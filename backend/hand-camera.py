import cv2
import mediapipe as mp
import numpy as np
from socketio import Client
import uuid

# Initialize SocketIO client
sio = Client()
try:
    sio.connect('http://localhost:5000')
    print("Connected to server")
except Exception as e:
    print(f"Failed to connect to server: {e}")
hand_id = str(uuid.uuid4())

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False,
                      max_num_hands=1,
                      min_detection_confidence=0.5,
                      min_tracking_confidence=0.5)
mp_draw = mp.solutions.drawing_utils

# Initialize webcam
cap = cv2.VideoCapture(0)

while True:
    # Read frame from webcam
    success, img = cap.read()
    if not success:
        print("Failed to capture frame")
        break

    # Flip the image horizontally (across the Y-axis)
    img = cv2.flip(img, 1)
        
    # Convert BGR image to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Process the image and detect hands
    results = hands.process(img_rgb)
    
    # Initialize list to store landmark points
    hand_points = []
    
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Get bounding box coordinates
            x_coords = [landmark.x for landmark in hand_landmarks.landmark]
            y_coords = [landmark.y for landmark in hand_landmarks.landmark]
            
            # Convert normalized coordinates to pixel coordinates
            h, w, c = img.shape
            x1 = int(min(x_coords) * w)
            y1 = int(min(y_coords) * h)
            x2 = int(max(x_coords) * w)
            y2 = int(max(y_coords) * h)
            
            # Draw green bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw landmarks and connections
            mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            # Store and format landmark points for WebSocket
            landmarks_data = []
            for landmark in hand_landmarks.landmark:
                landmarks_data.append({
                    'x': float(landmark.x),
                    'y': float(landmark.y),  # Flip back to original Y-axis
                    'z': float(landmark.z)
                })
                hand_points.append([landmark.x, landmark.y, landmark.z])  # Flip back to original Y-axis
            
            # Send landmarks to server
            try:
                print(f"\rSending {len(landmarks_data)} landmarks", end='')  # Add debug print
                sio.emit('hand_landmarks', {
                    'hand_id': hand_id,
                    'landmarks': landmarks_data
                })
            except Exception as e:
                print(f"\nError sending data: {e}")
    
    # Display the frame
    cv2.imshow('Hand Tracking', img)
    
    # Break loop on 'q' press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
hands.close()
if sio.connected:
    sio.disconnect()
