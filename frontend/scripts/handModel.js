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
            'rigged_lowpoly_hand.glb',
            (gltf) => {
                console.log("Model loaded successfully");
                this.handModel = gltf.scene;
                
                // Add visual debugging - add a colored box to the model
                const helper = new THREE.BoxHelper(this.handModel, 0xff0000);
                this.scene.add(helper);
                
                console.log("Model hierarchy:");
                this.printModelHierarchy(this.handModel);

                this.scene.add(this.handModel);
                

                // Log model details
                console.log("Model details:", {
                    position: this.handModel.position,
                    scale: this.handModel.scale,
                    children: this.handModel.children.length
                });
                
                // Find all bones in the model
                this.bones = [];
                this.handModel.traverse((object) => {
                    if (object.isBone || object.type === 'Bone') {
                        this.bones.push(object);
                        console.log("Found bone:", object.name);
                    }
                });
                
                // Now map the bones to landmarks
                this.mapBonestoLandmarks();
                this.addBoneAxesHelpers();

                this.addVisualHelpers();

                // Adjust camera to focus on the model
                this.fitCameraToObject(this.handModel);
            },
            // Progress and error handlers remain the same
        );
    }

    printModelHierarchy(object, indent = 0) {
        const indentStr = ' '.repeat(indent * 2);
        console.log(`${indentStr}${object.name || 'unnamed'} (Type: ${object.type})`);
        
        if (object.children && object.children.length > 0) {
            object.children.forEach(child => {
                this.printModelHierarchy(child, indent + 1);
            });
        }
    }
    
    mapBonestoLandmarks() {
        // First, ensure we have the bones
        this.bones = [];
        this.handModel.traverse((object) => {
            if (object.isBone || object.type === 'Bone') {
                this.bones.push(object);
                console.log(`Found bone: ${object.name}`);
            }
        });
        
        // Map the bones based on their positions in the hierarchy
        // The mapping is based on common hand skeleton structures:
        // - First we have the wrist (root)
        // - Then usually thumb (3 bones)
        // - Then index (3 bones)
        // - Then middle (3 bones)
        // - Then ring (3 bones)
        // - Then pinky (3 bones)
        this.boneMap = {
            // Wrist is typically the root
            wrist: this.bones.find(bone => bone.name === "Bone_Armature"),
            
            // Thumb typically has 3 bones (CMC, MCP, IP)
            thumb1: this.bones.find(bone => bone.name === "Bone001_Armature"),
            thumb2: this.bones.find(bone => bone.name === "Bone002_Armature"),
            thumb3: this.bones.find(bone => bone.name === "Bone003_Armature"),
            
            // Index finger has 3 bones (MCP, PIP, DIP)
            index1: this.bones.find(bone => bone.name === "Bone004_Armature"),
            index2: this.bones.find(bone => bone.name === "Bone005_Armature"),
            index3: this.bones.find(bone => bone.name === "Bone006_Armature"),
            indexTip: this.bones.find(bone => bone.name === "Bone007_Armature"),
            
            // Middle finger has 3 bones (MCP, PIP, DIP)
            middle1: this.bones.find(bone => bone.name === "Bone008_Armature"),
            middle2: this.bones.find(bone => bone.name === "Bone009_Armature"),
            middle3: this.bones.find(bone => bone.name === "Bone010_Armature"),
            middleTip: this.bones.find(bone => bone.name === "Bone011_Armature"),
            
            // Ring finger has 3 bones (MCP, PIP, DIP)
            ring1: this.bones.find(bone => bone.name === "Bone012_Armature"),
            ring2: this.bones.find(bone => bone.name === "Bone013_Armature"),
            ring3: this.bones.find(bone => bone.name === "Bone014_Armature"),
            ringTip: this.bones.find(bone => bone.name === "Bone015_Armature"),
            
            // Pinky finger has 3 bones (MCP, PIP, DIP)
            pinky1: this.bones.find(bone => bone.name === "Bone016_Armature"),
            pinky2: this.bones.find(bone => bone.name === "Bone017_Armature"),
            pinky3: this.bones.find(bone => bone.name === "Bone018_Armature"),
            pinkyTip: this.bones.find(bone => bone.name === "Bone019_Armature")
        };
        
        console.log('Bone mapping completed:', this.boneMap);
        
        // Check for any missing mappings
        for (const [key, bone] of Object.entries(this.boneMap)) {
            if (!bone) {
                console.warn(`Missing bone mapping for ${key}`);
            }
        }
    }
    
    findBoneByName(name) {
        const bone = this.bones.find(bone => 
            bone.name.toLowerCase().includes(name.toLowerCase())
        );
        if (!bone) {
            console.warn(`Bone '${name}' not found`);
        }
        return bone;
    }

    updateHandPosition(landmarks) {
        // If the model isn't loaded yet, exit early
        if (!this.handModel || !this.boneMap) {
            console.warn("Hand model or bone map not ready yet");
            return;
        }
        
        // Debug info
        console.log("Updating hand with landmarks:", landmarks);
        
        // Update overall hand position based on wrist (landmark 0)
        if (landmarks[0]) {
            this.handModel.position.set(
                (landmarks[0].x - 0.5) * 2,  // Center the hand
                -(landmarks[0].y - 0.5) * 2, // Flip Y axis to match camera
                -landmarks[0].z * 2          // Scale Z coordinate
            );
            console.log("Hand position updated:", this.handModel.position);
        }
        
        // Map MediaPipe landmarks to the rigged model bones
        // MediaPipe hand landmarks: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
        
        // Thumb
        this.updateFingerBone(this.boneMap.thumb1, landmarks[1], landmarks[2]);  // CMC
        this.updateFingerBone(this.boneMap.thumb2, landmarks[2], landmarks[3]);  // MCP
        this.updateFingerBone(this.boneMap.thumb3, landmarks[3], landmarks[4]);  // IP to tip
        
        // Index
        this.updateFingerBone(this.boneMap.index1, landmarks[5], landmarks[6]);  // MCP
        this.updateFingerBone(this.boneMap.index2, landmarks[6], landmarks[7]);  // PIP
        this.updateFingerBone(this.boneMap.index3, landmarks[7], landmarks[8]);  // DIP to tip
        
        // Middle
        this.updateFingerBone(this.boneMap.middle1, landmarks[9], landmarks[10]);  // MCP
        this.updateFingerBone(this.boneMap.middle2, landmarks[10], landmarks[11]); // PIP
        this.updateFingerBone(this.boneMap.middle3, landmarks[11], landmarks[12]); // DIP to tip
        
        // Ring
        this.updateFingerBone(this.boneMap.ring1, landmarks[13], landmarks[14]); // MCP
        this.updateFingerBone(this.boneMap.ring2, landmarks[14], landmarks[15]); // PIP
        this.updateFingerBone(this.boneMap.ring3, landmarks[15], landmarks[16]); // DIP to tip
        
        // Pinky
        this.updateFingerBone(this.boneMap.pinky1, landmarks[17], landmarks[18]); // MCP
        this.updateFingerBone(this.boneMap.pinky2, landmarks[18], landmarks[19]); // PIP
        this.updateFingerBone(this.boneMap.pinky3, landmarks[19], landmarks[20]); // DIP to tip
    }
    
    updateFingerBone(bone, startLandmark, endLandmark) {
        if (!bone || !startLandmark || !endLandmark) {
            return;
        }
        
        try {
            // Store original quaternion for debugging
            const originalRotation = bone.quaternion.clone();
            
            // Calculate direction vector from start to end landmark
            const direction = new THREE.Vector3(
                endLandmark.x - startLandmark.x,
                -(endLandmark.y - startLandmark.y), // Flip Y axis
                -(endLandmark.z - startLandmark.z)  // Adjust Z
            );
            
            // Get magnitude for debugging
            const magnitude = direction.length();
            
            // Skip tiny movements to reduce jitter
            if (magnitude < 0.01) {
                return;
            }
            
            // Normalize the direction vector
            direction.normalize();
            
            // Use a more appropriate default direction based on your model's bone orientation
            // You might need to adjust this for each bone type
            // For example, thumb bones might point in a different direction than finger bones
            let defaultDirection;
            
            // Different default directions for different finger types
            if (bone.name.includes("001") || bone.name.includes("002") || bone.name.includes("003")) {
                // Thumb bones might point differently
                defaultDirection = new THREE.Vector3(1, 0, 0);
            } else {
                // Regular finger bones
                defaultDirection = new THREE.Vector3(0, 1, 0);
            }
            
            // Create a smoother rotation by blending with existing rotation
            // This helps reduce jittery movement
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(defaultDirection, direction);
            
            // Smooth between existing rotation and new rotation
            // Adjust the 0.3 value to control smoothing amount (lower = smoother but less responsive)
            bone.quaternion.slerp(quaternion, 0.3);
            
            // Log rotation changes for debugging
            if (bone.name === "Bone001_Armature") { // Log only for one bone to avoid console spam
                console.log(`Bone ${bone.name} rotation:`, {
                    from: startLandmark,
                    to: endLandmark,
                    direction: direction.toArray(),
                    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
                });
            }
        } catch (error) {
            console.error("Error updating finger bone:", error);
        }
    }

    addVisualHelpers() {
        // Add a grid to help with orientation
        const gridHelper = new THREE.GridHelper(1, 10);
        this.scene.add(gridHelper);
        
        // Add global axes
        const axesHelper = new THREE.AxesHelper(0.5);
        this.scene.add(axesHelper);
        
        // Add bone visualization
        if (this.handModel) {
            // Create a colored helper for each bone
            this.handModel.traverse((object) => {
                if (object.isBone || object.type === 'Bone') {
                    // Different color for each finger
                    let color;
                    if (object.name.includes("001") || object.name.includes("002") || object.name.includes("003")) {
                        color = 0xff0000; // Red for thumb
                    } else if (object.name.includes("004") || object.name.includes("005") || object.name.includes("006") || object.name.includes("007")) {
                        color = 0x00ff00; // Green for index
                    } else if (object.name.includes("008") || object.name.includes("009") || object.name.includes("010") || object.name.includes("011")) {
                        color = 0x0000ff; // Blue for middle
                    } else if (object.name.includes("012") || object.name.includes("013") || object.name.includes("014") || object.name.includes("015")) {
                        color = 0xff00ff; // Magenta for ring
                    } else if (object.name.includes("016") || object.name.includes("017") || object.name.includes("018") || object.name.includes("019")) {
                        color = 0xffff00; // Yellow for pinky
                    } else {
                        color = 0xffffff; // White for other bones
                    }
                    
                    // Add a small sphere at each bone position for visibility
                    const geometry = new THREE.SphereGeometry(0.01, 8, 8);
                    const material = new THREE.MeshBasicMaterial({ color: color });
                    const sphere = new THREE.Mesh(geometry, material);
                    object.add(sphere);
                    
                    // Add a line to show bone direction
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 0.05, 0) // Adjust direction as needed
                    ]);
                    const lineMaterial = new THREE.LineBasicMaterial({ color: color });
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    object.add(line);
                }
            });
        }
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
    fitCameraToObject(object, offset = 0.6) { // Reduced offset for closer view
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(object);
        
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        // Get more precise measurements of the actual model
        console.log("Bounding box size:", size);
        
        // Position camera closer to the hand
        const distance = Math.max(size.x, size.y) * offset;
        
        // Adjust position for better view
        this.camera.position.set(
            center.x,                 // Same X as center
            center.y + size.y * 0.1,  // Slightly above center
            center.z + distance       // Closer to the model
        );
        
        // Look at the center of the model
        this.camera.lookAt(center);
        
        // Add orbit controls if needed for debugging
        this.addOrbitControls();
        
        console.log("Camera positioned closer:", {
            position: this.camera.position.toArray(),
            lookAt: center.toArray()
        });
    }
    addBoneAxesHelpers() {
        if (!this.handModel) return;
        
        this.handModel.traverse((object) => {
            if (object.isBone || object.type === 'Bone') {
                const helper = new THREE.AxesHelper(0.05); // Small size appropriate for fingers
                object.add(helper);
                console.log(`Added axes helper to ${object.name}`);
            }
        });
    }
}
