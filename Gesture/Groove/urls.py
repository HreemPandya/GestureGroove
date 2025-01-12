from django.urls import path
from . import views  # Import the views from the same app

urlpatterns = [
    path('', views.home, name='home'),  # Home view
    path('perform_action/', views.perform_action, name='perform_action'),  # Trigger Spotify actions
]