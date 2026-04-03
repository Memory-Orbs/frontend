import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const glassVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const glassFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;

  void main() {
    float vDotN = dot(vViewDir, vNormal);
    float fresnel = pow(clamp(1.0 - vDotN, 0.0, 1.0), 3.0);
    
    // 1. Crystal Transparency & Rim (Visibility)
    float edge = 0.2 + 0.6 * fresnel;
    
    // 2. Studio Highlights
    vec3 lPos = normalize(vec3(5.0, 10.0, 5.0));
    float spec = pow(max(dot(vNormal, lPos), 0.0), 128.0) * 1.5;
    
    // 3. Fake Refraction & Depth
    float coreHighlight = pow(vDotN, 10.0) * 0.2;
    float bounceLight = pow(max(dot(vNormal, vec3(0.0, -1.0, 0.0)), 0.0), 4.0) * 0.4;
    
    // 4. White BG Contrast: Beyaz zeminde kontur çizgisi
    float contour = pow(fresnel, 20.0) * 0.5; 
    
    vec3 baseCol = vec3(0.94, 0.97, 1.0);
    vec3 finalColor = baseCol + spec + coreHighlight + bounceLight - contour;
    
    gl_FragColor = vec4(finalColor, clamp(edge + spec * 0.5, 0.0, 1.0));
  }
`;

const innerVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const innerFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uRatio;
  uniform float uTime;
  uniform float uFill;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float t = uTime * 0.6;
    float n = sin(vPosition.x * 2.0 + t) * cos(vPosition.z * 2.0 - t) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, clamp(uRatio + (n - 0.5) * 0.35, 0.0, 1.0));
    
    // Volumetric Glow
    float glow = pow(dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    gl_FragColor = vec4(color * (0.3 + 0.7 * glow), uFill);
  }
`;

const shadowFragmentShader = `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float a = smoothstep(0.5, 0.1, d) * uOpacity;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
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
  const glassRef = useRef();
  const shadowRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const uniforms = useMemo(() => ({
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uRatio: { value: ratio },
    uTime: { value: 0 },
    uFill: { value: fill }
  }), []);

  const glassUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const shadowUniforms = useMemo(() => ({ uOpacity: { value: 0.3 } }), []);

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
    const time = state.clock.getElapsedTime();
    
    if (materialRef.current) materialRef.current.uniforms.uTime.value = time;
    if (glassRef.current) glassRef.current.uniforms.uTime.value = time;
    
    if (!isAnimating && !targetPosition) {
      groupRef.current.position.y = position[1] + Math.sin(time * 1.4) * 0.15;
      groupRef.current.rotation.y += delta * 0.3;
      
      if (shadowRef.current && shadowRef.current.material.uniforms) {
        const s = 1.3 - Math.sin(time * 1.4) * 0.2;
        shadowRef.current.scale.set(s, s, 1);
        shadowRef.current.material.uniforms.uOpacity.value = 0.3 - Math.sin(time * 1.4) * 0.1;
      }
    }

    const b = isNaN(scale) ? 1 : Math.max(0.01, scale);
    const ts = hovered ? b * 1.15 : b;
    const cur = groupRef.current.scale.x || b;
    const res = THREE.MathUtils.lerp(cur, ts, 0.1);
    groupRef.current.scale.set(res, res, res);

    if (innerMeshRef.current) {
      if (fill > 0.01) {
        innerMeshRef.current.visible = true;
        innerMeshRef.current.scale.setScalar(0.88 + Math.sin(time * 3.5) * 0.02);
      } else {
        innerMeshRef.current.visible = false;
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <shaderMaterial
          fragmentShader={shadowFragmentShader}
          vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          uniforms={shadowUniforms}
          transparent={true}
        />
      </mesh>

      <group 
        ref={groupRef} 
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            ref={glassRef}
            vertexShader={glassVertexShader}
            fragmentShader={glassFragmentShader}
            uniforms={glassUniforms}
            transparent={true}
          />
        </mesh>
        
        <mesh ref={innerMeshRef}>
          <sphereGeometry args={[1, 48, 48]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={innerVertexShader}
            fragmentShader={innerFragmentShader}
            uniforms={uniforms}
            transparent={false}
          />
        </mesh>
      </group>
    </group>
  );
};

export default Orb;
