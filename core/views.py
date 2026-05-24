from django.shortcuts import render
from django.http import HttpResponse

def home(request):
    return render(request, 'core/home.html')

def portfolio(request):
    return HttpResponse("Page Portfolio - bientôt disponible")

def reservation(request):
    return HttpResponse("Page Réservation - bientôt disponible")

def education(request):
    return HttpResponse("Page Éducation - bientôt disponible")

def idees(request):
    return HttpResponse("Page Idées Événements - bientôt disponible")