class HandModel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.handModel = null;
        this.bones = [];
        
        this.init();
        this.loadRiggedHand();
        console.log("THREE available:", typeof THREE !== 'undefined');
        console.log("GLTFLoader available:", typeof THREE.GLTFLoader !== 'undefined');
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

    loadRiggedHand() {
        // Check if GLTFLoader is available
        console.log("THREE available:", typeof THREE !== 'undefined');
        console.log("GLTFLoader available:", typeof THREE.GLTFLoader !== 'undefined');
        
        // Use THREE.GLTFLoader if it's defined by your local script
        const loader = new THREE.GLTFLoader();
        
        // Load the model
        loader.load(
            'rigged_lowpoly_hand.glb',  // Path is relative to the scripts folder
            (gltf) => {
                // Successfully loaded the model
                console.log("Model loaded successfully");
                this.handModel = gltf.scene;
                this.scene.add(this.handModel);
                
                // Set initial position/scale if needed
                this.handModel.position.set(0, 0, 0);
                this.handModel.scale.set(1, 1, 1);
                
                // You may need to add code here to handle the rigged hand's bones
                // depending on how you want to control it
            },
            (xhr) => {
                // Loading progress
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                // Error handling
                console.error('An error happened while loading the model:', error);
                
                // Fallback to skeleton hand if model fails to load
                //console.log("Falling back to skeleton hand");
                //this.createHand();
            }
        );
    }
    
    mapBonestoLandmarks() {
        // This mapping depends on the specific bone structure of your rigged model
        // You'll need to adjust this based on your GLB file's bone hierarchy
        this.boneMap = {
            // Example mapping (adjust according to your model's structure)
            wrist: this.findBoneByName('Wrist'),
            thumb1: this.findBoneByName('Thumb1'),
            thumb2: this.findBoneByName('Thumb2'),
            thumb3: this.findBoneByName('Thumb3'),
            index1: this.findBoneByName('Index1'),
            index2: this.findBoneByName('Index2'),
            index3: this.findBoneByName('Index3'),
            middle1: this.findBoneByName('Middle1'),
            middle2: this.findBoneByName('Middle2'),
            middle3: this.findBoneByName('Middle3'),
            ring1: this.findBoneByName('Ring1'),
            ring2: this.findBoneByName('Ring2'),
            ring3: this.findBoneByName('Ring3'),
            pinky1: this.findBoneByName('Pinky1'),
            pinky2: this.findBoneByName('Pinky2'),
            pinky3: this.findBoneByName('Pinky3')
        };
        
        console.log('Bone mapping completed:', this.boneMap);
    }
    
    findBoneByName(name) {
        return this.bones.find(bone => bone.name.includes(name));
    }

    updateHandPosition(landmarks) {
        // If the model isn't loaded yet, exit early
        if (!this.handModel || !this.boneMap) return;
        
        // Update overall hand position based on wrist (landmark 0)
        if (landmarks[0]) {
            this.handModel.position.set(
                (landmarks[0].x - 0.5) * 2,  // Center the hand
                -(landmarks[0].y - 0.5) * 2, // Flip Y axis to match camera
                -landmarks[0].z * 2          // Scale Z coordinate
            );
        }
        
        // Map the MediaPipe hand landmarks to the rigged model bones
        // This mapping will depend on your specific model's rig
        
        // Example bone rotations (you'll need to adjust these based on your model's rig)
        if (this.boneMap.thumb1 && landmarks[2]) {
            this.updateBoneRotation(this.boneMap.thumb1, landmarks[1], landmarks[2]);
        }
        
        if (this.boneMap.thumb2 && landmarks[3]) {
            this.updateBoneRotation(this.boneMap.thumb2, landmarks[2], landmarks[3]);
        }
        
        if (this.boneMap.thumb3 && landmarks[4]) {
            this.updateBoneRotation(this.boneMap.thumb3, landmarks[3], landmarks[4]);
        }
        
        // Index finger
        if (this.boneMap.index1 && landmarks[6]) {
            this.updateBoneRotation(this.boneMap.index1, landmarks[5], landmarks[6]);
        }
        
        if (this.boneMap.index2 && landmarks[7]) {
            this.updateBoneRotation(this.boneMap.index2, landmarks[6], landmarks[7]);
        }
        
        if (this.boneMap.index3 && landmarks[8]) {
            this.updateBoneRotation(this.boneMap.index3, landmarks[7], landmarks[8]);
        }
        
        // Continue for other fingers...
    }
    
    updateBoneRotation(bone, startLandmark, endLandmark) {
        if (!bone || !startLandmark || !endLandmark) return;
        
        // Calculate direction vector from start to end landmark
        const direction = new THREE.Vector3(
            endLandmark.x - startLandmark.x,
            -(endLandmark.y - startLandmark.y), // Flip Y axis
            -(endLandmark.z - startLandmark.z)  // Scale Z
        );
        
        // Normalize the direction vector
        direction.normalize();
        
        // Create a quaternion that rotates from the bone's default direction to the new direction
        // Note: You might need to adjust the default direction based on your model
        const defaultDirection = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(defaultDirection, direction);
        
        // Apply the rotation to the bone
        bone.quaternion.copy(quaternion);
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