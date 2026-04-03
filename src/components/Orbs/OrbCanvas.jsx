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
      background: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
    }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 45 }}>
        <Environment preset="city" />
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        
        {children}
        
        {!hideControls && <OrbitControls enableZoom={false} />}
      </Canvas>
    </div>
  );
};

export default OrbCanvas;
