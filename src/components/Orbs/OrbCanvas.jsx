import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

export const OrbCanvas = ({ children, hideControls = true }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '250px',
      marginBottom: '1rem', 
      position: 'relative',
      background: 'transparent', 
      overflow: 'hidden',
      border: 'none', 
      outline: 'none',
      zIndex: 10
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
