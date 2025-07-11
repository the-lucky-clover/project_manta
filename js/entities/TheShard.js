// PROJECT_MANTA - The Shard Boss Entity

// Ensure THREE.js is available
const THREE = window.THREE;

export class TheShard {
    constructor(scene, audioSystem) {
        this.scene = scene;
        this.audioSystem = audioSystem;
        
        // Boss properties
        this.health = 3;
        this.maxHealth = 3;
        this.isActive = false;
        this.isDefeated = false;
        
        // Position and movement
        this.position = new window.THREE.Vector3(0, 1500, -4000);
        this.rotation = new window.THREE.Euler(0, 0, 0);
        this.scale = 1.0;
        
        // Temporal effects
        this.temporalField = {
            strength: 0.0,
            radius: 1000,
            inputLagFactor: 0.0,
            hudGlitchIntensity: 0.0
        };
        
        // Quantum echoes
        this.quantumEchoes = [];
        this.echoSpawnTimer = 0;
        this.echoSpawnInterval = 3.0;
        
        // Chronological core
        this.chronologicalCore = {
            position: new window.THREE.Vector3(0, 0, 0),
            isVisible: false,
            scansCompleted: 0,
            scansRequired: 3,
            scanRange: 50
        };
        
        // Visual components
        this.mesh = null;
        this.coreMesh = null;
        this.fieldMesh = null;
        
        // Shader uniforms
        this.shaderUniforms = {
            time: { value: 0 },
            temporalDistortion: { value: 0 },
            chronologicalStability: { value: 1 }
        };
        
        // Phase management
        this.currentPhase = 0;
        this.phaseTimer = 0;
        this.phases = [
            { name: 'Temporal Distortion', duration: 30, effects: ['input_lag', 'hud_glitch'] },
            { name: 'Quantum Echoes', duration: 45, effects: ['quantum_echoes'] },
            { name: 'Chronological Instability', duration: 60, effects: ['input_lag', 'hud_glitch', 'quantum_echoes'] }
        ];
        
        this.init();
    }
    
    init() {
        this.createShardMesh();
        this.createChronologicalCore();
        this.createTemporalField();
        
        console.log('The Shard boss entity initialized');
    }
    
    createShardMesh() {
        // Create non-Euclidean crystalline geometry
        const geometry = this.createCrystallineGeometry();
        
        // Temporal distortion shader material
        const material = new window.THREE.ShaderMaterial({
            uniforms: {
                ...this.shaderUniforms,
                color1: { value: new window.THREE.Color(0x4400ff) },
                color2: { value: new window.THREE.Color(0x00ffff) },
                color3: { value: new window.THREE.Color(0xff0044) }
            },
            vertexShader: `
                uniform float time;
                uniform float temporalDistortion;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vDistortion;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    vUv = uv;
                    
                    // Non-Euclidean distortion
                    vec3 distortedPosition = position;
                    
                    // Temporal wave distortion
                    float wave1 = sin(time * 2.0 + position.x * 0.01) * temporalDistortion;
                    float wave2 = cos(time * 1.5 + position.y * 0.01) * temporalDistortion;
                    float wave3 = sin(time * 3.0 + position.z * 0.01) * temporalDistortion;
                    
                    distortedPosition.x += wave1 * 50.0;
                    distortedPosition.y += wave2 * 50.0;
                    distortedPosition.z += wave3 * 50.0;
                    
                    // Non-linear space distortion
                    float r = length(position);
                    float distortionFactor = 1.0 + sin(r * 0.01 + time) * temporalDistortion * 0.5;
                    distortedPosition *= distortionFactor;
                    
                    vDistortion = distortionFactor;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float temporalDistortion;
                uniform float chronologicalStability;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vDistortion;
                
                void main() {
                    // Refractive effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(vNormal, viewDirection), 2.0);
                    
                    // Temporal color shifting
                    float timeShift = sin(time * 4.0 + vPosition.x * 0.01) * 0.5 + 0.5;
                    vec3 shiftedColor = mix(color1, color2, timeShift);
                    shiftedColor = mix(shiftedColor, color3, sin(time * 2.0) * 0.5 + 0.5);
                    
                    // Chronological instability effect
                    float instability = 1.0 - chronologicalStability;
                    vec3 instabilityColor = vec3(1.0, 0.0, 0.0) * instability;
                    shiftedColor = mix(shiftedColor, instabilityColor, instability * 0.5);
                    
                    // Distortion-based transparency
                    float alpha = 0.7 + vDistortion * 0.3;
                    alpha *= (1.0 - instability * 0.5);
                    
                    // Fresnel transparency
                    alpha *= fresnel;
                    
                    gl_FragColor = vec4(shiftedColor, alpha);
                }
            `,
            transparent: true,
            side: window.THREE.DoubleSide,
            blending: window.THREE.AdditiveBlending
        });
        
        this.mesh = new window.THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.scale.setScalar(200); // Large scale
        this.mesh.name = 'TheShard';
        
        this.scene.add(this.mesh);
    }
    
