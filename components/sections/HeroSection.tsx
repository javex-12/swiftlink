"use client";

import React, { useRef } from "react";
import { ArrowRight, Zap, Globe, Shield } from "lucide-react";
import type { PageSection, ShopState } from "@/lib/schema";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const HeroThree = dynamic(() => import("./HeroThree"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#020617] animate-pulse" />
});

export function HeroSection({ section, state }: { section: PageSection; state: ShopState }) {
  const content = section.content || {};
  // Use either the section's specific templateId OR fall back to the state's global preference
  const templateId = content.templateId || state.heroTemplateId || "hero-3d";
  
  const title = section.title || state.tagline || "Future of Commerce";
  const subtitle = section.subtitle || "Build your brand with the world's most powerful WhatsApp storefront.";
  const buttonText = content.buttonText || "Explore Catalog";

  // Shared Animation Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
  };

  if (templateId === "hero-3d") {
    return (
      <motion.section 
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full overflow-hidden bg-[#020617] min-h-[500px] md:min-h-[650px] flex flex-col items-center justify-center text-center px-6 md:px-12 group mb-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <Suspense fallback={null}>
              <HeroThree />
           </Suspense>
           <motion.div 
             style={{ x: useSpring(useTransform(mouseX, [0, 1000], [-20, 20])), y: useSpring(useTransform(mouseY, [0, 1000], [-20, 20])) }}
             className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen" 
           />
        </div>

        <div className="relative z-20 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Node Active</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-8 italic uppercase">
               {title.split(' ').map((word, i) => <span key={i} className={i % 2 === 1 ? "text-emerald-500 not-italic block md:inline" : ""}>{word}{' '}</span>)}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12">{subtitle}</p>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => document.getElementById("sl-catalog")?.scrollIntoView({ behavior: "smooth" })} className="px-10 py-5 bg-white text-[#020617] rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-emerald-400 transition-colors">
              {buttonText} <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    );
  }

  if (templateId === "hero-warp") {
    return (
      <motion.section 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative w-full overflow-hidden bg-[#020617] min-h-[500px] md:min-h-[600px] flex items-center px-8 md:px-20 mb-12 border border-white/5"
      >
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]" />
           <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:40px_40px] [perspective:1000px] [transform:rotateX(60deg)_translateY(-20%)]" />
        </div>
        <div className="relative z-10 max-w-2xl">
           <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-500 font-black text-xs uppercase tracking-[0.4em] mb-4">High-Velocity Commerce</motion.p>
           <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none mb-6 uppercase">{title}</h1>
           <p className="text-slate-400 text-lg mb-10 max-w-md">{subtitle}</p>
           <button onClick={() => document.getElementById("sl-catalog")?.scrollIntoView({ behavior: "smooth" })} className="px-8 py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-3">
              {buttonText} <Zap size={14} />
           </button>
        </div>
      </motion.section>
    );
  }

  // Fallback Template
  return (
    <motion.section 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="relative w-full overflow-hidden bg-slate-900 min-h-[400px] flex items-center px-12 mb-12"
      style={{ backgroundImage: `url(${content.image || ""})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10">
         <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">{title}</h1>
         <p className="text-slate-300 mt-4 max-w-md">{subtitle}</p>
         <button className="mt-8 px-6 py-3 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest">{buttonText}</button>
      </div>
    </motion.section>
  );
}