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
  uniform float uTime;

  void main() {
    float vDotN = dot(vViewDir, vNormal);
    float fresnel = pow(clamp(1.0 - vDotN, 0.0, 1.0), 3.0);
    
    vec3 reflectDir = reflect(-vViewDir, vNormal);
    vec2 matcapUv = reflectDir.xy * 0.5 + 0.5;
    float reflection = pow(1.0 - distance(matcapUv, vec2(0.5)), 3.0) * 0.6;
    
    vec3 lPos = normalize(vec3(-5.0, 8.0, 5.0));
    float spec = pow(max(dot(vNormal, lPos), 0.0), 128.0) * 2.5;
    
    vec3 lPos2 = normalize(vec3(5.0, -2.0, -5.0));
    float spec2 = pow(max(dot(vNormal, lPos2), 0.0), 64.0) * 0.8;
    
    float rim = pow(fresnel, 5.0) * 1.5;
    vec3 baseCol = vec3(0.92, 0.96, 1.0);
    vec3 finalColor = (baseCol * 0.1) + spec + spec2 + reflection * 0.4;
    
    float alpha = clamp(rim + spec + spec2 + reflection * 0.2 + 0.05, 0.0, 1.0);
    float contour = pow(fresnel, 20.0) * 0.8;
    
    gl_FragColor = vec4(finalColor - contour * 0.2, alpha);
  }
`;

const innerVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vIsSurface;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFill;

  void main() {
    vUv = uv;
    float targetHeight = -0.95 + (clamp(uFill, 0.0, 1.0) * 1.9); 
    
    vec3 pos = position;
    float wave = sin(pos.x * 6.0 + uTime * 2.0) * cos(pos.z * 6.0 + uTime * 1.5) * 0.03;
    float surfaceY = targetHeight + wave;
    
    vIsSurface = 0.0;
    vec3 newNormal = normal;
    
    if (pos.y > surfaceY) {
      pos.y = surfaceY;
      vIsSurface = 1.0;
      newNormal = normalize(vec3(
         sin(pos.x * 15.0 + uTime * 3.0) * 0.1, 
         1.0, 
         cos(pos.z * 15.0 + uTime * 3.0) * 0.1
      ));
    }
    
    vNormal = normalize(normalMatrix * newNormal);
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const innerFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uPct1;
  uniform float uPct2;
  uniform float uTime;
  uniform float uFill;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vIsSurface;

  void main() {
    float t = uTime * 0.5;
    
    // Normalized height (0 to 1) roughly
    float h = (vPosition.y / 0.98 + 1.0) * 0.5;

    vec3 defaultColor = vec3(0.85, 0.9, 0.95);
    vec3 baseCol;
    
    float blend = 0.05;
    float noise = sin(vPosition.x * 5.0 + t) * cos(vPosition.z * 5.0 - t) * 0.02;
    float hNoise = h + noise;
    
    vec3 col1_2 = mix(uColor1, uColor2, smoothstep(uPct1 - blend, uPct1 + blend, hNoise));
    float topMixThreshold = uPct1 + max(uPct2, 0.0);
    float mix2 = smoothstep(topMixThreshold - blend, topMixThreshold + blend, hNoise);
    
    if (uPct2 < 0.001) {
       col1_2 = uColor1;
       mix2 = smoothstep(uPct1 - blend, uPct1 + blend, hNoise);
    }
    
    if (uPct1 <= 0.0 && uPct2 <= 0.0) {
       baseCol = defaultColor;
    } else {
       baseCol = mix(col1_2, defaultColor, mix2);
    }

    float depthGrad = smoothstep(-1.0, 0.8, vPosition.y); 
    vec3 liquidColor = baseCol * (0.3 + 0.7 * depthGrad);

    float viewDot = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
    float edgeIntensity = pow(1.0 - abs(viewDot), 2.0);

    vec3 finalColor;
    
    if (vIsSurface > 0.5) {
      finalColor = baseCol * 1.1; 
      
      float spec = pow(max(dot(normalize(vNormal), normalize(vec3(-2.0, 5.0, 2.0))), 0.0), 32.0);
      finalColor += vec3(spec * 0.8);

      float currentRadius = length(vPosition.xz);
      float maxRadius = sqrt(max(0.98*0.98 - vPosition.y*vPosition.y, 0.001)) * 0.98;
      float ring = smoothstep(maxRadius - 0.04, maxRadius, currentRadius);
      finalColor += baseCol * ring * 1.5;
    } else {
      finalColor = liquidColor + (baseCol * edgeIntensity * 0.6);
      
      vec3 modPos = vPosition * 8.0 + vec3(0.0, uTime * -1.5, 0.0);
      float bubble = sin(modPos.x) * cos(modPos.y) * sin(modPos.z);
      if (bubble > 0.95 && hNoise < (uPct1 + uPct2)) {
        finalColor += vec3(0.4); 
      }
    }
    
    float alpha = mix(0.7, 0.95, 1.0 - mix2);
    if (uPct1 <= 0.0 && uPct2 <= 0.0) alpha = 0.7;
    
    gl_FragColor = vec4(finalColor, alpha);
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
  pct1 = 0,
  pct2 = 0,
  ratio = 0.5, 
  fill = 1, 
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
    uPct1: { value: pct1 },
    uPct2: { value: pct2 },
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
      materialRef.current.uniforms.uPct1.value = pct1;
      materialRef.current.uniforms.uPct2.value = pct2;
      materialRef.current.uniforms.uRatio.value = ratio;
      materialRef.current.uniforms.uFill.value = fill;
    }
  }, [color1, color2, pct1, pct2, ratio, fill]);

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
        innerMeshRef.current.scale.setScalar(1.0);
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
        
        {/* Refractive Inner Core (Liquid) */}
        <mesh ref={innerMeshRef}>
          <sphereGeometry args={[0.98, 64, 64]} />
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
