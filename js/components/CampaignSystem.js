// PROJECT_MANTA - Enhanced Campaign System

export class CampaignSystem {
    constructor(scene, hudSystem, audioSystem) {
        this.scene = scene;
        this.hudSystem = hudSystem;
        this.audioSystem = audioSystem;
        
        this.currentMission = null;
        this.campaignData = null;
        this.missionSystem = null;
        this.bossSystem = null;
        
        // Campaign state
        this.currentAct = 1;
        this.currentPhase = 1;
        this.completedMissions = [];
        
        this.init();
    }
    
    async init() {
        try {
            // Skip campaign system for now to avoid loading issues
            console.log('Campaign System skipped for minimal initialization');
        } catch (error) {
            console.warn('Campaign System initialization failed:', error);
        }
    }
    
    async loadCampaignData() {
        try {
            const response = await fetch('data/campaign-data.json');
            this.campaignData = await response.json();
        } catch (error) {
            console.error('Failed to load campaign data:', error);
            this.campaignData = this.getDefaultCampaignData();
        }
    }
    
    getDefaultCampaignData() {
        return {
            missions: {
                atmospheric_calibration: {
                    title: "Atmospheric Calibration",
                    description: "Initial systems evaluation and navigation check",
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
        if (!this.missionSystem) {
            console.error('Mission system not initialized');
            return false;
        }
        
        const success = this.missionSystem.startMission(missionId);
        if (success) {
            this.currentMission = this.campaignData.missions[missionId];
            
            // Update HUD with campaign info
            if (this.hudSystem) {
                this.hudSystem.setMissionTitle(this.currentMission.title);
                this.hudSystem.setMissionStatus('In Progress');
            }
        }
        
        return success;
    }
    
    update(deltaTime) {
        // Update mission system
        if (this.missionSystem) {
            const playerPosition = window.projectManta?.tr3bModel?.getModel()?.position;
            this.missionSystem.update(deltaTime, playerPosition);
        }
        
        // Update boss system
        if (this.bossSystem) {
            const playerPosition = window.projectManta?.tr3bModel?.getModel()?.position;
            this.bossSystem.update(deltaTime, playerPosition);
        }
    }
    
    getCurrentMission() {
        return this.currentMission;
    }
    
    getMissionProgress() {
        if (this.missionSystem) {
            return this.missionSystem.getMissionProgress();
        }
        return { completed: 0, total: 0, percentage: 0 };
    }
    
    dispose() {
        if (this.missionSystem) {
            this.missionSystem.dispose();
        }
        
        if (this.bossSystem) {
            this.bossSystem.dispose();
        }
        
        this.currentMission = null;
        this.campaignData = null;
    }
}