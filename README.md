# Hand Tracking with WebSocket and 3D Visualization

Real-time hand tracking system that captures hand landmarks using OpenCV and MediaPipe, streams the data through WebSocket, and renders a smooth 3D hand visualization using Three.js.

## Setup

1. Install Python dependencies:
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

3. Start the local web server and open the frontend:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/frontend` in your web browser
   - For best performance, use a modern browser with WebGL support

4. (Optional) Run the test client:
```bash
python backend/test-client.py
```

## Features
- Real-time hand tracking with MediaPipe
- WebSocket data streaming
- Stores last 100 frames of hand position data
- Supports single hand tracking
- Visual feedback with landmarks and bounding box
- 3D Hand Visualization:
  - Smooth interpolated movement
  - Realistic finger joint connections
  - Dynamic camera following
  - Responsive hand model with proper finger thickness
  - WebGL-powered rendering with Three.js
  - Ambient and point lighting for depth perception
  - Automatic window resize handling

## Technical Details
- Backend: Python with OpenCV and MediaPipe
- Frontend: Three.js for 3D graphics
- Communication: WebSocket for real-time data streaming
- Rendering: WebGL with antialiasing
- Smoothing: Interpolated motion for natural movement
- Performance: Optimized geometry and materials for real-time rendering