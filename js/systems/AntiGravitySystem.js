// PROJECT_MANTA - Anti-Gravity System

const CANNON = window.CANNON;

// Ensure THREE.js and CANNON.js are available
const THREE = window.THREE;
const CANNON = window.CANNON;

export class AntiGravitySystem {
    constructor(physicsBody, tr3bModel) {
        this.physicsBody = physicsBody;
        this.tr3bModel = tr3bModel;
        
        // System parameters
        this.baseMass = 127000; // kg
        this.massReduction = 0.892; // 89.2% mass reduction when active
        this.activationTime = 3.0; // seconds
        
        // State variables
        this.plasmaPower = 0.0; // 0.0 to 1.0
        this.targetPlasmaPower = 0.0;
        this.isActivating = false;
        this.isActive = false;
        
        // Gyroscopic stabilization
        this.gyroStabilization = {
            strength: 1.0,
            dampingFactor: 0.95,
            maxTorque: 10000
        };
        
        // Power consumption and heat
        this.powerConsumption = 0;
        this.heatGeneration = 0;
        this.maxHeat = 100;
        this.currentHeat = 0;
        
        // Visual effects
        this.plasmaEffects = [];
        
        console.log('Anti-Gravity System initialized');
    }
    
    activate() {
        if (this.isActivating || this.isActive) return;
        
        this.isActivating = true;
        this.targetPlasmaPower = 1.0;
        
        console.log('Anti-Gravity System activation initiated');
    }
    
    deactivate() {
        if (!this.isActivating && !this.isActive) return;
        
        this.isActivating = false;
        this.isActive = false;
        this.targetPlasmaPower = 0.0;
        
        console.log('Anti-Gravity System deactivation initiated');
    }
    
    update(deltaTime) {
        this.updatePlasmaPower(deltaTime);
        this.updateMass();
        this.updateGyroscopicStabilization(deltaTime);
        this.updateThermalManagement(deltaTime);
        this.updateVisualEffects(deltaTime);
        this.updateUI();
    }
    
    updatePlasmaPower(deltaTime) {
        // Smooth power transition
        const powerChangeRate = 1.0 / this.activationTime;
        const powerDelta = (this.targetPlasmaPower - this.plasmaPower) * powerChangeRate * deltaTime;
        
        this.plasmaPower += powerDelta;
        this.plasmaPower = Math.max(0, Math.min(1, this.plasmaPower));
        
        // Update system state
        if (this.plasmaPower > 0.95 && this.isActivating) {
            this.isActivating = false;
            this.isActive = true;
            console.log('Anti-Gravity System fully active');
        }
        
        if (this.plasmaPower < 0.05 && !this.isActivating) {
            this.isActive = false;
            console.log('Anti-Gravity System deactivated');
        }
    }
    
    updateMass() {
        if (!this.physicsBody) return;
        
        // Calculate current mass based on plasma power
        const massReductionFactor = this.plasmaPower * this.massReduction;
        const currentMass = this.baseMass * (1.0 - massReductionFactor);
        
        // Update physics body mass
        this.physicsBody.mass = currentMass;
        this.physicsBody.updateMassProperties();
        
        // Update power consumption
        this.powerConsumption = this.plasmaPower * 1000; // kW
    }
    
    updateGyroscopicStabilization(deltaTime) {
        if (!this.physicsBody || this.plasmaPower < 0.1) return;
        
        // Calculate stabilization strength based on plasma power
        const stabilizationStrength = this.plasmaPower * this.gyroStabilization.strength;
        
        // Get current angular velocity
        const angularVelocity = this.physicsBody.angularVelocity;
        
        // Apply counter-torque to stabilize
        const stabilizationTorque = new CANNON.Vec3(
            -angularVelocity.x * stabilizationStrength,
            -angularVelocity.y * stabilizationStrength * 0.5, // Less Y stabilization for maneuverability
            -angularVelocity.z * stabilizationStrength
        );
        
        // Limit maximum torque
        const torqueMagnitude = stabilizationTorque.length();
        if (torqueMagnitude > this.gyroStabilization.maxTorque) {
            stabilizationTorque.scale(this.gyroStabilization.maxTorque / torqueMagnitude, stabilizationTorque);
        }
        
        // Apply stabilization torque
        this.physicsBody.torque.vadd(stabilizationTorque, this.physicsBody.torque);
        
        // Apply damping
        this.physicsBody.angularVelocity.scale(
            Math.pow(this.gyroStabilization.dampingFactor, deltaTime),
            this.physicsBody.angularVelocity
        );
    }
    
