import asyncio
import json
import cv2
import mediapipe as mp
import base64
import numpy as np
from channels.generic.websocket import AsyncWebsocketConsumer
from .gesture import detect_gesture, play_pause, next_track, previous_track, volume_up, volume_down

class GestureControlConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
        self.mp_drawing = mp.solutions.drawing_utils
        self.last_action_time = 0
        self.cooldown = 1.0
        await self.accept()

    async def disconnect(self, close_code):
        self.hands.close()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            image_data = base64.b64decode(data['image'].split(',')[1])
            image_array = np.frombuffer(image_data, dtype=np.uint8)
            frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            # Process frame
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    # Draw landmarks on frame
                    self.mp_drawing.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                    
                    landmarks_list = [(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark]
                    frame_height, frame_width = frame.shape[:2]
                    
                    gesture = detect_gesture(landmarks_list, frame_width, frame_height)
                    
                    current_time = asyncio.get_event_loop().time()
                    if gesture and current_time - self.last_action_time > self.cooldown:
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
                        self.last_action_time = current_time
                        await self.send(json.dumps({
                            'type': 'gesture_detected',
                            'gesture': gesture
                        }))

            # Convert processed frame back to base64
            _, buffer = cv2.imencode('.jpg', frame)
            processed_image = base64.b64encode(buffer).decode('utf-8')
            
            await self.send(json.dumps({
                'type': 'processed_frame',
                'image': f'data:image/jpeg;base64,{processed_image}'
            }))
            
        except Exception as e:
            await self.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))
