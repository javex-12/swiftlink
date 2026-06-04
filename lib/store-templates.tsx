"use client";

import React from "react";
import { 
  ArrowRight, Zap, Globe, Shield, Star, ShoppingBag, 
  ChevronRight, ArrowUpRight, Instagram, Mail, Command, Eye,
  Layout, Sparkles, Truck, MessageSquare, Package, Clock, CheckCircle2,
  Camera, Smartphone, Box, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ThreeDBackground = dynamic(
  () => import("@/components/ThreeDBackground").then((m) => m.ThreeDBackground),
  { ssr: false }
);

// --- UTILS ---
const getContrastColor = (hex: string) => {
    if (!hex) return "#ffffff";
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? "#000000" : "#ffffff";
};

// ==========================================
// HERO TEMPLATES (24 TOTAL)
// ==========================================

export const HeroTemplates: Record<string, React.FC<any>> = {
    // 1. OLED Minimal
    "hero-1": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5 bg-[#050505] min-h-[80vh] flex flex-col justify-center items-center text-center px-6">
                <div className="absolute inset-0 pointer-events-none opacity-40"><ThreeDBackground type={4} accentColor={accent} /></div>
                <div className="relative z-10 max-w-4xl">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-6 block">Premium Protocol</span>
                        <h1 className="text-6xl md:text-9xl font-black text-white leading-none tracking-tighter italic uppercase mb-8">
                            {state.heroTitle || state.bizName || "The Elite"}<br />
                            <span className="opacity-30">Collection.</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto mb-12 uppercase tracking-wide">{state.heroSubtitle || state.tagline}</p>
                        <button onClick={onShopClick} className="bg-emerald-500 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl shadow-emerald-500/20">
                            Explore Catalog
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    },

    // 2. Lumina Luxe
    "hero-lumina": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden bg-[#0A0A0A] font-serif">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300&display=swap');
                    .font-serif-lumina { font-family: 'Cormorant Garamond', serif; }
                    .text-outline-lumina { -webkit-text-stroke: 1px rgba(255, 255, 255, 0.4); color: transparent; }
                `}</style>
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
                    <img src={state.heroImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2400"} className="w-full h-full object-cover" />
                </div>
                <div className="relative z-20 text-center px-4 w-full max-w-screen-2xl font-serif-lumina">
                    <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="text-[15vw] md:text-[12vw] leading-none tracking-tighter text-white uppercase">
                        {state.heroTitle || "THE STILL"}<br />
                        <span className="text-outline-lumina italic">COLLECTION</span>
                    </motion.h1>
                    <div className="mt-12 flex flex-col md:flex-row justify-between items-center w-full px-8 md:px-32 gap-8 text-white/60">
                        <div className="text-[10px] tracking-[0.5em] uppercase text-center md:text-left leading-relaxed">
                            Boutique Architectural <br /> Objects & Furniture
                        </div>
                        <button onClick={onShopClick} className="group flex items-center gap-4 text-xs tracking-[0.4em] uppercase hover:text-white transition-colors">
                            Explore <div className="w-12 h-[1px] bg-white group-hover:w-20 transition-all duration-500" />
                        </button>
                    </div>
                </div>
            </div>
        );
    },

    // 3. Void Cinematic
    "hero-void": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden perspective-1000">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Space+Mono&display=swap');
                    .font-mono-void { font-family: 'Space Mono', monospace; }
                `}</style>
                <div className="absolute inset-0 z-0">
                    <motion.img 
                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.4, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        src={state.heroImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2400"} 
                        className="w-full h-full object-cover grayscale"
                    />
                </div>
                <div className="relative z-10 text-center font-mono-void">
                    <h1 className="text-[10vw] font-bold leading-[0.8] tracking-tighter text-white uppercase">
                        {state.heroTitle || "CONSTRUCT"} <br />
                        <span className="italic opacity-50 text-white/40">THE VOID.</span>
                    </h1>
                    <div className="mt-12 flex justify-center gap-12 text-[9px] tracking-[0.8em] uppercase text-white/30">
                        <span>EST. 2026</span>
                        <div className="w-px h-4 bg-white/10" />
                        <span>SEQUENCE</span>
                    </div>
                    <button onClick={onShopClick} className="mt-16 px-12 py-5 border border-white/20 rounded-full text-[10px] tracking-[0.5em] uppercase text-white hover:bg-white hover:text-black transition-all">
                        Inquire
                    </button>
                </div>
            </div>
        );
    },

    // 4. Tokyo Night
    "hero-tokyo": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-black overflow-hidden flex items-center px-10 md:px-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#3b82f633,transparent:50%),radial-gradient(circle_at_30%_70%,#ec489933,transparent:50%)]" />
                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-7xl md:text-[120px] font-black text-white italic leading-none mb-6">
                        NEON <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500">PULSE.</span>
                    </h1>
                    <p className="text-blue-200/60 text-lg uppercase tracking-[0.3em] mb-10">{state.tagline}</p>
                    <button onClick={onShopClick} className="px-12 py-4 bg-white text-black font-black text-xs uppercase tracking-widest hover:skew-x-[-12deg] transition-transform">
                        Shop Now
                    </button>
                </div>
            </div>
        );
    },

    // 5. Brutalist Bold
    "hero-brutalist": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen bg-[#F0F0F0] border-y-[20px] border-black p-10 flex flex-col justify-between text-black">
                <div className="flex justify-between items-start">
                    <span className="text-[120px] font-black leading-none tracking-tighter">01</span>
                    <div className="w-32 h-32 bg-black rounded-full" />
                </div>
                <div className="max-w-4xl">
                    <h1 className="text-[10vw] font-black uppercase leading-[0.8] mb-10 tracking-tighter">
                        {state.heroTitle || "RAW POWER."}
                    </h1>
                    <button onClick={onShopClick} className="bg-black text-white px-20 py-8 text-2xl font-black uppercase hover:bg-emerald-500 transition-colors">
                        Enter
                    </button>
                </div>
            </div>
        );
    },

    // 6. Glassmorphism
    "hero-glass": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-slate-900 overflow-hidden flex items-center justify-center p-6">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse opacity-20" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse opacity-20" />
                </div>
                <div className="relative z-10 w-full max-w-5xl aspect-video bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 flex flex-col items-center text-center justify-center shadow-2xl">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight uppercase">
                        TRANSLUCENT <br /> <span className="italic text-emerald-400">DESIGN.</span>
                    </h1>
                    <button onClick={onShopClick} className="px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all">
                        View Products
                    </button>
                </div>
            </div>
        );
    },

    // 7. Split Minimal
    "hero-split": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen flex flex-col md:flex-row bg-white">
                <div className="flex-1 bg-black flex flex-col justify-center px-10 md:px-20 py-20 order-2 md:order-1 text-white">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8 uppercase">
                        LESS <br /> IS MORE.
                    </h1>
                    <button onClick={onShopClick} className="w-fit border-b-2 border-emerald-500 pb-2 text-white font-black text-sm uppercase tracking-widest hover:px-4 transition-all">
                        Shop Collection
                    </button>
                </div>
                <div className="flex-1 relative order-1 md:order-2 min-h-[400px]">
                    <img src={state.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8"} className="absolute inset-0 w-full h-full object-cover" />
                </div>
            </div>
        );
    },

    // 8. Editorial Vogue
    "hero-vogue": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen bg-[#F9F9F9] flex flex-col items-center pt-32 px-6 font-serif text-black">
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400 mb-10 italic">Issue No. 042</span>
                <h1 className="text-7xl md:text-[140px] italic leading-[0.8] tracking-tighter text-center mb-16 text-[#1A1A1A]">
                    {state.bizName || "VOGUE"}
                </h1>
                <div className="w-full max-w-4xl aspect-[16/9] bg-slate-200 relative overflow-hidden rounded-sm group cursor-pointer" onClick={onShopClick}>
                    <img src={state.heroImage || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" />
                </div>
            </div>
        );
    },

    // 9. Wave Mesh
    "hero-9": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full overflow-hidden mb-10 border border-white/5 shadow-2xl min-h-[550px] bg-[#050811] flex items-center justify-center">
                <ThreeDBackground type={7} accentColor={accent} />
                <div className="relative z-10 text-center px-6">
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase italic">{state.heroTitle || "Wave Core"}</h1>
                    <button onClick={onShopClick} className="bg-white text-black px-12 py-5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">Shop Now</button>
                </div>
            </div>
        );
    },

    // 10. Neon Rings
    "hero-10": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5 min-h-[560px] bg-[#0a000f] flex items-center justify-center">
                <ThreeDBackground type={10} accentColor={accent} />
                <div className="relative z-10 text-center px-6">
                    <h1 className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter uppercase italic" style={{ textShadow: `0 0 40px ${accent}aa` }}>{state.heroTitle || "Neon Hub"}</h1>
                    <button onClick={onShopClick} className="bg-emerald-500 text-white px-12 py-5 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl">Initialize</button>
                </div>
            </div>
        );
    },

    // 11. Midnight Luxe
    "hero-midnight": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen bg-[#020617] flex items-center justify-center text-center p-6">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
                <div className="relative z-10 text-white">
                    <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase mb-6 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                        MIDNIGHT <br /> LUXE.
                    </h1>
                    <button onClick={onShopClick} className="px-16 py-6 bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-blue-400 transition-colors rounded-none">Shop Collection</button>
                </div>
            </div>
        );
    },

    // 12. Solaris Flare
    "hero-solaris": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-[#FFFbeb] flex items-center justify-center overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[100px]" />
                <div className="relative z-10 text-center text-slate-900">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600/60 mb-6 block italic">Solar Sequence</span>
                    <h1 className="text-7xl md:text-[140px] font-black tracking-tighter leading-[0.8] mb-12 uppercase italic">
                        HEAT <br /> <span className="text-orange-500 not-italic">WAVE.</span>
                    </h1>
                    <button onClick={onShopClick} className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto hover:scale-110 transition-transform shadow-2xl">
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>
        );
    },

    // 13. Quartz Minimal
    "hero-quartz": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen bg-white flex flex-col items-center justify-center text-center p-6 text-slate-900">
                <div className="w-full max-w-5xl aspect-[21/9] border border-slate-100 relative overflow-hidden flex items-center justify-center bg-slate-50/50">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tight uppercase italic mix-blend-multiply">QUARTZ.</h1>
                </div>
                <div className="mt-12 space-y-6">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.4em]">{state.tagline}</p>
                    <button onClick={onShopClick} className="text-slate-900 font-black text-xs uppercase tracking-widest border-b-2 border-black pb-1 hover:px-6 transition-all">Enter Shop</button>
                </div>
            </div>
        );
    },

    // 14. High Velocity
    "hero-velocity": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-black flex items-center px-10 md:px-32 overflow-hidden text-white">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 [background-image:linear-gradient(90deg,white_1px,transparent_1px)] [background-size:100px_100%]" />
                <div className="relative z-10 w-full">
                    <h1 className="text-8xl md:text-[180px] font-black italic leading-none tracking-tighter uppercase">FAST.</h1>
                    <div className="flex items-center gap-10 mt-10">
                        <div className="w-32 h-[2px] bg-emerald-500" />
                        <button onClick={onShopClick} className="text-white font-black text-lg uppercase tracking-tighter hover:text-emerald-500 transition-colors flex items-center gap-4">
                            Next Drop <ArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        );
    },

    // 15. Mono Focus
    "hero-mono": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-[70vh] bg-zinc-900 flex items-end p-10 md:p-20 text-white">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {state.heroImage && <img src={state.heroImage} className="w-2/3 h-2/3 object-contain hover:scale-110 transition-transform duration-700" />}
                </div>
                <div className="relative z-10 max-w-xl">
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-none mb-10 italic">
                        {state.bizName?.split(' ')[0] || "MONO"}
                    </h1>
                    <button onClick={onShopClick} className="bg-emerald-500 text-white px-10 py-4 rounded-sm font-black uppercase text-xs tracking-widest shadow-2xl">Shop Catalog</button>
                </div>
            </div>
        );
    },

    // 16. Artistic Blur
    "hero-art": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden text-white">
                <div className="absolute inset-0 opacity-40 blur-[100px] scale-150">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500 via-rose-500 to-indigo-500 animate-pulse" />
                </div>
                <div className="relative z-10 text-center">
                    <h1 className="text-7xl md:text-[120px] font-black italic leading-none tracking-tighter uppercase mb-12 drop-shadow-2xl">
                        CREATE <br /> <span className="text-white/20">CHAOS.</span>
                    </h1>
                    <button onClick={onShopClick} className="px-16 py-6 border-2 border-white rounded-full font-black text-xs uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all">Discover</button>
                </div>
            </div>
        );
    },

    // 17. Tech Core
    "hero-tech": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-screen bg-[#050505] flex items-center px-10 md:px-24 text-white">
                <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(#34d399_1px,transparent_1px),linear-gradient(90deg,#34d399_1px,transparent_1px)] [background-size:60px_60px]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-[2px] bg-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">System Operational</span>
                    </div>
                    <h1 className="text-6xl md:text-9xl font-black leading-none tracking-tighter uppercase italic mb-12">
                        FUTURE <br /> <span className="opacity-20">EQUIPMENT.</span>
                    </h1>
                    <button onClick={onShopClick} className="bg-emerald-500 text-black px-12 py-5 font-black uppercase text-xs tracking-widest hover:px-16 transition-all rounded-sm flex items-center gap-4">Initialize <Zap size={16} fill="currentColor" /></button>
                </div>
            </div>
        );
    },

    // 18. Nature Flow
    "hero-nature": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-[90vh] bg-[#E8E8E1] flex flex-col md:flex-row items-stretch text-orange-950">
                <div className="flex-1 relative order-2 md:order-1 min-h-[300px]">
                    <img src={state.heroImage || "https://images.unsplash.com/photo-1544833058-e70f6ca25617"} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-orange-900/10" />
                </div>
                <div className="flex-1 p-10 md:p-20 flex flex-col justify-center order-1 md:order-2">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] mb-6 italic">Organic Source</span>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight mb-10 italic">Breathable <br /> Essentials.</h1>
                    <button onClick={onShopClick} className="w-fit bg-orange-900 text-white px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">Browse Source</button>
                </div>
            </div>
        );
    },

    // 19. Slate Business
    "hero-slate": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-slate-900 flex items-center justify-between px-10 md:px-24 text-white">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8 uppercase">PRO <br /> WORKSPACE.</h1>
                    <p className="text-slate-400 text-xl mb-12 border-l-4 border-emerald-500 pl-6 italic">{state.tagline}</p>
                    <div className="flex gap-4">
                        <button onClick={onShopClick} className="bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90">Open Store</button>
                    </div>
                </div>
                <div className="hidden lg:block w-1/3 aspect-[3/4] bg-slate-800 rounded-[3rem] overflow-hidden rotate-3 shadow-2xl border border-white/10">
                    <img src={state.heroImage || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} className="w-full h-full object-cover" />
                </div>
            </div>
        );
    },

    // 20. Infinite Loop
    "hero-infinite": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-white dark:bg-black flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20"><ThreeDBackground type={6} accentColor="#3b82f6" /></div>
                <div className="relative z-10">
                    <h1 className="text-[12vw] font-black tracking-tighter text-slate-900 dark:text-white leading-[0.8] mb-12 uppercase italic">ALWAYS <br /> <span className="text-emerald-500 not-italic">FORWARD.</span></h1>
                    <button onClick={onShopClick} className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center mx-auto shadow-2xl hover:scale-110 transition-transform"><ArrowRight size={24} /></button>
                </div>
            </div>
        );
    },

    // 21. Ambient Orbs
    "hero-2": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl min-h-[500px] bg-[#0a0a0a] flex items-center justify-center text-center px-6 text-white">
                <ThreeDBackground type={3} accentColor={accent} />
                <div className="relative z-10 max-w-2xl">
                    <div className="w-10 h-1 bg-emerald-500 mx-auto mb-8" />
                    <h1 className="text-6xl md:text-9xl font-black uppercase leading-none tracking-tighter mb-10 italic">{state.heroTitle || state.bizName}</h1>
                    <button onClick={onShopClick} className="px-12 py-5 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-white transition-colors">Shop Now</button>
                </div>
            </div>
        );
    },

    // 22. Magazine Aurora
    "hero-3": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full min-h-[420px] bg-white dark:bg-zinc-950 flex flex-col md:flex-row overflow-hidden border border-black/5 dark:border-white/5">
                <div className="flex-1 p-10 md:p-20 flex flex-col justify-center text-slate-900 dark:text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-6 block">New Collection</span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-10 italic">{state.heroTitle || state.bizName}</h1>
                    <button onClick={onShopClick} className="w-fit px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Explore</button>
                </div>
                <div className="flex-1 relative bg-slate-50 dark:bg-zinc-900 overflow-hidden min-h-[300px]">
                    <ThreeDBackground type={6} accentColor={accent} />
                </div>
            </div>
        );
    },

    // 23. Torus Glow
    "hero-4": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full min-h-[550px] bg-[#020205] flex items-center justify-center text-center overflow-hidden border border-white/5 shadow-2xl text-white">
                <ThreeDBackground type={1} accentColor={accent} />
                <div className="relative z-10 max-w-2xl px-6">
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-10 italic">{state.heroTitle || state.bizName}</h1>
                    <button onClick={onShopClick} className="bg-emerald-500 text-white px-12 py-5 rounded-full font-black uppercase text-xs tracking-widest flex items-center gap-4 mx-auto shadow-2xl shadow-emerald-500/40">{state.heroButtonText || "Shop Now"} <Zap size={16} fill="currentColor" /></button>
                </div>
            </div>
        );
    },

    // 24. Cyber Floor
    "hero-5": ({ state, onShopClick }) => {
        const accent = state.accentColor || "#10b981";
        return (
            <div className="relative w-full min-h-[550px] bg-[#050b0a] flex items-center justify-center text-center overflow-hidden text-white border border-white/5">
                <ThreeDBackground type={2} accentColor={accent} />
                <div className="relative z-10 px-6">
                    <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-8">{state.heroTitle || state.bizName}</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-12 italic opacity-80">{state.tagline}</p>
                    <button onClick={onShopClick} className="border-2 border-emerald-500 px-12 py-4 font-black uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-black transition-colors">Enter System</button>
                </div>
            </div>
        );
    },

    // 25. High-Density Bento
    "hero-bento": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full min-h-[85vh] bg-white dark:bg-black p-4 sm:p-6 text-slate-900 dark:text-white">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
                    <div className="md:col-span-8 bg-slate-900 dark:bg-zinc-900 rounded-[2.5rem] p-10 flex flex-col justify-end text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-6 relative z-10">{state.heroTitle || state.bizName}</h1>
                        <button onClick={onShopClick} className="bg-emerald-500 text-white w-fit px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest relative z-10 shadow-2xl">Start Exploring</button>
                    </div>
                    <div className="md:col-span-4 grid grid-rows-2 gap-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] p-8 flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">New Arrivals</span>
                            <p className="text-2xl font-black italic text-slate-900 dark:text-white leading-tight">THE SS26 <br /> DROP.</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-zinc-800 rounded-[2rem] p-8 flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Since 2026</span>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{state.tagline}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    // 26. Typographic Chaos
    "hero-typo": ({ state, onShopClick }) => {
        return (
            <div className="relative w-full h-screen bg-white text-black flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex flex-wrap gap-10 p-4 font-black text-9xl uppercase italic rotate-12">
                   {Array.from({length:20}).map((_,i) => <span key={i}>{state.bizName}</span>)}
                </div>
                <div className="relative z-10 text-center">
                    <h1 className="text-7xl md:text-[180px] font-black leading-[0.75] tracking-tighter uppercase mb-12">
                       {state.bizName?.split(' ').map((w,i) => <span key={i} className={i%2===1 ? "text-white bg-black px-4" : ""}>{w}<br/></span>)}
                    </h1>
                    <button onClick={onShopClick} className="w-24 h-24 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center hover:scale-110 transition-transform">Enter</button>
                </div>
            </div>
        );
    }
};

