import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
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
  varying vec3 vNormal;

  void main() {
    float n = sin(vNormal.x * 2.0 + uTime) * cos(vNormal.y * 2.0 + uTime) * 0.5 + 0.5;
    vec3 baseColor = mix(uColor1, uColor2, clamp(uRatio + (n - 0.5) * 0.2, 0.0, 1.0));
    float alpha = uFill > 0.01 ? uFill : 0.0;
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

export const Orb = ({ 
  color1 = "#ffffff", 
  color2 = "#ffffff", 
  ratio = 0.5, 
  fill = 0, 
  scale = 1,
  position = [0, 0, 0],
  isAnimating = false, 
  targetPosition = null,
  onAnimationComplete = null,
  onClick = null
}) => {
  const groupRef = useRef();
  const innerMeshRef = useRef();
  const materialRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const uniforms = useMemo(() => ({
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uRatio: { value: ratio },
    uTime: { value: 0 },
    uFill: { value: fill }
  }), []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor1.value.set(new THREE.Color(color1));
      materialRef.current.uniforms.uColor2.value.set(new THREE.Color(color2));
      materialRef.current.uniforms.uRatio.value = ratio;
      materialRef.current.uniforms.uFill.value = fill;
    }
  }, [color1, color2, ratio, fill]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Safely get time
    let time = 0;
    try { time = state.clock.getElapsedTime(); } catch(e) { time = Date.now() * 0.001; }
    
    if (materialRef.current) materialRef.current.uniforms.uTime.value = time;
    
    // Smooth idle animation
    if (!isAnimating && !targetPosition) {
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.1;
      groupRef.current.rotation.y += delta * 0.15;
    }

    // Stabilized scale logic (Prevent NaN/Context Lost)
    const validScale = isNaN(scale) ? 1 : Math.max(0.01, scale);
    const targetScale = hovered ? validScale * 1.1 : validScale;
    const currentScale = groupRef.current.scale.x || validScale;
    const lerped = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    const safeFinalScale = isNaN(lerped) ? validScale : lerped;
    groupRef.current.scale.set(safeFinalScale, safeFinalScale, safeFinalScale);

    // Inner core logic
    if (innerMeshRef.current) {
      if (fill > 0.01) {
        innerMeshRef.current.visible = true;
        const pulse = Math.sin(time * 4.0) * 0.02;
        const innerScale = 1.0 + pulse; /* Glass kabuk olmadığı için tam boyut! */
        innerMeshRef.current.scale.set(innerScale, innerScale, innerScale);
      } else {
        innerMeshRef.current.visible = false;
      }
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Sadece Doğrudan Duygu Küresi Render Edilir (Dış Camsız) */}
      <mesh ref={innerMeshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
        />
      </mesh>
    </group>
  );
};

export default Orb;
