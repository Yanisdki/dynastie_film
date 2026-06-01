# aesthetic_portfolio/urls.py
from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('reservation/', views.reservation, name='reservation'),
    path('reservation/success/', views.reservation_success, name='reservation_success'),
    path('education/', views.education, name='education'),
    path('idees/', views.idees, name='idees'),
    path('reservation/paiement/<uuid:token>/', views.reservation_paiement, name='reservation_paiement'),
    path('api/dates-reservees/', views.get_dates_reservees, name='get_dates_reservees'),
    path('portfolio/', views.portfolio, name='portfolio'),
    
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)