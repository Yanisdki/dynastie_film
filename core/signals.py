# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMessage, send_mail
from django.template.loader import render_to_string
import pdfkit
from .models import Reservation

@receiver(post_save, sender=Reservation)
def workflow_reservation_emails(sender, instance, created, **kwargs):
    # L'adresse email de l'administrateur (Dynastie Film)
    ADMIN_EMAIL = "ton-email-admin@dynastiefilm.com" 

    # --- MOMENT 1 : L'utilisateur soumet sa preuve ---
    if instance.status == 'VERIFICATION' and instance.recu_paiement:
        subject_admin = f"🔔 Preuve d'acompte reçue - {instance.nom_contact} {instance.prenom_contact}"
        message_admin = f"""Bonjour Admin,

Une preuve de paiement a été téléversée pour la prestation : {instance.get_prestation_type_display()}.
Client : {instance.prenom_contact} {instance.nom_contact}
Date de l'événement : {instance.date_event}

Rendez-vous sur le panel d'administration pour vérifier le reçu et valider le contrat."""
        send_mail(subject_admin, message_admin, None, [ADMIN_EMAIL])

    # --- MOMENTS 2 & 3 : L'admin interagit depuis le panel Django ---
    elif not created:
        
        # MOMENT 2 : L'admin valide la réservation -> CALCUL DU CONTRAT ET ENVOI
        if instance.status == 'CONFIRME':
            subject_client = "✅ Votre contrat d'engagement signé ! - Dynastie Film"
            message_client = f"""Bonjour {instance.prenom_contact},

Nous avons le plaisir de vous informer que votre reçu d'acompte a été validé avec succès.

Votre réservation est officiellement CONFIRMÉE au calendrier. Vous trouverez en pièce jointe de cet e-mail votre Contrat d'Engagement officiel en bonne et due forme, reprenant l'ensemble du cahier des charges, le versement de vos 20 000 DA d'acompte ainsi que le solde restant.

Merci pour votre confiance.

L'équipe Dynastie Film."""
            
            # --- ALGORITHME DE CALCUL DES TARIFS DYNASTIE FILM ---
            prix_base = 0
            
            # 1. Tarification selon le type de prestation
            if instance.prestation_type == 'MARIAGE':
                if instance.mariage_horaire == 'SOIREE':
                    prix_base = 62000
                else:
                    prix_base = 60000  # Standard (8h - 18h)
            elif instance.prestation_type == 'CIRCONCISION':
                prix_base = 50000
            elif instance.prestation_type == 'EDITORIAL':
                prix_base = 30000
            elif instance.prestation_type == 'CORPORATE':
                prix_base = 30000  # Prix de départ selon exigences
            elif instance.prestation_type == 'CLIP_MUSICAL':
                prix_base = 150000  # Tarif par défaut pour le clip
            
            # 2. Calcul du surplus pour les journées supplémentaires (+35 000 DA / jour)
            surplus_jours = instance.jours_supplementaires * 35000
            
            # 3. Calcul de l'option Drone (+20 000 DA)
            surplus_drone = 20000 if instance.option_drone else 0
            
            # 4. Calcul du déplacement Hors Wilaya (+3 000 DA si activé)
            surplus_deplacement = 3000 if instance.hors_wilaya else 0
            
            # 5. Calcul des totaux finaux
            total_prestation = prix_base + surplus_jours + surplus_drone + surplus_deplacement
            acompte = 20000
            reste_a_payer = total_prestation - acompte

            # Dictionnaire de contexte envoyé à ton fichier HTML
            context_data = {
                'reservation': instance,
                'prix_base': prix_base,
                'surplus_jours': surplus_jours,
                'surplus_drone': surplus_drone,
                'surplus_deplacement': surplus_deplacement,
                'total_prestation': total_prestation,
                'acompte': acompte,
                'reste_a_payer': reste_a_payer
            }
            
            # Rendu du template HTML avec les vrais prix calculés
            html_content = render_to_string('core/facture_pdf.html', context_data)
            
            # Configuration de pdfkit (wkhtmltopdf)
            options = {
                'page-size': 'Letter',
                'encoding': "UTF-8",
                'margin-top': '0.5in',
                'margin-right': '0.5in',
                'margin-bottom': '0.5in',
                'margin-left': '0.5in',
            }
            
            # Génération du binaire PDF en mémoire
            pdf_data = pdfkit.from_string(html_content, False, options=options)
            
            # Construction de l'e-mail (Envoi au client + Copie cachée pour l'admin)
            email = EmailMessage(
                subject=subject_client,
                body=message_client,
                from_email=None,
                to=[instance.email],
                bcc=[ADMIN_EMAIL]
            )
            
            # Attachement du contrat PDF
            email.attach(f"Contrat_DynastieFilm_{instance.id}.pdf", pdf_data, 'application/pdf')
            email.send()

        # MOMENT 3 : L'admin annule la réservation
        elif instance.status == 'ANNULE':
            subject_client = "❌ Statut de votre réservation - Dynastie Film"
            message_client = f"""Bonjour {instance.prenom_contact},

Après vérification des pièces de votre dossier, nous sommes au regret de vous informer que votre demande de réservation pour le {instance.date_event} a été annulée (reçu non conforme ou acompte incorrect).

Si vous pensez qu'il s'agit d'une erreur, merci de répondre directement à cet e-mail.

Cordialement,
L'équipe Dynastie Film."""
            send_mail(subject_client, message_client, None, [instance.email])