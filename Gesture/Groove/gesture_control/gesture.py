import cv2
import mediapipe as mp
import time
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# Spotify credentials and setup
SPOTIPY_CLIENT_ID = 'd4399e2a2a2147c98d8405c27b052594'
SPOTIPY_CLIENT_SECRET = '869ed3ddacfb408fa1bad415c629cafe'
SPOTIPY_REDIRECT_URI = 'http://127.0.0.1:8888/callback'
SPOTIPY_SCOPE = "user-library-read user-read-playback-state user-modify-playback-state streaming"

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=SPOTIPY_CLIENT_ID,
                                                client_secret=SPOTIPY_CLIENT_SECRET,
                                                redirect_uri=SPOTIPY_REDIRECT_URI,
                                                scope=SPOTIPY_SCOPE))

# MediaPipe for hand tracking setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

# Initialize the webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open webcam")
    exit()
    
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Functions for controlling Spotify
def play_pause():
    try:
        current_state = sp.current_playback()
        if current_state is None:
            print("No active device found. Please open Spotify and start playing something first!")
            return
        
        if current_state and current_state['is_playing']:
            sp.pause_playback()
        else:
            # Get available devices
            devices = sp.devices()
            if not devices['devices']:
                print("No Spotify devices found. Please open Spotify app first!")
                return
                
            # Use the first available device
            device_id = devices['devices'][0]['id']
            sp.start_playback(device_id=device_id)
    except Exception as e:
        print(f"Spotify Error: {str(e)}")
        print("Please make sure Spotify is open and playing something first!")

def next_track():
    sp.next_track()

def previous_track():
    sp.previous_track()

def volume_up():
    playback_state = sp.current_playback()
    if playback_state and playback_state.get('device'):
        current_volume = playback_state['device'].get('volume_percent', 50)
        if current_volume < 100:
            sp.volume(min(current_volume + 30, 100))

def volume_down():
    playback_state = sp.current_playback()
    if playback_state and playback_state.get('device'):
        current_volume = playback_state['device'].get('volume_percent', 50)
        if current_volume > 0:
            sp.volume(max(current_volume - 30, 0))

# Track previous hand positions to detect motion
previous_x_positions = []
position_buffer_size = 5  # Reduced buffer size for faster processing
previous_y_positions = []

# Gesture detection logic
def detect_gesture(landmarks, frame_width, frame_height):
    global previous_x_positions, previous_y_positions
    if landmarks is None:
        previous_x_positions = []
        previous_y_positions = []
        return None

    wrist_x = landmarks[0][0] * frame_width
    wrist_y = landmarks[0][1] * frame_height

    thumb_tip = landmarks[4]
    index_tip = landmarks[8]
    pinch_distance = ((index_tip[0] - thumb_tip[0]) ** 2 + (index_tip[1] - thumb_tip[1]) ** 2) ** 0.5

    # Pinch gesture for play/pause
    if pinch_distance < 0.05:
        return 'play/pause'

    # Right motion for next track
    previous_x_positions.append(wrist_x)
    if len(previous_x_positions) > position_buffer_size:
        previous_x_positions.pop(0)

    if len(previous_x_positions) == position_buffer_size:
        x_motion = previous_x_positions[-1] - previous_x_positions[0]
        if x_motion > 50:
            previous_x_positions = []
            return 'next'
        elif x_motion < -50:
            previous_x_positions = []
            return 'previous'

    # Upward motion for volume up
    previous_y_positions.append(wrist_y)
    if len(previous_y_positions) > position_buffer_size:
        previous_y_positions.pop(0)

    if len(previous_y_positions) == position_buffer_size:
        y_motion = previous_y_positions[0] - previous_y_positions[-1]
        if y_motion > 50:
            previous_y_positions = []
            return 'volume up'
        elif y_motion < -50:
            previous_y_positions = []
            return 'volume down'

    return None

# Cooldown management
last_action_time = time.time()
cooldown = 1.0  # Cooldown in seconds

# Main loop
frame_count = 0  # Counter for skipping frames
while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process every 3rd frame
    frame_count += 1
    if frame_count % 3 != 0:
        cv2.imshow('Gesture Controlled Music Controller', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        continue

    results = hands.process(rgb_frame)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Optionally disable this for performance
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            landmarks_list = [(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark]
            frame_width = frame.shape[1]
            frame_height = frame.shape[0]

            gesture = detect_gesture(landmarks_list, frame_width, frame_height)

            # Handle gesture with cooldown
            if gesture and time.time() - last_action_time > cooldown:
                if gesture == 'play/pause':
                    play_pause()
                elif gesture == 'next':
                    next_track()
                elif gesture == 'previous':
                    previous_track()
                elif gesture == 'volume up':
                    volume_up()
                elif gesture == 'volume down':
                    volume_down()
                last_action_time = time.time()

    cv2.imshow('Gesture Controlled Music Controller', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()