    createCrystallineGeometry() {
        // Create a complex crystalline structure
        const geometry = new window.THREE.BufferGeometry();
        
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];
        
        // Create multiple crystal formations
        const crystalCount = 8;
        const baseRadius = 1;
        
        for (let c = 0; c < crystalCount; c++) {
            const angle = (c / crystalCount) * Math.PI * 2;
            const crystalHeight = 2 + Math.random() * 3;
            const crystalRadius = baseRadius * (0.5 + Math.random() * 0.5);
            
            // Crystal center
            const centerX = Math.cos(angle) * baseRadius * 0.5;
            const centerY = 0;
            const centerZ = Math.sin(angle) * baseRadius * 0.5;
            
            // Create crystal points
            const segments = 6;
            const baseVertexIndex = vertices.length / 3;
            
            // Base vertices
            for (let i = 0; i < segments; i++) {
                const segmentAngle = (i / segments) * Math.PI * 2;
                const x = centerX + Math.cos(segmentAngle) * crystalRadius;
                const y = centerY;
                const z = centerZ + Math.sin(segmentAngle) * crystalRadius;
                
                vertices.push(x, y, z);
                normals.push(0, -1, 0);
                uvs.push(i / segments, 0);
            }
            
            // Top vertex
            vertices.push(centerX, centerY + crystalHeight, centerZ);
            normals.push(0, 1, 0);
            uvs.push(0.5, 1);
            
            // Create faces
            for (let i = 0; i < segments; i++) {
                const next = (i + 1) % segments;
                
                // Side faces
                indices.push(
                    baseVertexIndex + i,
                    baseVertexIndex + next,
                    baseVertexIndex + segments
                );
                
                // Base faces (if needed)
                if (c === 0) {
                    indices.push(
                        baseVertexIndex + next,
                        baseVertexIndex + i,
                        baseVertexIndex + segments
                    );
                }
            }
        }
        
        geometry.setAttribute('position', new window.THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new window.THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new window.THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    createChronologicalCore() {
        // Create the scannable core
        const coreGeometry = new window.THREE.SphereGeometry(30, 32, 32);
        const coreMaterial = new window.THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            wireframe: true
        });
        
        this.coreMesh = new window.THREE.Mesh(coreGeometry, coreMaterial);
        this.coreMesh.name = 'ChronologicalCore';
        this.coreMesh.visible = false;
        
