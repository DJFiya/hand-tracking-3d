from flask import Flask
from flask_socketio import SocketIO, emit
from collections import deque
from dotenv import load_dotenv 
import os
import json

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'fallback_dev_key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Store last 100 frames of hand data for hand
# Format: {hand_id: deque([frame1_data, frame2_data, ...]), ...}
hand_data_history = {}
MAX_HISTORY = 100

@app.route('/')
def index():
    return "Hand Tracking Server Running"

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_response', {'data': 'Connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('hand_landmarks')
def handle_landmarks(data):
    print("\nReceived landmarks from hand-camera")
    hand_id = data.get('hand_id')
    landmarks = data.get('landmarks')

    if hand_id and landmarks:
        if hand_id not in hand_data_history:
            hand_data_history[hand_id] = deque(maxlen=MAX_HISTORY)
        
        hand_data_history[hand_id].append(landmarks)
        print(f"Stored frame {len(hand_data_history[hand_id])} for hand {hand_id}")
        
        print(f"Broadcasting to all clients...")
        emit('landmarks_received', {
            'status': 'success',
            'hand_id': hand_id,
            'frames_stored': len(hand_data_history[hand_id])
        }, broadcast=True)

@socketio.on('get_hand_data')
def handle_get_hand_data(data):
    """
    Get stored hand data for a specific hand
    """
    hand_id = data.get('hand_id')
    if hand_id in hand_data_history:
        emit('hand_data', {
            'hand_id': hand_id,
            'data': list(hand_data_history[hand_id])
        })
    else:
        emit('hand_data', {
            'hand_id': hand_id,
            'data': []
        })

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)