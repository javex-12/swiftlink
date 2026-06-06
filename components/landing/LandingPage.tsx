"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Store, Zap, Shield, MessageSquare, Layout, Clock, CheckCircle2, Menu, X, ChevronRight, Globe, Sparkles, Smartphone, Box, Truck, TrendingUp,
  Palette, Smartphone as MobileIcon, MousePointer2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LivePreview } from "./LivePreview";

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

<<<<<<< HEAD
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduce(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduce;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 767px)");
    if (!mq) return;
    const onChange = () => setIsMobile(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return isMobile;
}

const LightweightHeroVisual = () => (
  <div className="w-full h-full min-h-[340px] sm:min-h-[480px] relative flex items-center justify-center">
    <div className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.35),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(15,23,42,0.20),transparent_55%)]" />
    <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/0 via-white/0 to-white" />
    <div className="relative w-[220px] h-[220px] rounded-full bg-emerald-400/20 blur-2xl" />
  </div>
);

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Sun, Moon } from "lucide-react";

=======
>>>>>>> bb59a8930a25d30bfaf5f4c42445014216d33e3f
// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useSwiftLink();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
<<<<<<< HEAD
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 sm:px-6 py-4",
        isScrolled ? "bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-slate-100 dark:border-white/10 py-3 shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            SwiftLink
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors">How it works</a>
          <a href="#pricing" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors">Pricing</a>
          
          <div className="flex items-center gap-4 border-l border-slate-200 dark:border-white/10 pl-8">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-400"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link
              href="/signup"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all active:scale-95 shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-400"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-2 text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
=======
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-6",
        isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="SL" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-black tracking-widest text-white uppercase italic">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {["Features", "Workflow", "Pricing"].map(item => (
            <a 
              key={item}
              href={`#${item.toLowerCase()}`} 
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-500 transition-colors"
            >
              {item}
            </a>
          ))}
          <Link
            href="/signup"
            className="bg-emerald-500 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            Start Free
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
>>>>>>> bb59a8930a25d30bfaf5f4c42445014216d33e3f
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-black border-b border-slate-100 dark:border-white/10 px-6 py-8 md:hidden flex flex-col gap-5 shadow-xl"
          >
            <a href="#features" className="text-base font-bold text-slate-700 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-base font-bold text-slate-700 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="text-base font-bold text-slate-700 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
