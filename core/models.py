import json
import uuid
from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Reservation(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Utilisateur")
    
    PRESTATION_CHOICES = [
        ('MARIAGE', 'Mariage / Fiançailles'),
        ('CIRCONCISION', 'Circoncision'),
        ('CLIP_MUSICAL', 'Clip Musical'),
        ('EDITORIAL', 'Session Éditoriale / Mode'),
        ('CORPORATE', 'Corporate / Événementiel'),
    ]

    MARIAGE_HORAIRE_CHOICES = [
        ('STANDARD', 'Standard (08h00 - 18h00)'),
        ('TOUTE LA JOURNÉE', 'Toute la journée (08h00 - FIN)'),
        ('SOIREE', 'Soirée (20h00 - Fin)'),
    ]

    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente d\'acompte'),
        ('VERIFICATION', 'Reçu en cours de vérification'),
        ('CONFIRME', 'Confirmé'),
        ('ANNULE', 'Annulé'),
    ]

    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # 1. Nature du projet & Options de base
    prestation_type = models.CharField(max_length=30, choices=PRESTATION_CHOICES, verbose_name="Type de Prestation")
    mariage_horaire = models.CharField(max_length=20, choices=MARIAGE_HORAIRE_CHOICES, blank=True, null=True, verbose_name="Horaire Mariage (Si applicable)")
    
    date_event = models.DateField(verbose_name="Date de l'événement")
    jours_supplementaires = models.PositiveIntegerField(default=0, verbose_name="Nombre de journées supplémentaires")
    dates_supplementaires = models.JSONField(default=list, blank=True, null=True)
    
    # Équipes et matériel
    option_drone = models.BooleanField(default=False, verbose_name="Option Drone (+20 000 DA)")
    
    # Localisation
    lieu = models.CharField(max_length=150, verbose_name="Lieu (Commune, Adresse)")
    hors_wilaya = models.BooleanField(default=False, verbose_name="Hors Wilaya de Tizi Ouzou (+3 000 DA)")

    # 2. Le Contact
    nom_contact = models.CharField(max_length=100, verbose_name="Nom du Contact")
    prenom_contact = models.CharField(max_length=100, verbose_name="Prénom du Contact")
    email = models.EmailField(verbose_name="Adresse Email")
    telephone = models.CharField(max_length=20, verbose_name="Numéro de Téléphone")

    # 3. Les Époux
    prenom_epoux = models.CharField(max_length=100, blank=True, null=True, verbose_name="Prénom de l'Époux")
    prenom_epouse = models.CharField(max_length=100, blank=True, null=True, verbose_name="Prénom de l'Épouse")

    # 4. Détails et Justificatif
    message = models.TextField(verbose_name="Détails / Exigences du client", blank=True, null=True)
    recu_paiement = models.ImageField(upload_to="recus_acomptes/", blank=True, null=True, verbose_name="Reçu de virement (Acompte)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE', verbose_name="Statut")
    created_at = models.DateTimeField(auto_now_add=True)

    def synchro_calendar(self):
        """
        Appelle cette méthode après validation pour créer l'événement.
        """
        try:
            from generic_calendar import create
            create(
                title=f"Prestation : {self.get_prestation_type_display()} - {self.nom_contact}",
                start_datetime=self.date_event.strftime('%Y%m%dT0000'),
                is_all_day=True,
                description=f"Lieu: {self.lieu} | Contact: {self.telephone}"
            )
            return True
        except ImportError:
            print("Erreur: generic_calendar n'est pas installé.")
            return False

    @classmethod
    def est_disponible(cls, date_a_verifier, exclude_id=None):
        """Vérifie si une date est déjà prise (principale ou supplémentaire)."""
        queryset = cls.objects.all()
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)

        if queryset.filter(date_event=date_a_verifier).exists():
            return False
        
        for res in queryset:
            try:
                dates_supp = res.dates_supplementaires if isinstance(res.dates_supplementaires, list) else json.loads(res.dates_supplementaires or "[]")
                if str(date_a_verifier) in [str(d) for d in dates_supp]:
                    return False
            except:
                continue
        return True

    def get_total_price(self):
        prix = 0
        if self.prestation_type == 'MARIAGE':
            if self.mariage_horaire == 'STANDARD': prix = 60000
            elif self.mariage_horaire == 'TOUTE LA JOURNÉE': prix = 62000
            elif self.mariage_horaire == 'SOIREE': prix = 65000
        elif self.prestation_type == 'CIRCONCISION':
            prix = 60000
        elif self.prestation_type == 'CLIP_MUSICAL':
            prix = 80000
        elif self.prestation_type == 'EDITORIAL':
            prix = 40000
        elif self.prestation_type == 'CORPORATE':
            prix = 50000    
        # Calcul basé sur la liste réelle des dates
        dates_list = self.dates_supplementaires if isinstance(self.dates_supplementaires, list) else json.loads(self.dates_supplementaires or "[]")
        prix += (len(dates_list) * 35000)
        
        if self.option_drone: prix += 20000
        if self.hors_wilaya: prix += 3000
        return prix

    def __str__(self):
        return f"{self.get_prestation_type_display()} - {self.nom_contact} {self.prenom_contact}"

