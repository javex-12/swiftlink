"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function SilkFlow() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    meshRef.current.rotation.y = Math.cos(t * 0.15) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} scale={1.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#10b981"
          speed={2}
          distort={0.4}
          radius={1}
          emissive="#064e3b"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function ThreeScene() {
  return (
    <div className="w-full h-full relative pointer-events-none opacity-40">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <SilkFlow />
        </Suspense>
      </Canvas>
    </div>
  );
}
