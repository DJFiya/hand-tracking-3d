document.addEventListener('DOMContentLoaded', () => {
    const socketClient = new HandSocketClient();
    const handModel = new HandModel('handCanvas');
    
    // Start animation loop
    handModel.animate();

    // Connect socket client to hand model
    socketClient.onLandmarksUpdate = (landmarks) => {
        handModel.updateHandPosition(landmarks);
    };

    // UI Controls
    document.getElementById('connectBtn').addEventListener('click', () => {
        if (!socketClient.connected) {
            socketClient.connect();
        } else {
            socketClient.disconnect();
        }
    });

    document.getElementById('toggleTracking').addEventListener('click', function() {
        if (this.textContent === 'Start Tracking') {
            socketClient.onLandmarksUpdate = (landmarks) => {
                handModel.updateHandPosition(landmarks);
            };
            this.textContent = 'Stop Tracking';
        } else {
            socketClient.onLandmarksUpdate = null;
            this.textContent = 'Start Tracking';
        }
    });
});
