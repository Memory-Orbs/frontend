import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

export const OrbCanvas = ({ children, hideControls = true }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      marginBottom: '20px', 
      position: 'relative',
      background: 'rgba(100, 100, 100, 0.08)', // Subtle grey background for contrast
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {children}
        
        {!hideControls && <OrbitControls enableZoom={false} />}
      </Canvas>
    </div>
  );
};

export default OrbCanvas;