class HeroSection(models.Model):
    title = models.CharField(max_length=100, default="DYNASTIE", verbose_name="Grand Titre Haut")
    subtitle = models.CharField(max_length=100, default="Film", verbose_name="Grand Titre Bas")

    class Meta:
        verbose_name = "1. Section Hero (Titres)"
        verbose_name_plural = "1. Section Hero (Titres)"

    def __str__(self):
        return f"{self.title} {self.subtitle}"

class GridCard(models.Model):
    card_number = models.IntegerField(choices=[(i, f"Case {i}") for i in range(1, 7)], unique=True, verbose_name="Numéro de la case (1 à 6)")
    image = models.ImageField(upload_to='grid/', null=True, blank=True, verbose_name="Image de fond")
    text_content = models.CharField(max_length=50, default="1", verbose_name="Texte/Chiffre affiché")

    class Meta:
        verbose_name = "2. Case de la Grille"
        verbose_name_plural = "2. Cases de la Grille"
        ordering = ['card_number']

    def __str__(self):
        return f"Case {self.card_number} - {self.text_content}"

class ProfessionSection(models.Model):
    badge_italic_1 = models.CharField(max_length=50, default="Film", verbose_name="Badge 1 (Italique)")
    badge_normal_1 = models.CharField(max_length=50, default="maker", verbose_name="Badge 1 (Normal)")
    badge_italic_2 = models.CharField(max_length=50, default="Photo", verbose_name="Badge 2 (Italique)")
    badge_normal_2 = models.CharField(max_length=50, default="grapher", verbose_name="Badge 2 (Normal)")
    description = models.TextField(verbose_name="Texte de Présentation Principal")
    editorial_image = models.ImageField(upload_to='editorial/', verbose_name="Image Éditoriale vertical")
    editorial_subtitle = models.CharField(max_length=100, default="L'art du mouvement", verbose_name="Sous-titre Éditorial")
    editorial_title = models.CharField(max_length=200, default="Capturer le temps...", verbose_name="Titre Éditorial")
    editorial_text = models.TextField(verbose_name="Texte Éditorial")

    class Meta:
        verbose_name = "3. Section Profession & Éditorial"
        verbose_name_plural = "3. Section Profession & Éditorial"

    def __str__(self):
        return "Contenu Profession & Éditorial"

class HorizontalProject(models.Model):
    title = models.CharField(max_length=150, verbose_name="Titre du projet")
    description = models.TextField(verbose_name="Description courte")
    image = models.ImageField(upload_to='horizontal_portfolio/', verbose_name="Image du projet (600x450)")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")

    class Meta:
        verbose_name = "4. Projet Scroll Horizontal"
        verbose_name_plural = "4. Projets Scroll Horizontal"
        ordering = ['order']

    def __str__(self):
        return self.title
    
class Projet(models.Model):
    titre = models.CharField(max_length=200)
    # Un seul champ pour tout (image ou vidéo)
    fichier = models.FileField(upload_to='portfolio/', verbose_name="Image ou Vidéo")
    categorie = models.CharField(max_length=50)
    date_ajout = models.DateTimeField(auto_now_add=True)

    def is_video(self):
        # Vérifie si le fichier est une vidéo
        return self.fichier.name.lower().endswith(('.mp4', '.mov', '.avi', '.mkv'))

    def __str__(self):
        return self.titre
    

class HeroSlide(models.Model):
    titre = models.CharField(max_length=100)
    video = models.FileField(upload_to='hero_videos/')
    ordre = models.PositiveIntegerField(default=0, help_text="Ordre d'affichage (1, 2, 3...)")
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return self.titre

class SiteContent(models.Model):
    section_name = models.CharField(max_length=50, unique=True, default="Manifeste")
    title = models.CharField(max_length=200, default="Notre Vision")
    description = models.TextField(default="Votre texte par défaut ici...")

    def __str__(self):
        return self.section_name
class EducationArticle(models.Model):
    titre = models.CharField(max_length=200)
    categorie = models.CharField(max_length=50, choices=[
        ('video', 'Vidéaste / Montage'),
        ('photo', 'Photographie'),
        ('conseil', 'Conseils Techniques')
    ])
    contenu = models.TextField()
    image = models.ImageField(upload_to='education/')
    ordre = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordre']

class ConseilMariage(models.Model):
    CATEGORIES = [
        ('prep', 'Préparatifs'),
        ('timing', 'Organisation & Timing'),
        ('video', 'Conseils Vidéo'),
    ]

    titre = models.CharField(max_length=200)
    categorie = models.CharField(max_length=50, choices=CATEGORIES)
    resume = models.CharField(max_length=300, help_text="Phrase d'accroche visible avant clic")
    contenu = models.TextField(help_text="Texte complet du conseil")
    image = models.ImageField(upload_to='conseils/')
    ordre = models.PositiveIntegerField(default=0, help_text="Ordre d'affichage (1, 2, 3...)")
    actif = models.BooleanField(default=True)
    date_pub = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordre', '-date_pub']

    def __str__(self):
        return f"{self.ordre} - {self.titre}"
    
class ClientReview(models.Model):
    author_name = models.CharField(max_length=100, verbose_name="Nom")
    content = models.TextField(verbose_name="Avis")
    rating = models.IntegerField(default=5, verbose_name="Note") # Note sur 5
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name} - {self.rating}/5"