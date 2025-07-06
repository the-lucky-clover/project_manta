// PROJECT_MANTA - Input System

export class InputSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            buttons: {}
        };
        
        this.isPointerLocked = false;
        this.sensitivity = 0.002;
        
        this.init();
    }
    
    init() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('click', () => this.requestPointerLock());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        
        console.log('Input System initialized');
    }
    
    update(deltaTime) {
        // Reset mouse delta each frame
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouse.deltaX = event.movementX * this.sensitivity;
            this.mouse.deltaY = event.movementY * this.sensitivity;
        }
    }
    
    onMouseDown(event) {
        this.mouse.buttons[event.button] = true;
    }
    
    onMouseUp(event) {
        this.mouse.buttons[event.button] = false;
    }
    
    requestPointerLock() {
        this.canvas.requestPointerLock();
    }
    
    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.canvas;
    }
    
    onPointerLockError() {
        console.error('Pointer lock failed');
    }
    
    // Helper methods
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    isMouseButtonPressed(button) {
        return !!this.mouse.buttons[button];
    }
    
    getMouseDelta() {
        return {
            x: this.mouse.deltaX,
            y: this.mouse.deltaY
        };
    }
    
    dispose() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('pointerlockerror', this.onPointerLockError);
    }
}