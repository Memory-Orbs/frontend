import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hexToRgb } from '../../utils/colorUtils';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uRatio; // 0 to 1
  uniform float uTime;
  uniform float uFill; // 0 (empty) to 1 (full)
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Simple 3D noise
  float hash(vec3 p)  {
      p  = fract( p*0.3183099+.1 );
      p *= 17.0;
      return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
  }
  float noise( in vec3 x ) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f*f*(3.0-2.0*f);
      return mix(mix(mix( hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)),f.x),
                     mix( hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix( hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)),f.x),
                     mix( hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }

  void main() {
    // Generate a swirling pattern
    float n = noise(vPosition * 2.0 + uTime * 0.5);
    
    // Mix the two colors based on ratio and noise
    vec3 mixedColor = mix(uColor1, uColor2, smoothstep(uRatio - 0.2, uRatio + 0.2, n));
    
    // Glass/Empty state (very faint white, transparent)
    vec3 emptyColor = vec3(1.0, 1.0, 1.0);
    
    // Final color based on fill
    vec3 finalColor = mix(emptyColor, mixedColor, uFill);
    
    // Add specular/glow effect (fresnel)
    float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    if (uFill < 0.1) {
      // Empty orb looks like thin glass
      float alpha = 0.1 + fresnel * 0.5;
      gl_FragColor = vec4(emptyColor, alpha);
    } else {
      // Glowing orb
      gl_FragColor = vec4(finalColor + fresnel * mix(vec3(0.0), finalColor, 0.5), 0.95);
    }
  }
`;

export const Orb = ({ 
  color1 = "#ffffff", 
  color2 = "#ffffff", 
  ratio = 0.5, 
  fill = 0, // 0 means empty glass, 1 means filled with color
  targetPosition = null, // for animation
  isAnimating = false, // if true, it will move towards targetPosition
  onAnimationComplete = null,
  scale = 1,
  onClick = null,
  position = [0, 0, 0]
}) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const uniforms = useMemo(() => {
    // SADECE İLK RENDERDA OLUŞTURUYORUZ!
    return {
      uColor1: { value: new THREE.Vector3(1, 1, 1) },
      uColor2: { value: new THREE.Vector3(1, 1, 1) },
      uRatio: { value: 0.5 },
      uTime: { value: 0 },
      uFill: { value: 0 }
    };
  }, []); // Dependencies empty so it's created ONCE

  // Update uniforms when props change dynamically without remounting
  React.useEffect(() => {
    if (meshRef.current) {
      const rgb1 = hexToRgb(color1);
      const rgb2 = hexToRgb(color2);
      meshRef.current.material.uniforms.uColor1.value.set(rgb1.r, rgb1.g, rgb1.b);
      meshRef.current.material.uniforms.uColor2.value.set(rgb2.r, rgb2.g, rgb2.b);
      meshRef.current.material.uniforms.uRatio.value = ratio;
      meshRef.current.material.uniforms.uFill.value = fill;
    }
  }, [color1, color2, ratio, fill]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value += delta;
      
      // Floating animation when idle
      if (!isAnimating && !targetPosition) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      }
      
      // Lerp to target position for shelf animation
      if (isAnimating && targetPosition) {
        meshRef.current.position.lerp(targetPosition, 0.05); // Smooth interpolation
        
        // Check if arrived
        if (meshRef.current.position.distanceTo(targetPosition) < 0.05) {
          if (onAnimationComplete) onAnimationComplete();
        }
      }
      
      // Hover scale effect
      if (!isAnimating) {
        const targetScale = hovered ? scale * 1.1 : scale;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      }
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      scale={scale}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      style={{ cursor: hovered ? 'pointer' : 'auto' }}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Orb;
