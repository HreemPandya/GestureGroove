from django.urls import path
from . import views  # Import the views from the same app

urlpatterns = [
    path('', views.home, name='home'),  # Home view
    path('perform_action/', views.perform_action, name='perform_action'),  # Trigger Spotify actions
    path('api/start-gesture-control', views.start_gesture_control, name='start_gesture_control'),  # Start gesture control
]