import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export const OrbCanvas = ({ children, hideControls = true }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      marginBottom: '20px', 
      position: 'relative',
      background: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
    }}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45 }}>
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
