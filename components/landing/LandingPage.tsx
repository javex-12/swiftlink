"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Store, Zap, Shield, MessageSquare, Layout, Clock, CheckCircle2, Menu, X, ChevronRight, Globe, Sparkles, Smartphone, Box, Truck
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { AnimatedText } from "./AnimatedText";
import { LivePreview } from "./LivePreview";

const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-6", isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm" : "bg-transparent")}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
          <span className="text-xl font-black tracking-tight text-slate-900 uppercase italic">SwiftLink</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {["Features", "Workflow", "Pricing"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">{item}</a>
          ))}
          <Link href="/signup" className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl active:scale-95">Get Started</Link>
        </div>
        <button className="md:hidden text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-8 md:hidden flex flex-col gap-6 shadow-2xl">
            {["Features", "Workflow", "Pricing"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-black uppercase tracking-widest text-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{item}</a>
            ))}
            <Link href="/signup" className="bg-emerald-500 text-white py-5 rounded-2xl text-center font-black text-xs uppercase tracking-widest" onClick={() => setIsMobileMenuOpen(false)}>Get Started Free</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => (
  <section className="relative h-screen w-full flex items-center px-6 overflow-hidden bg-white">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.05),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.03),transparent_40%)]" />
    <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-20 items-center relative z-10">
      <div>
        <FadeUp delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600">Enterprise Infrastructure</span>
          </div>
          <h1 className="text-6xl sm:text-8xl 2xl:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter mb-10 uppercase">
            SELL ON<br />WHATSAPP<br /><span className="text-emerald-500 italic">LIKE A PRO.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-md mb-12 font-medium leading-relaxed">
            The high-performance workspace for Nigerian entrepreneurs. Built for speed, scale, and your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup" className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95">Start Selling Now <ArrowRight size={18} /></Link>
            <Link href="/signup?mode=login" className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center active:scale-95">Open Dashboard</Link>
          </div>
        </FadeUp>
        <FadeUp delay={0.4} className="mt-16 flex items-center gap-10 opacity-40">
           {["60s Setup", "0% Fees", "Live Tracking"].map(stat => (
             <div key={stat} className="flex flex-col">
               <span className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">{stat.split(' ')[0]}</span>
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{stat.split(' ').slice(1).join(' ')}</span>
             </div>
           ))}
        </FadeUp>
      </div>
      <div className="hidden lg:block relative h-[600px] w-full">
         <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full" />
         <ThreeScene />
      </div>
    </div>
  </section>
);

const Features = () => {
  const items = [
    { icon: Store, title: "Pro Catalog", desc: "High-performance listings that convert instantly.", className: "md:col-span-2 bg-slate-900 text-white" },
    { icon: Zap, title: "Fast Setup", desc: "Your store is live in under 60 seconds.", className: "bg-emerald-50 text-emerald-900" },
    { icon: Truck, title: "Live Maps", desc: "Real-time dispatch tracking for your customers.", className: "bg-slate-50" },
    { icon: Shield, title: "Secure Sync", desc: "Automated inventory management across devices.", className: "md:col-span-2 bg-white border border-slate-100" },
  ];
  return (
    <section id="features" className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Workspace Capabilities</span>
          <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Everything you need.<br />None of the noise.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((f, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className={cn("p-10 rounded-[3rem] flex flex-col justify-between h-[340px] transition-all", f.className)}>
              <f.icon size={32} strokeWidth={2.5} />
              <div>
                <h3 className="text-2xl font-black uppercase italic mb-3">{f.title}</h3>
                <p className="text-sm font-medium leading-relaxed opacity-60">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  return (
    <main className="bg-white min-h-screen text-slate-900 selection:bg-emerald-500/30">
      <Navbar />
      <Hero />
      <Features />
      <footer className="py-20 px-6 border-t border-slate-50 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
           <span className="text-[10px] font-black uppercase tracking-[0.4em]">© 2026 SwiftLink Workspace</span>
           <div className="flex gap-10">
              {["Twitter", "Instagram", "WhatsApp"].map(s => <span key={s} className="text-[10px] font-black uppercase tracking-[0.4em] cursor-pointer hover:text-emerald-500 transition-colors">{s}</span>)}
           </div>
        </div>
      </footer>
    </main>
  );
}