    updateThermalManagement(deltaTime) {
        // Heat generation based on plasma power
        const heatGenerated = this.plasmaPower * this.plasmaPower * 50 * deltaTime;
        this.currentHeat += heatGenerated;
        
        // Heat dissipation
        const heatDissipated = this.currentHeat * 0.1 * deltaTime;
        this.currentHeat -= heatDissipated;
        
        this.currentHeat = Math.max(0, Math.min(this.maxHeat, this.currentHeat));
        
        // Thermal throttling
        if (this.currentHeat > this.maxHeat * 0.9) {
            this.targetPlasmaPower *= 0.95; // Reduce power to prevent overheating
            console.warn('Anti-Gravity System thermal throttling engaged');
        }
    }
    
    updateVisualEffects(deltaTime) {
        if (!this.tr3bModel) return;
        
        // Update plasma ring effects
        this.tr3bModel.updatePlasmaRings(this.plasmaPower, deltaTime);
        
        // Create plasma discharge effects
        if (this.plasmaPower > 0.5 && Math.random() < 0.1) {
            this.createPlasmaDischarge();
        }
    }
    
    createPlasmaDischarge() {
        // Create visual plasma discharge effect
        const effect = {
            position: new window.THREE.Vector3(
                (Math.random() - 0.5) * 200,
                -50 + Math.random() * 20,
                (Math.random() - 0.5) * 200
            ),
            intensity: this.plasmaPower,
            lifetime: 0.5,
            age: 0
        };
        
        this.plasmaEffects.push(effect);
        
        // Limit number of effects
        if (this.plasmaEffects.length > 10) {
            this.plasmaEffects.shift();
        }
    }
    
    updateUI() {
        // Update plasma power display
        const plasmaFill = document.getElementById('plasma-fill');
        const plasmaPercentage = document.getElementById('plasma-percentage');
        
        if (plasmaFill) {
            plasmaFill.style.width = `${this.plasmaPower * 100}%`;
        }
        
        if (plasmaPercentage) {
            plasmaPercentage.textContent = `${Math.round(this.plasmaPower * 100)}%`;
        }
        
        // Update plasma button state
        const plasmaBtn = document.getElementById('plasma-btn');
        if (plasmaBtn) {
            if (this.isActive) {
                plasmaBtn.classList.add('active');
                plasmaBtn.textContent = 'PLASMA ON';
            } else if (this.isActivating) {
                plasmaBtn.classList.add('activating');
                plasmaBtn.textContent = 'CHARGING';
            } else {
                plasmaBtn.classList.remove('active', 'activating');
                plasmaBtn.textContent = 'PLASMA';
            }
        }
    }
    
    // Public interface methods
    getPlasmaPower() {
        return this.plasmaPower;
    }
    
    isSystemActive() {
        return this.isActive;
    }
    
    isSystemActivating() {
        return this.isActivating;
    }
    
    getCurrentMass() {
        const massReductionFactor = this.plasmaPower * this.massReduction;
        return this.baseMass * (1.0 - massReductionFactor);
    }
    
    getPowerConsumption() {
        return this.powerConsumption;
    }
    
    getHeatLevel() {
        return this.currentHeat / this.maxHeat;
    }
    
    getStabilizationStrength() {
        return this.plasmaPower * this.gyroStabilization.strength;
    }
    
    // Emergency shutdown
    emergencyShutdown() {
        this.isActivating = false;
        this.isActive = false;
        this.targetPlasmaPower = 0.0;
        this.plasmaPower = 0.0;
        
        if (this.physicsBody) {
            this.physicsBody.mass = this.baseMass;
            this.physicsBody.updateMassProperties();
        }
        
        console.warn('Anti-Gravity System emergency shutdown activated');
    }
    
    // Diagnostic information
    getDiagnostics() {
        return {
            plasmaPower: this.plasmaPower,
            targetPlasmaPower: this.targetPlasmaPower,
            isActive: this.isActive,
            isActivating: this.isActivating,
            currentMass: this.getCurrentMass(),
            powerConsumption: this.powerConsumption,
            heatLevel: this.getHeatLevel(),
            stabilizationStrength: this.getStabilizationStrength()
        };
    }
    
    dispose() {
        this.plasmaEffects = [];
        console.log('Anti-Gravity System disposed');
    }
}