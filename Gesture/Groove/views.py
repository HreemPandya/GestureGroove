from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .gesture_control.gesture import play_pause, next_track, previous_track, volume_up, volume_down
import threading
import subprocess
import sys
import os

# Global variable to store the gesture control process
gesture_process = None

# Home view
def home(request):
    return render(request, 'index.html')

@csrf_exempt
def start_gesture_control(request):
    if request.method == 'POST':
        global gesture_process
        if gesture_process is None:
            # Get the absolute path to gesture.py
            gesture_script_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                'gesture_control',
                'gesture.py'
            )
            
            # Start the gesture control script as a subprocess
            gesture_process = subprocess.Popen([sys.executable, gesture_script_path])
            return JsonResponse({'status': 'success', 'message': 'Gesture control started'})
        return JsonResponse({'status': 'error', 'message': 'Gesture control already running'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

# Trigger Spotify actions
def perform_action(request):
    action = request.GET.get('action', None)

    if not action:
        return JsonResponse({'status': 'error', 'message': 'No action specified'})

    # Perform the Spotify control based on action
    if action == 'play/pause':
        play_pause()
    elif action == 'next':
        next_track()
    elif action == 'previous':
        previous_track()
    elif action == 'volume up':
        volume_up()
    elif action == 'volume down':
        volume_down()

    return JsonResponse({'status': 'success', 'message': f'Performed action: {action}'})