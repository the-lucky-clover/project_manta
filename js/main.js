// PROJECT_MANTA - Main Application Entry Point

const THREE = window.THREE;
const CANNON = window.CANNON;

import { Engine } from './core/Engine.js';
import { TR3BModel } from './core/TR3BModel.js';
import { ControlSystem } from './systems/ControlSystem.js';
import { AntiGravitySystem } from './systems/AntiGravitySystem.js';
import { PhysicsSystem } from './components/PhysicsSystem.js';
import { AudioSystem } from './components/AudioSystem.js';
import { HUDSystem } from './components/HUDSystem.js';
import { CampaignSystem } from './components/CampaignSystem.js';

class ProjectManta {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-bar');
        this.loadingText = document.getElementById('loading-text');
        
        // Core systems
        this.engine = null;
        this.tr3bModel = null;
        this.controlSystem = null;
        this.antiGravitySystem = null;
        this.physicsSystem = null;
        this.audioSystem = null;
        this.hudSystem = null;
        this.campaignSystem = null;
        
        // Physics world
        this.world = null;
        this.tr3bBody = null;
        
        // Game state
        this.isInitialized = false;
        this.isRunning = false;
        this.deltaTime = 0;
        this.lastTime = 0;
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Starting PROJECT_MANTA initialization...');
            this.updateLoadingProgress(5, 'Initializing core engine...');
            
            // Initialize core engine
            this.engine = new Engine();
            console.log('Engine created, checking initialization...');
            
            // Wait a moment for engine to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('Engine initialization status:', this.engine.isInitialized);
            this.updateLoadingProgress(15, 'Engine systems online...');
            
            // Initialize physics world
            console.log('Initializing physics world...');
            this.initPhysicsWorld();
            this.updateLoadingProgress(25, 'Physics world created...');
            
            // Initialize control system
            console.log('Initializing control system...');
            this.controlSystem = new ControlSystem(this.engine.canvas);
            this.updateLoadingProgress(35, 'Control systems calibrated...');
            
            // Load TR-3B model
            console.log('Loading TR-3B model...');
            this.tr3bModel = new TR3BModel(this.engine.scene);
            try {
                await this.tr3bModel.load();
                console.log('TR-3B model loaded successfully');
            } catch (error) {
                console.warn('TR-3B model loading failed, using fallback:', error);
            }
            this.updateLoadingProgress(50, 'TR-3B model loaded...');
            
            // Create physics body for TR-3B
            console.log('Creating TR-3B physics body...');
            this.createTR3BPhysicsBody();
            this.updateLoadingProgress(60, 'Physics integration complete...');
            
            // Initialize anti-gravity system
            console.log('Initializing anti-gravity system...');
            this.antiGravitySystem = new AntiGravitySystem(this.tr3bBody, this.tr3bModel);
            this.updateLoadingProgress(70, 'Anti-gravity systems online...');
            
            // Initialize remaining systems
            console.log('Initializing remaining systems...');
            this.physicsSystem = new PhysicsSystem();
            this.audioSystem = new AudioSystem();
            this.hudSystem = new HUDSystem();
            this.updateLoadingProgress(80, 'Support systems operational...');
            
            // Initialize campaign system (this will start the first mission)
            console.log('Initializing campaign system...');
            try {
                this.campaignSystem = new CampaignSystem(this.engine.scene, this.hudSystem, this.audioSystem);
                console.log('Campaign system initialized');
            } catch (error) {
                console.warn('Campaign system initialization failed:', error);
            }
            this.updateLoadingProgress(90, 'Campaign systems loaded...');
            
            // Setup camera
            console.log('Setting up camera...');
            this.setupCamera();
            this.updateLoadingProgress(95, 'Final system checks...');
            
            // Complete initialization
            console.log('Finalizing initialization...');
            this.finalizeInitialization();
            this.updateLoadingProgress(100, 'PROJECT_MANTA ready for deployment...');
            
            // Start the application
            console.log('Starting application...');
            setTimeout(() => {
                this.startApplication();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize PROJECT_MANTA:', error);
            console.error('Error stack:', error.stack);
            this.showError('System initialization failed. Check console for details.');
        }
    }
    