=======
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black border-b border-white/5 px-8 py-10 md:hidden flex flex-col gap-6 shadow-2xl"
          >
            {["Features", "Workflow", "Pricing"].map(item => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
>>>>>>> bb59a8930a25d30bfaf5f4c42445014216d33e3f
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
  <section className="relative min-h-screen flex items-center px-6 overflow-hidden bg-black pt-20">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
    
    <div className="max-w-[1400px] mx-auto w-full relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Content */}
        <div className="text-center lg:text-left">
          <FadeUp delay={0}>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-10">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Built for Nigerian Brands</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="text-5xl sm:text-7xl lg:text-[100px] font-black text-white leading-[0.9] tracking-tighter mb-10 uppercase italic">
              Sell on <br />
              <span className="text-emerald-500">WhatsApp</span> <br />
              <span className="opacity-40">like a Pro.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 mb-12 font-medium leading-relaxed uppercase tracking-wide">
              The easiest way to build a professional storefront and manage your orders. Fast, sleek, and designed for your phone.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-5">
              <Link
                href="/signup"
                className="bg-emerald-500 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-emerald-500/20"
              >
                Create Store <ArrowRight size={16} />
              </Link>
              <Link
                href="/signup?mode=login"
                className="bg-white/5 text-white border border-white/10 px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                Merchant Login
              </Link>
            </div>
          </FadeUp>
        </div>

        {/* Right: Preview Visual */}
        <FadeUp delay={0.2} className="relative flex justify-center h-[600px] sm:h-[700px] items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none scale-150" />
            <div className="scale-90 sm:scale-100">
               <LivePreview />
            </div>
            
            {/* Floating Terminal Badges */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="absolute top-[20%] right-[-5%] bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl z-20 hidden sm:flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Sales</p>
                <p className="text-xl font-black text-white italic tracking-tighter">₦2.4M+</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="absolute bottom-[20%] left-[-5%] bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl z-20 hidden sm:flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Live Tracking</p>
                <p className="text-xl font-black text-white italic tracking-tighter">Active</p>
              </div>
            </motion.div>
        </FadeUp>
      </div>
    </div>
  </section>
);

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const features = [
    { icon: Layout, title: "Visual Designer", description: "Design with 20+ cinematic templates. Complete control over your store's look.", className: "md:col-span-2 md:row-span-2 bg-white text-black" },
    { icon: Sparkles, title: "Easy Uploads", description: "Add your products in seconds and let us handle the styling.", className: "bg-white/5 text-white border-white/10" },
    { icon: Truck, title: "Order Tracking", description: "Keep customers happy with real-time updates on their package.", className: "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20" },
    { icon: Shield, title: "Manage Many", description: "Run multiple brands from a single professional dashboard.", className: "bg-white/5 text-white border-white/10" },
    { icon: Globe, title: "Global Reach", description: "Sell to anyone, anywhere with localized currency and fast checkout.", className: "md:col-span-2 bg-black text-white border-white/10" },
  ];

  return (
    <section id="features" className="py-32 px-6 bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-24 text-center lg:text-left">
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-6 block">Professional Infrastructure</span>
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none uppercase italic">
            Powerful tools <br />
            <span className="opacity-30">built for your growth.</span>
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
                "p-10 rounded-[2.5rem] border border-transparent flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 group min-h-[350px] cursor-pointer shadow-sm",
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
             <div className="relative z-10 bg-white dark:bg-zinc-900 p-4 rounded-[3.5rem] shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1556742049-13d736c7a91d?auto=format&fit=crop&q=80&w=800" className="w-[300px] h-[600px] object-cover rounded-[3rem] opacity-80" alt="Editor" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white">
                   <Palette size={48} className="mb-6 text-emerald-500" />
                   <h4 className="text-2xl font-black italic uppercase mb-2">Editor Core</h4>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">24+ High-Fidelity Templates</p>
                </div>
             </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 mb-8 block">Operational Flow</span>
            <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none mb-16 uppercase italic">
              Simple. Fast. <br />
              <span className="text-emerald-500">Effective.</span>
            </h2>
            
            <div className="space-y-16">
              {[
                { n: "01", t: "Deploy Hub", d: "Initialize your workspace. Your professional storefront is live in 60s." },
                { n: "02", t: "Sync Products", d: "Upload your catalog. Our smart relay engine handles the aesthetics." },
                { n: "03", t: "Start Selling", d: "Share your link on WhatsApp and watch your orders grow." }
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="flex gap-10 group cursor-pointer">
                  <span className="text-5xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors duration-700 italic leading-none">{step.n}</span>
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
    { name: "Starter", price: "Free", desc: "Try out the basic tools for your brand.", feat: ["5 Active Products", "Standard Styles", "SwiftLink Branding", "WhatsApp Orders"] },
    { name: "Pro", price: "₦5K", period: "/mo", desc: "Elite aesthetics for growing vendors.", feat: ["Unlimited Products", "24 Cinematic Styles", "Live Map Tracking", "Sales Insights", "Custom Link"], featured: true },
    { name: "Enterprise", price: "₦15K", period: "/mo", desc: "Manage multi-brand networks easily.", feat: ["Multi-Store Hub", "Verified Badge", "Priority Relay", "Custom API Nodes", "Transfer Engine"] },
  ];

  return (
    <section id="pricing" className="py-32 px-6 bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-32">
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-6 block">Access Tiers</span>
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none uppercase italic">
            Start small, <br />
            <span className="opacity-30">grow big.</span>
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
                <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-8 opacity-40">{p.name} Plan</p>
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
                Access Dashboard
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
        className="bg-emerald-500 rounded-[3rem] sm:rounded-[4rem] p-16 sm:p-24 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20 group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10">
          <span className="text-white text-[9px] font-black uppercase tracking-[0.5em] mb-8 block italic">Ready for Deployment?</span>
          <h2 className="text-5xl sm:text-8xl font-black text-white mb-10 tracking-tighter leading-none italic uppercase">
            Build your dream <br />
            store today.
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
              Merchant Login
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
                The easiest way for Nigerian brands to build professional WhatsApp storefronts and manage orders without the stress.
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