// ==========================================
// CATALOG TEMPLATES
// ==========================================

export const CatalogTemplates: Record<string, React.FC<any>> = {
    // Standard Grid
    "catalog-1": ({ state, products, onProductClick }) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((p: any) => (
                <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group">
                    <div className="w-full aspect-square rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 shadow-sm mb-4 relative border border-black/[0.02] dark:border-white/5 group-hover:shadow-xl transition-all">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                        {p.outOfStock && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl shadow-lg">Sold Out</span></div>}
                    </div>
                    <h3 className="font-black text-sm md:text-lg text-gray-900 dark:text-white truncate px-1 uppercase tracking-tight italic leading-none">{p.name}</h3>
                    <p className="font-black text-sm md:text-xl text-emerald-600 dark:text-emerald-400 mt-1.5 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                </button>
            ))}
        </div>
    ),

    // Lumina Style
    "catalog-lumina": ({ state, products, onProductClick }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-40 max-w-screen-2xl mx-auto py-20 font-serif">
             {products.map((p: any, i: number) => (
                <div key={p.id} className={`group ${i % 2 !== 0 ? 'md:mt-40' : ''}`} onClick={() => onProductClick(p)}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#111] cursor-pointer">
                        <img src={p.image} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2s]" alt={p.name} />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                        <div className="absolute top-10 right-10 text-xs tracking-widest italic text-white opacity-40">No. {i+1}</div>
                    </div>
                    <div className="mt-12 flex justify-between items-end border-b border-white/10 pb-6 text-gray-900 dark:text-white">
                        <div>
                            <h3 className="text-4xl font-serif mb-2 uppercase">{p.name}</h3>
                            <span className="text-[10px] tracking-[0.3em] uppercase opacity-40">{p.category}</span>
                        </div>
                        <div className="text-2xl font-serif italic text-emerald-500">{state.currency}{Number(p.price).toLocaleString()}</div>
                    </div>
                </div>
            ))}
        </div>
    ),

    // Void Style
    "catalog-void": ({ state, products, onProductClick }) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-20 font-mono text-white bg-black p-4 sm:p-10">
            {products.map((p: any, i: number) => (
              <div key={p.id} className="group cursor-pointer relative" onClick={() => onProductClick(p)}>
                <div className="relative aspect-[3/4] border border-white/10 overflow-hidden mb-8 bg-zinc-900">
                   <img src={p.image} className="w-full h-full object-cover grayscale opacity-40 group-hover:scale-110 group-hover:opacity-100 transition-all duration-[2s]" />
                </div>
                <h3 className="text-xl italic mb-1 uppercase tracking-tighter">{p.name}</h3>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 opacity-60">
                    <p className="text-[9px] tracking-widest uppercase">Series {i+1}</p>
                    <p className="text-emerald-500 font-bold">{state.currency}{Number(p.price).toLocaleString()}</p>
                </div>
              </div>
            ))}
        </div>
    ),

    // Template 2: Magazine List
    "catalog-2": ({ state, products, onProductClick }) => (
        <div className="space-y-6">
            {products.map((p: any) => (
                <button key={p.id} onClick={() => onProductClick(p)} className="w-full flex items-center gap-6 p-4 rounded-[2rem] bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all group text-left border border-black/[0.02] dark:border-white/5">
                    <div className="w-24 h-24 md:w-40 md:h-40 rounded-[1.5rem] overflow-hidden bg-gray-50 dark:bg-zinc-800 shrink-0 relative">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase italic truncate">{p.name}</h3>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{p.description}</p>
                        <p className="text-lg md:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-4 italic">{state.currency}{Number(p.price).toLocaleString()}</p>
                    </div>
                </button>
            ))}
        </div>
    ),

    // Template 10: Brutalist
    "catalog-10": ({ state, products, onProductClick }) => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10">
            {products.map((p: any) => (
                <div key={p.id} className="bg-white dark:bg-zinc-900 border-[4px] border-black dark:border-white p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-[0_0_0_0_#000] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer" onClick={() => onProductClick(p)}>
                    <div className="w-full aspect-[3/4] border-[3px] border-black dark:border-white overflow-hidden mb-5">
                        <img src={p.image} className="w-full h-full object-cover grayscale" />
                    </div>
                    <h3 className="font-black text-lg text-black dark:text-white uppercase italic">{p.name}</h3>
                    <p className="font-black text-2xl text-emerald-600 mt-2 italic">{state.currency}{Number(p.price).toLocaleString()}</p>
                </div>
            ))}
        </div>
    )
};

