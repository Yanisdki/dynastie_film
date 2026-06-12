from .settings import *

# 1. Activation du mode debug pour voir les erreurs détaillées
DEBUG = True

# 2. Autoriser l'accès en local
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# 3. Utiliser SQLite par défaut sans les contraintes de Render
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 4. Désactiver WhiteNoise en local (Django servira les statiques nativement)
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# 5. Configurer l'email pour le terminal (plus besoin de Brevo pour tester)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'