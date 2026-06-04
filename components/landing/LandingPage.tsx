"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Store, Zap, Shield, MessageSquare, Layout, Clock, CheckCircle2, Menu, X, ChevronRight, Globe, Sparkles, Smartphone, Box, Truck, TrendingUp,
  Palette, Typography, Layers, Image as ImageIcon, Camera, ShoppingBag, CreditCard, Star, Heart, Share2, Search, Filter, Monitor, Smartphone as Mobile
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Fade-Up helper ───────────────────────────────────────────────────────────
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

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-6",
        isScrolled ? "bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 py-4" : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="SL" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-900 dark:text-white uppercase italic">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {["Templates", "Features", "Pricing"].map(item => (
            <a 
              key={item}
              href={`#${item.toLowerCase()}`} 
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
            >
              {item}
            </a>
          ))}
          <Link
            href="/signup"
            className="bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all active:scale-95"
          >
            Start Free
          </Link>
        </div>

        <button className="md:hidden text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-black border-b border-slate-100 dark:border-white/5 px-8 py-10 md:hidden flex flex-col gap-6 shadow-2xl"
          >
            {["Templates", "Features", "Pricing"].map(item => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <Link
              href="/signup"
              className="bg-emerald-500 text-white py-4 rounded-xl text-center font-black text-xs uppercase tracking-widest"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden bg-white dark:bg-black pt-20">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <FadeUp delay={0}>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Cinematic Storefronts for WhatsApp</span>
        </div>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-8 italic uppercase">
          Build a brand <br />
          <span className="text-emerald-500">not just a store.</span>
        </h1>
      </FadeUp>
      <FadeUp delay={0.2}>
        <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          The ultimate collection of high-fidelity templates designed to make your products look expensive and your sales grow faster.
        </p>
      </FadeUp>
      <FadeUp delay={0.3}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto bg-slate-900 dark:bg-emerald-500 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl">
            Choose Your Style
          </Link>
          <a href="#templates" className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95">
            View Templates
          </a>
        </div>
      </FadeUp>
    </div>
  </section>
);

// ─── Templates Section (The "20 Template Section") ───────────────────────────
const Templates = () => {
  const styles = [
    { name: "OLED Minimal", desc: "Pure blacks and emerald glows.", accent: "bg-emerald-500" },
    { name: "Tokyo Night", desc: "Neon accents and high contrast.", accent: "bg-purple-500" },
    { name: "Soft Linen", desc: "Warm whites and elegant serifs.", accent: "bg-amber-100" },
    { name: "Cyberpunk", desc: "Bold typography and glitches.", accent: "bg-cyan-400" },
    { name: "Vogue Elite", desc: "Fashion-first editorial layout.", accent: "bg-rose-500" },
    { name: "Industrial", desc: "Raw textures and brutalist vibes.", accent: "bg-slate-400" },
    { name: "Glassmorphism", desc: "Layers of blur and transparency.", accent: "bg-white/20" },
    { name: "Organic Root", desc: "Earthy tones and natural flow.", accent: "bg-orange-700" },
    { name: "Arctic Ice", desc: "Frosted visuals and cool blues.", accent: "bg-blue-200" },
    { name: "Royal Gold", desc: "Luxury blacks with gold details.", accent: "bg-yellow-600" },
    { name: "Mono Bold", desc: "Black and white power design.", accent: "bg-white" },
    { name: "Candy Pop", desc: "Playful colors and rounded shapes.", accent: "bg-pink-400" },
    { name: "Modernist", desc: "Clean lines and perfect grid.", accent: "bg-slate-900" },
    { name: "Neon Jungle", desc: "Dark greens with vibrant pops.", accent: "bg-lime-400" },
    { name: "Slate Pro", desc: "The ultimate business aesthetic.", accent: "bg-slate-600" },
    { name: "Velvet Red", desc: "Deep reds for high-end luxury.", accent: "bg-red-800" },
    { name: "Mint Fresh", desc: "Light, airy, and clean visuals.", accent: "bg-emerald-100" },
    { name: "Solar Flare", desc: "High energy oranges and yellows.", accent: "bg-orange-500" },
    { name: "Deep Sea", desc: "Calming blues and deep depth.", accent: "bg-indigo-900" },
    { name: "Cloud Nine", desc: "Soft shadows and airy layout.", accent: "bg-sky-50" }
  ];

  return (
    <section id="templates" className="py-24 sm:py-32 px-6 bg-slate-50 dark:bg-[#050505]">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-20 text-center lg:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 block">The Collection</span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase mb-6">
            Elite <br />
            <span className="opacity-30">Styles.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg font-medium">Choose from 20 cinematic styles, each engineered for conversion and high-end brand identity.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {styles.map((style, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:border-emerald-500/30 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl"
            >
              <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-black">
                <div className={cn("absolute inset-0 opacity-20 group-hover:scale-110 transition-transform duration-700", style.accent)} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-32 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-white/10 group-hover:-translate-y-2 transition-transform duration-500 flex flex-col p-3 gap-2">
                      <div className="w-full h-8 bg-slate-100 dark:bg-white/5 rounded-md" />
                      <div className="w-2/3 h-2 bg-slate-100 dark:bg-white/5 rounded-full" />
                      <div className="w-full aspect-square bg-slate-50 dark:bg-white/5 rounded-lg" />
                   </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{style.name}</h3>
                   <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Pro</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
                   {style.desc}
                </p>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-black uppercase text-slate-400">Apply Style</span>
                   <ArrowRight size={14} className="text-emerald-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Features (Bento) ─────────────────────────────────────────────────────────
const Features = () => {
  const f = [
    { t: "Visual Engine", d: "Real-time editor with 100+ customization nodes for your brand.", icon: Palette, c: "bg-slate-900 text-white md:col-span-2" },
    { t: "Live Relay", d: "Instant WhatsApp order notifications and customer sync.", icon: Zap, c: "bg-emerald-500 text-white" },
    { t: "Global Scale", d: "Sell to anyone, anywhere with localized currency support.", icon: Globe, c: "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10" },
    { t: "Secure Core", d: "Enterprise-grade security for your business data and assets.", icon: Shield, c: "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10" },
    { t: "Social Pulse", d: "Built-in review system to build trust with new customers.", icon: MessageSquare, c: "bg-white dark:bg-black text-slate-900 dark:text-white border-slate-200 dark:border-white/10 md:col-span-2" }
  ];

  return (
    <section id="features" className="py-24 sm:py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-20 sm:mb-32">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6 block">Capabilities</span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase mb-6">
            The Infrastructure <br />
            <span className="opacity-30">of Growth.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {f.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn("p-10 rounded-[3rem] border border-transparent flex flex-col justify-between min-h-[350px] group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1", item.c)}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                 <item.icon size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-4">{item.t}</h3>
                <p className="text-sm font-medium opacity-70 leading-relaxed uppercase tracking-widest">{item.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTA = () => (
  <section className="py-24 sm:py-32 px-6 bg-white dark:bg-black relative">
    <div className="max-w-[1200px] mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500 rounded-[4rem] p-16 sm:p-24 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20 group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10">
          <span className="text-white text-xs font-bold uppercase tracking-[0.4em] mb-8 block italic">Ready to scale?</span>
          <h2 className="text-4xl sm:text-8xl font-black text-white mb-10 tracking-tighter leading-none italic uppercase">
            Start Your <br />
            Success Story.
          </h2>
          <Link
            href="/signup"
            className="inline-flex px-12 py-6 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 shadow-2xl mt-12"
          >
            Access Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="py-24 px-6 bg-slate-50 dark:bg-black border-t border-slate-100 dark:border-white/5">
    <div className="max-w-[1400px] mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24 text-center md:text-left">
          <div className="col-span-1 md:col-span-2 space-y-8">
             <div className="flex items-center justify-center md:justify-start gap-3">
               <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                 <img src="/logo.png" alt="SL" className="w-5 h-5 object-contain" />
               </div>
               <span className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">SwiftLink<span className="text-emerald-500">Pro</span></span>
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto md:mx-0 leading-loose uppercase text-[10px] tracking-widest">
                The high-performance command center for modern WhatsApp commerce.
             </p>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-8">Node</h4>
             <ul className="space-y-5">
                {["Templates", "Features", "Pricing"].map(item => (
                   <li key={item}><a href={`#${item.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">{item}</a></li>
                ))}
             </ul>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-8">Mesh</h4>
             <ul className="space-y-5">
                <li><Link href="/terms" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@swiftlink.pro" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">Support</a></li>
             </ul>
          </div>
       </div>
       <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-slate-200 dark:border-white/5 gap-6">
          <p className="text-slate-400 dark:text-slate-700 text-[8px] font-black uppercase tracking-[0.4em]">© 2026 SwiftLink Workspace.</p>
          <div className="flex gap-10">
             {["Twitter", "Instagram", "WhatsApp"].map(social => (
                <span key={social} className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-700 cursor-pointer hover:text-emerald-500 transition-all">{social}</span>
             ))}
          </div>
       </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <main className="bg-white dark:bg-black min-h-screen text-slate-900 dark:text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      <Navbar />
      <Hero />
      <Templates />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}