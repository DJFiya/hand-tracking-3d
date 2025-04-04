class HandSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.onLandmarksUpdate = null;
    }

    connect() {
        this.socket = io('http://localhost:5000');
        
        this.socket.on('connect', () => {
            this.connected = true;
            const statusEl = document.getElementById('connectionStatus');
            statusEl.textContent = 'Connected';
            // Force remove and re-add to trigger the style
            statusEl.classList.remove('connected');
            setTimeout(() => statusEl.classList.add('connected'), 0);
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
            const statusEl = document.getElementById('connectionStatus');
            statusEl.textContent = 'Disconnected';
            statusEl.classList.remove('connected');
            console.log('Disconnected from server');
        });

        this.socket.on('landmarks_received', (data) => {
            document.getElementById('frameCount').textContent = data.frames_stored;
            if (this.onLandmarksUpdate) {
                this.socket.emit('get_hand_data', { hand_id: data.hand_id });
            }
        });

        this.socket.on('hand_data', (data) => {
            if (data.data.length > 0 && this.onLandmarksUpdate) {
                this.onLandmarksUpdate(data.data[data.data.length - 1]);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