        this.mesh.add(this.coreMesh);
    }
    
    createTemporalField() {
        // Create visual representation of temporal field
        const fieldGeometry = new window.THREE.SphereGeometry(this.temporalField.radius, 32, 32);
        const fieldMaterial = new window.THREE.MeshBasicMaterial({
            color: 0x4400ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        
        this.fieldMesh = new window.THREE.Mesh(fieldGeometry, fieldMaterial);
        this.fieldMesh.name = 'TemporalField';
        
        this.mesh.add(this.fieldMesh);
    }
    
    activate() {
        this.isActive = true;
        this.currentPhase = 0;
        this.phaseTimer = 0;
        
        // Start entrance animation
        this.playEntranceAnimation();
        
        console.log('The Shard boss activated');
    }
    
    playEntranceAnimation() {
        // Dramatic entrance with temporal distortion
        this.mesh.scale.setScalar(0);
        this.mesh.visible = true;
        
        // Animate scale up
        const startTime = Date.now();
        const duration = 3000; // 3 seconds
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.mesh.scale.setScalar(200 * easeOut);
            this.shaderUniforms.temporalDistortion.value = easeOut * 0.5;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.startPhase(0);
            }
        };
        
        animate();
        
        // Play entrance sound
        if (this.audioSystem) {
            this.audioSystem.playSound('boss_entrance', 0.8);
        }
    }
    
    startPhase(phaseIndex) {
        if (phaseIndex >= this.phases.length) {
            this.enterFinalPhase();
            return;
        }
        
        this.currentPhase = phaseIndex;
        this.phaseTimer = 0;
        
        const phase = this.phases[phaseIndex];
        console.log(`The Shard entering phase: ${phase.name}`);
        
        // Apply phase effects
        this.applyPhaseEffects(phase.effects);
        
        // Show chronological core in final phase
        if (phaseIndex >= 2) {
            this.revealChronologicalCore();
        }
    }
    
    applyPhaseEffects(effects) {
        effects.forEach(effect => {
            switch (effect) {
                case 'input_lag':
                    this.temporalField.inputLagFactor = 0.3;
                    break;
                case 'hud_glitch':
                    this.temporalField.hudGlitchIntensity = 0.5;
                    this.triggerHUDGlitch();
                    break;
                case 'quantum_echoes':
                    this.enableQuantumEchoes();
                    break;
                case 'temporal_field':
                    this.temporalField.strength = 1.0;
                    break;
            }
        });
    }
    
    triggerHUDGlitch() {
        // Add glitch effect to HUD
        const hud = document.getElementById('hud-overlay');
        if (hud) {
            hud.style.animation = 'hud-glitch 0.2s infinite';
        }
        
        // Add glitch CSS if not exists
        if (!document.getElementById('glitch-styles')) {
            const style = document.createElement('style');
            style.id = 'glitch-styles';
            style.textContent = `
                @keyframes hud-glitch {
                    0% { transform: translate(0); filter: hue-rotate(0deg); }
                    20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
                    40% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
                    60% { transform: translate(2px, 2px); filter: hue-rotate(270deg); }
                    80% { transform: translate(2px, -2px); filter: hue-rotate(360deg); }
                    100% { transform: translate(0); filter: hue-rotate(0deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    enableQuantumEchoes() {
        this.echoSpawnTimer = 0;
        console.log('Quantum echoes enabled');
    }
    
    revealChronologicalCore() {
        this.chronologicalCore.isVisible = true;
        this.coreMesh.visible = true;
        
        // Animate core appearance
        this.coreMesh.material.opacity = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / 2000, 1);
            
            this.coreMesh.material.opacity = progress * 0.8;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        
        console.log('Chronological core revealed');
    }
    
    createQuantumEcho() {
        // Create a semi-transparent duplicate
        const echoGeometry = this.mesh.geometry.clone();
        const echoMaterial = this.mesh.material.clone();
        echoMaterial.opacity *= 0.3;
        
        const echo = new THREE.Mesh(echoGeometry, echoMaterial);
        echo.position.copy(this.mesh.position);
        echo.rotation.copy(this.mesh.rotation);
        echo.scale.copy(this.mesh.scale);
        
        // Random direction
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        const echoData = {
            mesh: echo,
            direction: direction,
            speed: 200 + Math.random() * 100,
            lifetime: 10,
            age: 0
        };
        
        this.quantumEchoes.push(echoData);
        this.scene.add(echo);
        
        console.log('Quantum echo created');
    }
    
    attemptScan(scannerPosition) {
        if (!this.chronologicalCore.isVisible) return false;
        
        const coreWorldPosition = new window.THREE.Vector3();
        this.coreMesh.getWorldPosition(coreWorldPosition);
        
        const distance = scannerPosition.distanceTo(coreWorldPosition);
        
        if (distance <= this.chronologicalCore.scanRange) {
            this.performScan();
            return true;
        }
        
        return false;
    }
    
    performScan() {
        this.chronologicalCore.scansCompleted++;
        
        console.log(`Scan completed: ${this.chronologicalCore.scansCompleted}/${this.chronologicalCore.scansRequired}`);
        
        // Visual feedback
        this.coreMesh.material.color.setHex(0x00ff00);
        setTimeout(() => {
            this.coreMesh.material.color.setHex(0xffffff);
        }, 500);
        
        // Check if boss is defeated
        if (this.chronologicalCore.scansCompleted >= this.chronologicalCore.scansRequired) {
            this.defeat();
        } else {
            // Increase difficulty
            this.shaderUniforms.chronologicalStability.value -= 0.3;
        }
    }
    
    defeat() {
        this.isDefeated = true;
        this.isActive = false;
        
        console.log('The Shard defeated');
        
        // Play defeat animation
        this.playDefeatAnimation();
        
        // Show defeat dialogue
        this.showDefeatDialogue();
        
        // Dispatch defeat event
        const event = new CustomEvent('bossDefeated', {
            detail: { bossId: 'the_shard' }
        });
        window.dispatchEvent(event);
    }
    
    playDefeatAnimation() {
        const startTime = Date.now();
        const duration = 3000;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fade out and scale down
            this.mesh.scale.setScalar(200 * (1 - progress));
            this.mesh.material.opacity = 1 - progress;
            
            // Temporal distortion reduction
            this.shaderUniforms.temporalDistortion.value = 0.5 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.mesh.visible = false;
                this.clearTemporalEffects();
            }
        };
        
        animate();
    }
    
    showDefeatDialogue() {
        setTimeout(() => {
            // Create dialogue UI
            const dialogueElement = document.createElement('div');
            dialogueElement.className = 'boss-defeat-dialogue';
            dialogueElement.innerHTML = `
                <div class="dialogue-content">
                    <div class="speaker-name">Commandant Eva Rostova</div>
                    <div class="dialogue-text">My God... What was that? This changes everything. The training is over.</div>
                    <button class="dialogue-continue">Continue</button>
                </div>
            `;
            
            dialogueElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5000;
                color: #00ff00;
                font-family: 'Courier New', monospace;
            `;
            
            const content = dialogueElement.querySelector('.dialogue-content');
            content.style.cssText = `
                max-width: 600px;
                padding: 30px;
                background: rgba(0, 20, 0, 0.95);
                border: 2px solid #00ff00;
                border-radius: 10px;
                text-align: center;
            `;
            
            const continueBtn = dialogueElement.querySelector('.dialogue-continue');
            continueBtn.style.cssText = `
                margin-top: 20px;
                padding: 10px 20px;
                background: transparent;
                border: 2px solid #00ff00;
                color: #00ff00;
                font-family: inherit;
                cursor: pointer;
                border-radius: 5px;
            `;
            
            continueBtn.addEventListener('click', () => {
                dialogueElement.remove();
            });
            
            document.body.appendChild(dialogueElement);
        }, 2000);
    }
    
    clearTemporalEffects() {
        // Remove temporal field effects
        this.temporalField.strength = 0;
        this.temporalField.inputLagFactor = 0;
        this.temporalField.hudGlitchIntensity = 0;
        
        // Remove HUD glitch
        const hud = document.getElementById('hud-overlay');
        if (hud) {
            hud.style.animation = 'hud-flicker 3s infinite alternate';
        }
        
        // Clear quantum echoes
        this.quantumEchoes.forEach(echo => {
            this.scene.remove(echo.mesh);
            echo.mesh.geometry.dispose();
            echo.mesh.material.dispose();
        });
        this.quantumEchoes = [];
    }
    
    update(deltaTime, playerPosition) {
        if (!this.isActive || this.isDefeated) return;
        
        // Update shader uniforms
        this.shaderUniforms.time.value += deltaTime;
        
        // Update phase timer
        this.phaseTimer += deltaTime;
        
        // Check phase progression
        const currentPhaseData = this.phases[this.currentPhase];
        if (currentPhaseData && this.phaseTimer >= currentPhaseData.duration) {
            this.startPhase(this.currentPhase + 1);
        }
        
        // Update rotation
        this.mesh.rotation.x += deltaTime * 0.1;
        this.mesh.rotation.y += deltaTime * 0.15;
        this.mesh.rotation.z += deltaTime * 0.05;
        
        // Update quantum echoes
        this.updateQuantumEchoes(deltaTime);
        
        // Spawn new echoes
        if (this.phases[this.currentPhase]?.effects.includes('quantum_echoes')) {
            this.echoSpawnTimer += deltaTime;
            if (this.echoSpawnTimer >= this.echoSpawnInterval) {
                this.createQuantumEcho();
                this.echoSpawnTimer = 0;
            }
        }
        
        // Update chronological core
        if (this.chronologicalCore.isVisible) {
            this.coreMesh.rotation.x += deltaTime * 2;
            this.coreMesh.rotation.y += deltaTime * 1.5;
        }
    }
    
    updateQuantumEchoes(deltaTime) {
        for (let i = this.quantumEchoes.length - 1; i >= 0; i--) {
            const echo = this.quantumEchoes[i];
            echo.age += deltaTime;
            
            // Move echo
            const movement = echo.direction.clone().multiplyScalar(echo.speed * deltaTime);
            echo.mesh.position.add(movement);
            
            // Fade out over time
            const fadeProgress = echo.age / echo.lifetime;
            echo.mesh.material.opacity = (1 - fadeProgress) * 0.3;
            
            // Remove expired echoes
            if (echo.age >= echo.lifetime) {
                this.scene.remove(echo.mesh);
                echo.mesh.geometry.dispose();
                echo.mesh.material.dispose();
                this.quantumEchoes.splice(i, 1);
            }
        }
    }
    
    getTemporalFieldStrength(position) {
        const distance = position.distanceTo(this.position);
        if (distance > this.temporalField.radius) return 0;
        
        const normalizedDistance = distance / this.temporalField.radius;
        return this.temporalField.strength * (1 - normalizedDistance);
    }
    
    getInputLagFactor() {
        return this.temporalField.inputLagFactor;
    }
    
    dispose() {
        // Remove from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            
            // Dispose of geometries and materials
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        
        // Clear quantum echoes
        this.clearTemporalEffects();
        
        console.log('The Shard disposed');
    }
}