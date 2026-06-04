"use client";

import { useRef, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  PerspectiveCamera,
  Environment,
  Text,
  MeshTransmissionMaterial,
  Float as FloatDrei,
} from "@react-three/drei";
import * as THREE from "three";

// ─── Glass Slab ───────────────────────────────────────────────────────────────
function GlassSlab({ position, rotation, scale = [1, 1, 1] }: { position: [number, number, number], rotation: [number, number, number], scale?: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={position} rotation={rotation} scale={scale as any}>
        <boxGeometry args={[2, 3, 0.1]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1}
          chromaticAberration={0.02}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.1}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#ffffff"
          bg={new THREE.Color('#000000')}
        />
      </mesh>
    </Float>
  );
}

// ─── Emerald Core ─────────────────────────────────────────────────────────────
function EmeraldCore() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <Float speed={3} rotationIntensity={2} floatIntensity={2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={2}
          roughness={0}
          metalness={1}
        />
      </mesh>
    </Float>
  );
}

// ─── Floating Particles ───────────────────────────────────────────────────────
function FloatingParticles({ count = 40 }) {
  const points = useRef<THREE.Points>(null!);
  const particles = Array.from({ length: count }, () => ({
    position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
    size: Math.random() * 0.05 + 0.02,
  }));

  useFrame((state) => {
    points.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(particles.flatMap((p) => p.position))}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#10b981" size={0.08} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────
function Scene() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const { mouse } = state;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (mouse.x * Math.PI) / 10,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (-mouse.y * Math.PI) / 10,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      <EmeraldCore />
      <GlassSlab position={[1.5, 0.5, 1]} rotation={[0.2, 0.4, 0]} scale={[0.8, 0.8, 1]} />
      <GlassSlab position={[-1.8, -0.8, -1]} rotation={[-0.1, -0.3, 0.2]} scale={[0.6, 0.6, 1]} />
      
      {/* Abstract Orbiting Ring */}
      <Float speed={1.5} rotationIntensity={0.5}>
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[3, 0.005, 16, 100]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
        </mesh>
      </Float>

      <FloatingParticles count={60} />
      
      <spotLight position={[5, 5, 5]} intensity={2} penumbra={1} color="#10b981" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#ffffff" />
    </group>
  );
}

export default function ThreeScene() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 767px)");
    if (!mq) return;
    const onChange = () => setIsMobile(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] relative pointer-events-none overflow-visible">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 35 }}
        gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
        dpr={isMobile ? 1 : [1, 2]}
      >
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
