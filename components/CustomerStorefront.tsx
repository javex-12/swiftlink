"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ChevronLeft, 
  MessageCircle, 
  Zap, 
  Loader2, 
  Star, 
  Heart, 
  Home, 
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import type { ShopState, Product } from "@/lib/types";
import * as THREE from "three";
import dynamic from "next/dynamic";

const ThreeDBackground = dynamic(
  () => import("./ThreeDBackground").then((m) => m.ThreeDBackground),
  { ssr: false }
);

const SocialHub = dynamic(
  () => import("./SocialHub").then((m) => m.SocialHub),
  { ssr: false }
);


// ==========================================
// TEMPLATE ENGINE COMPONENTS
// ==========================================

const Hero4Wireframe = ({ accent }: { accent: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current) return;
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        const geometry = new THREE.IcosahedronGeometry(2, 4);
        const positionAttribute = geometry.getAttribute('position');
        const originalPositions = [];
        for (let i = 0; i < positionAttribute.count; i++) {
            originalPositions.push(
                positionAttribute.getX(i),
                positionAttribute.getY(i),
                positionAttribute.getZ(i)
            );
        }
        geometry.userData = { originalPositions };

        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(accent),
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            emissive: new THREE.Color(accent).multiplyScalar(0.3),
            shininess: 100
        });

        let crystalMesh = new THREE.Mesh(geometry, material);
        scene.add(crystalMesh);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        let animationFrameId: number;
        let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX - window.innerWidth / 2) / 100;
            mouseY = (e.clientY - window.innerHeight / 2) / 100;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            crystalMesh.rotation.y += 0.002;
            crystalMesh.rotation.x += 0.001;

            const positions = crystalMesh.geometry.attributes.position;
            const original = crystalMesh.geometry.userData.originalPositions;

            for (let i = 0; i < positions.count; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;
                const wave = Math.sin(time + (original[ix] + original[iy] + original[iz])) * 0.15;
                positions.setXYZ(
                    i,
                    original[ix] + wave * (original[ix] / 2),
                    original[iy] + wave * (original[iy] / 2),
                    original[iz] + wave * (original[iz] / 2)
                );
            }
            positions.needsUpdate = true;

            crystalMesh.position.x = targetX * 0.5;
            crystalMesh.position.y = -targetY * 0.5;

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, [accent]);
    return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />;
};

const Hero5Particles = ({ accent }: { accent: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current) return;
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);

        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount*3; i++) {
            positions[i] = (Math.random() - 0.5) * 15;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(accent),
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            particles.rotation.y += 0.001;
            particles.rotation.x += 0.0005;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, [accent]);
    return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />;
};

