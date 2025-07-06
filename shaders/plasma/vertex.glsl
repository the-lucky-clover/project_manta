// PROJECT_MANTA - Plasma Vertex Shader

precision mediump float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;
uniform float time;
uniform float intensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vIntensity;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * vec4(normal, 0.0)).xyz;
    vPosition = position;
    
    // Add plasma wave distortion
    vec3 distortedPosition = position;
    float wave = sin(time * 2.0 + position.x * 0.1) * 0.5;
    distortedPosition.y += wave * intensity;
    
    vIntensity = intensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPosition, 1.0);
}