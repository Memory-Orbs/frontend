import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export const OrbCanvas = ({ children, hideControls = true }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '350px', 
      position: 'relative' 
    }}>
      <Canvas 
        shadows={false}
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[-5, 5, 5]} intensity={1.5} />
        <pointLight position={[5, -5, 5]} intensity={0.5} />
        
        {children}
        
        {!hideControls && <OrbitControls enableZoom={false} />}
      </Canvas>
    </div>
  );
};

export default OrbCanvas;
