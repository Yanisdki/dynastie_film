import json
import traceback

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from .forms import ReservationForm, CustomUserCreationForm
from django.contrib import messages
from django.shortcuts import redirect, get_object_or_404
from django.core.mail import send_mail
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from .models import ClientReview, EducationArticle, HeroSlide, Projet, Reservation, HeroSection, GridCard, ProfessionSection, HorizontalProject, SiteContent, ConseilMariage
from django.conf import settings
from django.contrib.auth.models import User



def home(request):
    if request.method == 'POST':
        author_name = request.POST.get('author_name')
        content = request.POST.get('content')
        rating = request.POST.get('rating', 5)

        if author_name and content:
            ClientReview.objects.create(
                author_name=request.user.username,
                content=content,
                rating=int(rating)
            )
        # Redirection sur la même page pour vider le formulaire et éviter les doubles envois au rafraîchissement
        return redirect('core:home.html') 

    # 2. Récupération des avis (les 6 plus récents) pour l'affichage
    reviews = ClientReview.objects.all()[:6]
    
    context = {
        'hero': HeroSection.objects.first(),
        'grid_cards': GridCard.objects.all(),
        'profession': ProfessionSection.objects.first(),
        'horizontal_projects': HorizontalProject.objects.all(),
        'reviews': reviews,
    }
    return render(request, 'core/home.html', context)


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                # Redirige vers la page de réservation après connexion
                return redirect('core:reservation') 
    else:
        form = AuthenticationForm()
    return render(request, 'core/login.html', {'form': form})

# Vue d'Inscription (Pour les nouveaux clients)
def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user) # Connecte l'utilisateur dès qu'il a créé son compte
            return redirect('core:reservation')
    else:
        form = CustomUserCreationForm()
    return render(request, 'core/register.html', {'form': form})

@login_required(login_url='core:login')  # 👈 Si pas connecté, redirige vers la page de connexion
def reservation(request):
    if request.method == 'POST':
        form = ReservationForm(request.POST)
        if form.is_valid():
            # On crée l'objet sans le sauvegarder en BDD tout de suite
            reservation_obj = form.save(commit=False)
            # On associe la réservation à l'utilisateur actuellement connecté
            reservation_obj.user = request.user 
            reservation_obj.save()
            
            # Construction de l'URL unique pour le paiement (RIB/WhatsApp)
            domain = request.get_host()
            protocol = 'https' if request.is_secure() else 'http'
            payment_url = f"{protocol}://{domain}/reservation/paiement/{reservation_obj.token}/"
            
            # --- Envoi de l'Email de Confirmation d'Acompte ---
            sujet = "Dynastie Film — Confirmation de réception (Acompte requis)"
            
            message_text = f"""Bonjour {reservation_obj.prenom_contact},

            Votre demande de réservation pour le projet {reservation_obj.get_prestation_type_display()} a bien été enregistrée !

Pour bloquer définitivement la date du {reservation_obj.date_event} dans notre calendrier, un acompte de 20 000 DA est requis.

Veuillez consulter nos informations bancaires (RIB/CCP) et nous transmettre votre preuve de virement en cliquant sur le lien ci-dessous :
👉 {payment_url}

Si vous rencontrez des difficultés, vous pourrez également nous envoyer le reçu directement via WhatsApp depuis cette page.

À très bientôt,
L'équipe Dynastie Film.
"""

            try:
                send_mail(
                    sujet,
                    message_text,
                    'doukiyanis@gmail.com',
                    [reservation_obj.email], # Envoyé à l'adresse saisie dans le formulaire
                    fail_silently=False,
                )
            except Exception as e:
                    print("--- 🚨 CRASH ENVOI EMAIL 🚨 ---")
                    print(f"Type de l'erreur : {type(e).__name__}")
                    print(f"Message : {e}")
                    traceback.print_exc()

            return redirect('core:reservation_success')
    else:
        form = ReservationForm()
        
    return render(request, 'core/reservation.html', {'form': form})
def reservation_success(request):
    return render(request, 'core/reservation_success.html')



def idees(request):
    # Si tu veux récupérer les articles depuis la base de données :
    conseils = ConseilMariage.objects.all()
    return render(request, 'core/conseils.html', {
        'conseils': conseils
    })

# core/views.py

# core/views.py

def reservation_paiement(request, token):
    reservation_obj = get_object_or_404(Reservation, token=token)
    
    if request.method == 'POST' and request.FILES.get('screenshot'):
        # On récupère le fichier image depuis le formulaire
        reservation_obj.recu_paiement = request.FILES['screenshot']
        reservation_obj.save()
        messages.success(request, "Votre reçu a bien été transmis à l'équipe Dynastie Film. Validation en cours.")
        return redirect('core:reservation_paiement', token=token)
        
    context = {
        'reservation': reservation_obj,
        'montant_acompte': "20 000 DA"
    }
    return render(request, 'core/reservation_paiement.html', context)


def get_dates_reservees(request):
    try:
        # On récupère toutes les réservations avec ces statuts
        reservations = Reservation.objects.filter(status__in=['EN_ATTENTE', 'VERIFICATION', 'CONFIRME'])
        dates_prises = []
        
        for res in reservations:
            if res.date_event:
                dates_prises.append(res.date_event.isoformat())
            if res.dates_supplementaires:
                try:
                    # Sécurité : si c'est déjà une liste, on l'utilise
                    supp = json.loads(res.dates_supplementaires) if isinstance(res.dates_supplementaires, str) else res.dates_supplementaires
                    dates_prises.extend(supp)
                except: pass
        
        return JsonResponse({'dates': dates_prises})
    except Exception as e:
        # En cas d'erreur serveur, on renvoie une liste vide au lieu de faire planter le JS
        return JsonResponse({'dates': []})
    
def portfolio(request):
    projets = Projet.objects.all().order_by('-date_ajout')
    slides = HeroSlide.objects.filter(actif=True)
    # Récupère le manifeste (ou crée un vide si inexistant)
    manifeste = SiteContent.objects.filter(section_name="Manifeste").first()
    
    return render(request, 'core/portfolio.html', {
        'projets': projets,
        'slides': slides,
        'manifeste': manifeste
    })

def education(request):
    # Récupère tous les articles classés par leur champ "ordre"
    articles = EducationArticle.objects.all()
    return render(request, 'core/education.html', {
        'articles': articles
    })

def create_admin_emergency(request):
    # Choisis tes identifiants de connexion ici :
    username = 'yanis'
    email = 'doukiyanis@gmail.com'
    password = 'MonSuperMotDePasseSecurise2026!' 

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username, email, password)
        return HttpResponse("🚀 Superuser cree avec succes ! Connecte-toi sur /admin")
    else:
        return HttpResponse("ℹ️ Le superuser existe deja.")