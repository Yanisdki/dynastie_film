from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('portfolio/', views.portfolio, name='portfolio'),
    path('reservation/', views.reservation, name='reservation'),
    path('education/', views.education, name='education'),
    path('idees/', views.idees, name='idees'),
]