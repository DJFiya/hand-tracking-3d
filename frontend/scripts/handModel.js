class HandModel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.points = []; // Array to store point meshes
        this.curves = []; // Array to store curve meshes
        this.targetPositions = []; // Array to store target positions for interpolation
        this.smoothingFactor = 0.3; // Increased from 0.15 for more responsive movement while keeping some smoothing

        this.init();
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

        // Create points for landmarks
        this.createPoints(21); // Assuming 21 landmarks

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    createPoints(count) {
        const geometry = new THREE.SphereGeometry(0.01, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        for (let i = 0; i < count; i++) {
            const point = new THREE.Mesh(geometry, material);
            this.scene.add(point);
            this.points.push(point);
        }
    }

    updateHandPosition(landmarks) {
        if (!landmarks || landmarks.length !== this.points.length) {
            console.warn("Invalid landmarks data");
            return;
        }

        // Initialize target positions array if needed
        if (this.targetPositions.length === 0) {
            this.targetPositions = landmarks.map(landmark => ({
                x: (landmark.x - 0.5) * 2,
                y: -(landmark.y - 0.5) * 2,
                z: -landmark.z * 2
            }));
        }

        // Update target positions
        landmarks.forEach((landmark, index) => {
            this.targetPositions[index] = {
                x: (landmark.x - 0.5) * 2,
                y: -(landmark.y - 0.5) * 2,
                z: -landmark.z * 2
            };
        });

        // Interpolate current positions towards target positions
        this.points.forEach((point, index) => {
            const target = this.targetPositions[index];
            point.position.x += (target.x - point.position.x) * this.smoothingFactor;
            point.position.y += (target.y - point.position.y) * this.smoothingFactor;
            point.position.z += (target.z - point.position.z) * this.smoothingFactor;
        });

        // Update curves with interpolated positions
        this.updateCurves(this.points.map(point => ({
            x: (point.position.x / 2) + 0.5,
            y: -(point.position.y / 2) + 0.5,
            z: -point.position.z / 2
        })));
    }

    updateCurves(landmarks) {
        // Remove existing curves
        this.curves.forEach(curve => this.scene.remove(curve));
        this.curves = [];

        // Define finger connections (indices based on MediaPipe hand landmarks)
        const fingers = [
            [2, 3, 4],       // Thumb (skip wrist connection)
            [5, 6, 7, 8],       // Index
            [9, 10, 11, 12],    // Middle
            [13, 14, 15, 16],   // Ring
            [17, 18, 19, 20]    // Pinky
        ];

        // Create curves for fingers
        fingers.forEach((fingerIndices, fingerIndex) => {
            const fingerPoints = fingerIndices.map(i => {
                const landmark = landmarks[i];
                return new THREE.Vector3(
                    (landmark.x - 0.5) * 2,
                    -(landmark.y - 0.5) * 2,
                    -landmark.z * 2 // Invert Z direction for fingers
                );
            });

            const curve = new THREE.CatmullRomCurve3(fingerPoints);
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                20,
                fingerIndex === 0 ? 0.08 : 0.05, // Increase thumb thickness
                8,
                false
            );
            const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.7 }); 
            const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

            // Add rounded tops to the fingers
            const sphereGeometry = new THREE.SphereGeometry(fingerIndex === 0 ? 0.078 : 0.048, 16, 16); // Match thumb thickness
            const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.7 }); 
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphereMesh.position.copy(fingerPoints[fingerPoints.length - 1]); // Position at the fingertip
            this.scene.add(sphereMesh);
            this.curves.push(sphereMesh);

            this.scene.add(tubeMesh);
            this.curves.push(tubeMesh);
        });

        // Create a palm curve connecting the base of all fingers to the wrist and thumb
        const palmIndices = [0, 2, 5, 9, 13, 17, 0]; 
        const palmPoints = palmIndices.map(i => {
            const landmark = landmarks[i];
            return new THREE.Vector3(
                (landmark.x - 0.5) * 2,
                -(landmark.y - 0.5) * 2,
                -landmark.z * 2 
            );
        });

        const palmCurve = new THREE.CatmullRomCurve3(palmPoints, true); // Closed curve for palm
        const palmGeometry = new THREE.TubeGeometry(palmCurve, 50, 0.08, 8, false); // More segments for smoothness
        const palmMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.7 }); 
        const palmMesh = new THREE.Mesh(palmGeometry, palmMaterial);

        this.scene.add(palmMesh);
        this.curves.push(palmMesh);
    }

    fitCameraToObject(offset = 1.6) {
        // Adjust the camera to fit the points
        const boundingBox = new THREE.Box3();
        this.points.forEach(point => boundingBox.expandByPoint(point.position));

        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * offset;

        this.camera.position.set(center.x, center.y - distance, center.z); 
        this.camera.near = 0.1;
        this.camera.far = distance*10;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(center);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.points.length > 0) {
            const centerPoint = this.points[0]; 
            const targetCameraPos = new THREE.Vector3(
                centerPoint.position.x,
                centerPoint.position.y,
                centerPoint.position.z + 2
            );
            
            this.camera.position.lerp(targetCameraPos, 0.15); 
            this.camera.lookAt(centerPoint.position);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}