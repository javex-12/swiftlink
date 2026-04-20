"use client";

import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  PerspectiveCamera,
  Environment,
  Sparkles,
  Trail,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";

// ─── Animated Ring ────────────────────────────────────────────────────────────
function AnimatedRing({
  radius,
  speed,
  color,
  thickness,
  tilt,
}: {
  radius: number;
  speed: number;
  color: string;
  thickness: number;
  tilt: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.z += speed * 0.008;
    ref.current.rotation.x = tilt[0] + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, thickness, 32, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.1}
        metalness={0.9}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// ─── Orbiting Sphere ──────────────────────────────────────────────────────────
function OrbitingSphere({
  orbitRadius,
  speed,
  color,
  size,
  startAngle,
  yOffset,
}: {
  orbitRadius: number;
  speed: number;
  color: string;
  size: number;
  startAngle: number;
  yOffset: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + startAngle;
    ref.current.position.x = Math.cos(t) * orbitRadius;
    ref.current.position.z = Math.sin(t) * orbitRadius;
    ref.current.position.y = yOffset + Math.sin(t * 1.3) * 0.3;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        roughness={0}
        metalness={1}
      />
    </mesh>
  );
}

// ─── Core Central Blob ────────────────────────────────────────────────────────
function CentralBlob() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * 0.15;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={ref} position={[0, 0, 0]} scale={1.8}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color="#10b981"
          speed={4}
          distort={0.35}
          radius={1}
          emissive="#10b981"
          emissiveIntensity={0.3}
          roughness={0.05}
          metalness={0.95}
          wireframe={false}
        />
      </mesh>
    </Float>
  );
}

// ─── Wireframe Globe (background depth) ───────────────────────────────────────
function WireframeGlobe() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    ref.current.rotation.x = state.clock.elapsedTime * 0.02;
  });
  return (
    <mesh ref={ref} position={[0, 0, -4]} scale={5}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color="#10b981"
        wireframe
        transparent
        opacity={0.05}
        emissive="#10b981"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// ─── Floating Dark Cube ───────────────────────────────────────────────────────
function FloatingCube({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={2.5} floatIntensity={1.5}>
      <mesh position={position}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <MeshWobbleMaterial
          color="#0f172a"
          speed={2}
          factor={0.4}
          roughness={0}
          metalness={1}
          emissive="#1e293b"
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
}

// ─── Floating Emerald Sphere ──────────────────────────────────────────────────
function FloatingSmallSphere({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={2}>
      <mesh position={position}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
}

// ─── Mouse-Reactive Scene Root ────────────────────────────────────────────────
function Scene() {
  const groupRef = useRef<THREE.Group>(null!);
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useFrame((state) => {
    if (reduceMotion) return;
    const { mouse } = state;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (mouse.x * Math.PI) / 8,
      0.04
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (mouse.y * Math.PI) / 12,
      0.04
    );
  });

  return (
    <group ref={groupRef}>
      {/* Background wireframe globe for depth */}
      <WireframeGlobe />

      {/* Central hero element */}
      <CentralBlob />

      {/* Orbiting rings */}
      <AnimatedRing
        radius={2.8}
        speed={1}
        color="#10b981"
        thickness={0.04}
        tilt={[Math.PI / 4, 0, 0]}
      />
      <AnimatedRing
        radius={3.5}
        speed={-0.7}
        color="#0f172a"
        thickness={0.025}
        tilt={[Math.PI / 6, Math.PI / 5, 0]}
      />
      <AnimatedRing
        radius={4.2}
        speed={0.5}
        color="#34d399"
        thickness={0.015}
        tilt={[Math.PI / 3, 0, Math.PI / 6]}
      />

      {/* Orbiting satellites */}
      <OrbitingSphere orbitRadius={2.8} speed={0.5} color="#10b981" size={0.18} startAngle={0} yOffset={0} />
      <OrbitingSphere orbitRadius={2.8} speed={0.5} color="#34d399" size={0.12} startAngle={Math.PI} yOffset={0} />
      <OrbitingSphere orbitRadius={3.5} speed={-0.35} color="#0f172a" size={0.22} startAngle={Math.PI / 3} yOffset={0.5} />
      <OrbitingSphere orbitRadius={3.5} speed={-0.35} color="#475569" size={0.14} startAngle={Math.PI + Math.PI / 3} yOffset={-0.5} />

      {/* Floating decorative elements */}
      <FloatingCube position={[3.2, 1.8, 0.5]} />
      <FloatingCube position={[-3.5, -1.2, -0.8]} />
      <FloatingSmallSphere position={[-2.5, 2.2, 0.5]} color="#10b981" />
      <FloatingSmallSphere position={[2.8, -2.0, 1.0]} color="#34d399" />
      <FloatingSmallSphere position={[-1.5, -2.8, -0.5]} color="#6ee7b7" />

      {/* Particle sparkles */}
      <Sparkles
        count={40}
        scale={12}
        size={1.5}
        speed={0.3}
        color="#10b981"
        opacity={0.6}
      />
    </group>
  );
}

export default function ThreeScene() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduceMotion(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 767px)");
    if (!mq) return;
    const onChange = () => setIsMobile(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <Canvas
        dpr={isMobile ? 1 : [1, 1.5]}
        frameloop={reduceMotion || isMobile ? "demand" : "always"}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={45} />

        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <spotLight
          position={[10, 12, 10]}
          angle={0.2}
          penumbra={1}
          intensity={2}
          color="#ffffff"
        />
        <pointLight position={[-8, -6, -8]} intensity={1.5} color="#10b981" />
        <pointLight position={[8, 6, 4]} intensity={0.8} color="#6ee7b7" />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#34d399" />

        <Suspense fallback={null}>
          <Scene />
          {!isMobile && <Environment preset="city" />}
        </Suspense>
      </Canvas>
    </div>
  );
}
