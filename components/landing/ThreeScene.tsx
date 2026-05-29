"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, MeshTransmissionMaterial, Octahedron } from "@react-three/drei";
import * as THREE from "three";

function GeometricCore() {
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.2;
    meshRef.current.rotation.z = t * 0.1;
  });

  return (
    <group ref={meshRef}>
      {/* Primary Crystal */}
      <Float speed={3} rotationIntensity={1} floatIntensity={2}>
        <mesh scale={1.8}>
          <octahedronGeometry args={[1, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={1}
            chromaticAberration={0.025}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.1}
            clearcoat={1}
            color="#10b981"
          />
        </mesh>
      </Float>

      {/* Wireframe Shell */}
      <mesh scale={2.2}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Orbiting Shards */}
      {[...Array(3)].map((_, i) => (
        <Float key={i} speed={4} rotationIntensity={2} floatIntensity={1.5}>
           <mesh position={[Math.sin(i * 2) * 3, Math.cos(i * 2) * 3, 0]} scale={0.4}>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
           </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function ThreeScene() {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} color="#10b981" intensity={1} />
          <GeometricCore />
        </Suspense>
      </Canvas>
    </div>
  );
}