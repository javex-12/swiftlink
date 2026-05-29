"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function StarField() {
  const ref = useRef<THREE.Points>(null!);
  
  // Generate a high-performance particle cloud
  const [positions, step] = useMemo(() => {
    const pos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return [pos, 0.002];
  }, []);

  useFrame((state) => {
    ref.current.rotation.y += step;
    ref.current.rotation.x += step / 2;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#10b981"
          size={0.04}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function AmbientLightOrb() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = Math.sin(t * 0.5) * 0.2;
    ref.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.05);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#10b981" transparent opacity={0.03} />
    </mesh>
  );
}

export default function ThreeScene() {
  return (
    <div className="w-full h-full relative pointer-events-none opacity-80">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <StarField />
          <AmbientLightOrb />
        </Suspense>
      </Canvas>
    </div>
  );
}
