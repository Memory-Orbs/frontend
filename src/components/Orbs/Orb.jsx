import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const glassVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const glassFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  uniform float uTime;

  void main() {
    float vDotN = dot(vViewDir, vNormal);
    float fresnel = pow(clamp(1.0 - vDotN, 0.0, 1.0), 3.0);
    
    // 1. Matcap Style Reflections (Fake World Space)
    // Bu, kürenin üzerine kavisli bir stüdyo yansıması ekleyerek 3D hacmi belirginleştirir.
    vec3 reflectDir = reflect(-vViewDir, vNormal);
    float m = 2.0 * sqrt(pow(reflectDir.x, 2.0) + pow(reflectDir.y, 2.0) + pow(reflectDir.z + 1.0, 2.0));
    vec2 matcapUv = reflectDir.xy / m + 0.5;
    float reflection = pow(1.0 - distance(matcapUv, vec2(0.5)), 3.0) * 0.4;
    
    // 2. Specular Highlights (Top-Left & Sharp Glint)
    vec3 lPos = normalize(vec3(-5.0, 8.0, 5.0));
    float spec = pow(max(dot(vNormal, lPos), 0.0), 128.0) * 2.0;
    
    // 3. Ambient Occlusion Overlay (Kürenin kendi üzerindeki gölgesi)
    float ao = smoothstep(0.3, -0.6, vNormal.y) * 0.25;
    
    // 4. Rim Lighting (3D Kenar Işığı)
    float rim = pow(fresnel, 4.0) * 0.8;
    
    vec3 baseCol = vec3(0.96, 0.98, 1.0);
    vec3 finalColor = baseCol + spec + reflection - ao;
    
    // Beyaz zeminde kontur belirginleştirme
    float contour = pow(fresnel, 20.0) * 0.5;
    
    gl_FragColor = vec4(finalColor - contour, clamp(rim + spec * 0.6 + reflection * 0.3 + 0.05, 0.0, 1.0));
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
    float t = uTime * 0.4;
    // Plasma Noise
    float n = sin(vPosition.x * 2.0 + t) * cos(vPosition.z * 2.0 - t + sin(t)) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, clamp(uRatio + (n - 0.5) * 0.4, 0.0, 1.0));
    
    // 3D Inner Volume - Bakış açısına göre değişen derinlik
    float intensity = pow(dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    float verticalGrad = smoothstep(-1.2, 0.8, vPosition.y); // Alt tarafı daha koyu
    
    gl_FragColor = vec4(color * (0.2 + 0.8 * intensity) * verticalGrad, uFill);
  }
`;

const shadowFragmentShader = `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    // Contact Shadow (Merkezi daha koyu AO noktası)
    float ao = smoothstep(0.15, 0.0, d) * 1.5; 
    float falloff = smoothstep(0.5, 0.0, d) * 0.5;
    float a = (ao + falloff) * uOpacity;
    gl_FragColor = vec4(0.0, 0.0, 0.05, a);
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
  const timeRef = useRef(0);
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
    
    const dt = isNaN(delta) ? 0.016 : Math.min(delta, 0.1);
    timeRef.current += dt;
    const t = timeRef.current;
    
    if (materialRef.current) materialRef.current.uniforms.uTime.value = t;
    if (glassRef.current) glassRef.current.uniforms.uTime.value = t;
    
    if (!isAnimating && !targetPosition) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.15;
      groupRef.current.rotation.y += dt * 0.25;
      
      if (shadowRef.current && shadowRef.current.material.uniforms) {
        const s = 1.3 - Math.sin(t * 1.2) * 0.15;
        // Gölge artık yatay formunu koruyarak süzülüyor
        shadowRef.current.scale.set(s * 1.4, s * 0.6, 1);
        shadowRef.current.material.uniforms.uOpacity.value = clampSafe(0.35 - Math.sin(t * 1.2) * 0.1, 0, 1);
      }
    }

    const b = isNaN(scale) ? 1 : Math.max(0.01, scale);
    const ts = hovered ? b * 1.12 : b;
    const res = THREE.MathUtils.lerp(groupRef.current.scale.x || b, ts, 0.1);
    groupRef.current.scale.set(res, res, res);

    if (innerMeshRef.current) {
      if (fill > 0.01) {
        innerMeshRef.current.visible = true;
        // Kırılma etkisi (Kenarlarda hafif büyüme)
        const pulse = Math.sin(t * 2.5) * 0.015;
        const innerScale = 0.88 + pulse;
        innerMeshRef.current.scale.setScalar(innerScale);
      } else {
        innerMeshRef.current.visible = false;
      }
    }
  });

  const clampSafe = (val, min, max) => isNaN(val) ? min : Math.min(Math.max(val, min), max);

  return (
    <group position={position}>
      {/* 3D Contact Shadow System */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
        <planeGeometry args={[3, 3]} />
        <shaderMaterial
          fragmentShader={shadowFragmentShader}
          vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          uniforms={shadowUniforms}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      <group 
        ref={groupRef} 
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Volumetric Glass Layer */}
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <shaderMaterial
            ref={glassRef}
            vertexShader={glassVertexShader}
            fragmentShader={glassFragmentShader}
            uniforms={glassUniforms}
            transparent={true}
          />
        </mesh>
        
        {/* Refractive Inner Core */}
        <mesh ref={innerMeshRef}>
          <sphereGeometry args={[0.99, 32, 32]} />
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
