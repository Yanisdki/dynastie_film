from django.contrib import admin
from .models import ClientReview, EducationArticle, HeroSection, GridCard, HeroSlide, ProfessionSection, HorizontalProject, Reservation, Projet, SiteContent, ConseilMariage

@admin.register(HeroSection)
class HeroSectionAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not HeroSection.objects.exists()

@admin.register(GridCard)
class GridCardAdmin(admin.ModelAdmin):
    list_display = ('card_number', 'text_content', 'image')
    max_num = 6

@admin.register(ProfessionSection)
class ProfessionSectionAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not ProfessionSection.objects.exists()

@admin.register(HorizontalProject)
class HorizontalProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'order')
    list_editable = ('order',)

@admin.action(description='Synchroniser avec le calendrier')
def sync_reservation(modeladmin, request, queryset):
    for res in queryset:
        res.synchro_calendar()

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('prenom_contact', 'nom_contact', 'prestation_type', 'date_event', 'status', 'recu_paiement')
    readonly_fields = ('token',)
    actions = [sync_reservation]

    def changelist_view(self, request, extra_context=None):
        reservations = Reservation.objects.all() # On prend tout pour voir l'état réel
        events_list = []
        
        for res in reservations:
            # Attribution des couleurs selon le statut
            if res.status == 'CONFIRME':
                color = '#dc3545' # Rouge
            elif res.status == 'EN_ATTENTE':
                color = '#0d6efd' # Bleu
            elif res.status == 'FAIT': # Remplace par ton vrai statut 'termine' si nécessaire
                color = '#198754' # Vert
            else:
                color = '#6c757d' # Gris par défaut

            events_list.append({
                'id': res.id,
                'title': f"{res.nom_contact}  {res.prenom_contact} |{res.get_prestation_type_display()}",
                'start': res.date_event.strftime('%Y-%m-%d'),
                'backgroundColor': color,
                'borderColor': color,
                'textColor': 'white',
            })
        
        extra_context = extra_context or {}
        extra_context['events'] = events_list
        return super().changelist_view(request, extra_context=extra_context)

@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ('titre', 'categorie', 'date_ajout')
    list_filter = ('categorie',)

@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('titre', 'ordre', 'actif')
    list_editable = ('ordre', 'actif')
@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ('section_name', 'title')

@admin.register(EducationArticle)
class EducationArticleAdmin(admin.ModelAdmin):
    list_display = ('titre', 'categorie', 'ordre')

@admin.register(ConseilMariage)
class ConseilMariageAdmin(admin.ModelAdmin):
    list_display = ('ordre', 'titre', 'categorie', 'actif', 'date_pub')
    
    # AJOUTE CETTE LIGNE : On définit 'titre' comme le lien pour ouvrir l'objet
    # Ainsi, 'ordre' reste libre d'être éditable dans la liste.
    list_display_links = ('titre',) 
    
    list_editable = ('ordre', 'actif')
    list_filter = ('categorie', 'actif', 'date_pub')
    search_fields = ('titre', 'resume', 'contenu')
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('titre', 'categorie', 'image', 'ordre', 'actif')
        }),
        ('Contenu du conseil', {
            'fields': ('resume', 'contenu'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ClientReview)
class ClientReviewAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('author_name', 'content')