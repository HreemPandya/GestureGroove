from django.urls import re_path
from .gesture_control.websocket_handler import GestureControlConsumer

websocket_urlpatterns = [
    re_path(r'ws/gesture/$', GestureControlConsumer.as_asgi()),
]
