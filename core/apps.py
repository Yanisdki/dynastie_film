# core/apps.py
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Cette ligne est cruciale pour lier les actions aux sauvegardes de modèles
        import core.signals