"use client";

import { useRef, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  PerspectiveCamera,
  Environment,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

// ─── Glowing Connection Line ──────────────────────────────────────────────────
function ConnectionLine({
  start,
  end,
  color,
  delay = 0,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  delay?: number;
}) {
  const lineRef = useRef<THREE.Line>(null!);
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    // Pulse line opacity and color intensity
    const t = state.clock.elapsedTime + delay;
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.15 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.2} linewidth={1} />
    </line>
  );
}

// ─── Floating Glass Card ──────────────────────────────────────────────────────
function GlassCard({
  position,
  scale = [1, 1, 1],
  color = "#10b981",
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale} rotation={rotation}>
        <boxGeometry args={[1, 1.5, 0.08]} />
        <meshPhysicalMaterial
          color="#0f172a"
          emissive={color}
          emissiveIntensity={0.15}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transmission={0.6}
          thickness={0.5}
          transparent
          opacity={0.85}
        />
        {/* Card Border Highlight */}
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1.02, 1.52, 0.1)]} />
          <lineBasicMaterial attach="material" color={color} linewidth={2} transparent opacity={0.6} />
        </lineSegments>
      </mesh>
    </Float>
  );
}

// ─── Floating Product Node ────────────────────────────────────────────────────
function ProductNode({
  position,
  color,
  delay,
}: {
  position: [number, number, number];
  color: string;
  delay: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 1.5 + delay;
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t) * 0.15;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.22, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        roughness={0.05}
        metalness={0.95}
      />
      {/* Outer Halo */}
      <mesh scale={1.3}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} wireframe />
      </mesh>
    </mesh>
  );
}

// ─── Flowing Order Particle ───────────────────────────────────────────────────
function FlowingOrder({
  start,
  end,
  speed = 1,
  delay = 0,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  speed?: number;
  delay?: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);

  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.4 * speed + delay) % 1.0;
    if (ref.current) {
      ref.current.position.lerpVectors(startVec, endVec, t);
      // Fade out near the destination
      const scale = t < 0.1 ? t * 10 : t > 0.9 ? (1 - t) * 10 : 1;
      ref.current.scale.setScalar(scale * 0.14);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

// ─── Digital Grid Base ────────────────────────────────────────────────────────
function GridBase() {
  const ref = useRef<THREE.GridHelper>(null!);
  useFrame((state) => {
    if (ref.current) {
      // Gentle rocking motion for the grid floor
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <gridHelper
      ref={ref}
      args={[20, 20, "#10b981", "#1e293b"]}
      position={[0, -2.5, 0]}
      rotation={[0.1, 0, 0]}
    />
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────
function Scene() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const { mouse } = state;
    // Elegant mouse follow rotation
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (mouse.x * Math.PI) / 8,
      0.04
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (-mouse.y * Math.PI) / 10,
      0.04
    );
  });

  // Nodes position layout
  const centerNode: [number, number, number] = [0, 0.2, 0];
  const nodeLeft: [number, number, number] = [-3.2, 1.2, -0.5];
  const nodeRight: [number, number, number] = [3.2, -0.6, 0.5];
  const nodeTopRight: [number, number, number] = [2.4, 1.8, -1.0];
  const nodeBottomLeft: [number, number, number] = [-2.0, -1.5, 0.8];

  return (
    <group ref={groupRef}>
      {/* Central Command glass panels (representing mobile phone / dashboard layered) */}
      <GlassCard position={centerNode} scale={[2.6, 1.8, 1]} color="#10b981" />
      <GlassCard position={[0.4, 0.5, 0.3]} scale={[1.2, 0.9, 1]} color="#34d399" />
      <GlassCard position={[-0.5, -0.3, 0.5]} scale={[1.0, 0.7, 1]} color="#059669" />

      {/* Connection Networks (Visualizing commerce links) */}
      <ConnectionLine start={nodeLeft} end={centerNode} color="#10b981" delay={0.2} />
      <ConnectionLine start={nodeRight} end={centerNode} color="#10b981" delay={0.4} />
      <ConnectionLine start={nodeTopRight} end={centerNode} color="#34d399" delay={0.6} />
      <ConnectionLine start={nodeBottomLeft} end={centerNode} color="#059669" delay={0.8} />

      {/* Orbiting / Surrounding product & storefront nodes */}
      <ProductNode position={nodeLeft} color="#10b981" delay={0} />
      <ProductNode position={nodeRight} color="#10b981" delay={1.5} />
      <ProductNode position={nodeTopRight} color="#34d399" delay={3} />
      <ProductNode position={nodeBottomLeft} color="#059669" delay={4.5} />

      {/* Live Transaction / Order Flows (animated light pulses) */}
      <FlowingOrder start={nodeLeft} end={centerNode} speed={1.2} delay={0.0} color="#10b981" />
      <FlowingOrder start={nodeRight} end={centerNode} speed={0.9} delay={0.4} color="#34d399" />
      <FlowingOrder start={nodeTopRight} end={centerNode} speed={1.4} delay={0.2} color="#10b981" />
      <FlowingOrder start={nodeBottomLeft} end={centerNode} speed={1.1} delay={0.6} color="#059669" />

      {/* Cyber Base Grid */}
      <GridBase />

      {/* Ambient background dust */}
      <Sparkles
        count={40}
        scale={8}
        size={1.5}
        speed={0.3}
        color="#10b981"
        opacity={0.5}
      />
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
    <div className="w-full h-full min-h-[450px] relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={isMobile ? 1 : [1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <spotLight position={[8, 12, 10]} angle={0.25} penumbra={1} intensity={2} color="#ffffff" />
        <pointLight position={[-8, -8, -8]} intensity={1.5} color="#10b981" />
        <pointLight position={[5, -5, 5]} intensity={1} color="#059669" />
        <Suspense fallback={null}>
          <Scene />
          {!isMobile && <Environment preset="night" />}
        </Suspense>
      </Canvas>
    </div>
  );
}