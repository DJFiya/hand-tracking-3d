from socketio import Client
import time
import json

sio = Client()
latest_hand_id = None

@sio.on('connect')
def on_connect():
    print('Connected to server')

@sio.on('connection_response')
def on_connection_response(data):
    print('Server responded:', data)

@sio.on('landmarks_received')
def on_landmarks_received(data):
    global latest_hand_id
    latest_hand_id = data['hand_id']
    print(f"\nLandmarks received event:")
    print(f"Status: {data['status']}")
    print(f"Hand ID: {data['hand_id']}")
    print(f"Frames: {data['frames_stored']}")

@sio.on('hand_data')
def on_hand_data(data):
    print(f"\nReceived hand data event:")
    print(f"Hand ID: {data['hand_id']}")
    print(f"Data length: {len(data['data'])}")
    if data['data']:
        latest_frame = data['data'][-1]
        print(f"Sample point: {latest_frame[0]}")  # Print first landmark of latest frame

@sio.on('*')  # Add this to catch all events
def catch_all(event, data):
    print(f"\nCaught event: {event}")
    print(f"Data: {data}")

print("\n=== Hand Tracking Test Client ===")
print("Connecting to server...")
sio.connect('http://localhost:5000')
print("Connected! Waiting for hand data...")

try:
    while True:
        if latest_hand_id:
            print("\nRequesting hand data...")
            sio.emit('get_hand_data', {'hand_id': latest_hand_id})
        else:
            print("\rWaiting for hand ID...", end='')
        time.sleep(2)
except KeyboardInterrupt:
    print("\nDisconnecting...")
    sio.disconnect()