const HeroTemplate = ({ state, templateId, onShopClick }: { state: ShopState, templateId: string, onShopClick?: () => void }) => {
    const title = state.heroTitle || state.bizName || "Premium Collection";
    const subtitle = state.heroSubtitle || "Discover our curated collection";
    const btnText = state.heroButtonText || "Shop Now";
    const bg = state.heroImage || state.bizImage;
    const accent = state.accentColor || "#10b981";

    // Hero-1: Cinematic dark with animated orbs & glassmorphism
    if (!templateId || templateId === "hero-1") {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5" style={{ minHeight: 450, background: "#050505" }}>
                {/* Animated background orbs */}
                {/* Animated 3D background */}
                <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
                    <ThreeDBackground type={4} accentColor={accent} />
                    {bg && <img src={bg} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.15, mixBlendMode:"luminosity" }} />}
                </div>
                {/* Subtle grid lines */}
                <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />
                {/* Content */}
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"3.5rem 3rem", minHeight:450 }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:9999, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", backdropFilter:"blur(12px)", fontSize:10, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.6)", width:"fit-content", marginBottom:24 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:accent, display:"inline-block" }} />
                        {state.bizName || "New Collection"}
                    </div>
                    <h1 style={{ fontSize:"clamp(2.5rem,7vw,4.5rem)", fontWeight:950, lineHeight:1.02, letterSpacing:"-0.03em", color:"#ffffff", margin:"0 0 1rem 0", fontStyle:"italic", textTransform:"uppercase" }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.45)", fontWeight:400, maxWidth:480, lineHeight:1.7, margin:"0 0 2rem 0" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"14px 32px", background:"#ffffff", color:"#000000", fontWeight:900, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", borderRadius:9999, border:"none", cursor:"pointer", width:"fit-content", transition:"all 0.3s" }} className="hover:scale-105 active:scale-95">
                        {btnText}
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </div>
                <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.1);opacity:1} }`}</style>
            </div>
        );
    }

    // Hero-2: Full-bleed image with editorial dark overlay
    if (templateId === "hero-2") {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-xl" style={{ minHeight: 500 }}>
                <div style={{ position:"absolute", inset:0, background: bg ? `url(${bg}) center/cover no-repeat` : `linear-gradient(135deg, #0a0a0a 0%, #111827 100%)` }} />
                <ThreeDBackground type={3} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)" }} />
                {/* Accent color bar */}
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:accent }} />
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"4rem 3rem", minHeight:500 }}>
                    <p style={{ fontSize:10, fontWeight:900, letterSpacing:"0.35em", textTransform:"uppercase", color:accent, marginBottom:16 }}>
                        {state.bizName || "Premium Brand"}
                    </p>
                    <h1 style={{ fontSize:"clamp(2.5rem,8vw,5.5rem)", fontWeight:900, lineHeight:1, letterSpacing:"-0.03em", color:"#ffffff", margin:"0 0 1.5rem 0", maxWidth:700 }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.5)", fontWeight:400, maxWidth:420, lineHeight:1.7, marginBottom:"2.5rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"16px 36px", background:accent, color:"#ffffff", fontWeight:900, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", borderRadius:8, border:"none", cursor:"pointer", width:"fit-content" }} className="hover:scale-105 active:scale-95 transition-transform">
                        {btnText}
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    // Hero-3: Light editorial magazine style
    if (templateId === "hero-3") {
        return (
            <div className="relative w-full overflow-hidden mb-10 bg-white border border-black/[0.04] shadow-sm" style={{ minHeight: 420 }}>
                <div style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:420 }}>
                    {/* Top bar */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.5rem 2.5rem", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
                        <span style={{ fontSize:9, fontWeight:900, letterSpacing:"0.3em", textTransform:"uppercase", color:"#999" }}>{state.bizName}</span>
                        <span style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", color:"#999" }}>New Season</span>
                    </div>
                    {/* Main content */}
                    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"3.5rem 2.5rem" }}>
                        <h1 style={{ fontSize:"clamp(2.5rem,7vw,4.5rem)", fontWeight:950, lineHeight:1.0, letterSpacing:"-0.04em", color:"#0a0a0a", margin:"0 0 1.5rem 0", textTransform:"uppercase" }}>
                            {title}
                        </h1>
                        <div style={{ display:"flex", alignItems:"center", gap:"2rem", flexWrap:"wrap" }}>
                            <p style={{ fontSize:"0.95rem", color:"#666", fontWeight:400, maxWidth:360, lineHeight:1.7, margin:0 }}>
                                {subtitle}
                            </p>
                            <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 28px", background:"#0a0a0a", color:"#ffffff", fontWeight:900, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", borderRadius:9999, border:"none", cursor:"pointer", whiteSpace:"nowrap" }} className="hover:scale-105 active:scale-95 transition-transform">
                                {btnText} →
                            </button>
                        </div>
                    </div>
                    {/* Bottom accent */}
                    <div style={{ height:4, background:`linear-gradient(90deg, ${accent}, ${accent}44, transparent)` }} />
                </div>
                {bg && <div style={{ position:"absolute", right:0, top:0, bottom:0, width:"35%", backgroundImage:`url(${bg})`, backgroundSize:"cover", backgroundPosition:"center", clipPath:"polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }} />}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, mixBlendMode:"difference" }}>
                     <ThreeDBackground type={6} accentColor={accent} />
                </div>
            </div>
        );
    }

    // Hero-4: Glowing Torus Knot (3D Canvas - No Image Required)
    if (templateId === "hero-4") {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5" style={{ minHeight: 550, background: "#020205" }}>
                <ThreeDBackground type={1} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "linear-gradient(to right, rgba(2,2,5,0.9) 30%, rgba(2,2,5,0.4) 60%, transparent 100%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"center", padding:"4rem 3.5rem", minHeight:550, maxWidth: 650 }}>
                    <h1 style={{ fontSize:"clamp(2.5rem,7vw,4.5rem)", fontWeight:950, lineHeight:1.05, letterSpacing:"-0.03em", color:"#ffffff", margin:"0 0 1.5rem 0", textTransform:"uppercase" }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.05rem", color:"rgba(255,255,255,0.55)", fontWeight:400, maxWidth:460, lineHeight:1.7, marginBottom:"2.5rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"16px 36px", background:accent, color:"#ffffff", fontWeight:900, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", borderRadius:12, border:"none", cursor:"pointer", width:"fit-content", boxShadow:`0 15px 30px -10px ${accent}66` }} className="hover:scale-105 active:scale-95 group transition-all">
                        {btnText}
                        <svg className="transition-transform group-hover:translate-x-1" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    // Hero-5: Cyber Grid Floor (3D Canvas - No Image Required)
    if (templateId === "hero-5") {
        return (
            <div className="relative w-full overflow-hidden mb-10 border border-white/5 shadow-2xl" style={{ minHeight: 550, background: "#050b0a" }}>
                <ThreeDBackground type={2} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "linear-gradient(to top, #050b0a 10%, rgba(5,11,10,0.5) 100%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"4rem 2rem", minHeight:550 }}>
                    <h1 style={{ fontSize:"clamp(2.5rem,8vw,5.5rem)", fontWeight:950, lineHeight:1.0, letterSpacing:"-0.04em", color:"transparent", backgroundImage:`linear-gradient(135deg, #ffffff, ${accent})`, WebkitBackgroundClip:"text", margin:"0 0 1.5rem 0", textTransform:"uppercase" }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.125rem", color:"rgba(255,255,255,0.6)", fontWeight:400, maxWidth:580, lineHeight:1.7, marginBottom:"3rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"18px 44px", background:"#ffffff", color:"#000000", fontWeight:900, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", borderRadius:9999, border:"none", cursor:"pointer", boxShadow:"0 20px 40px -15px rgba(255,255,255,0.3)" }} className="hover:scale-105 active:scale-95 group transition-all">
                        {btnText}
                        <Zap size={14} fill="currentColor" />
                    </button>
                </div>
            </div>
        );
    }

    // Hero-6: Cosmic Particles Universe (3D Canvas - No Image Required)
    if (templateId === "hero-6") {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl" style={{ minHeight: 580, background: "#000000" }}>
                <ThreeDBackground type={5} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 90%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"4rem 2rem", minHeight:580 }}>
                    <h1 style={{ fontSize:"clamp(3rem,9vw,6rem)", fontWeight:900, lineHeight:1.0, letterSpacing:"-0.05em", color:"#ffffff", margin:"0 0 1.5rem 0", textTransform:"uppercase", textShadow:`0 0 50px ${accent}44` }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.25rem", color:"rgba(255,255,255,0.7)", fontWeight:300, maxWidth:600, lineHeight:1.6, marginBottom:"3rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"18px 48px", background:accent, color:"#ffffff", fontWeight:900, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", borderRadius:16, border:"none", cursor:"pointer", boxShadow:`0 25px 50px -10px ${accent}88` }} className="hover:scale-105 active:scale-95 group transition-all">
                        {btnText}
                        <svg className="transition-transform group-hover:translate-x-2" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    // Hero-7: DNA Matrix Helix (3D Canvas - No Image Required)
    if (templateId === "hero-7") {
        return (
            <div className="relative w-full overflow-hidden mb-10 border border-white/5 shadow-2xl" style={{ minHeight: 550, background: "#03020c" }}>
                <ThreeDBackground type={8} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "linear-gradient(to right, #03020c 45%, rgba(3,2,12,0.6) 80%, transparent 100%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"center", padding:"4rem 3.5rem", minHeight:550, maxWidth: 650 }}>
                    <h1 style={{ fontSize:"clamp(2.5rem,7vw,4.5rem)", fontWeight:950, lineHeight:1.05, letterSpacing:"-0.03em", color:"#ffffff", margin:"0 0 1.5rem 0", textTransform:"uppercase" }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.05rem", color:"rgba(255,255,255,0.5)", fontWeight:400, maxWidth:460, lineHeight:1.7, marginBottom:"2.5rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"16px 36px", background:"#ffffff", color:"#03020c", fontWeight:900, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", borderRadius:9999, border:"none", cursor:"pointer", width:"fit-content", boxShadow:"0 15px 30px -10px rgba(255,255,255,0.2)" }} className="hover:scale-105 active:scale-95 group transition-all">
                        {btnText}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Hero-8: Futuristic Starfield Warp (3D Canvas - No Image Required)
    if (templateId === "hero-8") {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5" style={{ minHeight: 550, background: "#000000" }}>
                <ThreeDBackground type={9} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "linear-gradient(135deg, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.5) 100%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"center", padding:"4rem 3.5rem", minHeight:550, maxWidth: 700 }}>
                    <h1 style={{ fontSize:"clamp(2.5rem,8vw,5.5rem)", fontWeight:950, lineHeight:0.95, letterSpacing:"-0.04em", color:"#ffffff", margin:"0 0 1.5rem 0", textTransform:"uppercase", fontStyle:"oblique" }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.125rem", color:"rgba(255,255,255,0.55)", fontWeight:400, maxWidth:500, lineHeight:1.7, marginBottom:"2.5rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"16px 38px", background:accent, color:"#ffffff", fontWeight:900, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", borderRadius:9999, border:"none", cursor:"pointer", width:"fit-content", boxShadow:`0 15px 30px -10px ${accent}88` }} className="hover:scale-105 active:scale-95 transition-transform">
                        {btnText}
                        <Zap size={14} fill="currentColor" />
                    </button>
                </div>
            </div>
        );
    }

    // Hero-9: Oceanic Wave Mesh (3D Canvas - No Image Required)
    if (templateId === "hero-9") {
        return (
            <div className="relative w-full overflow-hidden mb-10 border border-white/5 shadow-2xl" style={{ minHeight: 550, background: "#050811" }}>
                <ThreeDBackground type={7} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "linear-gradient(to top, #050811 15%, rgba(5,8,17,0.4) 100%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"4rem 2rem", minHeight:550 }}>
                    <h1 style={{ fontSize:"clamp(2.5rem,7vw,4.5rem)", fontWeight:950, lineHeight:1.05, letterSpacing:"-0.03em", color:"#ffffff", margin:"0 0 1.5rem 0", textTransform:"uppercase" }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.05rem", color:"rgba(255,255,255,0.6)", fontWeight:400, maxWidth:500, lineHeight:1.7, marginBottom:"3rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"16px 36px", background:"#ffffff", color:"#050811", fontWeight:900, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", borderRadius:12, border:"none", cursor:"pointer", boxShadow:"0 15px 30px -10px rgba(255,255,255,0.15)" }} className="hover:scale-105 active:scale-95 group transition-all">
                        {btnText}
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        );
    }

    // Hero-10: Neon Rings Tunnel (3D Canvas - No Image Required)
    if (templateId === "hero-10") {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5" style={{ minHeight: 560, background: "#0a000f" }}>
                <ThreeDBackground type={10} accentColor={accent} />
                <div style={{ position:"absolute", inset:0, background: "radial-gradient(circle, transparent 20%, #0a000f 90%)", zIndex: 5 }} />
                
                <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"4rem 2rem", minHeight:560 }}>
                    <h1 style={{ fontSize:"clamp(2.8rem,8.5vw,5.5rem)", fontWeight:950, lineHeight:1.0, letterSpacing:"-0.04em", color:"#ffffff", margin:"0 0 1.5rem 0", textTransform:"uppercase", textShadow:`0 0 40px ${accent}aa` }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"1.125rem", color:"rgba(255,255,255,0.65)", fontWeight:400, maxWidth:580, lineHeight:1.7, marginBottom:"3rem" }}>
                        {subtitle}
                    </p>
                    <button onClick={onShopClick} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"18px 48px", background:accent, color:"#ffffff", fontWeight:900, fontSize:11, letterSpacing:"0.25em", textTransform:"uppercase", borderRadius:9999, border:"none", cursor:"pointer", boxShadow:`0 20px 40px -10px ${accent}cc` }} className="hover:scale-105 active:scale-95 group transition-all">
                        {btnText}
                        <Zap size={14} fill="currentColor" />
                    </button>
                </div>
            </div>
        );
    }

    return <HeroTemplate state={state} templateId="hero-1" />;
};



const CatalogTemplate = ({ state, templateId, products, onProductClick }: { state: ShopState, templateId: string, products: Product[], onProductClick: (p: Product) => void }) => {
    const accent = state.accentColor || "#10b981";

    // Template 2: Magazine List
    if (templateId === "catalog-2") {
        return (
            <div className="space-y-6">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="w-full flex items-center gap-6 p-4 rounded-[2rem] bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all group text-left border border-black/[0.02] dark:border-white/5">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] overflow-hidden bg-gray-50 dark:bg-zinc-800 shrink-0 relative">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[9px] font-black uppercase text-gray-900 dark:text-white bg-white dark:bg-zinc-800 px-2 py-1 rounded-md shadow-sm">Sold Out</span></div>}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {p.badge === "hot" && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded">Hot</span>}
                                {p.badge === "new" && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">New</span>}
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-tight">{p.name}</h3>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                            <p className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-3">{state.currency}{Number(p.price).toLocaleString()}</p>
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    // Template 3: Glassmorphic Cards
    if (templateId === "catalog-3") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group rounded-[2rem] p-4 bg-white/10 dark:bg-white/[0.03] backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl hover:bg-white/20 dark:hover:bg-white/5 transition-all">
                        <div className="w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-white/5 shadow-inner mb-4 relative">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[10px] font-black uppercase text-gray-900 dark:text-white bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl">Sold Out</span></div>}
                        </div>
                        <h3 className="font-black text-sm md:text-base text-gray-900 dark:text-white truncate px-1">{p.name}</h3>
                        <p className="font-bold text-[10px] md:text-xs text-gray-400 mt-1 px-1 line-clamp-1">{p.description}</p>
                        <p className="font-black text-sm md:text-lg text-emerald-600 dark:text-emerald-400 mt-2 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        );
    }

    // Template 4: Cyber Dark Cards
    if (templateId === "catalog-4") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group p-3 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all">
                        <div className="w-full aspect-[4/5] rounded-xl overflow-hidden mb-3 relative bg-zinc-900 border border-zinc-800">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><span className="text-[8px] font-black uppercase text-white bg-red-600/90 px-3 py-1.5 rounded tracking-widest border border-red-500">Out of Stock</span></div>}
                        </div>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-1">Node // Code 0{p.id % 9}</span>
                        <h3 className="font-black text-xs md:text-sm text-white truncate px-1 mt-1">{p.name}</h3>
                        <p className="font-bold text-[10px] text-zinc-500 mt-0.5 px-1 truncate">{p.description}</p>
                        <p className="font-black text-xs md:text-base text-emerald-400 mt-2 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        );
    }

    // Template 5: Compact Swipe Carousel
    if (templateId === "catalog-5") {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth snap-x snap-mandatory">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="w-[180px] md:w-[240px] shrink-0 text-left group snap-start">
                        <div className="w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 shadow-sm mb-3 relative border border-black/[0.02] dark:border-white/5 group-hover:shadow-md transition-all">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[9px] font-black uppercase text-gray-900 dark:text-white bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg">Sold Out</span></div>}
                        </div>
                        <h3 className="font-black text-xs md:text-sm text-gray-900 dark:text-white truncate px-1">{p.name}</h3>
                        <p className="font-black text-xs md:text-sm text-emerald-600 dark:text-emerald-400 mt-1 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        );
    }

    // Template 6: Detailed Table Spec Sheet
    if (templateId === "catalog-6") {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/5 shadow-sm">
                <div className="divide-y divide-black/[0.04] dark:divide-white/5">
                    {products.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-800">
                                    <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-xs md:text-sm text-gray-900 dark:text-white uppercase truncate">{p.name}</h4>
                                    <p className="text-[10px] text-gray-400 truncate max-w-[200px] md:max-w-xs">{p.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-xs md:text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{state.currency}{Number(p.price).toLocaleString()}</span>
                                <button onClick={() => onProductClick(p)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:text-white dark:hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shrink-0">
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Template 7: Polaroid Retro
    if (templateId === "catalog-7") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 bg-[#faf8f5] dark:bg-zinc-950 p-6 rounded-[2rem] border border-stone-200 dark:border-zinc-800">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col bg-white dark:bg-zinc-900 p-4 shadow-md border border-stone-100 dark:border-zinc-800 hover:rotate-1 hover:scale-102 transition-all">
                        <div className="w-full aspect-square overflow-hidden bg-stone-100 mb-4 relative">
                            <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/75 dark:bg-black/75 flex items-center justify-center"><span className="text-[10px] font-black text-red-600 border-2 border-red-600 px-2 py-1 rotate-12 uppercase">Sold Out</span></div>}
                        </div>
                        <h3 className="font-black text-xs md:text-sm text-stone-850 dark:text-white italic tracking-tight">{p.name}</h3>
                        <p className="font-serif text-[10px] text-stone-400 mt-1 italic leading-tight truncate">{p.description}</p>
                        <p className="font-black text-xs md:text-base text-stone-800 dark:text-stone-300 mt-3 text-right">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        );
    }

    // Template 8: Asymmetric Masonry
    if (templateId === "catalog-8") {
        return (
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {products.map((p, idx) => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="break-inside-avoid w-full flex flex-col text-left group bg-white dark:bg-zinc-905 rounded-[2rem] p-4 border border-black/[0.02] dark:border-white/5 hover:shadow-xl transition-all">
                        <div className={`w-full rounded-[1.5rem] overflow-hidden mb-4 relative ${idx % 3 === 0 ? "aspect-[4/5]" : idx % 3 === 1 ? "aspect-square" : "aspect-[3/4]"}`}>
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[9px] font-black uppercase text-gray-905 dark:text-white bg-white dark:bg-zinc-800 px-3 py-1 rounded">Sold Out</span></div>}
                        </div>
                        <h3 className="font-black text-sm text-gray-900 dark:text-white truncate px-1">{p.name}</h3>
                        <p className="font-black text-sm text-emerald-600 dark:text-emerald-400 mt-1 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        );
    }

    // Template 9: Hover Reveal Cards
    if (templateId === "catalog-9") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group relative overflow-hidden rounded-[2rem] aspect-[4/5] bg-slate-100 dark:bg-zinc-800">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        
                        <div className="absolute inset-0 flex flex-col justify-end p-5 z-10 transition-transform duration-500 translate-y-3 group-hover:translate-y-0">
                            <h3 className="font-black text-base text-white truncate">{p.name}</h3>
                            <p className="font-medium text-[10px] text-white/60 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-0.5">{p.description}</p>
                            <p className="font-black text-base text-emerald-400 mt-2">{state.currency}{Number(p.price).toLocaleString()}</p>
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    // Template 10: Brutalist Poster
    if (templateId === "catalog-10") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group bg-yellow-100/10 dark:bg-zinc-900 border-[3px] border-black dark:border-white p-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-[0_0_0_0_#000] dark:hover:shadow-[0_0_0_0_#fff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                        <div className="w-full aspect-[4/5] border-2 border-black dark:border-white overflow-hidden mb-3 relative">
                            <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/90 dark:bg-black/90 flex items-center justify-center border-b-2 border-black dark:border-white"><span className="text-[11px] font-black uppercase text-black dark:text-white border-2 border-black dark:border-white px-3 py-1">SOLD OUT</span></div>}
                        </div>
                        <h3 className="font-black text-xs md:text-sm text-gray-900 dark:text-white uppercase tracking-tight">{p.name}</h3>
                        <p className="font-black text-xs md:text-lg text-emerald-600 dark:text-emerald-400 mt-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        );
    }

    // Template 1 (Default): Modern Grid
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {products.map(p => (
                <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group">
                    <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-905 shadow-sm mb-4 relative border border-black/[0.02] dark:border-white/5 group-hover:shadow-xl transition-all">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {p.badge === "hot" && <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">Hot</span>}
                            {p.badge === "new" && <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">New</span>}
                            {p.badge === "sale" && <span className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">Sale</span>}
                        </div>

                        {p.outOfStock && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
                            </div>
                        )}
                    </div>
                    <h3 className="font-black text-sm md:text-lg text-gray-905 dark:text-white truncate px-1">{p.name}</h3>
                    <p className="font-bold text-xs md:text-sm text-gray-400 mt-1 px-1 line-clamp-1">{p.description}</p>
                    <p className="font-black text-sm md:text-xl text-emerald-600 dark:text-emerald-400 mt-2 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                </button>
            ))}
        </div>
    );
};

const AboutTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    const aboutText = state.aboutUs || "Welcome to our store! We are dedicated to providing the highest quality products and exceptional customer service. Explore our collection and discover curated items tailored just for you.";
    const accent = state.accentColor || "#10b981";

    // Template 2: Centered Elegant Quote
    if (templateId === "about-2") {
        return (
            <div className="py-20 text-center max-w-3xl mx-auto border-y border-black/[0.05] dark:border-white/5 my-20">
                <Zap size={32} className="text-emerald-500 mx-auto mb-6 opacity-20" />
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8">The Brand</h2>
                <p className="text-lg md:text-2xl text-gray-600 dark:text-zinc-300 font-medium leading-relaxed italic">&quot;{aboutText}&quot;</p>
            </div>
        );
    }

    // Template 3: Split Color Pane
    if (templateId === "about-3") {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 rounded-[2.5rem] overflow-hidden my-20 shadow-lg border border-black/[0.02] dark:border-white/5 bg-white dark:bg-zinc-900">
                <div className="p-8 md:p-16 flex flex-col justify-center" style={{ backgroundColor: `${accent}10` }}>
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.25em] mb-4">Established</span>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white italic uppercase tracking-tighter leading-none mb-4">Our Roots</h2>
                    <div className="w-12 h-1 rounded-full" style={{ backgroundColor: accent }} />
                </div>
                <div className="p-8 md:p-16 flex items-center bg-white dark:bg-zinc-900">
                    <p className="text-sm md:text-base text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">{aboutText}</p>
                </div>
            </div>
        );
    }

    // Template 4: Core Pillars Grid
    if (templateId === "about-4") {
        return (
            <div className="my-20 space-y-10">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Our Philosophy</h2>
                    <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-2">Built on three core pillars</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Authenticity", desc: "Every product is selected with a direct connection to genuine, verifiable origins." },
                        { title: "Craftsmanship", desc: "We focus on premium finishes, high durability materials, and strict tolerances." },
                        { title: "Active Support", desc: "Real humans responding on WhatsApp, guiding you from dispatch to delivery." }
                    ].map((pillar, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-black/[0.02] dark:border-white/5 shadow-sm">
                            <span className="text-2xl font-black text-emerald-500">0{i+1}</span>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-4 uppercase">{pillar.title}</h3>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">{pillar.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-black/[0.02] dark:border-white/5 text-center shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-medium max-w-3xl mx-auto">{aboutText}</p>
                </div>
            </div>
        );
    }

    // Template 5: Cyber Grid Block
    if (templateId === "about-5") {
        return (
            <div className="my-20 bg-black/40 border border-zinc-800 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-zinc-650 dark:text-zinc-600 uppercase">// node_identity // active</div>
                <h2 className="font-mono text-emerald-500 text-xs uppercase tracking-widest mb-6">&gt; ABOUT_US_PROTOCOL</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <p className="font-mono text-zinc-350 text-xs md:text-sm leading-relaxed">&gt; {aboutText}</p>
                    </div>
                    <div className="border-l border-zinc-800 pl-6 flex flex-col justify-between py-2">
                        <div className="font-mono text-[10px] text-zinc-500 uppercase">
                            Status: <span className="text-emerald-500">Optimal</span><br/>
                            Nodes: <span className="text-white">Active</span><br/>
                            Currency: <span className="text-white">{state.currency}</span>
                        </div>
                        <div className="font-mono text-[8px] text-zinc-600 uppercase mt-4">SYS.LOC: Global Terminal</div>
                    </div>
                </div>
            </div>
        );
    }

    // Template 6: Frosted Glass Float
    if (templateId === "about-6") {
        return (
            <div className="my-20 bg-white/10 dark:bg-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[3rem] p-8 md:p-16 shadow-2xl relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[60px]" style={{ backgroundColor: `${accent}33` }} />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[60px]" style={{ backgroundColor: `${accent}22` }} />
                <div className="relative z-10 max-w-3xl">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-4 block">The Vision</span>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-6">Designed For Excellence</h2>
                    <p className="text-sm md:text-base text-gray-700 dark:text-zinc-300 font-medium leading-relaxed">{aboutText}</p>
                </div>
            </div>
        );
    }

    // Template 7: Milestone Timeline
    if (templateId === "about-7") {
        return (
            <div className="my-20 space-y-12">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Our Timeline</h2>
                    <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-2">A legacy of constant evolution</p>
                </div>
                <div className="relative border-l-2 border-slate-100 dark:border-zinc-800 ml-4 md:ml-32 space-y-12">
                    {[
                        { year: "2021", title: "The Foundation", desc: "Started as a small direct-to-consumer store with simple chat integration." },
                        { year: "2024", title: "Automated Dispatch", desc: "Scaled backend capabilities, introducing automated logistics maps." },
                        { year: "2026", title: "SwiftLink Pro", desc: "Migrated to next-gen visual editing systems and responsive storefront grids." }
                    ].map((step, i) => (
                        <div key={i} className="relative pl-8 md:pl-12">
                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-black" style={{ backgroundColor: accent }} />
                            <div className="absolute left-[-90px] top-0.5 text-right font-black text-sm text-slate-300 dark:text-zinc-700 uppercase w-16 hidden md:block">{step.year}</div>
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/[0.02] dark:border-white/5 shadow-sm max-w-xl">
                                <span className="font-black text-xs text-emerald-500 uppercase tracking-widest md:hidden">{step.year} - </span>
                                <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase">{step.title}</h3>
                                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-3xl p-6 md:p-10 border border-slate-100 dark:border-zinc-800 text-center max-w-2xl mx-auto">
                    <p className="text-xs md:text-sm text-gray-505 dark:text-zinc-400 leading-relaxed font-semibold">{aboutText}</p>
                </div>
            </div>
        );
    }

    // Template 8: Brutalist Poster Block
    if (templateId === "about-8") {
        return (
            <div className="my-20 bg-orange-100/10 dark:bg-zinc-900 border-[3px] border-black dark:border-white p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white bg-yellow-300 dark:bg-emerald-600 px-3 py-1.5 border-2 border-black dark:border-white inline-block mb-6">WHO WE ARE</span>
                <h2 className="text-3xl md:text-6xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-6">THE CREATIVE DIRECTIVE.</h2>
                <p className="text-sm md:text-lg text-black dark:text-zinc-300 font-black leading-relaxed uppercase border-t-2 border-black dark:border-white pt-6">{aboutText}</p>
            </div>
        );
    }

    // Template 9: Minimalist Serif Strip
    if (templateId === "about-9") {
        return (
            <div className="py-20 my-20 border-t border-b border-black/[0.08] dark:border-white/10 max-w-4xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    <div className="md:col-span-1">
                        <h2 className="font-serif text-2xl md:text-3xl font-light text-slate-900 dark:text-white italic leading-tight">A dedication to modern design, directly from us.</h2>
                    </div>
                    <div className="md:col-span-2">
                        <p className="font-serif text-sm md:text-base text-slate-655 dark:text-zinc-450 leading-relaxed font-light">{aboutText}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Template 10: Aura Gradient Card
    if (templateId === "about-10") {
        return (
            <div className="my-20 relative p-1 rounded-[3rem] overflow-hidden">
                {/* Pulsing gradient background aura */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 animate-pulse blur-3xl opacity-50" />
                <div className="relative z-10 bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-[2.8rem] p-8 md:p-16 border border-white/40 dark:border-white/5 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-emerald-500/10">
                        <Sparkles size={28} />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">Our Legacy</h2>
                    <p className="text-sm md:text-lg text-gray-650 dark:text-zinc-300 font-medium leading-relaxed max-w-2xl mx-auto">{aboutText}</p>
                </div>
            </div>
        );
    }

    // Template 1 (Default): Card
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-black/[0.02] border border-black/[0.01] dark:border-white/5 my-20">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white italic uppercase tracking-tighter mb-6">Our Story</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl">{aboutText}</p>
        </div>
    );
};

const FooterTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    const accent = state.accentColor || "#10b981";
    const socials = state.socials as any || {};

    // Template 2: Minimal centered
    if (templateId === "footer-2") {
        return (
            <footer className="py-16 text-center border-t border-black/[0.06] dark:border-white/5 mt-20 space-y-6 w-full bg-white dark:bg-zinc-950 storefront-footer">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white italic uppercase">{state.bizName}</h3>
                {state.tagline && <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{state.tagline}</p>}
                <div className="flex justify-center gap-3">
                    {socials.instagram && <a href={socials.instagram} target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                    {socials.twitter && <a href={socials.twitter} target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>}
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Powered by SwiftLink</p>
            </footer>
        );
    }

    // Template 3: Multi-Column Directory
    if (templateId === "footer-3") {
        return (
            <footer className="mt-20 bg-white dark:bg-zinc-900 p-10 md:p-16 border-t border-black/[0.03] dark:border-white/5 w-full storefront-footer">
                <div className="max-w-screen-xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: accent }}>
                            <Zap size={16} fill="currentColor" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{state.bizName}</h3>
                        {state.tagline && <p className="text-gray-400 text-xs leading-relaxed">{state.tagline}</p>}
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Shop</h4>
                        {["All Products", "New Arrivals", "Best Sellers", "Discounts"].map(l => (
                            <p key={l} className="text-xs text-gray-600 dark:text-zinc-400 font-medium hover:text-emerald-500 cursor-pointer transition-colors">{l}</p>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Support</h4>
                        {["Contact Us", "WhatsApp Chat", "Returns Policy", "FAQ"].map(l => (
                            <p key={l} className="text-xs text-gray-600 dark:text-zinc-400 font-medium hover:text-emerald-500 cursor-pointer transition-colors">{l}</p>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Connect</h4>
                        <div className="flex gap-2 flex-wrap">
                            {socials.instagram && <a href={socials.instagram} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105" style={{ backgroundColor: accent }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                            {socials.facebook && <a href={socials.facebook} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105" style={{ backgroundColor: accent }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>}
                            {socials.twitter && <a href={socials.twitter} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105" style={{ backgroundColor: accent }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>}
                            {socials.website && <a href={socials.website} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105" style={{ backgroundColor: accent }}><Globe size={14} /></a>}
                        </div>
                        {state.contactEmail && <p className="text-[10px] text-gray-400 break-all">{state.contactEmail}</p>}
                        {state.phone && <p className="text-[10px] text-gray-400">{state.phone}</p>}
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-black/[0.04] dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-300">© {new Date().getFullYear()} {state.bizName}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-300">Powered by SwiftLink</p>
                </div>
            </footer>
        );
    }

    // Template 4: Premium Dark Panel
    if (templateId === "footer-4") {
        return (
            <footer className="mt-20 bg-zinc-950 p-10 md:p-16 border-t border-zinc-800 w-full storefront-footer">
                <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row gap-12 justify-between">
                    <div className="space-y-5 max-w-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
                                <Zap size={16} fill="currentColor" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{state.bizName}</h3>
                        </div>
                        {state.tagline && <p className="text-zinc-500 text-sm leading-relaxed">{state.tagline}</p>}
                        <div className="flex gap-3">
                            {socials.instagram && <a href={socials.instagram} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-105"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                            {socials.twitter && <a href={socials.twitter} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-105"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>}
                            {socials.website && <a href={socials.website} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-105"><Globe size={14} /></a>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>Catalogue</h4>
                            {["All Items", "Featured", "New In", "Sale"].map(l => (
                                <p key={l} className="text-xs text-zinc-500 font-medium hover:text-white cursor-pointer transition-colors">{l}</p>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>Contact</h4>
                            {state.contactEmail && <p className="text-xs text-zinc-500 break-all">{state.contactEmail}</p>}
                            {state.phone && <p className="text-xs text-zinc-500">{state.phone}</p>}
                            {state.contactAddress && <p className="text-xs text-zinc-500">{state.contactAddress}</p>}
                        </div>
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">© {new Date().getFullYear()} {state.bizName}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Powered by SwiftLink</p>
                </div>
            </footer>
        );
    }

    // Template 5: Contact Feedback Strip
    if (templateId === "footer-5") {
        return (
            <footer className="mt-20 w-full storefront-footer">
                <div className="p-10 md:p-16 text-center w-full" style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)`, borderTop: `1px solid ${accent}22` }}>
                    <h3 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Stay Connected</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto mb-8">Questions? We're always on standby. Reach out and we'll respond on WhatsApp within minutes.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <input type="email" placeholder="Your email address..." className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm font-medium outline-none" />
                        <button className="px-6 py-3 rounded-xl text-white text-xs font-black uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: accent }}>Subscribe</button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-8 pt-6 pb-6 bg-white dark:bg-zinc-950 border-t border-black/5 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">{state.bizName}</p>
                    <div className="flex gap-3">
                        {socials.instagram && <a href={socials.instagram} target="_blank" className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                        {socials.website && <a href={socials.website} target="_blank" className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><Globe size={13} /></a>}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Powered by SwiftLink</p>
                </div>
            </footer>
        );
    }

    // Template 6: Glassmorphic Floating Bar
    if (templateId === "footer-6") {
        return (
            <footer className="mt-20 mb-8">
                <div className="rounded-[2.5rem] p-6 md:p-10 bg-white/10 dark:bg-white/[0.03] backdrop-blur-xl border border-white/25 dark:border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: accent }}>
                            <Zap size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{state.bizName}</h3>
                            {state.tagline && <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{state.tagline}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {socials.instagram && <a href={socials.instagram} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                        {socials.twitter && <a href={socials.twitter} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>}
                        {socials.website && <a href={socials.website} target="_blank" className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><Globe size={14} /></a>}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">Powered by SwiftLink</p>
                </div>
            </footer>
        );
    }

    // Template 7: Brutalist Block
    if (templateId === "footer-7") {
        return (
            <footer className="mt-20 mb-8 border-t-[4px] border-black dark:border-white pt-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="space-y-3">
                        <h3 className="text-3xl md:text-5xl font-black text-black dark:text-white uppercase leading-none">{state.bizName}</h3>
                        {state.tagline && <p className="text-xs text-black/50 dark:text-white/40 uppercase tracking-widest font-black">{state.tagline}</p>}
                    </div>
                    <div className="flex flex-col gap-4">
                        {state.contactEmail && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center"><MessageCircle size={14} className="text-white dark:text-black" /></div>
                                <p className="text-xs font-black text-black dark:text-white uppercase">{state.contactEmail}</p>
                            </div>
                        )}
                        {state.phone && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center"><Zap size={14} className="text-white dark:text-black" fill="currentColor" /></div>
                                <p className="text-xs font-black text-black dark:text-white uppercase">{state.phone}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-8 border-t-2 border-black/10 dark:border-white/10 pt-4 flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30 dark:text-white/20">© {new Date().getFullYear()}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30 dark:text-white/20">Powered by SwiftLink</p>
                </div>
            </footer>
        );
    }

    // Template 8: Floating Contact Badges
    if (templateId === "footer-8") {
        return (
            <footer className="mt-20 mb-8 space-y-6">
                <div className="flex flex-wrap gap-3 justify-center">
                    {state.contactEmail && (
                        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">
                            <MessageCircle size={14} className="text-emerald-500" />
                            <span className="text-xs font-black text-gray-700 dark:text-zinc-300">{state.contactEmail}</span>
                        </div>
                    )}
                    {state.phone && (
                        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">
                            <Zap size={14} style={{ color: accent }} fill="currentColor" />
                            <span className="text-xs font-black text-gray-700 dark:text-zinc-300">{state.phone}</span>
                        </div>
                    )}
                    {socials.instagram && (
                        <a href={socials.instagram} target="_blank" className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: accent }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            <span className="text-xs font-black text-gray-700 dark:text-zinc-300">Instagram</span>
                        </a>
                    )}
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{state.bizName}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Powered by SwiftLink</p>
                </div>
            </footer>
        );
    }

    // Template 9: Cyber Telemetry
    if (templateId === "footer-9") {
        return (
            <footer className="mt-20 mb-8 bg-zinc-950 rounded-3xl p-8 md:p-12 border border-zinc-800 font-mono">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: accent }}>&gt; ENTITY_ID</p>
                        <p className="text-lg font-black text-white uppercase">{state.bizName}</p>
                        {state.tagline && <p className="text-[10px] text-zinc-600">{state.tagline}</p>}
                    </div>
                    <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: accent }}>&gt; CONTACT_NODES</p>
                        {state.contactEmail && <p className="text-[10px] text-zinc-400">{state.contactEmail}</p>}
                        {state.phone && <p className="text-[10px] text-zinc-400">{state.phone}</p>}
                        {state.contactAddress && <p className="text-[10px] text-zinc-600">{state.contactAddress}</p>}
                    </div>
                    <div className="space-y-3">
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: accent }}>&gt; SOCIAL_LINKS</p>
                        <div className="flex gap-3 flex-wrap">
                            {socials.instagram && <a href={socials.instagram} target="_blank" className="text-[10px] text-zinc-500 hover:text-white transition-colors">instagram</a>}
                            {socials.twitter && <a href={socials.twitter} target="_blank" className="text-[10px] text-zinc-500 hover:text-white transition-colors">twitter</a>}
                            {socials.website && <a href={socials.website} target="_blank" className="text-[10px] text-zinc-500 hover:text-white transition-colors">website</a>}
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-700">SYS.YEAR: {new Date().getFullYear()}</p>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-700">POWERED_BY: SWIFTLINK_PROTOCOL</p>
                </div>
            </footer>
        );
    }

    // Template 10: Minimal Strip
    if (templateId === "footer-10") {
        return (
            <footer className="mt-20 mb-8 py-6 border-t border-black/[0.05] dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">{state.bizName}</p>
                <div className="flex gap-2">
                    {socials.instagram && <a href={socials.instagram} target="_blank" className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform" style={{ backgroundColor: accent }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                    {socials.twitter && <a href={socials.twitter} target="_blank" className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform" style={{ backgroundColor: accent }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>}
                    {socials.website && <a href={socials.website} target="_blank" className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform" style={{ backgroundColor: accent }}><Globe size={12} /></a>}
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-300">Powered by SwiftLink</p>
            </footer>
        );
    }

    // Template 1 (Default): Branded card
    return (
        <footer className="p-10 md:p-20 mt-20 flex flex-col md:flex-row gap-10 justify-between w-full border-t border-black/5 dark:border-white/5 storefront-footer" style={{ backgroundColor: `${accent}08` }}>
            <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: accent }}>
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white italic uppercase">{state.bizName}</h3>
                </div>
                {state.tagline && <p className="text-gray-500 font-medium text-sm leading-relaxed">{state.tagline}</p>}
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">Powered by SwiftLink</p>
            </div>
            <div className="space-y-5">
                {(state.contactEmail || state.contactAddress || state.phone) && (
                    <div className="space-y-2">
                        {state.contactEmail && <p className="text-xs text-gray-500 font-medium">{state.contactEmail}</p>}
                        {state.phone && <p className="text-xs text-gray-500 font-medium">{state.phone}</p>}
                        {state.contactAddress && <p className="text-xs text-gray-500 font-medium">{state.contactAddress}</p>}
                    </div>
                )}
                <div className="flex gap-3">
                    {socials.instagram && <a href={socials.instagram} target="_blank" className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                    {socials.facebook && <a href={socials.facebook} target="_blank" className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>}
                    {socials.website && <a href={socials.website} target="_blank" className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: accent }}><Globe size={16} /></a>}
                </div>
            </div>
        </footer>
    );
};

// ==========================================
// MAIN STOREFRONT
// ==========================================

export function CustomerStorefront({
  shopId,
  isEditable = false,
  selectedSectionId,
  onSectionAction
}: {
  shopId?: string;
  isEditable?: boolean;
  selectedSectionId?: string | null;
  onSectionAction?: (id: string, action: string) => void;
}) {
  const { 
      state, 
      cart, 
      updateCart, 
      cartItemCount,
      sendWhatsAppOrder,
      logEvent,
      user
  } = useSwiftLink();

  const [publicState, setPublicState] = useState<ShopState | null>(null);
  const effectiveState = shopId ? publicState : state;
  
  const isStoreOwner = isEditable || (user && effectiveState && effectiveState.ownerId === user.id);
  
  const [screen, setScreen] = useState<"home" | "product" | "cart" | "search" | "success" | "community">("home");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "cart" | "community">("home");
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", message: "", rating: 5 });
  const [comments, setComments] = useState<Record<string, any[]>>({});

  useEffect(() => {
      if (screen === "community" && effectiveState?.id) {
          setReviewsLoading(true);
          supabase.from("store_reviews").select("*").eq("store_id", effectiveState.id).neq("type", "post").order("created_at", { ascending: false })
            .then(async ({ data: reviewsData }) => {
                if (reviewsData) {
            const filteredReviews = reviewsData.filter(r => !effectiveState.ownerId || r.author_id !== effectiveState.ownerId);
                    setReviews(filteredReviews);
                    const reviewIds = filteredReviews.map(r => r.id);
                    if (reviewIds.length > 0) {
                        const { data: commentsData } = await supabase
                          .from("store_review_comments")
                          .select("*")
                          .in("review_id", reviewIds)
                          .order("created_at", { ascending: true });
                          
                        if (commentsData) {
                            const grouped: Record<string, any[]> = {};
                            commentsData.forEach(c => {
                                if (!grouped[c.review_id]) grouped[c.review_id] = [];
                                grouped[c.review_id].push(c);
                            });
                            setComments(grouped);
                        }
                    }
                }
                setReviewsLoading(false);
            });
      }
  }, [screen, effectiveState?.id]);

  const submitReview = async () => {
      if (!newReview.name || !newReview.message || !effectiveState?.id) return;
      
      const { data, error } = await supabase.from("store_reviews").insert({
          store_id: effectiveState.id,
          author_name: newReview.name,
          author_id: user?.id || null,
          message: newReview.message,
          rating: newReview.rating
      }).select().single();

      if (!error && data) {
          setReviews(prev => [data, ...prev]);
          setShowReviewForm(false);
          setNewReview({ name: "", message: "", rating: 5 });
      }
  };

  useEffect(() => {
    if (!shopId) {
      setPublicState(null);
      return;
    }
    
    supabase
      .from('stores')
      .select('state_json')
      .eq('id', shopId)
      .single()
      .then(({ data }) => {
        if (data?.state_json) {
           const s = data.state_json as ShopState;
           setPublicState({ ...s, id: shopId });
        }
      });

    const channel = supabase
      .channel(`customer-shop-${shopId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${shopId}` }, payload => {
        if (payload.new?.state_json) {
          const data = payload.new.state_json as Partial<ShopState>;
          setPublicState((prev) => ({ ...(prev || ({} as ShopState)), ...(data as ShopState), id: shopId }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  useEffect(() => {
    if (effectiveState?.id) {
        logEvent("view", { shopId: effectiveState.id });
    }
  }, [effectiveState?.id, logEvent]);

  const categories: string[] = useMemo(() => {
      if (!effectiveState) return ["All"];
      const custom = effectiveState.categories || [];
      const collected = Array.from(new Set((effectiveState.products || []).map(p => p.category).filter(Boolean)));
      return Array.from(new Set(["All", ...custom, ...(collected as string[])]));
  }, [effectiveState]);

  const filteredProducts = useMemo(() => {
    if (!effectiveState) return [];
    return effectiveState.products.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const shouldHide = effectiveState.outOfStockDisplay === "hide" && p.outOfStock;
        return matchesCat && matchesSearch && !shouldHide;
    });
  }, [effectiveState, activeCategory, searchQuery]);

  const totalPrice = useMemo(() => {
    if (!effectiveState) return 0;
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const p = effectiveState.products.find(x => x.id === Number(id));
      return total + (p?.price || 0) * qty;
    }, 0);
  }, [cart, effectiveState]);

  const goTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === "home") setScreen("home");
    else if (tab === "search") setScreen("search");
    else if (tab === "cart") setScreen("cart");
    else if (tab === "community") setScreen("community");
  };

  const handleOrder = () => {
    logEvent("whatsapp_checkout", { total: totalPrice, items: Object.keys(cart).length });
    sendWhatsAppOrder();
    setScreen("success");
    setTimeout(() => {
      setScreen("home");
      setActiveTab("home");
    }, 3000);
  };

  if (!effectiveState && shopId) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Storefront…</p>
        </div>
    );
  }

  const s = effectiveState!;

  const pageAnim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 },
  };

  const qty = (id: number) => cart[id] || 0;

  // NEW DYNAMIC COLOR SYSTEM
  const accentColor = s.accentColor || "#10b981";
  const bgColor = s.bgColor || "#f2f2f7";
  const textColor = s.textColor || "#111827";
  const surfaceColor = s.surfaceColor || "#ffffff";
  const buttonColor = s.buttonColor || accentColor;

  return (
    <div className="min-h-screen flex flex-col items-center selection:bg-emerald-500 selection:text-white w-full overflow-x-hidden"
         style={{ 
            backgroundColor: bgColor,
            "--theme-color": accentColor, 
            "--bg-color": bgColor, 
            "--text-color": textColor,
            "--surface-color": surfaceColor,
            "--btn-color": buttonColor
         } as React.CSSProperties}>
      <style>{`
         .bg-emerald-500 { background-color: var(--btn-color) !important; }
         .text-emerald-500 { color: var(--theme-color) !important; }
         .text-emerald-600 { color: color-mix(in srgb, var(--theme-color) 80%, black) !important; }
         .border-emerald-500 { border-color: var(--theme-color) !important; }
         .bg-gray-100 { background-color: color-mix(in srgb, var(--bg-color) 95%, var(--text-color)) !important; }
         .text-gray-900 { color: var(--text-color) !important; }
         .bg-white { background-color: var(--surface-color) !important; border-color: color-mix(in srgb, var(--text-color) 10%, transparent) !important; }
         .bg-gray-50 { background-color: color-mix(in srgb, var(--surface-color) 95%, var(--text-color)) !important; }
         .text-gray-500, .text-gray-400 { color: color-mix(in srgb, var(--text-color) 60%, transparent) !important; }
         .bg-gray-900 { background-color: var(--text-color) !important; color: var(--bg-color) !important; }
         header.storefront-header, div.storefront-header { background-color: var(--bg-color) !important; }
         footer.storefront-footer, div.storefront-footer, footer { background-color: var(--bg-color) !important; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--text-color) 20%, transparent); }
      `}</style>
      
      <div className="w-full min-h-screen flex flex-col relative overflow-x-hidden">
        <div className="flex-1 flex flex-col relative">
          <AnimatePresence mode="wait">
            
            {/* HOME SCREEN */}
            {screen === "home" && (
              <motion.div key="home" {...pageAnim} className="absolute inset-0 flex flex-col">
                
                {/* Fixed Header */}
                <div className="backdrop-blur-md border-b border-black/[0.06] sticky top-0 z-50 w-full shrink-0 storefront-header" style={{ backgroundColor: `${bgColor}e6` }}>
                  <div className="w-full px-4 md:px-12 py-3 md:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm overflow-hidden">
                        {s.bizImage ? <img src={s.bizImage} className="w-full h-full object-cover" /> : <Zap size={14} fill="white" className="text-white" />}
                      </div>
                      <div>
                        <p className="text-[11px] md:text-sm font-black text-gray-900 leading-none">{s.bizName || "Store"}</p>
                        <p className="text-[8px] md:text-[10px] text-emerald-500 font-bold leading-none mt-1">● Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => goTab("search")} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                        <Search size={16} className="text-gray-900" />
                      </button>
                      <button onClick={() => goTab("cart")} className="relative p-1.5 hover:bg-black/5 rounded-full transition-colors">
                        <ShoppingCart size={16} className="text-gray-900" />
                        <AnimatePresence>
                          {cartItemCount > 0 && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                              {cartItemCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                </div>


                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col">

                  {/* NEW TEMPLATE ENGINE - Full bleed */}
                  <div className="w-full">
                    <HeroTemplate state={s} templateId={s.heroTemplateId || "hero-1"} onShopClick={() => {
                        const target = document.getElementById("sl-catalog");
                        if(target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }} />
                  </div>

                  <div className="w-full flex-1">
                    <div className="max-w-screen-xl mx-auto px-4 md:px-12 py-4 md:py-8">
                        
                        {/* CATEGORIES BAR */}
                        <div id="sl-catalog" className="pb-8 sticky top-0 z-40 backdrop-blur-xl pt-2">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                                {categories.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setActiveCategory(c)}
                                    className={`flex-shrink-0 px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[12px] font-black transition-all active:scale-95 ${
                                    activeCategory === c ? "shadow-lg bg-gray-900 text-white" : "border border-black/[0.05] bg-white text-gray-900 hover:brightness-95"
                                    }`}
                                >
                                    {c}
                                </button>
                                ))}
                            </div>
                        </div>

                        <CatalogTemplate state={s} templateId={s.catalogTemplateId || "catalog-1"} products={filteredProducts} onProductClick={(p) => { setSelectedProduct(p); setScreen("product"); logEvent("product_click", { productId: p.id }); }} />
                        <AboutTemplate state={s} templateId={s.aboutTemplateId || "about-1"} />
                    </div>
                  </div>

                  {/* Footer Template - Full bleed */}
                  <div className="w-full mt-auto">
                    <FooterTemplate state={s} templateId={s.footerTemplateId || "footer-1"} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRODUCT DETAIL SCREEN */}
            {screen === "product" && selectedProduct && (
              <motion.div key="product" {...pageAnim} className="absolute inset-0 flex flex-col bg-white overflow-hidden z-[60]">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="w-full md:flex md:items-stretch md:min-h-screen">
                    
                    {/* Image Column */}
                    <div className="relative md:w-1/2 md:h-screen">
                      {(() => {
                        const imgs = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image];
                        const idx = Math.min(activeImgIdx, imgs.length - 1);
                        return (
                          <>
                            <img src={imgs[idx]} alt={selectedProduct.name} className="w-full h-[400px] md:h-full object-cover" />
                            {imgs.length > 1 && (
                              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                                {imgs.map((_, i) => (
                                  <button key={i} onClick={() => setActiveImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/50"}`} />
                                ))}
                              </div>
                            )}
                            {imgs.length > 1 && (
                              <div className="absolute bottom-12 left-0 right-0 flex gap-2 px-4 overflow-x-auto no-scrollbar z-20">
                                {imgs.map((img, i) => (
                                  <button key={i} onClick={() => setActiveImgIdx(i)} className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === idx ? "border-white" : "border-transparent opacity-60"}`}>
                                    <img src={img} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
                      <button onClick={() => { setScreen("home"); setActiveImgIdx(0); }} className="absolute top-5 left-5 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center active:scale-90 shadow-lg text-gray-900">
                        <ChevronLeft size={20} />
                      </button>
                    </div>

                    {/* Content Column */}
                    <div className="p-6 md:p-12 md:w-1/2 flex flex-col justify-center bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h1>
                        </div>
                        <p className="text-2xl md:text-4xl font-black text-emerald-600">{s.currency}{Number(selectedProduct.price).toLocaleString()}</p>
                      </div>

                      <p className="text-xs md:text-base text-gray-500 mt-6 md:mt-10 leading-relaxed max-w-md">
                        {selectedProduct.description || `Premium quality ${selectedProduct.name.toLowerCase()} designed for the modern lifestyle.`}
                      </p>

                      <div className="mt-10 md:mt-16 space-y-3 md:space-y-4 max-w-md">
                        {qty(selectedProduct.id) === 0 ? (
                          <button disabled={selectedProduct.outOfStock} onClick={() => updateCart(selectedProduct.id, 1)} className="w-full py-4 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50 disabled:grayscale">
                            <ShoppingCart size={18} /> {selectedProduct.outOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-100 rounded-2xl md:rounded-3xl px-8 py-4 md:py-6 text-gray-900">
                            <button onClick={() => updateCart(selectedProduct.id, -1)} className="active:scale-90"><Minus size={20} /></button>
                            <span className="text-lg md:text-xl font-black">{qty(selectedProduct.id)}</span>
                            <button onClick={() => updateCart(selectedProduct.id, 1)} className="active:scale-90 text-emerald-500"><Plus size={20} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEARCH SCREEN */}
            {screen === "search" && (
              <motion.div key="search" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden z-[60]" style={{ backgroundColor: bgColor }}>
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full storefront-header">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 md:py-10">
                    <div className="flex items-center gap-4 mb-4 md:mb-6">
                        <button onClick={() => goTab("home")} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-gray-900 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-sm md:text-2xl font-black text-gray-900 tracking-tight">Search Catalog</h2>
                    </div>
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Try 'hoodie'..." className="w-full pl-12 pr-6 py-4 md:py-6 bg-gray-100 rounded-2xl md:rounded-3xl text-xs md:text-lg font-bold text-gray-900 placeholder:text-gray-400 outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all shadow-inner" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 space-y-4">
                    {searchQuery && filteredProducts.map((p) => (
                      <button key={p.id} onClick={() => { setSelectedProduct(p); setScreen("product"); }} className="w-full flex items-center gap-4 md:gap-8 bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-xl active:scale-[0.98] transition-all group border border-black/[0.01]">
                        <img src={p.image} className="w-16 h-16 md:w-32 md:h-32 object-cover rounded-xl md:rounded-[1.5rem] flex-shrink-0 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 text-left">
                          <p className="text-[11px] md:text-xl font-black text-gray-900 leading-none mb-1 md:mb-3">{p.name}</p>
                          <p className="text-[12px] md:text-2xl font-black text-emerald-600 mt-2 md:mt-4">{s.currency}{Number(p.price).toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all"><ArrowRight size={20} /></div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CART SCREEN */}
            {screen === "cart" && (
              <motion.div key="cart" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden z-[60]" style={{ backgroundColor: bgColor }}>
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full storefront-header">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 md:py-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => goTab("home")} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-gray-900 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                        <h2 className="text-sm md:text-2xl font-black text-gray-900 tracking-tight">Your Shopping Bag</h2>
                        <p className="text-[10px] md:text-sm text-gray-400 font-bold mt-1 uppercase tracking-wider">{cartItemCount} items selected</p>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6">
                    {cartItemCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ShoppingCart size={40} className="text-gray-200 mb-8" />
                        <p className="text-xs md:text-base font-black text-gray-400 uppercase tracking-[0.2em]">Bag is empty</p>
                        <button onClick={() => goTab("home")} className="mt-8 px-10 py-4 bg-gray-900 text-white text-[11px] md:text-sm font-black rounded-full active:scale-95 transition-all shadow-xl">BROWSE STORE</button>
                      </div>
                    ) : (
                      <div className="md:flex md:gap-12">
                        <div className="flex-1 space-y-4">
                          <AnimatePresence>
                            {Object.entries(cart).map(([id, q]) => {
                              const p = s.products.find(x => x.id === Number(id));
                              if (!p || q <= 0) return null;
                              return (
                                <motion.div key={id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm flex items-center gap-4 md:gap-8 border border-black/[0.01]">
                                  <img src={p.image} className="w-16 h-16 md:w-32 md:h-32 object-cover rounded-xl" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] md:text-xl font-black text-gray-900 truncate leading-none mb-1.5">{p.name}</p>
                                    <p className="text-[11px] md:text-lg font-black text-emerald-600">{s.currency}{(Number(p.price) * q).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 bg-gray-50 rounded-full p-1 md:p-1.5 text-gray-900">
                                    <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 md:w-10 md:h-10 bg-white shadow-sm rounded-full flex items-center justify-center active:scale-90"><Minus size={12} /></button>
                                    <span className="text-xs md:text-lg font-black w-4 md:w-8 text-center">{q}</span>
                                    <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 md:w-10 md:h-10 bg-emerald-500 text-white shadow-sm rounded-full flex items-center justify-center active:scale-90"><Plus size={12} /></button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                        <div className="md:w-[350px] mt-8 md:mt-0">
                          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-black/[0.02] border border-black/[0.01] sticky top-32">
                            <h3 className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Order Summary</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between text-xs md:text-base font-bold text-gray-400"><span>Subtotal</span><span className="text-gray-900">{s.currency}{totalPrice.toLocaleString()}</span></div>
                              <div className="border-t border-gray-50 pt-6 flex justify-between"><span className="text-sm md:text-lg font-black text-gray-900">Total</span><span className="text-xl md:text-3xl font-black text-emerald-600">{s.currency}{totalPrice.toLocaleString()}</span></div>
                            </div>
                            <button onClick={handleOrder} className="w-full mt-8 md:mt-10 py-5 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl">
                              <MessageCircle size={18} /> CHECKOUT ON WHATSAPP
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* COMMUNITY/REVIEWS SCREEN */}
            {screen === "community" && (
              <motion.div key="community" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden z-50" style={{ backgroundColor: bgColor }}>
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full shrink-0 z-10 storefront-header">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setScreen("home"); setActiveTab("home"); }} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-gray-900 transition-colors">
                        <ChevronLeft size={24} />
                      </button>
                      <h2 className="text-sm md:text-xl font-black text-gray-900 tracking-tight">Customer Reviews</h2>
                    </div>
                    {!isStoreOwner && (
                      <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md">
                        + Write Review
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 space-y-8">
                    
                    {/* Rating Stats Summary Panel */}
                    {reviews.length > 0 && (
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/[0.02] grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* Overall Average */}
                        <div className="text-center md:border-r border-black/[0.05] dark:border-white/5 py-2">
                          <h3 className="text-5xl font-black text-gray-900 leading-none">
                            {(reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)}
                          </h3>
                          <div className="flex justify-center gap-1 my-3">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const avg = reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length;
                              return <Star key={i} size={16} className={i < Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-gray-200"} />;
                            })}
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Based on {reviews.length} reviews</p>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="col-span-2 space-y-2">
                          {[5, 4, 3, 2, 1].map(stars => {
                            const count = reviews.filter(r => r.rating === stars).length;
                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={stars} className="flex items-center gap-3 text-xs font-bold">
                                <span className="w-12 text-gray-400 text-right">{stars} star</span>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 text-gray-500 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Review List */}
                    {reviewsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
                    ) : reviews.length === 0 ? (
                      <div className="py-20 flex flex-col items-center text-center bg-white rounded-3xl p-8 border border-black/[0.01] shadow-sm">
                        <MessageCircle size={48} className="text-gray-200 mb-4" />
                        <h3 className="text-base font-black text-gray-900 uppercase">No reviews yet</h3>
                        <p className="text-xs text-gray-400 max-w-xs mt-2 leading-relaxed">
                          {isStoreOwner ? "When customers leave feedback for your store, they will appear here." : "Have you purchased from us? Share your experience with the community today."}
                        </p>
                        {!isStoreOwner && (
                          <button onClick={() => setShowReviewForm(true)} className="mt-6 px-6 py-3 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md">
                            Leave a Feedback
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6 pb-24">
                        {reviews.filter(r => !isStoreOwner || r.author_id !== user?.id).map((r) => {
                          const reviewerComments = comments[r.id] || [];
                          return (
                            <div key={r.id} className="bg-white rounded-3xl p-6 border border-black/[0.01] shadow-sm space-y-4">
                              {/* Card Header */}
                              <div className="flex items-start justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black uppercase shadow-inner text-sm">
                                    {r.author_name?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight">{r.author_name}</h4>
                                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                        ✓ Verified
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"}</p>
                                  </div>
                                </div>
                                
                                {/* Star Rating */}
                                <div className="flex gap-0.5 bg-amber-50 dark:bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={12} className={i < (r.rating || 5) ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                                  ))}
                                </div>
                              </div>

                              {/* Review Text */}
                              <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-medium pl-1">
                                {r.message}
                              </p>

                              {/* Nested Replies/Comments */}
                              {reviewerComments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 space-y-3 pl-4 md:pl-8">
                                  {reviewerComments.map((comment) => (
                                    <div key={comment.id} className="bg-slate-50 dark:bg-zinc-850/40 rounded-2xl p-4 border border-black/[0.01]">
                                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <h5 className="font-black text-xs text-gray-900 uppercase">{comment.author_name || "Store Owner"}</h5>
                                          <span className="text-[8px] font-black uppercase tracking-widest text-white bg-slate-900 dark:bg-emerald-600 px-1.5 py-0.5 rounded">
                                            Store Owner
                                          </span>
                                        </div>
                                        <span className="text-[8px] text-gray-400">{comment.created_at ? new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}</span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-zinc-300 leading-relaxed pl-4 font-medium">{comment.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-20 shrink-0" />

                {/* Write Review Modal Overlay */}
                <AnimatePresence>
                  {showReviewForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReviewForm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

                      {/* Modal Panel */}
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 w-full max-w-md shadow-2xl border border-black/[0.05] dark:border-white/5 space-y-6 z-10">
                        <div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Share Your Experience</h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Submit feedback to {s.bizName || "our store"}</p>
                        </div>

                        <div className="space-y-4">
                          {/* Name Input */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Name</label>
                            <input type="text" value={newReview.name} onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))} placeholder="Alex Carter" className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-500/20" />
                          </div>

                          {/* Star Rating selector */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Rating</label>
                            <div className="flex gap-2 bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 justify-center border border-black/5 dark:border-white/5">
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <button key={stars} onClick={() => setNewReview(prev => ({ ...prev, rating: stars }))} className="hover:scale-125 transition-transform">
                                  <Star size={24} className={stars <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Message Input */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Review</label>
                            <textarea value={newReview.message} onChange={(e) => setNewReview(prev => ({ ...prev, message: e.target.value }))} placeholder="Tell others what you loved about our service and products..." className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none resize-none h-28 focus:border-emerald-500/20" />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button onClick={() => setShowReviewForm(false)} className="flex-1 py-4 bg-gray-105 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-zinc-350 transition-colors border border-black/5">
                            Cancel
                          </button>
                          <button onClick={submitReview} disabled={!newReview.name || !newReview.message} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none shadow-lg">
                            Submit
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* SUCCESS SCREEN */}
            {screen === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white flex flex-col items-center justify-center p-10 text-center z-[70]">
                <div className="max-w-md mx-auto space-y-6">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-24 h-24 md:w-32 md:h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight italic uppercase">Order Sent!</h2>
                  <p className="text-sm md:text-lg text-gray-400 font-medium leading-relaxed">We&apos;ve forwarded your request to the store on WhatsApp.</p>
                  <button onClick={() => { setScreen("home"); setActiveTab("home"); }} className="px-10 py-4 bg-gray-900 text-white text-xs md:text-sm font-black rounded-full active:scale-95 transition-all shadow-xl">BACK TO STORE</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-md border-t border-black/[0.04] md:border-none flex items-center justify-center px-4 md:px-0 md:pb-8" style={{ height: 75, backgroundColor: `${bgColor}f2` }}>
          <div className="flex items-center w-full max-w-screen-lg mx-auto md:px-8 md:py-2 md:w-fit md:gap-12">
            {[
              { id: "home", icon: Home, label: "Store" },
              { id: "search", icon: Search, label: "Search" },
              { id: "community", icon: MessageCircle, label: "Reviews" },
              { id: "cart", icon: ShoppingCart, label: "Cart", badge: cartItemCount },
            ].map(({ id, icon: Icon, label, badge }) => (
              <button key={id} onClick={() => goTab(id as any)} className={`flex-1 md:flex-initial flex flex-col items-center gap-1 py-2 relative active:scale-90 transition-all ${activeTab === id ? "text-gray-900" : "text-gray-300 hover:text-gray-400"}`}>
                <div className="relative">
                  <Icon className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" style={{ color: activeTab === id ? textColor : undefined }} strokeWidth={activeTab === id ? 2.5 : 1.5} />
                  {badge != null && badge > 0 && <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">{badge}</span>}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest`} style={{ color: activeTab === id ? textColor : undefined }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW EXPORT — renders a single section template for the Live Preview Modal
// Called from BusinessView's LivePreviewModal component.
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerStorefrontPreview({
  type,
  templateId,
  state,
}: {
  type: "hero" | "catalog" | "about" | "footer";
  templateId: string;
  state: ShopState;
}) {
  // Build a tiny mock product list for catalog previews
  const mockProducts: Product[] = [
    { id: 1, name: "Premium Item", description: "Handcrafted with care", price: 12500, image: "", images: [], outOfStock: false, category: "Featured" },
    { id: 2, name: "Signature Piece", description: "Limited edition quality", price: 8900, image: "", images: [], outOfStock: false, category: "New" },
    { id: 3, name: "Classic Collection", description: "Timeless design excellence", price: 15000, image: "", images: [], outOfStock: false, category: "Popular" },
  ];

  const accent = state.accentColor || "#10b981";

  const wrapperClass = type === "hero"
    ? "min-h-[340px] relative overflow-hidden"
    : type === "catalog"
    ? "py-4 px-2"
    : type === "about"
    ? "py-4 px-2"
    : "px-2 py-2";

  return (
    <div className={wrapperClass}>
      {type === "hero" && (
        <HeroTemplate state={state} templateId={templateId} />
      )}
      {type === "catalog" && (
        <CatalogTemplate state={state} templateId={templateId} products={mockProducts} onProductClick={() => {}} />
      )}
      {type === "about" && (
        <AboutTemplate state={state} templateId={templateId} />
      )}
      {type === "footer" && (
        <FooterTemplate state={state} templateId={templateId} />
      )}
    </div>
  );
}
