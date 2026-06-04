"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Store, Zap, Shield, MessageSquare, Layout, Clock, CheckCircle2, Menu, X, ChevronRight, Globe, Sparkles, Smartphone, Box, Truck, TrendingUp
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { LivePreview } from "./LivePreview";
import { ThreeDBackground } from "../ThreeDBackground";

const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[500px]" />,
});

// ─── Fade-Up helper ───────────────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
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
        isScrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-2xl">
            <img src="/logo.png" alt="SL" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-black tracking-[0.2em] text-white uppercase italic">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          {["Features", "Workflow", "Pricing"].map(item => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`} 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-500 transition-colors"
            >
              {item}
            </a>
          ))}
          <Link
            href="/signup"
            className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl"
          >
            Deploy Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black border-b border-white/5 px-8 py-10 md:hidden flex flex-col gap-6 shadow-2xl"
          >
            {["Features", "Workflow", "Pricing"].map(item => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`} 
                className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400"
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
const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center px-6 overflow-hidden bg-black pt-20">
      <ThreeDBackground type={1} accentColor="#10b981" />
      
      <div className="max-w-[1400px] mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <FadeUp delay={0}>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-10">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Enterprise Protocol v2.6</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-black text-white leading-[0.9] tracking-tighter mb-10 uppercase italic">
                Elite <span className="text-emerald-500">Commerce</span> <br />
                <span className="opacity-40">Infrastructure.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 mb-12 font-medium leading-relaxed uppercase tracking-wide">
                The high-fidelity command center for Nigerian brands. Build, sync, and dominate with cinematic precision.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-5">
                <Link
                  href="/signup"
                  className="bg-emerald-500 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-emerald-500/20"
                >
                  Initiate Setup <ArrowRight size={16} />
                </Link>
                <Link
                  href="/signup?mode=login"
                  className="bg-white/5 text-white border border-white/10 px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  Operator Login
                </Link>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.4} className="mt-16 flex items-center justify-center lg:justify-start gap-12 opacity-30">
               {[
                 { val: "60s", lab: "Deploy" },
                 { val: "0.0%", lab: "Fees" },
                 { val: "Live", lab: "Nodes" }
               ].map(stat => (
                 <div key={stat.lab} className="flex flex-col">
                    <span className="text-2xl font-black text-white tracking-tighter italic">{stat.val}</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.lab}</span>
                 </div>
               ))}
            </FadeUp>
          </div>

          {/* Right: Visual */}
          <FadeUp delay={0.2} className="relative hidden lg:flex justify-center h-[700px] items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
            <ThreeScene />
            
            {/* Floating Terminal Badges */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="absolute top-[20%] right-[-5%] bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl z-20 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Growth Vector</p>
                <p className="text-xl font-black text-white italic tracking-tighter">+142%</p>
              </div>
            </motion.div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const features = [
    { icon: Layout, title: "Cinematic Editor", description: "Design with 10+ high-fidelity templates. Complete control over visual aesthetics.", className: "md:col-span-2 md:row-span-2 bg-white text-black" },
    { icon: Sparkles, title: "Smart Relay", description: "Upload once, sync everywhere. Auto-generated product nodes.", className: "bg-white/5 text-white border-white/10" },
    { icon: Truck, title: "Logistics Node", description: "Real-time relay tracking. Live map telemetry for peers.", className: "bg-emerald-500 text-white" },
    { icon: Shield, title: "Multi-Node", description: "Manage multiple brand clusters from a single command center.", className: "bg-white/5 text-white border-white/10" },
    { icon: Globe, title: "Global Mesh", description: "Verified customer proof mesh with real-time social relay.", className: "md:col-span-2 bg-black text-white border-white/10" },
  ];

  return (
    <section id="features" className="py-32 px-6 bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-24">
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-6 block">Core Protocols</span>
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none uppercase italic">
            Engineered for <br />
            <span className="opacity-30">Pure Performance.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-12 rounded-[2.5rem] border border-transparent flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 group min-h-[350px] cursor-pointer",
                f.className
              )}
            >
              <div>
                 <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 bg-black/5 dark:bg-white/10 shadow-xl">
                    <f.icon size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight italic mb-4">{f.title}</h3>
                 <p className="text-[13px] font-medium leading-relaxed opacity-60 uppercase tracking-wide">
                    {f.description}
                 </p>
              </div>
              <div className="mt-12 flex justify-end">
                 <ArrowRight className="opacity-20 group-hover:opacity-100 group-hover:translate-x-3 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Workflow ─────────────────────────────────────────────────────────────────
const Workflow = () => {
  return (
    <section id="workflow" className="py-32 px-6 bg-black relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_70%)]" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-32 items-center">
          <div className="flex justify-center relative order-2 lg:order-1 scale-90 sm:scale-100">
             <div className="absolute -inset-20 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
             <LivePreview />
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 mb-8 block">Operational Flow</span>
            <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none mb-16 uppercase italic">
              Frictionless <br />
              <span className="text-emerald-500">Execution.</span>
            </h2>
            
            <div className="space-y-16">
              {[
                { n: "01", t: "Deploy Hub", d: "Initialize your workspace. Professional UI is live in 60s." },
                { n: "02", t: "Sync Catalog", d: "Bulk relay product nodes with cinematic high-res galleries." },
                { n: "03", t: "Monitor Relay", d: "Manage fulfillment via live telemetry and real-time map data." }
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="flex gap-10 group cursor-pointer">
                  <span className="text-5xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors duration-700 italic">{step.n}</span>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic">{step.t}</h3>
                    <p className="text-[12px] font-medium text-slate-500 leading-relaxed uppercase tracking-wider">{step.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
const Pricing = () => {
  const plans = [
    { name: "Starter", price: "Free", desc: "Test the protocol with core tools.", feat: ["5 Active Nodes", "Standard UI", "Shared Relay", "WhatsApp Link"] },
    { name: "Pro", price: "₦5K", period: "/mo", desc: "Elite aesthetics for growing brands.", feat: ["Unlimited Nodes", "Cinematic UI", "Live Telemetry", "Advanced Intel", "Custom Node"], featured: true },
    { name: "Enterprise", price: "₦15K", period: "/mo", desc: "Manage multi-brand mesh networks.", feat: ["Multi-Store Hub", "Verified Mesh Proof", "Priority Relay", "Custom API Nodes", "Transfer Engine"] },
  ];

  return (
    <section id="pricing" className="py-32 px-6 bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-32">
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-6 block">Access Tiers</span>
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none uppercase italic">
            Choose your <br />
            <span className="opacity-30">Security Level.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-[3rem] p-12 border transition-all duration-700 relative overflow-hidden flex flex-col justify-between min-h-[600px] cursor-pointer",
                p.featured ? "bg-white text-black border-white shadow-[0_0_100px_rgba(255,255,255,0.1)] scale-105 z-10" : "bg-white/5 text-white border-white/10 hover:border-white/20"
              )}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-8 opacity-40">{p.name} Protocol</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-black tracking-tighter italic">{p.price}</span>
                  {p.period && <span className="text-xs font-black uppercase tracking-widest opacity-40">{p.period}</span>}
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest leading-loose mb-12 opacity-60">{p.desc}</p>
                
                <div className="space-y-5 mb-16">
                   {p.feat.map(f => (
                     <div key={f} className="flex items-center gap-4">
                        <CheckCircle2 size={16} className={p.featured ? "text-emerald-500" : "text-emerald-500/50"} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{f}</span>
                     </div>
                   ))}
                </div>
              </div>

              <Link
                href={`/signup?mode=signup&plan=${p.name.toLowerCase()}`}
                className={cn(
                  "w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-center active:scale-95",
                  p.featured ? "bg-black text-white hover:bg-emerald-500" : "bg-white text-black hover:bg-emerald-400 shadow-2xl"
                )}
              >
                Access Protocol
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTA = () => (
  <section className="py-32 px-6 bg-black relative">
    <div className="max-w-[1200px] mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500 rounded-[4rem] p-16 sm:p-24 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20 group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10">
          <span className="text-white text-[9px] font-black uppercase tracking-[0.5em] mb-8 block">Ready for Deployment?</span>
          <h2 className="text-5xl sm:text-8xl font-black text-white mb-10 tracking-tighter leading-none italic uppercase">
            Initialize your <br />
            Command Center.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16">
            <Link
              href="/signup?mode=signup"
              className="w-full sm:w-auto px-12 py-6 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Get Started Now
            </Link>
            <Link
              href="/signup?mode=login"
              className="w-full sm:w-auto px-12 py-6 bg-white/20 text-white border border-white/30 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
            >
              Operator Log
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="py-24 px-6 bg-black border-t border-white/5">
    <div className="max-w-[1400px] mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2 space-y-8">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                 <img src="/logo.png" alt="SL" className="w-5 h-5 object-contain" />
               </div>
               <span className="text-xl font-black text-white uppercase italic tracking-tighter">SwiftLink<span className="text-emerald-500">Pro</span></span>
             </div>
             <p className="text-slate-500 font-medium max-w-sm leading-loose uppercase text-[10px] tracking-widest">
                The high-performance command center for modern WhatsApp commerce.
             </p>
          </div>
          <div>
             <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white mb-8">Node</h4>
             <ul className="space-y-5">
                {["Features", "Workflow", "Pricing"].map(item => (
                   <li key={item}><a href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">{item}</a></li>
                ))}
             </ul>
          </div>
          <div>
             <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white mb-8">Mesh</h4>
             <ul className="space-y-5">
                <li><Link href="/terms" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">Protocol Terms</Link></li>
                <li><a href="mailto:ops@swiftlink.pro" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-colors">Ops Support</a></li>
             </ul>
          </div>
       </div>
       <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-6">
          <p className="text-slate-700 text-[8px] font-black uppercase tracking-[0.4em]">© 2026 SwiftLink Workspace Protocol.</p>
          <div className="flex gap-10">
             {["X.COM", "INSTAGRAM", "WHATSAPP"].map(social => (
                <span key={social} className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-700 cursor-pointer hover:text-emerald-500 transition-all">{social}</span>
             ))}
          </div>
       </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <main className="bg-black min-h-screen text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
