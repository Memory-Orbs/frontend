import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
  uniform float uRatio;
  uniform float uTime;
  uniform float uFill;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Işık ve derinlik efekti (Fresnel)
    float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 2.0);

    // Renk karışımı
    float noise = sin(vPosition.x * 2.0 + uTime) * cos(vPosition.y * 2.0 + uTime) * 0.5 + 0.5;
    vec3 baseColor = mix(uColor1, uColor2, clamp(uRatio + (noise - 0.5) * 0.3, 0.0, 1.0));
    
    // Boş/Dolu hali
    vec3 glassColor = vec3(0.8, 0.8, 0.9); // Hafif maviye çalan cam rengi
    vec3 finalColor = mix(glassColor, baseColor, uFill);
    
    // Opaklık ayarı (Boşken daha şeffaf, doluyken daha canlı)
    float alpha = mix(0.3, 0.9, uFill) + fresnel * 0.5;
    
    gl_FragColor = vec4(finalColor + fresnel * 0.2, alpha);
  }
`;

export const Orb = ({ 
  color1 = "#ffffff", 
  color2 = "#ffffff", 
  ratio = 0.5, 
  fill = 0, 
  targetPosition = null, 
  isAnimating = false, 
  onAnimationComplete = null,
  scale = 1,
  onClick = null,
  position = [0, 0, 0]
}) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Uniforms stable reference
  const uniforms = useMemo(() => ({
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uRatio: { value: ratio },
    uTime: { value: 0 },
    uFill: { value: fill }
  }), []);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  // Update uniforms when props change dynamically
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor1.value.set(new THREE.Color(color1));
      materialRef.current.uniforms.uColor2.value.set(new THREE.Color(color2));
      materialRef.current.uniforms.uRatio.value = ratio;
      materialRef.current.uniforms.uFill.value = fill;
    }
  }, [color1, color2, ratio, fill]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (materialRef.current) materialRef.current.uniforms.uTime.value += delta;
      
      // Floating animation when idle
      if (!isAnimating && !targetPosition) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      }
      
      // Lerp to target position for shelf animation
      if (isAnimating && targetPosition) {
        const targetVec = Array.isArray(targetPosition) 
           ? new THREE.Vector3(...targetPosition) 
           : targetPosition;
           
        meshRef.current.position.lerp(targetVec, 0.05);
        
        if (meshRef.current.position.distanceTo(targetVec) < 0.05) {
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
    >
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

export default Orb;