// ==========================================
// ABOUT TEMPLATES
// ==========================================

export const AboutTemplates: Record<string, React.FC<any>> = {
    "about-1": ({ state, section }) => {
        const textColor = state.textColor || "#111827";
        return (
            <div className="mt-20 p-10 md:p-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-black/[0.02] dark:border-white/5 shadow-sm text-center" style={{ color: textColor }}>
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-8" style={{ color: textColor }}>{section?.title || "Our Story"}</h2>
                <p className="max-w-2xl mx-auto text-lg opacity-60 font-medium leading-relaxed">
                    {section?.content?.text || state.aboutUs || "Quality is not an option, it's a standard."}
                </p>
            </div>
        );
    },
    "about-brutalist": ({ state, section }) => {
        return (
            <div className="mt-20 p-10 md:p-24 bg-black text-white rounded-none border-[4px] border-emerald-500">
                <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-12">THE MISSION.</h2>
                <p className="text-xl md:text-3xl font-bold uppercase leading-tight max-w-4xl text-emerald-500 italic">
                    {section?.content?.text || state.aboutUs}
                </p>
            </div>
        )
    }
};

// ==========================================
// FOOTER TEMPLATES
// ==========================================

export const FooterTemplates: Record<string, React.FC<any>> = {
    "footer-1": ({ state }) => {
        const accent = state.accentColor || "#10b981";
        const bgColor = state.bgColor || "#ffffff";
        const contrast = getContrastColor(bgColor);
        
        return (
            <footer className="p-10 md:p-20 mt-20 flex flex-col md:flex-row gap-10 justify-between w-full border-t border-black/5 dark:border-white/5" style={{ backgroundColor: `${accent}05`, color: contrast }}>
                <div className="space-y-4 max-w-sm">
                    <h3 className="text-xl font-black italic uppercase" style={{ color: contrast }}>{state.bizName}</h3>
                    <p className="font-medium text-sm leading-relaxed opacity-60" style={{ color: contrast }}>{state.tagline}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40" style={{ color: contrast }}>Powered by SwiftLink</p>
                </div>
                <div className="space-y-6 text-right">
                    <div className="flex gap-6 justify-end opacity-60">
                        <Instagram size={18} style={{ color: contrast }} />
                        <Globe size={18} style={{ color: contrast }} />
                        <Mail size={18} style={{ color: contrast }} />
                    </div>
                    <div className="space-y-1">
                        {state.phone && <p className="text-xs font-black uppercase tracking-widest" style={{ color: contrast }}>{state.phone}</p>}
                        {state.contactEmail && <p className="text-[10px] font-bold opacity-60" style={{ color: contrast }}>{state.contactEmail}</p>}
                    </div>
                </div>
            </footer>
        );
    }
};