// PROJECT_MANTA - Advanced Control System

export class ControlSystem {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Input states
        this.keys = new Set();
        this.mouse = {
            x: 0, y: 0,
            deltaX: 0, deltaY: 0,
            buttons: new Set(),
            sensitivity: 0.002
        };
        
        // Mobile controls
        this.touch = {
            movement: { x: 0, y: 0, active: false },
            look: { x: 0, y: 0, active: false },
            actions: new Set()
        };
        
        // Device sensors
        this.sensors = {
            gyroscope: { x: 0, y: 0, z: 0 },
            accelerometer: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // Kalman filter for sensor fusion
        this.kalmanFilter = {
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            Q: 0.01, // Process noise
            R: 0.1   // Measurement noise
        };
        
        // PINN (Pilot Interface Neural Network) simulation
        this.pinn = {
            stressLevel: 0.0,
            adaptiveSensitivity: 1.0,
            learningRate: 0.001,
            baselinePerformance: 1.0
        };
        
        // Control states
        this.isPointerLocked = false;
        this.isMobile = this.detectMobile();
        this.controlMode = this.isMobile ? 'touch' : 'desktop';
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
    
    init() {
        this.setupKeyboardControls();
        this.setupMouseControls();
        this.setupTouchControls();
        this.setupSensorControls();
        this.setupHapticFeedback();
        
        console.log(`Control System initialized - Mode: ${this.controlMode}`);
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            this.handleKeyAction(e.code, true);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            this.handleKeyAction(e.code, false);
        });
    }
    
    setupMouseControls() {
        // Pointer lock
        this.canvas.addEventListener('click', () => {
            if (!this.isMobile) {
                this.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouse.deltaX = e.movementX * this.mouse.sensitivity * this.pinn.adaptiveSensitivity;
                this.mouse.deltaY = e.movementY * this.mouse.sensitivity * this.pinn.adaptiveSensitivity;
            }
        });
        
        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            this.mouse.buttons.add(e.button);
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.buttons.delete(e.button);
        });
    }
    
    setupTouchControls() {
        if (!this.isMobile) return;
        
        // Virtual joysticks
        this.setupVirtualJoystick('movement-stick', 'movement');
        this.setupVirtualJoystick('look-stick', 'look');
        
        // Action buttons
        this.setupActionButtons();
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
    }
    
    setupVirtualJoystick(elementId, type) {
        const stick = document.getElementById(elementId);
        const knob = stick.querySelector('.stick-knob');
        
        if (!stick || !knob) return;
        
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        let stickCenter = { x: 0, y: 0 };
        
        const updateStickCenter = () => {
            const rect = stick.getBoundingClientRect();
            stickCenter.x = rect.left + rect.width / 2;
            stickCenter.y = rect.top + rect.height / 2;
        };
        
        const handleStart = (e) => {
            isDragging = true;
            updateStickCenter();
            
            const touch = e.touches ? e.touches[0] : e;
            startPos.x = touch.clientX;
            startPos.y = touch.clientY;
            
            this.touch[type].active = true;
            this.triggerHapticFeedback('light');
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - stickCenter.x;
            const deltaY = touch.clientY - stickCenter.y;
            
            const maxDistance = stick.offsetWidth / 2 - knob.offsetWidth / 2;
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
            const angle = Math.atan2(deltaY, deltaX);
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            knob.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            
            // Normalize values (-1 to 1)
            this.touch[type].x = x / maxDistance;
            this.touch[type].y = y / maxDistance;
        };
        
        const handleEnd = () => {
            isDragging = false;
            knob.style.transform = 'translate(-50%, -50%)';
            
            this.touch[type].x = 0;
            this.touch[type].y = 0;
            this.touch[type].active = false;
        };
        
        // Touch events
        stick.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        
        // Mouse events for testing on desktop
        stick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    setupActionButtons() {
        const buttons = [
            { id: 'ascend-btn', action: 'ascend' },
            { id: 'descend-btn', action: 'descend' },
            { id: 'plasma-btn', action: 'plasma' }
        ];
        
        buttons.forEach(({ id, action }) => {
            const button = document.getElementById(id);
            if (!button) return;
            
            const handleStart = () => {
                this.touch.actions.add(action);
                button.classList.add('active');
                this.triggerHapticFeedback('medium');
            };
            
            const handleEnd = () => {
                this.touch.actions.delete(action);
                button.classList.remove('active');
            };
            
            button.addEventListener('touchstart', handleStart, { passive: false });
            button.addEventListener('touchend', handleEnd);
            button.addEventListener('mousedown', handleStart);
            button.addEventListener('mouseup', handleEnd);
        });
    }
    
    setupSensorControls() {
        if (!this.isMobile) return;
        
        // Request device motion permissions (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        this.enableSensors();
                    }
                })
                .catch(console.error);
        } else {
            this.enableSensors();
        }
    }
    
    enableSensors() {
        // Device orientation
        window.addEventListener('deviceorientation', (e) => {
            this.sensors.orientation.alpha = e.alpha || 0;
            this.sensors.orientation.beta = e.beta || 0;
            this.sensors.orientation.gamma = e.gamma || 0;
            
            this.updateKalmanFilter(e.alpha, e.beta, e.gamma);
        });
        
        // Device motion
        window.addEventListener('devicemotion', (e) => {
            if (e.accelerationIncludingGravity) {
                this.sensors.accelerometer.x = e.accelerationIncludingGravity.x || 0;
                this.sensors.accelerometer.y = e.accelerationIncludingGravity.y || 0;
                this.sensors.accelerometer.z = e.accelerationIncludingGravity.z || 0;
            }
            
            if (e.rotationRate) {
                this.sensors.gyroscope.x = e.rotationRate.alpha || 0;
                this.sensors.gyroscope.y = e.rotationRate.beta || 0;
                this.sensors.gyroscope.z = e.rotationRate.gamma || 0;
            }
        });
    }
    
    updateKalmanFilter(alpha, beta, gamma) {
        // Simplified Kalman filter for sensor fusion
        const dt = 0.016; // ~60fps
        
        // Predict
        this.kalmanFilter.x += this.kalmanFilter.vx * dt;
        this.kalmanFilter.y += this.kalmanFilter.vy * dt;
        this.kalmanFilter.z += this.kalmanFilter.vz * dt;
        
        // Update
        const kx = this.kalmanFilter.Q / (this.kalmanFilter.Q + this.kalmanFilter.R);
        const ky = this.kalmanFilter.Q / (this.kalmanFilter.Q + this.kalmanFilter.R);
        const kz = this.kalmanFilter.Q / (this.kalmanFilter.Q + this.kalmanFilter.R);
        
        this.kalmanFilter.x += kx * (alpha - this.kalmanFilter.x);
        this.kalmanFilter.y += ky * (beta - this.kalmanFilter.y);
        this.kalmanFilter.z += kz * (gamma - this.kalmanFilter.z);
    }
    
    setupHapticFeedback() {
        // Check for haptic feedback support
        this.hapticSupported = 'vibrate' in navigator;
    }
    
    triggerHapticFeedback(intensity = 'light') {
        if (!this.hapticSupported) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            double: [20, 50, 20]
        };
        
        navigator.vibrate(patterns[intensity] || patterns.light);
    }
    
    updatePINN(deltaTime) {
        // Simulate pilot stress based on control inputs
        const inputIntensity = this.getInputIntensity();
        const targetStress = Math.min(inputIntensity * 0.1, 1.0);
        
        // Smooth stress level changes
        this.pinn.stressLevel += (targetStress - this.pinn.stressLevel) * deltaTime * 2;
        
        // Adapt sensitivity based on stress
        const stressFactor = 1.0 - (this.pinn.stressLevel * 0.3);
        this.pinn.adaptiveSensitivity = this.pinn.baselinePerformance * stressFactor;
        
        // Learning: gradually improve baseline performance
        if (this.pinn.stressLevel < 0.5) {
            this.pinn.baselinePerformance += this.pinn.learningRate * deltaTime;
            this.pinn.baselinePerformance = Math.min(this.pinn.baselinePerformance, 1.2);
        }
    }
    
    getInputIntensity() {
        let intensity = 0;
        
        // Keyboard input intensity
        intensity += this.keys.size * 0.1;
        
        // Mouse movement intensity
        intensity += Math.abs(this.mouse.deltaX) + Math.abs(this.mouse.deltaY);
        
        // Touch input intensity
        if (this.touch.movement.active) {
            intensity += Math.abs(this.touch.movement.x) + Math.abs(this.touch.movement.y);
        }
        if (this.touch.look.active) {
            intensity += Math.abs(this.touch.look.x) + Math.abs(this.touch.look.y);
        }
        
        return Math.min(intensity, 10);
    }
    
    handleKeyAction(keyCode, pressed) {
        // Handle special key actions
        switch (keyCode) {
            case 'KeyQ':
                if (pressed) this.triggerHapticFeedback('medium');
                break;
            case 'Space':
                if (pressed) this.triggerHapticFeedback('light');
                break;
        }
    }
    
    requestPointerLock() {
        this.canvas.requestPointerLock();
    }
    
    // Input query methods
    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }
    
    isMouseButtonPressed(button) {
        return this.mouse.buttons.has(button);
    }
    
    isTouchActionActive(action) {
        return this.touch.actions.has(action);
    }
    
    getMovementInput() {
        if (this.controlMode === 'touch') {
            return {
                x: this.touch.movement.x,
                y: -this.touch.movement.y, // Invert Y for forward/backward
                z: 0
            };
        } else {
            return {
                x: (this.isKeyPressed('KeyD') ? 1 : 0) - (this.isKeyPressed('KeyA') ? 1 : 0),
                y: (this.isKeyPressed('KeyW') ? 1 : 0) - (this.isKeyPressed('KeyS') ? 1 : 0),
                z: (this.isKeyPressed('Space') ? 1 : 0) - (this.isKeyPressed('ShiftLeft') ? 1 : 0)
            };
        }
    }
    
    getLookInput() {
        if (this.controlMode === 'touch') {
            return {
                x: this.touch.look.x * 0.05,
                y: this.touch.look.y * 0.05
            };
        } else {
            const deltaX = this.mouse.deltaX;
            const deltaY = this.mouse.deltaY;
            
            // Reset mouse delta
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
            
            return { x: deltaX, y: deltaY };
        }
    }
    
    getPlasmaInput() {
        return this.isKeyPressed('KeyQ') || this.isTouchActionActive('plasma');
    }
    
    getAscendInput() {
        return this.isKeyPressed('Space') || this.isTouchActionActive('ascend');
    }
    
    getDescendInput() {
        return this.isKeyPressed('ShiftLeft') || this.isTouchActionActive('descend');
    }
    
    getSensorData() {
        return {
            orientation: { ...this.sensors.orientation },
            accelerometer: { ...this.sensors.accelerometer },
            gyroscope: { ...this.sensors.gyroscope },
            filtered: {
                x: this.kalmanFilter.x,
                y: this.kalmanFilter.y,
                z: this.kalmanFilter.z
            }
        };
    }
    
    update(deltaTime) {
        this.updatePINN(deltaTime);
    }
    
    dispose() {
        // Remove all event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        if (this.isMobile) {
            window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
            window.removeEventListener('devicemotion', this.handleDeviceMotion);
        }
    }
}