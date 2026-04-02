import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';

export const OrbCanvas = ({ children, hideControls = true }) => {
  return (
    <div style={{ width: '100%', height: '400px', marginBottom: '20px', position: 'relative' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="city" />
        
        {children}
        
        {!hideControls && <OrbitControls enableZoom={false} />}
      </Canvas>
    </div>
  );
};

export default OrbCanvas;
