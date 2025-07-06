// PROJECT_MANTA - Enhanced HUD System

export class HUDSystem {
    constructor() {
        this.elements = new Map();
        this.isVisible = true;
        this.missionTitle = 'PROJECT_MANTA';
        this.missionStatus = 'Operational';
        this.messages = [];
        
        this.init();
    }
    
    init() {
        // Cache HUD elements
        this.elements.set('missionTitle', document.getElementById('mission-title'));
        this.elements.set('missionStatus', document.getElementById('mission-status'));
        this.elements.set('hudOverlay', document.getElementById('hud-overlay'));
        this.elements.set('plasmaFill', document.getElementById('plasma-fill'));
        this.elements.set('plasmaPercentage', document.getElementById('plasma-percentage'));
        
        // Create message container
        this.createMessageContainer();
        
        console.log('Enhanced HUD System initialized');
    }
    
    createMessageContainer() {
        const messageContainer = document.createElement('div');
        messageContainer.id = 'hud-messages';
        messageContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
            pointer-events: none;
            text-align: center;
            font-family: 'Courier New', monospace;
        `;
        
        document.getElementById('hud').appendChild(messageContainer);
        this.elements.set('messageContainer', messageContainer);
    }
    
    update(deltaTime) {
        // Update HUD elements
        this.updateMissionInfo();
        this.updateMessages(deltaTime);
    }
    
    updateMissionInfo() {
        const titleElement = this.elements.get('missionTitle');
        const statusElement = this.elements.get('missionStatus');
        
        if (titleElement) {
            titleElement.textContent = this.missionTitle;
        }
        
        if (statusElement) {
            statusElement.textContent = this.missionStatus;
        }
    }
    
    updateMessages(deltaTime) {
        // Update message timers
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const message = this.messages[i];
            message.timeRemaining -= deltaTime * 1000;
            
            if (message.timeRemaining <= 0) {
                message.element.remove();
                this.messages.splice(i, 1);
            } else if (message.timeRemaining <= 1000) {
                // Fade out in last second
                const opacity = message.timeRemaining / 1000;
                message.element.style.opacity = opacity;
            }
        }
    }
    
    setMissionTitle(title) {
        this.missionTitle = title;
    }
    
    setMissionStatus(status) {
        this.missionStatus = status;
    }
    
    showMessage(message, duration = 3000, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `hud-message hud-message-${type}`;
        messageElement.textContent = message;
        
        // Style based on message type
        let color = '#00ff00';
        let borderColor = '#00ff00';
        let backgroundColor = 'rgba(0, 20, 0, 0.9)';
        
        switch (type) {
            case 'warning':
                color = '#ffff00';
                borderColor = '#ffff00';
                backgroundColor = 'rgba(20, 20, 0, 0.9)';
                break;
            case 'error':
                color = '#ff4444';
                borderColor = '#ff4444';
                backgroundColor = 'rgba(20, 0, 0, 0.9)';
                break;
            case 'success':
                color = '#44ff44';
                borderColor = '#44ff44';
                backgroundColor = 'rgba(0, 20, 0, 0.9)';
                break;
        }
        
        messageElement.style.cssText = `
            background: ${backgroundColor};
            color: ${color};
            padding: 15px 25px;
            border: 2px solid ${borderColor};
            border-radius: 8px;
            font-size: clamp(1em, 3vw, 1.2em);
            margin-bottom: 10px;
            text-shadow: 0 0 10px ${color};
            backdrop-filter: blur(5px);
            animation: messageSlideIn 0.5s ease-out;
        `;
        
        // Add slide-in animation if not exists
        if (!document.getElementById('message-animations')) {
            const style = document.createElement('style');
            style.id = 'message-animations';
            style.textContent = `
                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        const messageContainer = this.elements.get('messageContainer');
        messageContainer.appendChild(messageElement);
        
        // Store message for cleanup
        this.messages.push({
            element: messageElement,
            timeRemaining: duration
        });
    }
    
    updatePlasmaStatus(power, percentage) {
        const fillElement = this.elements.get('plasmaFill');
        const percentageElement = this.elements.get('plasmaPercentage');
        
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }
        
        if (percentageElement) {
            percentageElement.textContent = `${Math.round(percentage)}%`;
        }
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        const hudOverlay = this.elements.get('hudOverlay');
        if (hudOverlay) {
            hudOverlay.style.display = this.isVisible ? 'block' : 'none';
        }
    }
    
    createPlasmaEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'plasma-effect';
        effect.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #ff00ff, transparent);
            border-radius: 50%;
            pointer-events: none;
            animation: plasmaEffectFade 0.5s ease-out forwards;
        `;
        
        // Add animation if not exists
        if (!document.getElementById('plasma-effect-animations')) {
            const style = document.createElement('style');
            style.id = 'plasma-effect-animations';
            style.textContent = `
                @keyframes plasmaEffectFade {
                    from {
                        opacity: 1;
                        transform: scale(0.5);
                    }
                    to {
                        opacity: 0;
                        transform: scale(2);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.getElementById('hud').appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 500);
    }
    
    dispose() {
        // Clear all messages
        this.messages.forEach(message => {
            message.element.remove();
        });
        this.messages = [];
        
        this.elements.clear();
    }
}