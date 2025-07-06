// PROJECT_MANTA - Audio System

export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.musicTrack = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio System initialized');
        } catch (error) {
            console.warn('Audio System failed to initialize:', error);
        }
    }
    
    update(deltaTime) {
        // Update any time-based audio effects
        this.updatePositionalAudio();
    }
    
    updatePositionalAudio() {
        // Update 3D audio positioning based on camera and objects
        // This will be implemented when we have the actual 3D objects
    }
    
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
        }
    }
    
    playSound(name, volume = 1, pitch = 1, loop = false) {
        if (!this.audioContext || !this.sounds.has(name)) return;
        
        const audioBuffer = this.sounds.get(name);
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.loop = loop;
        source.playbackRate.value = pitch;
        
        gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
        
        return source;
    }
    
    playMusic(name, volume = 1, loop = true) {
        if (!this.audioContext || !this.sounds.has(name)) return;
        
        // Stop current music if playing
        if (this.musicTrack) {
            this.musicTrack.stop();
        }
        
        const audioBuffer = this.sounds.get(name);
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.loop = loop;
        
        gainNode.gain.value = volume * this.musicVolume * this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
        this.musicTrack = source;
        
        return source;
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    dispose() {
        if (this.musicTrack) {
            this.musicTrack.stop();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.sounds.clear();
    }
}