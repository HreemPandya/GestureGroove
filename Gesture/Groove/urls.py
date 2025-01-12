from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('play_pause/', views.play_pause, name='play_pause'),
    path('next/', views.next_track, name='next'),
    path('previous/', views.previous_track, name='previous'),
    path('volume_up/', views.volume_up, name='volume_up'),
    path('volume_down/', views.volume_down, name='volume_down'),
]
