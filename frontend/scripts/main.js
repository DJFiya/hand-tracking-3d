document.addEventListener('DOMContentLoaded', () => {
    const socketClient = new HandSocketClient();
    const handModel = new HandModel('handCanvas');
    
    // Start animation loop
    handModel.animate();

    // UI Controls
    document.getElementById('connectBtn').addEventListener('click', () => {
        if (!socketClient.connected) {
            socketClient.connect();
        } else {
            socketClient.disconnect();
        }
    });

    const trackingBtn = document.getElementById('toggleTracking');
    trackingBtn.addEventListener('click', function() {
        if (this.textContent === 'Start Tracking') {
            socketClient.onLandmarksUpdate = (landmarks) => {
                handModel.updateHandPosition(landmarks);
            };
            this.textContent = 'Stop Tracking';
            this.classList.add('active');
        } else {
            socketClient.onLandmarksUpdate = null;
            this.textContent = 'Start Tracking';
            this.classList.remove('active');
        }
    });
});
