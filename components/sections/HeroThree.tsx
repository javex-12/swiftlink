"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, Environment } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedSphere() {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.1;
    mesh.current.rotation.y = t * 0.15;
  });

  return (
    <Float speed={1.4} rotationIntensity={1.5} floatIntensity={2.3}>
      <Sphere ref={mesh} args={[1, 100, 200]} scale={2}>
        <MeshDistortMaterial
          color="#10b981"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
        />
      </Sphere>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={75} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      <AnimatedSphere />
      
      {/* Background elements */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
         <mesh position={[-4, 2, -2]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#3b82f6" opacity={0.3} transparent />
         </mesh>
      </Float>
      
      <Float speed={3} rotationIntensity={1} floatIntensity={1}>
         <mesh position={[4, -2, -3]}>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#10b981" opacity={0.2} transparent />
         </mesh>
      </Float>

      <Environment preset="city" />
    </>
  );
}

export default function HeroThree() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
