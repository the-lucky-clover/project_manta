// PROJECT_MANTA - Boss Encounter System

import { TheShard } from '../entities/TheShard.js';

export class BossSystem {
    constructor(scene, audioSystem, hudSystem) {
        this.scene = scene;
        this.audioSystem = audioSystem;
        this.hudSystem = hudSystem;
        
        this.currentBoss = null;
        this.isActive = false;
        this.bossData = null;
        
        // Temporal Analysis Equipment (TAE)
        this.tae = {
            isActive: false,
            scanRange: 50,
            scanCooldown: 2.0,
            lastScanTime: 0
        };
        
        this.init();
    }
    
    init() {
        // Listen for boss encounter events
        window.addEventListener('bossEncounter', (event) => {
            this.startBossEncounter(event.detail.bossId);
        });
        
        // Listen for TAE activation
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyT') {
                this.activateTAE();
            }
        });
        
        console.log('Boss System initialized');
    }
    
    async startBossEncounter(bossId) {
        console.log(`Starting boss encounter: ${bossId}`);
        
        // Load boss data
        await this.loadBossData(bossId);
        
        // Create boss entity
        switch (bossId) {
            case 'the_shard':
                this.currentBoss = new TheShard(this.scene, this.audioSystem);
                break;
            default:
                console.error(`Unknown boss: ${bossId}`);
                return;
        }
        
        // Activate boss
        this.isActive = true;
        this.currentBoss.activate();
        
        // Show boss introduction
        this.showBossIntroduction();
        
        // Enable TAE
        this.enableTAE();
    }
    
    async loadBossData(bossId) {
        try {
            const response = await fetch('data/campaign-data.json');
            const campaignData = await response.json();
            this.bossData = campaignData.bosses[bossId];
        } catch (error) {
            console.error('Failed to load boss data:', error);
        }
    }
    
    showBossIntroduction() {
        if (!this.bossData) return;
        
        // Show boss name and warning
        if (this.hudSystem) {
            this.hudSystem.showMessage(`WARNING: ${this.bossData.name.toUpperCase()} DETECTED`, 4000);
        }
        
        // Create boss health UI
        this.createBossHealthUI();
        
        // Show tactical information
        setTimeout(() => {
            this.showTacticalInfo();
        }, 2000);
    }
    
    createBossHealthUI() {
        // Remove existing boss UI
        const existingUI = document.getElementById('boss-ui');
        if (existingUI) {
            existingUI.remove();
        }
        
        const bossUI = document.createElement('div');
        bossUI.id = 'boss-ui';
        bossUI.innerHTML = `
            <div class="boss-info">
                <div class="boss-name">${this.bossData.name}</div>
                <div class="boss-health-container">
                    <div class="boss-health-bar">
                        <div class="boss-health-fill" id="boss-health-fill"></div>
                    </div>
                    <div class="boss-scans">Scans: <span id="boss-scan-count">0</span>/${this.bossData.vulnerability.scans_required}</div>
                </div>
            </div>
        `;
        
        bossUI.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1001;
            color: #ff4444;
            font-family: 'Courier New', monospace;
            text-align: center;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .boss-info {
                background: rgba(0, 0, 0, 0.8);
                padding: 15px 25px;
                border: 2px solid #ff4444;
                border-radius: 8px;
                backdrop-filter: blur(5px);
            }
            
            .boss-name {
                font-size: 1.5em;
                margin-bottom: 10px;
                text-shadow: 0 0 10px #ff4444;
                animation: boss-name-pulse 2s infinite;
            }
            
            @keyframes boss-name-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .boss-health-container {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .boss-health-bar {
                width: 200px;
                height: 20px;
                background: rgba(255, 68, 68, 0.2);
                border: 1px solid #ff4444;
                border-radius: 10px;
                overflow: hidden;
            }
            
            .boss-health-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff4444, #ff8888);
                width: 100%;
                transition: width 0.5s ease;
            }
            
            .boss-scans {
                font-size: 0.9em;
                color: #00ffff;
            }
        `;
        document.head.appendChild(style);
        
        document.getElementById('hud').appendChild(bossUI);
    }
    
    showTacticalInfo() {
        if (this.hudSystem) {
            this.hudSystem.showMessage("Use Temporal Analysis Equipment (T) to scan the chronological core", 6000);
        }
    }
    
    enableTAE() {
        // Add TAE indicator to HUD
        const taeIndicator = document.createElement('div');
        taeIndicator.id = 'tae-indicator';
        taeIndicator.innerHTML = `
            <div class="tae-status">
                <div class="tae-label">TAE</div>
                <div class="tae-state" id="tae-state">READY</div>
            </div>
        `;
        
        taeIndicator.style.cssText = `
            position: absolute;
            bottom: 120px;
            left: 20px;
            z-index: 1001;
            color: #00ffff;
            font-family: 'Courier New', monospace;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .tae-status {
                background: rgba(0, 0, 0, 0.8);
                padding: 10px 15px;
                border: 1px solid #00ffff;
                border-radius: 5px;
                backdrop-filter: blur(5px);
            }
            
            .tae-label {
                font-size: 0.8em;
                margin-bottom: 5px;
            }
            
            .tae-state {
                font-size: 1em;
                font-weight: bold;
            }
            
            .tae-scanning {
                color: #ffff00;
                animation: tae-scan-pulse 0.5s infinite;
            }
            
            .tae-cooldown {
                color: #ff4444;
            }
            
            @keyframes tae-scan-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
        
        document.getElementById('hud').appendChild(taeIndicator);
    }
    
    activateTAE() {
        if (!this.isActive || !this.currentBoss) return;
        
        const currentTime = Date.now() / 1000;
        if (currentTime - this.tae.lastScanTime < this.tae.scanCooldown) return;
        
        // Get player position (you'll need to pass this from the main game loop)
        const playerPosition = window.projectManta?.tr3bModel?.getModel()?.position || new window.THREE.Vector3();
        
        // Update TAE state
        const taeState = document.getElementById('tae-state');
        if (taeState) {
            taeState.textContent = 'SCANNING';
            taeState.className = 'tae-scanning';
        }
        
        // Attempt scan
        const scanSuccessful = this.currentBoss.attemptScan(playerPosition);
        
        if (scanSuccessful) {
            this.updateBossUI();
            
            if (this.hudSystem) {
                this.hudSystem.showMessage("SCAN SUCCESSFUL", 2000);
            }
            
            // Play scan sound
            if (this.audioSystem) {
                this.audioSystem.playSound('tae_scan_success', 0.7);
            }
        } else {
            if (this.hudSystem) {
                this.hudSystem.showMessage("SCAN FAILED - GET CLOSER TO CORE", 2000);
            }
            
            // Play fail sound
            if (this.audioSystem) {
                this.audioSystem.playSound('tae_scan_fail', 0.5);
            }
        }
        
        // Reset TAE state
        setTimeout(() => {
            if (taeState) {
                taeState.textContent = 'READY';
                taeState.className = '';
            }
        }, 1000);
        
        this.tae.lastScanTime = currentTime;
    }
    
    updateBossUI() {
        if (!this.currentBoss || !this.bossData) return;
        
        // Update scan count
        const scanCount = document.getElementById('boss-scan-count');
        if (scanCount) {
            scanCount.textContent = this.currentBoss.chronologicalCore.scansCompleted;
        }
        
        // Update health bar (visual representation of scans remaining)
        const healthFill = document.getElementById('boss-health-fill');
        if (healthFill) {
            const scansRemaining = this.bossData.vulnerability.scans_required - this.currentBoss.chronologicalCore.scansCompleted;
            const healthPercentage = (scansRemaining / this.bossData.vulnerability.scans_required) * 100;
            healthFill.style.width = `${healthPercentage}%`;
        }
    }
    
    onBossDefeated() {
        this.isActive = false;
        
        // Remove boss UI
        const bossUI = document.getElementById('boss-ui');
        if (bossUI) {
            bossUI.remove();
        }
        
        const taeIndicator = document.getElementById('tae-indicator');
        if (taeIndicator) {
            taeIndicator.remove();
        }
        
        // Show victory message
        if (this.hudSystem) {
            this.hudSystem.showMessage("TEMPORAL ENTITY NEUTRALIZED", 5000);
        }
        
        console.log('Boss encounter completed');
    }
    
    update(deltaTime, playerPosition) {
        if (!this.isActive || !this.currentBoss) return;
        
        // Update current boss
        this.currentBoss.update(deltaTime, playerPosition);
        
        // Check if boss is defeated
        if (this.currentBoss.isDefeated) {
            this.onBossDefeated();
        }
        
        // Apply temporal effects to player
        this.applyTemporalEffects(playerPosition);
    }
    
    applyTemporalEffects(playerPosition) {
        if (!this.currentBoss || !playerPosition) return;
        
        const fieldStrength = this.currentBoss.getTemporalFieldStrength(playerPosition);
        const inputLag = this.currentBoss.getInputLagFactor();
        
        // Apply effects to control system
        if (window.projectManta?.controlSystem) {
            // Simulate input lag by reducing responsiveness
            window.projectManta.controlSystem.temporalLagFactor = inputLag;
        }
        
        // Apply visual distortion to HUD
        const hud = document.getElementById('hud-overlay');
        if (hud && fieldStrength > 0.1) {
            hud.style.filter = `blur(${fieldStrength * 2}px) hue-rotate(${fieldStrength * 180}deg)`;
        } else if (hud) {
            hud.style.filter = 'none';
        }
    }
    
    dispose() {
        if (this.currentBoss) {
            this.currentBoss.dispose();
            this.currentBoss = null;
        }
        
        this.isActive = false;
        
        // Remove event listeners
        window.removeEventListener('bossEncounter', this.startBossEncounter);
        
        console.log('Boss System disposed');
    }
}