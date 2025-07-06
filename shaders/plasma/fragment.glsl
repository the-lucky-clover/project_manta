// PROJECT_MANTA - Plasma Fragment Shader

precision mediump float;

uniform float time;
uniform float intensity;
uniform vec3 color;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vIntensity;

void main() {
    // Create plasma effect
    float plasmaWave = sin(time * 3.0 + vPosition.x * 0.2) * 0.5 + 0.5;
    float plasmaWave2 = cos(time * 4.0 + vPosition.z * 0.15) * 0.5 + 0.5;
    
    vec3 plasmaColor = mix(color, vec3(0.0, 1.0, 1.0), plasmaWave * plasmaWave2);
    
    // Add intensity-based alpha
    float alpha = vIntensity * (plasmaWave + plasmaWave2) * 0.5;
    
    // Add glow effect
    float glow = 1.0 - length(vUv - 0.5);
    plasmaColor *= glow;
    
    gl_FragColor = vec4(plasmaColor, alpha);
}