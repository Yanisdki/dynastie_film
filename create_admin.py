import os
import django

# Configure l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aesthetic_portfolio.settings')
django.setup()

from django.contrib.auth.models import User

# Remplace par les identifiants que tu souhaites
USERNAME = 'yanis'
EMAIL = 'doukiyanis@gmail.com'
PASSWORD = 'Aezerty20'  # Mets un vrai mot de passe complet

if not User.objects.filter(username=USERNAME).exists():
    User.objects.create_superuser(USERNAME, EMAIL, PASSWORD)
    print("🚀 Superuser créé avec succès sur Render !")
else:
    print("ℹ️ Le superuser existe déjà.")