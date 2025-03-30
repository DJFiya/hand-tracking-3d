class HandModel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.init();
        this.createHand();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 2;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(ambientLight, pointLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createHand() {
        this.joints = [];
        this.connections = [];

        // Create joints (21 landmarks)
        for (let i = 0; i < 21; i++) {
            const geometry = new THREE.SphereGeometry(0.03);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            const joint = new THREE.Mesh(geometry, material);
            this.scene.add(joint);
            this.joints.push(joint);
        }

        // Create connections between joints
        const handConnections = [
            // Palm
            [0, 1], [1, 2], [2, 3], [3, 4],    // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],    // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20]  // Pinky
        ];

        handConnections.forEach(([start, end]) => {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.connections.push({ line, start, end });
        });
    }

    updateHandPosition(landmarks) {
        // Update joint positions
        landmarks.forEach((landmark, i) => {
            this.joints[i].position.set(
                (landmark.x - 0.5) * 2,     // Center the hand
                -(landmark.y - 0.5) * 2,    // Flip Y axis to match camera
                -landmark.z * 2             // Scale Z coordinate
            );
        });

        // Update connections
        this.connections.forEach(({ line, start, end }) => {
            const startPos = this.joints[start].position;
            const endPos = this.joints[end].position;
            
            const points = [startPos, endPos];
            line.geometry.setFromPoints(points);
        });
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}
