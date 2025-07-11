// PROJECT_MANTA - TR-3B Black Manta Model System

// Ensure THREE.js is available
const THREE = window.THREE;

export class TR3BModel {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.mixer = null;
        this.plasmaRings = [];
        
        // Physical specifications
        this.specs = {
            wingspan: 183, // meters
            length: 61,    // meters
            height: 15,    // meters
            baseMass: 127000, // kg
            plasmaRingDiameter: 15.2 // meters
        };
        
        // LOD system
        this.lodLevels = [];
        this.currentLOD = 0;
        
        this.isLoaded = false;
        this.loadingProgress = 0;
    }
    
    async load() {
        try {
            // For now, create a procedural TR-3B model
            // In production, this would load the actual .glb file
            await this.createProceduralModel();
            this.setupLODSystem();
            this.createPlasmaRings();
            this.setupAnimations();
            
            this.isLoaded = true;
            console.log('TR-3B model loaded successfully');
            
        } catch (error) {
            console.error('Failed to load TR-3B model:', error);
            throw error;
        }
    }
    
    async createProceduralModel() {
        // Create main hull geometry (triangular)
        const hullGeometry = this.createHullGeometry();
        const hullMaterial = this.createHullMaterial();
        
        this.model = new window.THREE.Group();
        this.model.name = 'TR3B_BlackManta';
        
        // Main hull
        const hull = new window.THREE.Mesh(hullGeometry, hullMaterial);
        hull.castShadow = true;
        hull.receiveShadow = true;
        this.model.add(hull);
        
        // Cockpit
        const cockpit = this.createCockpit();
        this.model.add(cockpit);
        
        // Landing gear (retracted by default)
        const landingGear = this.createLandingGear();
        this.model.add(landingGear);
        
        // Add to scene
        this.scene.add(this.model);
        
        // Set initial position
        this.model.position.set(0, 100, 0);
        this.model.scale.setScalar(1);
    }
    
    createHullGeometry() {
        // Create triangular hull shape
        const shape = new window.THREE.Shape();
        const wingspan = this.specs.wingspan;
        const length = this.specs.length;
        
        // Define triangular shape points
        shape.moveTo(0, length / 2);           // Front point
        shape.lineTo(-wingspan / 2, -length / 2); // Left rear
        shape.lineTo(wingspan / 2, -length / 2);  // Right rear
        shape.lineTo(0, length / 2);           // Back to front
        
        // Extrude to create 3D hull
        const extrudeSettings = {
            depth: this.specs.height,
            bevelEnabled: true,
            bevelSegments: 8,
            steps: 2,
            bevelSize: 2,
            bevelThickness: 1
        };
        
        const geometry = new window.THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Center the geometry
        geometry.center();
        
        return geometry;
    }
    
    createHullMaterial() {
        // Black metallic PBR material
        const material = new window.THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1.0
        });
        
        // Add normal map for surface detail
        const normalTexture = this.createProceduralNormalMap();
        material.normalMap = normalTexture;
        material.normalScale = new window.THREE.Vector2(0.5, 0.5);
        
        return material;
    }
    
    createProceduralNormalMap() {
        // Create a procedural normal map for surface detail
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create noise pattern
        const imageData = ctx.createImageData(512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.random() * 0.1 + 0.5;
            imageData.data[i] = noise * 255;     // R
            imageData.data[i + 1] = noise * 255; // G
            imageData.data[i + 2] = 255;         // B (normal Z)
            imageData.data[i + 3] = 255;         // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new window.THREE.CanvasTexture(canvas);
        texture.wrapS = window.THREE.RepeatWrapping;
        texture.wrapT = window.THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        return texture;
    }
    
    createCockpit() {
        const cockpitGroup = new window.THREE.Group();
        cockpitGroup.name = 'Cockpit';
        
        // Cockpit dome
        const domeGeometry = new window.THREE.SphereGeometry(8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new window.THREE.MeshStandardMaterial({
            color: 0x001122,
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.1
        });
        
        const dome = new window.THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.set(0, this.specs.height / 2 + 5, 10);
        cockpitGroup.add(dome);
        
        // Interior (simplified)
        const interiorGeometry = new window.THREE.BoxGeometry(12, 6, 8);
        const interiorMaterial = new window.THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.5,
            roughness: 0.8
        });
        
        const interior = new window.THREE.Mesh(interiorGeometry, interiorMaterial);
        interior.position.set(0, this.specs.height / 2, 10);
        cockpitGroup.add(interior);
        
        return cockpitGroup;
    }
    
    createLandingGear() {
        const gearGroup = new window.THREE.Group();
        gearGroup.name = 'LandingGear';
        
        // Create three landing gear assemblies
        const gearPositions = [
            { x: 0, z: 20 },           // Front
            { x: -40, z: -20 },        // Left rear
            { x: 40, z: -20 }          // Right rear
        ];
        
        gearPositions.forEach((pos, index) => {
            const gear = this.createSingleGear();
            gear.position.set(pos.x, -this.specs.height / 2 - 10, pos.z);
            gear.name = `Gear_${index}`;
            gearGroup.add(gear);
        });
        
        // Initially retracted
        gearGroup.visible = false;
        
        return gearGroup;
    }
    
    createSingleGear() {
        const gearGroup = new window.THREE.Group();
        
        // Strut
        const strutGeometry = new window.THREE.CylinderGeometry(0.5, 0.8, 15);
        const strutMaterial = new window.THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const strut = new window.THREE.Mesh(strutGeometry, strutMaterial);
        gearGroup.add(strut);
        
        // Wheel
        const wheelGeometry = new window.THREE.CylinderGeometry(3, 3, 1.5);
        const wheelMaterial = new window.THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.1,
            roughness: 0.9
        });
        
        const wheel = new window.THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.y = -8;
        wheel.rotation.z = Math.PI / 2;
        gearGroup.add(wheel);
        
        return gearGroup;
    }
    
    createPlasmaRings() {
        const ringPositions = [
            { x: 0, z: 20 },           // Front vertex
            { x: -60, z: -25 },        // Left rear vertex
            { x: 60, z: -25 }          // Right rear vertex
        ];
        
        ringPositions.forEach((pos, index) => {
            const ring = this.createPlasmaRing();
            ring.position.set(pos.x, -this.specs.height / 2 - 2, pos.z);
            ring.name = `PlasmaRing_${index}`;
            
            this.plasmaRings.push(ring);
            this.model.add(ring);
        });
    }
    
    createPlasmaRing() {
        const ringGroup = new window.THREE.Group();
        
        // Ring geometry
        const ringGeometry = new window.THREE.TorusGeometry(
            this.specs.plasmaRingDiameter / 2,
            1,
            16,
            64
        );
        
        // Plasma material with shader
        const plasmaMaterial = new window.THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 0.0 },
                color: { value: new window.THREE.Color(0xff00ff) }
            },
            vertexShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * vec4(normal, 0.0)).xyz;
                    vPosition = position;
                    
                    vec3 distortedPosition = position;
                    float wave = sin(time * 2.0 + position.x * 0.1) * 0.5;
                    distortedPosition.y += wave * intensity;
                    
                    vIntensity = intensity;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                uniform vec3 color;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                void main() {
                    float plasmaWave = sin(time * 3.0 + vPosition.x * 0.2) * 0.5 + 0.5;
                    float plasmaWave2 = cos(time * 4.0 + vPosition.z * 0.15) * 0.5 + 0.5;
                    
                    vec3 plasmaColor = mix(color, vec3(0.0, 1.0, 1.0), plasmaWave * plasmaWave2);
                    
                    float alpha = vIntensity * (plasmaWave + plasmaWave2) * 0.5;
                    
                    float glow = 1.0 - length(vUv - 0.5);
                    plasmaColor *= glow;
                    
                    gl_FragColor = vec4(plasmaColor, alpha);
                }
            `,
            transparent: true,
            blending: window.THREE.AdditiveBlending
        });
        
        const ring = new window.THREE.Mesh(ringGeometry, plasmaMaterial);
        ring.rotation.x = Math.PI / 2;
        ringGroup.add(ring);
        
        // Add glow effect
        const glowGeometry = new window.THREE.TorusGeometry(
            this.specs.plasmaRingDiameter / 2 + 2,
            2,
            8,
            32
        );
        
        const glowMaterial = new window.THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.1,
            blending: window.THREE.AdditiveBlending
        });
        
        const glow = new window.THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = Math.PI / 2;
        ringGroup.add(glow);
        
        return ringGroup;
    }
    
    setupLODSystem() {
        // Create different LOD levels
        // This is a simplified version - in production, you'd have actual LOD models
        this.lodLevels = [
            { distance: 0, model: this.model },      // High detail
            { distance: 1000, model: this.model },   // Medium detail (same for now)
            { distance: 5000, model: this.model }    // Low detail (same for now)
        ];
    }
    
    setupAnimations() {
        // Setup animation mixer for landing gear, etc.
        this.mixer = new window.THREE.AnimationMixer(this.model);
        
        // Create landing gear animation
        this.createLandingGearAnimation();
    }
    
    createLandingGearAnimation() {
        const gearGroup = this.model.getObjectByName('LandingGear');
        if (!gearGroup) return;
        
        // Create keyframe tracks for gear deployment
        const times = [0, 1, 2];
        const values = [0, 0, 0, 0, -15, 0, 0, -15, 0]; // Y positions
        
        const positionTrack = new window.THREE.VectorKeyframeTrack(
            'LandingGear.position',
            times,
            values
        );
        
        const visibilityTrack = new window.THREE.BooleanKeyframeTrack(
            'LandingGear.visible',
            [0, 0.1],
            [false, true]
        );
        
        const clip = new window.THREE.AnimationClip('DeployGear', 2, [positionTrack, visibilityTrack]);
        this.gearAction = this.mixer.clipAction(clip);
        this.gearAction.setLoop(window.THREE.LoopOnce);
        this.gearAction.clampWhenFinished = true;
    }
    
    updateLOD(cameraPosition) {
        if (!this.model) return;
        
        const distance = cameraPosition.distanceTo(this.model.position);
        
        // Determine appropriate LOD level
        let newLOD = 0;
        for (let i = this.lodLevels.length - 1; i >= 0; i--) {
            if (distance >= this.lodLevels[i].distance) {
                newLOD = i;
                break;
            }
        }
        
        if (newLOD !== this.currentLOD) {
            this.currentLOD = newLOD;
            // Switch LOD models here
            console.log(`Switched to LOD level: ${newLOD}`);
        }
    }
    
    updatePlasmaRings(intensity, deltaTime) {
        this.plasmaRings.forEach((ring) => {
            const material = ring.children[0].material;
            if (material.uniforms) {
                material.uniforms.time.value += deltaTime;
                material.uniforms.intensity.value = intensity;
            }
            
            // Update glow
            const glow = ring.children[1];
            if (glow && glow.material) {
                glow.material.opacity = intensity * 0.3;
            }
        });
    }
    
    deployLandingGear() {
        if (this.gearAction) {
            this.gearAction.reset();
            this.gearAction.play();
        }
    }
    
    retractLandingGear() {
        if (this.gearAction) {
            this.gearAction.reset();
            this.gearAction.setEffectiveTimeScale(-1);
            this.gearAction.play();
        }
    }
    
    update(deltaTime, cameraPosition) {
        if (!this.isLoaded) return;
        
        // Update animations
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Update LOD
        if (cameraPosition) {
            this.updateLOD(cameraPosition);
        }
        
        // Update plasma rings
        this.updatePlasmaRings(0.5, deltaTime); // Default intensity
    }
    
    getModel() {
        return this.model;
    }
    
    getSpecs() {
        return this.specs;
    }
    
    dispose() {
        if (this.model) {
            this.scene.remove(this.model);
        }
        
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        // Dispose of geometries and materials
        this.model?.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}