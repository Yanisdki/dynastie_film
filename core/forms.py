import json
from django import forms
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm
from .models import Reservation


class ReservationForm(forms.ModelForm):
    class Meta:
        model = Reservation
        fields = [
            'prestation_type', 'mariage_horaire', 'date_event', 'jours_supplementaires', 
            'dates_supplementaires', 'option_drone', 'lieu', 'hors_wilaya',
            'nom_contact', 'prenom_contact', 'email', 'telephone',
            'prenom_epoux', 'prenom_epouse', 'message'
        ]
        widgets = {
            'prestation_type': forms.Select(attrs={'class': 'form-input', 'id': 'id_prestation_type'}),
            'date_event': forms.DateInput(attrs={
                'class': 'form-input', 
                'type': 'date',
                'min': timezone.now().date().isoformat()
            }),
            'lieu': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Lieu (Ville, Salle...)'}),
            'mariage_horaire': forms.Select(attrs={'class': 'form-input', 'id': 'id_mariage_horaire'}),
            'jours_supplementaires': forms.NumberInput(attrs={'class': 'form-input', 'min': '0', 'value': '0'}),
            'dates_supplementaires': forms.HiddenInput(attrs={'id': 'id_dates_supplementaires'}),
            
            'nom_contact': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Votre Nom'}),
            'prenom_contact': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Votre Prénom'}),
            'telephone': forms.TextInput(attrs={'class': 'form-input', 'placeholder': '0X XX XX XX XX'}),
            'email': forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'votre@email.com'}),
            
            'prenom_epoux': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Prénom de l’Époux'}),
            'prenom_epouse': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Prénom de l’Épouse'}),
            'message': forms.Textarea(attrs={'class': 'form-input form-textarea', 'placeholder': 'Parlez-nous de votre projet...'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['mariage_horaire'].required = False

    def clean(self):
        cleaned_data = super().clean()
        date_event = cleaned_data.get('date_event')
        dates_sup_json = cleaned_data.get('dates_supplementaires')
        
        # 1. Lister toutes les dates demandées par CE client
        toutes_les_dates_demandees = [date_event.isoformat()] if date_event else []
        if dates_sup_json:
            try:
                # Gère le cas où c'est déjà une liste ou une chaîne JSON
                dates_liste = json.loads(dates_sup_json) if isinstance(dates_sup_json, str) else dates_sup_json
                toutes_les_dates_demandees.extend(dates_liste)
            except: pass

        # 2. Vérifier contre la BDD
        # CORRECTION : Utilise 'EN_ATTENTE' au lieu de 'ATTENTE' pour correspondre au modèle
        reservations_conflits = Reservation.objects.filter(
            status__in=['EN_ATTENTE', 'VERIFICATION', 'CONFIRME']
        ).exclude(pk=self.instance.pk if self.instance else None)

        for res in reservations_conflits:
            # Utilise la méthode est_disponible que nous avons créée dans le modèle
            # C'est plus propre et ça centralise la logique
            for d in toutes_les_dates_demandees:
                if not Reservation.est_disponible(d, exclude_id=res.pk if self.instance else None):
                    # Attention: ici on veut vérifier si 'd' est pris par 'res'
                    # On reprend ta logique d'intersection pour être sûr
                    dates_prises = [res.date_event.isoformat()]
                    if res.dates_supplementaires:
                        try:
                            s = res.dates_supplementaires
                            dates_prises.extend(json.loads(s) if isinstance(s, str) else s)
                        except: pass
                    
                    if d in dates_prises:
                        raise forms.ValidationError(
                            f"La date du {d} est déjà réservée. Veuillez en choisir une autre."
                        )
        return cleaned_data


# ✨ Correction ici : Aligné complètement à gauche, en dehors de ReservationForm
class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = get_user_model()
        fields = UserCreationForm.Meta.fields + ('email',)