    initPhysicsWorld() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Ground plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -100, 0);
        this.world.add(groundBody);
    }
    
    createTR3BPhysicsBody() {
        const specs = this.tr3bModel.getSpecs();
        
        // Create compound shape for TR-3B
        const shape = new CANNON.Box(new CANNON.Vec3(
            specs.wingspan / 2,
            specs.height / 2,
            specs.length / 2
        ));
        
        this.tr3bBody = new CANNON.Body({
            mass: specs.baseMass,
            shape: shape,
            position: new CANNON.Vec3(0, 100, 0),
            material: new CANNON.Material({
                friction: 0.1,
                restitution: 0.3
            })
        });
        
        // Add some initial angular damping
        this.tr3bBody.angularDamping = 0.1;
        this.tr3bBody.linearDamping = 0.01;
        
        this.world.add(this.tr3bBody);
    }
    
    setupCamera() {
        // Position camera behind and above the TR-3B
        const tr3bPosition = this.tr3bModel.getModel().position;
        this.engine.camera.position.set(
            tr3bPosition.x,
            tr3bPosition.y + 50,
            tr3bPosition.z + 200
        );
        this.engine.camera.lookAt(tr3bPosition);
    }
    
    finalizeInitialization() {
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Handle window unload
        window.addEventListener('beforeunload', () => {
            this.shutdown();
        });
        
        // Listen for boss defeat events
        window.addEventListener('bossDefeated', (event) => {
            console.log(`Boss defeated: ${event.detail.bossId}`);
            // Handle post-boss logic here
        });
    }
    
    updateLoadingProgress(percent, message) {
        this.progressBar.style.width = `${percent}%`;
        this.loadingText.textContent = message;
    }
    
    showError(message) {
        this.loadingText.textContent = message;
        this.loadingScreen.style.background = 'rgba(34, 0, 0, 0.95)';
        this.loadingText.style.color = '#ff4444';
    }
    
    startApplication() {
        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.isInitialized = true;
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            console.log('PROJECT_MANTA operational');
        }, 500);
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Limit delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        // Update all systems
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update control system
        this.controlSystem.update(deltaTime);
        
        // Handle input
        this.handleInput(deltaTime);
        
        // Update physics
        this.world.step(deltaTime);
        
        // Update anti-gravity system
        this.antiGravitySystem.update(deltaTime);
        
        // Sync TR-3B model with physics body
        this.syncModelWithPhysics();
        
        // Update TR-3B model
        this.tr3bModel.update(deltaTime, this.engine.camera.position);
        
        // Update other systems
        this.physicsSystem.update(deltaTime);
        this.audioSystem.update(deltaTime);
        this.hudSystem.update(deltaTime);
        this.campaignSystem.update(deltaTime);
        
        // Update camera
        this.updateCamera(deltaTime);
    }
    
    handleInput(deltaTime) {
        // Get input from control system
        const movement = this.controlSystem.getMovementInput();
        const look = this.controlSystem.getLookInput();
        const plasmaInput = this.controlSystem.getPlasmaInput();
        
        // Apply forces to TR-3B
        const force = new CANNON.Vec3(
            movement.x * 50000,
            movement.z * 50000, // Vertical movement
            -movement.y * 50000  // Forward/backward
        );
        
        // Transform force to world space
        this.tr3bBody.quaternion.vmult(force, force);
        this.tr3bBody.force.vadd(force, this.tr3bBody.force);
        
        // Apply torque for rotation
        const torque = new CANNON.Vec3(
            look.y * 10000,  // Pitch
            look.x * 10000,  // Yaw
            0                // Roll (could be added later)
        );
        
        this.tr3bBody.torque.vadd(torque, this.tr3bBody.torque);
        
        // Handle plasma system
        if (plasmaInput && !this.antiGravitySystem.isSystemActive()) {
            this.antiGravitySystem.activate();
        } else if (!plasmaInput && this.antiGravitySystem.isSystemActive()) {
            this.antiGravitySystem.deactivate();
        }
    }
    
    syncModelWithPhysics() {
        if (!this.tr3bModel.getModel() || !this.tr3bBody) return;
        
        const model = this.tr3bModel.getModel();
        
        // Sync position
        model.position.copy(this.tr3bBody.position);
        
        // Sync rotation
        model.quaternion.copy(this.tr3bBody.quaternion);
    }
    
    updateCamera(deltaTime) {
        if (!this.tr3bModel.getModel()) return;
        
        const tr3bPosition = this.tr3bModel.getModel().position;
        const tr3bRotation = this.tr3bModel.getModel().quaternion;
        
        // Third-person camera following the TR-3B
        const cameraOffset = new THREE.Vector3(0, 50, 200);
        cameraOffset.applyQuaternion(tr3bRotation);
        
        const targetPosition = tr3bPosition.clone().add(cameraOffset);
        
        // Smooth camera movement
        this.engine.camera.position.lerp(targetPosition, deltaTime * 2);
        this.engine.camera.lookAt(tr3bPosition);
    }
    
    render() {
        if (!this.isInitialized) return;
        
        this.engine.render();
    }
    
    pause() {
        this.isRunning = false;
        console.log('PROJECT_MANTA paused');
    }
    
    resume() {
        if (this.isInitialized) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            console.log('PROJECT_MANTA resumed');
        }
    }
    
    shutdown() {
        this.isRunning = false;
        
        // Clean up all systems
        if (this.engine) this.engine.dispose();
        if (this.tr3bModel) this.tr3bModel.dispose();
        if (this.controlSystem) this.controlSystem.dispose();
        if (this.antiGravitySystem) this.antiGravitySystem.dispose();
        if (this.physicsSystem) this.physicsSystem.dispose();
        if (this.audioSystem) this.audioSystem.dispose();
        if (this.hudSystem) this.hudSystem.dispose();
        if (this.campaignSystem) this.campaignSystem.dispose();
        
        console.log('PROJECT_MANTA shutdown complete');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.projectManta = new ProjectManta();
});

// Make ProjectManta available globally for debugging
window.ProjectManta = ProjectManta;