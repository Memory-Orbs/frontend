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
  uniform float uTotalPct;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float vDotN = dot(vViewDir, vNormal);
    float fresnel = pow(clamp(1.0 - vDotN, 0.0, 1.0), 2.5);
    vec3 reflectDir = reflect(-vViewDir, vNormal);
    vec2 matcapUv = reflectDir.xy * 0.5 + 0.5;
    float reflection = pow(1.0 - distance(matcapUv, vec2(0.5)), 3.0) * 0.5;
    vec3 lPos = normalize(vec3(-3.0, 6.0, 5.0));
    float spec = pow(max(dot(vNormal, lPos), 0.0), 96.0) * 1.5;
    
    // Kenar belirginliğini artırıyoruz
    float rim = pow(fresnel, 2.5) * 2.0; 

    // Widget bazlı gerçek "buzlu/sütlü" cam etkisi:
    vec3 baseCol = vec3(1.0, 1.0, 1.0); 
    
    // Eğer orb doluysa (duygu seçilmişse) camı incelt, boşsa kalın (bembeyaz) kalsın
    float glassBase = uTotalPct > 0.01 ? 0.15 : 0.85;
    float baseAlpha = uTotalPct > 0.01 ? 0.05 : 0.40;

    vec3 finalColor = (baseCol * glassBase) + spec + (reflection * 0.5);
    
    // Lebih açık cam (dolu iken) veya daha opak (boş iken)
    float alpha = clamp(rim + spec + reflection * 0.2 + baseAlpha, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
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

// Y-position liquid fill shader with edge noise wobble
const innerFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uPct1;
  uniform float uPct2;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hashF(float n) {
    return fract(sin(n) * 43758.5453);
  }

  float noise3D(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec3 basis = vec3(1.0, 57.0, 113.0);
    float n000 = hashF(dot(p,                            basis));
    float n100 = hashF(dot(p + vec3(1.0, 0.0, 0.0),     basis));
    float n010 = hashF(dot(p + vec3(0.0, 1.0, 0.0),     basis));
    float n110 = hashF(dot(p + vec3(1.0, 1.0, 0.0),     basis));
    float n001 = hashF(dot(p + vec3(0.0, 0.0, 1.0),     basis));
    float n101 = hashF(dot(p + vec3(1.0, 0.0, 1.0),     basis));
    float n011 = hashF(dot(p + vec3(0.0, 1.0, 1.0),     basis));
    float n111 = hashF(dot(p + vec3(1.0, 1.0, 1.0),     basis));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  void main() {
    float totalPct = uPct1 + uPct2;

    // Show nothing if no emotion selected
    if (totalPct < 0.01) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    float t = uTime * 0.5;
    vec3 pos = vPosition;

    // Animated surface noise for wobbly liquid boundary
    float wobble = noise3D(pos * 4.0 + vec3(t * 0.7, t * 0.5, -t * 0.6)) * 0.12
                 + noise3D(pos * 8.0 + vec3(-t * 0.5, t * 0.8, t * 0.4)) * 0.06;

    // Fill level: totalPct=1.0 -> full sphere, totalPct=0.5 -> halfway up
    // vPosition.y: top = +0.97, bottom = -0.97
    float fillY = (totalPct * 2.0 - 1.0) * 0.97;
    float inFill = smoothstep(0.05, -0.05, pos.y - fillY - wobble);

    if (inFill < 0.005) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // Color split between emotion 1 (bottom) and emotion 2 (top of fill)
    float splitY = (uPct1 * 2.0 - 1.0) * 0.97;
    float colorBlend = (uPct2 > 0.01)
      ? smoothstep(splitY - 0.12, splitY + 0.12, pos.y)
      : 0.0;
    vec3 cloudColor = mix(uColor1, uColor2, colorBlend);

    // Subtle shimmer inside the filled area
    float shimmer = noise3D(pos * 6.0 + vec3(t * 0.3, -t * 0.4, t * 0.5)) * 0.15 + 0.9;
    cloudColor *= shimmer;

    // Edge fade: use camera-facing normal (NOT length(pos) — sphere surface always has r=const!)
    // vNormal is in view space; dot with (0,0,1) = how much this face points toward camera.
    float nDotV = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    float edgeFade = smoothstep(0.0, 0.35, nDotV);

    float alpha = inFill * edgeFade * 0.92;
    gl_FragColor = vec4(cloudColor, clamp(alpha, 0.0, 1.0));
  }
`;

const shadowFragmentShader = `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
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
  onClick = null,
  idle = true
}) => {
  const groupRef     = useRef();
  const innerMeshRef = useRef();
  const materialRef  = useRef();
  const glassRef     = useRef();
  const shadowRef    = useRef();
  const timeRef      = useRef(0);
  const [hovered, setHovered] = useState(false);

  // Keep latest props in a ref so useFrame always sees current values
  const propsRef = useRef({ color1, color2, pct1, pct2, fill, scale, idle });
  useEffect(() => {
    propsRef.current = { color1, color2, pct1, pct2, fill, scale, idle };
  });

  // Uniforms created ONCE — mutated directly every frame
  const uniforms = useMemo(() => ({
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uPct1:   { value: pct1 },
    uPct2:   { value: pct2 },
    uTime:   { value: 0 },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const glassUniforms  = useMemo(() => ({ uTime: { value: 0 }, uTotalPct: { value: 0 } }), []);
  const shadowUniforms = useMemo(() => ({ uOpacity: { value: 0.3 } }), []);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const dt = isNaN(delta) ? 0.016 : Math.min(delta, 0.1);
    timeRef.current += dt;
    const t = timeRef.current;

    // Always push latest prop values to GPU every frame
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      const { color1: c1, color2: c2, pct1: p1, pct2: p2 } = propsRef.current;
      u.uColor1.value.set(c1);
      u.uColor2.value.set(c2);
      u.uPct1.value = p1;
      u.uPct2.value = p2;
      u.uTime.value  = t;
    }
    if (glassRef.current) {
      glassRef.current.uniforms.uTime.value = t;
      glassRef.current.uniforms.uTotalPct.value = propsRef.current.pct1 + propsRef.current.pct2;
    }

    if (!isAnimating && !targetPosition && propsRef.current.idle) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.15;
      groupRef.current.rotation.y += dt * 0.25;

      if (shadowRef.current && shadowRef.current.material &&
          shadowRef.current.material.uniforms) {
        const s = 1.3 - Math.sin(t * 1.2) * 0.15;
        shadowRef.current.scale.set(s * 1.4, s * 0.6, 1);
        shadowRef.current.material.uniforms.uOpacity.value =
          Math.min(Math.max(0.35 - Math.sin(t * 1.2) * 0.1, 0), 1);
      }
    } else if (!isAnimating && !targetPosition && !propsRef.current.idle) {
      // If idle is false, ensure it stays at the base position
      groupRef.current.position.y = position[1];
      // We don't reset rotation here to keep current orientation, 
      // or we can set it to a fixed value.
    }

    const { fill: f, scale: sc } = propsRef.current;
    const b  = isNaN(sc) ? 1 : Math.max(0.01, sc);
    const ts = hovered ? b * 1.12 : b;
    const res = THREE.MathUtils.lerp(groupRef.current.scale.x || b, ts, 0.1);
    groupRef.current.scale.set(res, res, res);

    if (innerMeshRef.current) {
      innerMeshRef.current.visible = f > 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Contact Shadow */}
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
        {/*
          Render order:
          1) Inner volumetric cloud  (renderOrder=1) — drawn first, no depth write
          2) Glass shell             (renderOrder=2) — drawn on top, no depth write
        */}

        {/* Volumetric Inner Cloud */}
        <mesh ref={innerMeshRef} renderOrder={1}>
          <sphereGeometry args={[0.97, 64, 64]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={innerVertexShader}
            fragmentShader={innerFragmentShader}
            uniforms={uniforms}
            transparent={true}
            depthWrite={false}
            depthTest={false}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Glass Shell — always on top */}
        <mesh renderOrder={2}>
          <sphereGeometry args={[1, 48, 48]} />
          <shaderMaterial
            ref={glassRef}
            vertexShader={glassVertexShader}
            fragmentShader={glassFragmentShader}
            uniforms={glassUniforms}
            transparent={true}
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>
      </group>
    </group>
  );
};

export default Orb;
