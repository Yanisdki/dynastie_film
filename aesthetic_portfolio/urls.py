from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from core.views import create_admin_emergency

from aesthetic_portfolio import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('secure-create-admin-xyz789/', create_admin_emergency),
    path('', include('core.urls')),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)