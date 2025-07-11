// PROJECT_MANTA - Core Engine System

// Ensure THREE.js is available
const THREE = window.THREE;

export class Engine {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.composer = null;
        this.stats = null;
        
        this.isInitialized = false;
        this.isRunning = false;
        this.deltaTime = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        
        // Performance monitoring
        this.batteryAPI = null;
        this.batteryLevel = 1.0;
        this.isLowPowerMode = false;
        this.targetFPS = 60;
        this.actualFPS = 60;
        
        // Quality settings
        this.qualityLevel = 'high'; // high, medium, low
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
        
        this.init();
    }
    
    async init() {
        try {
            this.canvas = document.getElementById('main-canvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            await this.initRenderer();
            this.initScene();
            this.initCamera();
            this.initPostProcessing();
            this.initStats();
            await this.initBatteryAPI();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Engine initialized successfully');
            
        } catch (error) {
            console.error('Engine initialization failed:', error);
            throw error;
        }
    }
    
    async initRenderer() {
        // Check WebGL2 support
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            console.warn('WebGL2 not supported, falling back to WebGL1');
        }
        
        this.renderer = new window.THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        
        // Enhanced rendering settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = window.THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = window.THREE.SRGBColorSpace;
        
        // Performance optimizations
        this.renderer.info.autoReset = false;
        this.renderer.sortObjects = true;
        this.renderer.autoClear = false;
    }
    
    initScene() {
        this.scene = new window.THREE.Scene();
        
        // Volumetric fog
        this.scene.fog = new window.THREE.FogExp2(0x000011, 0.0001);
        
        // Environment setup
        this.setupEnvironment();
    }
    
    initCamera() {
        this.camera = new window.THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            50000
        );
        
        this.camera.position.set(0, 100, 500);
        this.camera.lookAt(0, 0, 0);
    }
    
    initPostProcessing() {
        // Post-processing will be implemented with EffectComposer
        // For now, we'll set up the basic structure
        this.composer = null; // Will be initialized when needed
    }
    
    initStats() {
        if (typeof Stats !== 'undefined') {
            this.stats = new Stats();
            this.stats.showPanel(0); // FPS panel
            this.stats.dom.style.position = 'absolute';
            this.stats.dom.style.top = '10px';
            this.stats.dom.style.left = '10px';
            this.stats.dom.style.zIndex = '1001';
            document.getElementById('stats-container').appendChild(this.stats.dom);
        }
    }
    
    async initBatteryAPI() {
        try {
            if ('getBattery' in navigator) {
                this.batteryAPI = await navigator.getBattery();
                this.batteryLevel = this.batteryAPI.level;
                
                this.batteryAPI.addEventListener('levelchange', () => {
                    this.batteryLevel = this.batteryAPI.level;
                    this.updateQualitySettings();
                });
                
                this.batteryAPI.addEventListener('chargingchange', () => {
                    this.updateQualitySettings();
                });
                
                this.updateQualitySettings();
            }
        } catch (error) {
            console.warn('Battery API not available:', error);
        }
    }
    
    setupEnvironment() {
        // Atmospheric scattering skybox
        const skyGeometry = new window.THREE.SphereGeometry(25000, 64, 32);
        const skyMaterial = new window.THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                sunPosition: { value: new window.THREE.Vector3(1000, 1000, 1000) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 sunPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec3 direction = normalize(vWorldPosition);
                    float sunDot = dot(direction, normalize(sunPosition));
                    
                    // Simple atmospheric scattering approximation
                    vec3 skyColor = mix(
                        vec3(0.0, 0.0, 0.1),
                        vec3(0.1, 0.2, 0.4),
                        max(0.0, direction.y)
                    );
                    
                    // Add stars
                    float stars = smoothstep(0.99, 1.0, 
                        sin(vWorldPosition.x * 100.0) * 
                        sin(vWorldPosition.y * 100.0) * 
                        sin(vWorldPosition.z * 100.0)
                    );
                    skyColor += vec3(stars * 0.5);
                    
                    gl_FragColor = vec4(skyColor, 1.0);
                }
            `,
            side: window.THREE.BackSide
        });
        
        const skyMesh = new window.THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyMesh);
        
        // Lighting setup
        this.setupLighting();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new window.THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new window.THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(1000, 1000, 1000);
        directionalLight.castShadow = true;
        
        // Shadow camera setup
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 5000;
        directionalLight.shadow.camera.left = -2000;
        directionalLight.shadow.camera.right = 2000;
        directionalLight.shadow.camera.top = 2000;
        directionalLight.shadow.camera.bottom = -2000;
        
        this.scene.add(directionalLight);
        
        // Point lights for atmospheric effects
        const pointLight1 = new window.THREE.PointLight(0x00ff00, 0.5, 1000);
        pointLight1.position.set(0, 200, 0);
        this.scene.add(pointLight1);
        
        const pointLight2 = new window.THREE.PointLight(0x0088ff, 0.3, 800);
        pointLight2.position.set(-500, 100, -500);
        this.scene.add(pointLight2);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Visibility change for performance optimization
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.targetFPS = 30; // Reduce FPS when tab is hidden
            } else {
                this.targetFPS = 60;
            }
        });
    }
    
    updateQualitySettings() {
        if (!this.batteryAPI) return;
        
        const isCharging = this.batteryAPI.charging;
        const batteryLevel = this.batteryAPI.level;
        
        // Determine quality level based on battery
        if (!isCharging && batteryLevel < 0.2) {
            this.setQualityLevel('low');
        } else if (!isCharging && batteryLevel < 0.5) {
            this.setQualityLevel('medium');
        } else {
            this.setQualityLevel('high');
        }
        
        // Update UI
        const batteryElement = document.getElementById('battery-level');
        const qualityElement = document.getElementById('quality-level');
        
        if (batteryElement) {
            batteryElement.textContent = `${Math.round(batteryLevel * 100)}%`;
        }
        
        if (qualityElement) {
            qualityElement.textContent = this.qualityLevel.charAt(0).toUpperCase() + this.qualityLevel.slice(1);
        }
    }
    
    setQualityLevel(level) {
        if (this.qualityLevel === level) return;
        
        this.qualityLevel = level;
        
        switch (level) {
            case 'low':
                this.pixelRatio = Math.min(window.devicePixelRatio, 1);
                this.renderer.shadowMap.enabled = false;
                this.targetFPS = 30;
                document.body.classList.add('low-power-mode');
                break;
                
            case 'medium':
                this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
                this.renderer.shadowMap.enabled = true;
                this.targetFPS = 45;
                document.body.classList.remove('low-power-mode');
                break;
                
            case 'high':
                this.pixelRatio = Math.min(window.devicePixelRatio, 2);
                this.renderer.shadowMap.enabled = true;
                this.targetFPS = 60;
                document.body.classList.remove('low-power-mode');
                break;
        }
        
        this.renderer.setPixelRatio(this.pixelRatio);
        console.log(`Quality level set to: ${level}`);
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    start() {
        if (!this.isInitialized) {
            console.error('Engine not initialized');
            return;
        }
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('Engine started');
    }
    
    stop() {
        this.isRunning = false;
        console.log('Engine stopped');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // FPS limiting
        const targetFrameTime = 1000 / this.targetFPS;
        if (currentTime - this.lastTime < targetFrameTime) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // Update stats
        if (this.stats) {
            this.stats.begin();
        }
        
        // Update systems
        this.update(this.deltaTime);
        this.render();
        
        // Update FPS counter
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.actualFPS = Math.round(1 / this.deltaTime);
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = this.actualFPS.toString();
            }
        }
        
        if (this.stats) {
            this.stats.end();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update scene uniforms
        this.scene.traverse((object) => {
            if (object.material && object.material.uniforms) {
                if (object.material.uniforms.time) {
                    object.material.uniforms.time.value += deltaTime;
                }
            }
        });
        
        // Clear renderer info for next frame
        this.renderer.info.reset();
    }
    
    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    dispose() {
        this.stop();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.composer) {
            this.composer.dispose();
        }
        
        if (this.stats && this.stats.dom.parentNode) {
            this.stats.dom.parentNode.removeChild(this.stats.dom);
        }
        
        window.removeEventListener('resize', this.onWindowResize);
    }
}