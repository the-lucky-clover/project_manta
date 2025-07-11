// PROJECT_MANTA - Mission System

// Ensure THREE.js is available
const THREE = window.THREE;

export class MissionSystem {
    constructor(scene, hudSystem, audioSystem) {
        this.scene = scene;
        this.hudSystem = hudSystem;
        this.audioSystem = audioSystem;
        
        this.currentMission = null;
        this.missionData = null;
        this.objectives = [];
        this.waypoints = [];
        this.currentObjectiveIndex = 0;
        
        // Mission state
        this.isActive = false;
        this.isCompleted = false;
        this.missionTimer = 0;
        
        // Waypoint visualization
        this.waypointMeshes = [];
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadMissionData();
            console.log('Mission System initialized');
        } catch (error) {
            console.error('Failed to initialize Mission System:', error);
        }
    }
    
    async loadMissionData() {
        try {
            const response = await fetch('data/campaign-data.json');
            this.missionData = await response.json();
        } catch (error) {
            console.error('Failed to load mission data:', error);
            this.missionData = this.getDefaultMissionData();
        }
    }
    
    getDefaultMissionData() {
        return {
            missions: {
                atmospheric_calibration: {
                    title: "Atmospheric Calibration",
                    objectives: [
                        { title: "Navigate to Waypoint Alpha", position: [2000, 500, 1000] },
                        { title: "Navigate to Waypoint Beta", position: [-1500, 800, -2000] },
                        { title: "Navigate to Waypoint Gamma", position: [0, 1200, -3000] }
                    ]
                }
            }
        };
    }
    
    startMission(missionId) {
        if (!this.missionData || !this.missionData.missions[missionId]) {
            console.error(`Mission ${missionId} not found`);
            return false;
        }
        
        this.currentMission = this.missionData.missions[missionId];
        this.objectives = [...this.currentMission.objectives];
        this.currentObjectiveIndex = 0;
        this.isActive = true;
        this.isCompleted = false;
        this.missionTimer = 0;
        
        // Show briefing
        this.showBriefing();
        
        // Create waypoints
        this.createWaypoints();
        
        // Update HUD
        this.updateHUD();
        
        console.log(`Mission started: ${this.currentMission.title}`);
        return true;
    }
    
    showBriefing() {
        if (!this.currentMission.briefing) return;
        
        const briefing = this.currentMission.briefing;
        
        // Create briefing UI
        const briefingElement = document.createElement('div');
        briefingElement.className = 'mission-briefing';
        briefingElement.innerHTML = `
            <div class="briefing-content">
                <div class="speaker-info">
                    <div class="speaker-portrait"></div>
                    <div class="speaker-name">${this.getCharacterName(briefing.speaker)}</div>
                </div>
                <div class="briefing-text">${briefing.text}</div>
                <button class="briefing-continue">Continue</button>
            </div>
        `;
        
        briefingElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
            color: #00ff00;
            font-family: 'Courier New', monospace;
        `;
        
        const content = briefingElement.querySelector('.briefing-content');
        content.style.cssText = `
            max-width: 800px;
            padding: 40px;
            background: rgba(0, 20, 0, 0.95);
            border: 2px solid #00ff00;
            border-radius: 10px;
            text-align: center;
        `;
        
        const continueBtn = briefingElement.querySelector('.briefing-continue');
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
            briefingElement.remove();
            this.startObjective(0);
        });
        
        document.body.appendChild(briefingElement);
        
        // Play audio if available
        if (briefing.audio && this.audioSystem) {
            this.audioSystem.playSound('briefing', 0.8);
        }
    }
    
    getCharacterName(characterId) {
        if (this.missionData.characters && this.missionData.characters[characterId]) {
            return this.missionData.characters[characterId].name;
        }
        return 'Unknown';
    }
    
    createWaypoints() {
        // Clear existing waypoints
        this.clearWaypoints();
        
        this.objectives.forEach((objective, index) => {
            if (objective.position && !objective.hidden) {
                const waypoint = this.createWaypointMesh(objective, index);
                this.waypointMeshes.push(waypoint);
                this.scene.add(waypoint);
            }
        });
    }
    
    createWaypointMesh(objective, index) {
        const group = new window.THREE.Group();
        group.name = `Waypoint_${index}`;
        
        // Main waypoint ring
        const ringGeometry = new window.THREE.TorusGeometry(objective.radius || 100, 10, 8, 32);
        const ringMaterial = new window.THREE.MeshBasicMaterial({
            color: index === this.currentObjectiveIndex ? 0x00ff00 : 0x004400,
            transparent: true,
            opacity: 0.7
        });
        
        const ring = new window.THREE.Mesh(ringGeometry, ringMaterial);
        group.add(ring);
        
        // Pulsing inner light
        const lightGeometry = new window.THREE.SphereGeometry(20, 16, 16);
        const lightMaterial = new window.THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });
        
        const light = new window.THREE.Mesh(lightGeometry, lightMaterial);
        group.add(light);
        
        // Position waypoint
        group.position.set(...objective.position);
        
        // Store objective reference
        group.userData.objective = objective;
        group.userData.index = index;
        
        return group;
    }
    
    startObjective(index) {
        if (index >= this.objectives.length) {
            this.completeMission();
            return;
        }
        
        this.currentObjectiveIndex = index;
        const objective = this.objectives[index];
        
        // Update waypoint visibility
        this.updateWaypointVisibility();
        
        // Show objective
        if (this.hudSystem) {
            this.hudSystem.showMessage(`New Objective: ${objective.title}`, 4000);
            this.hudSystem.setMissionStatus(objective.title);
        }
        
        console.log(`Objective started: ${objective.title}`);
    }
    
    updateWaypointVisibility() {
        this.waypointMeshes.forEach((waypoint, index) => {
            const isActive = index === this.currentObjectiveIndex;
            const ring = waypoint.children[0];
            const light = waypoint.children[1];
            
            if (ring && ring.material) {
                ring.material.color.setHex(isActive ? 0x00ff00 : 0x004400);
                ring.material.opacity = isActive ? 0.9 : 0.3;
            }
            
            if (light && light.material) {
                light.material.opacity = isActive ? 0.8 : 0.2;
            }
        });
    }
    
    checkObjectiveCompletion(playerPosition) {
        if (!this.isActive || this.currentObjectiveIndex >= this.objectives.length) return;
        
        const currentObjective = this.objectives[this.currentObjectiveIndex];
        if (!currentObjective.position || currentObjective.completed) return;
        
        const objectivePos = new window.THREE.Vector3(...currentObjective.position);
        const distance = playerPosition.distanceTo(objectivePos);
        const radius = currentObjective.radius || 100;
        
        if (distance <= radius) {
            this.completeObjective(this.currentObjectiveIndex);
        }
    }
    
    completeObjective(index) {
        if (index >= this.objectives.length) return;
        
        const objective = this.objectives[index];
        objective.completed = true;
        
        // Hide completed waypoint
        if (this.waypointMeshes[index]) {
            this.waypointMeshes[index].visible = false;
        }
        
        // Show completion message
        if (this.hudSystem) {
            this.hudSystem.showMessage(`Objective Complete: ${objective.title}`, 3000);
        }
        
        // Play completion sound
        if (this.audioSystem) {
            this.audioSystem.playSound('objective_complete', 0.6);
        }
        
        console.log(`Objective completed: ${objective.title}`);
        
        // Check for special events
        if (index === 2 && this.currentMission.id === 'atmospheric_calibration') {
            // After third waypoint, trigger anomaly
            setTimeout(() => {
                this.triggerAnomaly();
            }, 2000);
        } else {
            // Start next objective
            setTimeout(() => {
                this.startObjective(index + 1);
            }, 1000);
        }
    }
    
    triggerAnomaly() {
        // Communications cut
        if (this.hudSystem) {
            this.hudSystem.showMessage("COMMUNICATIONS LOST", 3000);
        }
        
        // Add static effect to HUD
        this.addStaticEffect();
        
        // Show anomaly objective
        const anomalyObjective = this.objectives.find(obj => obj.id === 'investigate_anomaly');
        if (anomalyObjective) {
            anomalyObjective.hidden = false;
            
            // Create anomaly waypoint
            const waypoint = this.createWaypointMesh(anomalyObjective, this.objectives.length - 1);
            waypoint.children[0].material.color.setHex(0xff0000); // Red for danger
            this.waypointMeshes.push(waypoint);
            this.scene.add(waypoint);
            
            // Update objective
            this.currentObjectiveIndex = this.objectives.indexOf(anomalyObjective);
            
            if (this.hudSystem) {
                this.hudSystem.showMessage("UNKNOWN ENERGY SIGNATURE DETECTED", 4000);
                this.hudSystem.setMissionStatus("Investigate the temporal distortion");
            }
        }
        
        console.log('Anomaly triggered - communications lost');
    }
    
    addStaticEffect() {
        const hud = document.getElementById('hud-overlay');
        if (hud) {
            hud.style.animation = 'hud-static 0.1s infinite';
        }
        
        // Add CSS for static effect
        const style = document.createElement('style');
        style.textContent = `
            @keyframes hud-static {
                0% { filter: brightness(1) contrast(1); }
                25% { filter: brightness(1.2) contrast(1.5); }
                50% { filter: brightness(0.8) contrast(0.8); }
                75% { filter: brightness(1.1) contrast(1.2); }
                100% { filter: brightness(1) contrast(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Remove static after a few seconds
        setTimeout(() => {
            if (hud) {
                hud.style.animation = 'hud-flicker 3s infinite alternate';
            }
        }, 5000);
    }
    
    completeMission() {
        this.isActive = false;
        this.isCompleted = true;
        
        // Clear waypoints
        this.clearWaypoints();
        
        // Show completion message
        if (this.hudSystem) {
            this.hudSystem.showMessage("MISSION COMPLETE", 5000);
            this.hudSystem.setMissionStatus("Mission Complete");
        }
        
        console.log(`Mission completed: ${this.currentMission.title}`);
        
        // Trigger boss encounter if applicable
        if (this.currentMission.boss) {
            setTimeout(() => {
                this.triggerBossEncounter(this.currentMission.boss);
            }, 3000);
        }
    }
    
    triggerBossEncounter(bossId) {
        console.log(`Triggering boss encounter: ${bossId}`);
        
        // Dispatch event for boss system
        const event = new CustomEvent('bossEncounter', {
            detail: { bossId: bossId }
        });
        window.dispatchEvent(event);
    }
    
    clearWaypoints() {
        this.waypointMeshes.forEach(waypoint => {
            this.scene.remove(waypoint);
            
            // Dispose of geometries and materials
            waypoint.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        
        this.waypointMeshes = [];
    }
    
    updateHUD() {
        if (!this.hudSystem || !this.currentMission) return;
        
        // Update mission title
        this.hudSystem.setMissionTitle(this.currentMission.title);
        
        // Update objective list
        const objectivesList = this.objectives
            .filter(obj => !obj.hidden)
            .map((obj, index) => {
                const status = obj.completed ? '✓' : (index === this.currentObjectiveIndex ? '→' : '○');
                return `${status} ${obj.title}`;
            })
            .join('\n');
        
        // You would implement this method in HUDSystem
        // this.hudSystem.setObjectivesList(objectivesList);
    }
    
    update(deltaTime, playerPosition) {
        if (!this.isActive) return;
        
        this.missionTimer += deltaTime;
        
        // Check objective completion
        if (playerPosition) {
            this.checkObjectiveCompletion(playerPosition);
        }
        
        // Update waypoint animations
        this.updateWaypointAnimations(deltaTime);
    }
    
    updateWaypointAnimations(deltaTime) {
        this.waypointMeshes.forEach((waypoint, index) => {
            if (!waypoint.visible) return;
            
            // Rotate rings
            const ring = waypoint.children[0];
            if (ring) {
                ring.rotation.x += deltaTime * 0.5;
                ring.rotation.y += deltaTime * 0.3;
            }
            
            // Pulse lights
            const light = waypoint.children[1];
            if (light) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                light.scale.setScalar(pulse);
            }
        });
    }
    
    getCurrentMission() {
        return this.currentMission;
    }
    
    getCurrentObjective() {
        if (this.currentObjectiveIndex < this.objectives.length) {
            return this.objectives[this.currentObjectiveIndex];
        }
        return null;
    }
    
    getMissionProgress() {
        const completed = this.objectives.filter(obj => obj.completed).length;
        const total = this.objectives.filter(obj => !obj.hidden).length;
        return { completed, total, percentage: (completed / total) * 100 };
    }
    
    dispose() {
        this.clearWaypoints();
        this.currentMission = null;
        this.objectives = [];
        this.isActive = false;
    }
}