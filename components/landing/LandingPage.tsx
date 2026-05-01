"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Store, 
  Zap, 
  Shield, 
  MessageSquare, 
  Layout, 
  Clock, 
  CheckCircle2, 
  Menu, 
  X,
  ChevronRight,
  Globe,
  Sparkles,
  Smartphone,
  Box,
  Truck
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { AnimatedText } from "./AnimatedText";
import { LivePreview } from "./LivePreview";

const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px]" />,
});

// ─── Fade-Up helper (no overflow-hidden clipping) ─────────────────────────────
const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

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
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 sm:px-6 py-4",
        isScrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
          <span className="text-xl font-black tracking-tight text-slate-900">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-slate-600 hover:text-emerald-500 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-600 hover:text-emerald-500 transition-colors">How it works</a>
          <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-emerald-500 transition-colors">Pricing</a>
          <Link
            href="/signup"
            className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 px-6 py-6 md:hidden flex flex-col gap-5 shadow-xl"
          >
            <a href="#features" className="text-base font-bold text-slate-700" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-base font-bold text-slate-700" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="text-base font-bold text-slate-700" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
            <Link
              href="/signup"
              className="bg-emerald-500 text-white py-4 rounded-2xl text-center font-black text-base active:scale-95 transition-transform"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = () => {
  const scrollToDemo = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };
  const isMobile = useIsMobile();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6 overflow-hidden flex items-center bg-[#fafafa]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40%] aspect-square bg-emerald-100/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[35%] aspect-square bg-blue-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Left: Copy ─────────────────────────────── */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <FadeUp delay={0}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-full mb-8">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Next-Gen E-Commerce</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-tight mb-8">
                Sell on <span className="text-emerald-500">WhatsApp</span> <br className="hidden sm:block" />
                <span className="italic font-serif opacity-90">like a Pro.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-lg sm:text-xl text-slate-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                The high-performance storefront for Nigerian entrepreneurs. 
                Fast, professional, and built for your phone.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="bg-slate-900 text-white px-8 py-5 rounded-2xl text-base font-black hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-slate-200"
                >
                  Start Selling Now <ArrowRight size={18} />
                </Link>
                <button
                  onClick={scrollToDemo}
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-slate-700 bg-white border border-slate-200 font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Watch Demo <Sparkles size={18} className="text-emerald-500" />
                </button>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.4} className="mt-12 opacity-50 flex items-center justify-center lg:justify-start gap-8">
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">60s</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Setup Time</span>
               </div>
               <div className="w-px h-8 bg-slate-200" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">0%</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Transaction Fee</span>
               </div>
               <div className="w-px h-8 bg-slate-200" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">Live</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tracking</span>
               </div>
            </FadeUp>
          </div>

          {/* ── Right: Hero Visual ───────── */}
          <FadeUp delay={0.1} className="relative order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-[500px] aspect-square lg:aspect-auto lg:h-[700px]">
              {/* Background Glass Plate */}
              <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] -rotate-2 transform hidden lg:block" />
              
              <div className="relative h-full w-full flex items-center justify-center overflow-visible">
                {isMobile || reduceMotion ? <LightweightHeroVisual /> : <ThreeScene />}

                {/* Modern Floating Badges */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute top-[15%] right-[2%] bg-white border border-slate-100 p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex items-center gap-3 z-30"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase leading-none">Order Received</p>
                    <p className="text-[12px] font-black text-emerald-500 mt-1">₦72,500.00</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-[20%] left-[2%] bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 z-30"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Truck size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">Tracking</p>
                    <p className="text-[11px] font-black mt-1">Driver En-Route</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

// ─── Features (Bento Style) ───────────────────────────────────────────────────
const Features = () => {
  const features = [
    { icon: Store, title: "Modern Catalog", description: "Clean, high-performance product listings that convert visitors into customers instantly.", className: "md:col-span-2 md:row-span-2 bg-slate-900 text-white" },
    { icon: Zap, title: "Instant Setup", description: "Zero technical skills needed. Just name your store and go.", className: "bg-white" },
    { icon: Truck, title: "Live Tracking", description: "Real-time dispatch tracking. Customers watch their package move on a map.", className: "bg-emerald-50" },
    { icon: Shield, title: "Reliable Sync", description: "Your inventory stays updated across all devices automatically.", className: "bg-white" },
    { icon: Smartphone, title: "Mobile Editor", description: "Update your store, add products, and manage orders from anywhere.", className: "md:col-span-2 bg-white border-2 border-slate-100" },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">
            The Command Center
          </motion.span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Everything you need,<br />none of the noise.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "p-8 md:p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-2xl group",
                f.className
              )}
            >
              <div>
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110", f.className?.includes("slate-900") ? "bg-white/10 text-white" : "bg-slate-900 text-white")}>
                    <f.icon size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight italic mb-3">{f.title}</h3>
                 <p className={cn("text-base font-medium leading-relaxed opacity-70", f.className?.includes("slate-900") ? "text-slate-300" : "text-slate-500")}>
                    {f.description}
                 </p>
              </div>
              <div className="mt-12 flex justify-end">
                 <ArrowRight className="opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    { number: "01", title: "Launch your Hub", description: "Name your business and set your WhatsApp number. Your professional link is live instantly." },
    { number: "02", title: "Showcase Products", description: "Add items with high-res images and variations. Organise your catalog into smart, shareable categories." },
    { number: "03", title: "Close & Track", description: "Customers order via WhatsApp. You manage the dispatch and they watch the delivery live on a map." },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
          {/* Phone mockup with better styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center relative order-2 lg:order-1"
          >
            <div className="relative group">
              <div className="absolute -inset-10 bg-emerald-100/50 rounded-full blur-[100px] -z-10 group-hover:bg-emerald-200/50 transition-colors" />
              <div className="scale-90 sm:scale-100 transition-transform duration-700 group-hover:scale-[1.02]">
                 <LivePreview />
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <div className="order-1 lg:order-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 block">The Workflow</span>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-12 italic uppercase">
              Pure Frictionless<br />Commerce.
            </h2>
            <div className="space-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex gap-8 group"
                >
                  <div className="flex-shrink-0">
                    <span className="text-5xl font-black text-slate-200 group-hover:text-emerald-500 transition-colors duration-500 leading-none tabular-nums tracking-tighter">{step.number}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{step.title}</h3>
                    <p className="text-base text-slate-500 font-medium leading-relaxed">{step.description}</p>
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
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for testing the waters.",
      features: ["5 Live Products", "Basic Tracking", "SwiftLink Branding", "WhatsApp Checkout"],
      cta: "Start Free",
      variant: "white"
    },
    {
      name: "Pro",
      price: "₦5,000",
      period: "/mo",
      description: "Our most popular choice for growing stores.",
      features: ["Unlimited Products", "Custom Branding", "Live Map Tracking", "Detailed Analytics", "Priority Support"],
      cta: "Upgrade to Pro",
      featured: true,
      variant: "black"
    },
    {
      name: "Business",
      price: "₦15,000",
      period: "/mo",
      description: "Enterprise features for established brands.",
      features: ["Multi-Store Management", "Team Collaboration", "Payment Gateway Integration", "Custom Domain API", "API Access"],
      cta: "Contact Sales",
      variant: "white"
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">
            Pricing
          </motion.span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Simple plans for<br />ambitious brands.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "rounded-[3rem] p-10 flex flex-col justify-between transition-all duration-500 border relative overflow-hidden",
                p.variant === "black" ? "bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.05] z-10" : "bg-[#f8fafc] text-slate-900 border-slate-100"
              )}
            >
              {p.featured && (
                <div className="absolute top-6 right-8">
                   <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-4", p.variant === "black" ? "text-emerald-400" : "text-slate-400")}>{p.name}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl sm:text-5xl font-black tracking-tighter">{p.price}</span>
                  {p.period && <span className={cn("text-sm font-bold opacity-60", p.variant === "black" ? "text-slate-400" : "text-slate-500")}>{p.period}</span>}
                </div>
                <p className={cn("text-sm font-medium leading-relaxed mb-10", p.variant === "black" ? "text-slate-400" : "text-slate-500")}>{p.description}</p>
                
                <div className="space-y-4 mb-12">
                   {p.features.map(f => (
                     <div key={f} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className={p.variant === "black" ? "text-emerald-400" : "text-emerald-500"} />
                        <span className="text-sm font-bold opacity-80">{f}</span>
                     </div>
                   ))}
                </div>
              </div>

              <Link
                href={`/signup?mode=signup&plan=${p.name.toLowerCase()}`}
                className={cn(
                  "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-center active:scale-95",
                  p.variant === "black" ? "bg-white text-slate-900 hover:bg-emerald-400" : "bg-slate-900 text-white hover:bg-emerald-500 shadow-lg"
                )}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="py-24 sm:py-32 px-4 sm:px-6 bg-white overflow-hidden relative">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full">
       <div className="absolute top-[20%] left-[-10%] w-[40%] aspect-square bg-emerald-100/50 rounded-full blur-[100px]" />
       <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square bg-blue-50/50 rounded-full blur-[100px]" />
    </div>

    <div className="max-w-5xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[3.5rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Ready to Scale?</span>
          <h2 className="text-4xl sm:text-7xl font-black text-white mb-8 tracking-tighter leading-[1.0] italic uppercase">
            Deploy your<br />storefront today.
          </h2>
          <p className="text-slate-400 text-base sm:text-xl max-w-xl mx-auto mb-12 font-medium leading-relaxed">
            Join the elite circle of Nigerian vendors using SwiftLink Pro to dominate their niche.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?mode=signup&plan=pro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl text-lg font-black hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            <Link
              href="/signup?mode=login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-transparent text-white border border-white/20 px-10 py-5 rounded-2xl text-lg font-black hover:bg-white/5 transition-all active:scale-95"
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
  <footer className="py-20 px-4 sm:px-6 bg-[#fafafa] border-t border-slate-100">
    <div className="max-w-7xl mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center gap-2 mb-6">
               <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
               <span className="text-xl font-black text-slate-900 uppercase italic">SwiftLink<span className="text-emerald-500">Pro</span></span>
             </div>
             <p className="text-slate-500 font-medium max-w-xs leading-relaxed">
                The high-performance command center for modern WhatsApp commerce.
             </p>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Product</h4>
             <ul className="space-y-4">
                <li><a href="#features" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">Capabilities</a></li>
                <li><a href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">Workflow</a></li>
                <li><a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">Pricing</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Company</h4>
             <ul className="space-y-4">
                <li><Link href="/terms" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@swiftlink.pro" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">Support</a></li>
             </ul>
          </div>
       </div>
       <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200/60 gap-4">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 SwiftLink Pro Hub.</p>
          <div className="flex gap-6">
             {["Twitter", "Instagram", "WhatsApp"].map(social => (
                <span key={social} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors">{social}</span>
             ))}
          </div>
       </div>
    </div>
  </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-white min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTASection />
      <Footer />
    </main>
  );
}
