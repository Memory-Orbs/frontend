import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define the path for the tube
export const defaultTubePath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 2),   // Start (Center screen)
  new THREE.Vector3(0, 2, -1),  // Curve up/back
  new THREE.Vector3(3, 3, -2),  // Curve right/back
  new THREE.Vector3(6, 1, -5),  // Enter shelf area
]);

export const TubeStructure = ({ path = defaultTubePath, visible = true }) => {
  const geometry = useMemo(() => new THREE.TubeGeometry(path, 64, 1.2, 8, false), [path]);

  return (
    <mesh geometry={geometry} visible={visible}>
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.1}
        roughness={0.1}
        metalness={0.2}
        transmission={1.0} // Glass like
        thickness={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// A component that takes an Orb (as child or props) and animates it along a curve
export const AnimatedTubeOrb = ({ 
  children, 
  path = defaultTubePath, 
  onComplete,
  duration = 2.5, // seconds 
  startOffset = 0,
  reverse = false
}) => {
  const groupRef = useRef();
  const progress = useRef(startOffset);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (progress.current < 1) {
      // Speed multiplier based on duration
      progress.current += delta / duration;

      if (progress.current >= 1) {
        progress.current = 1;
        if (onComplete) onComplete();
      }

      // Calculate path point
      // If reverse, it goes backwards from 1 to 0. But practically we usually just reverse the progress logic
      const t = reverse ? 1 - progress.current : progress.current;
      const point = path.getPointAt(t);
      groupRef.current.position.copy(point);
      
      // Scaling down as it goes further away into the tube looks cool
      const scale = reverse ? 0.3 + t * 0.7 : 1.0 - t * 0.5;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};
