# Hand Tracking with WebSocket

Real-time hand tracking system that captures hand landmarks using OpenCV and MediaPipe, and streams the data through WebSocket.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the backend folder:
```bash
FLASK_SECRET_KEY=your_generated_secret_key_here
```

## Running the System

1. Start the server:
```bash
python backend/server.py
```

2. Start the hand tracking camera:
```bash
python backend/hand-camera.py
```

3. (Optional) Run the test client:
```bash
python backend/test-client.py
```

## Features
- Real-time hand tracking
- WebSocket data streaming
- Stores last 100 frames of hand position data
- Supports single hand tracking
- Visual feedback with landmarks and bounding box 