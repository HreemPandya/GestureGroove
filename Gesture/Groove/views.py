from django.http import JsonResponse
from django.shortcuts import render
from .gesture_control.gesture import play_pause, next_track, previous_track, volume_up, volume_down

# Home view
def home(request):
    return render(request, 'index.html')

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