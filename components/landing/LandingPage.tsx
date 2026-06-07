"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Store, Zap, Shield, MessageSquare, Layout, Clock, CheckCircle2, Menu, X, ChevronRight, Globe, Sparkles, Smartphone, Box, Truck, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { AnimatedText } from "./AnimatedText";
import { LivePreview } from "./LivePreview";
import { useSwiftLink } from "@/context/SwiftLinkContext";

const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px]" />,
});

// ─── Fade-Up helper ───────────────────────────────────────────────────────────
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
  const { theme, toggleTheme } = useSwiftLink();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 sm:px-6 py-4",
        isScrolled ? "bg-white/90 dark:bg-[#020617]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/[0.05] py-3 shadow-sm" : "bg-transparent"
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
          <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">How it works</a>
          <a href="#pricing" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">Pricing</a>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 border border-slate-200/50 dark:border-white/5"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Link
            href="/signup"
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200/50 dark:border-white/5"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Mobile Toggle */}
          <button className="p-2 text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-[#020617] border-b border-slate-100 dark:border-white/10 px-6 py-6 md:hidden flex flex-col gap-5 shadow-xl"
          >
            <a href="#features" className="text-base font-bold text-slate-700 dark:text-slate-200" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-base font-bold text-slate-700 dark:text-slate-200" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="text-base font-bold text-slate-700 dark:text-slate-200" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
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
    <section className="relative min-h-screen pt-32 sm:pt-40 pb-16 px-4 sm:px-6 overflow-hidden flex items-center bg-[#fafafa] dark:bg-[#020617] transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40%] aspect-square bg-emerald-100/40 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[35%] aspect-square bg-blue-100/30 dark:bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Left: Copy ─────────────────────────────── */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <FadeUp delay={0}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm rounded-full mb-8">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Next-Gen E-Commerce</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tight mb-8">
                Sell on <span className="text-emerald-500">WhatsApp</span> <br className="hidden sm:block" />
                <span className="italic font-serif opacity-90">like a Pro.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                The high-performance storefront for Nigerian entrepreneurs. 
                Fast, professional, and built for your phone.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 rounded-2xl text-base font-black hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-slate-200 dark:shadow-none"
                >
                  Start Selling Now <ArrowRight size={18} />
                </Link>
                <button
                  onClick={scrollToDemo}
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm"
                >
                  Watch Demo <Sparkles size={18} className="text-emerald-500" />
                </button>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.4} className="mt-12 opacity-50 flex items-center justify-center lg:justify-start gap-8">
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">60s</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Setup Time</span>
               </div>
               <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">0%</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Transaction Fee</span>
               </div>
               <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Live</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tracking</span>
               </div>
            </FadeUp>
          </div>

          {/* ── Right: Hero Visual ───────── */}
          <FadeUp delay={0.1} className="relative order-1 lg:order-2 flex justify-center w-full">
            <div className="relative w-full max-w-[550px] aspect-square flex items-center justify-center">
              {/* Background Glass Plate */}
              <div className="absolute inset-0 bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[3rem] -rotate-2 transform" />
              
              <div className="relative h-full w-full flex items-center justify-center overflow-visible">
                {reduceMotion ? <LightweightHeroVisual /> : <ThreeScene />}

                {/* Modern Floating Badges */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute top-[15%] right-[2%] bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-white/[0.05] p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex items-center gap-3 z-30"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">Order Received</p>
                    <p className="text-[12px] font-black text-emerald-500 mt-1">₦72,500.00</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-[20%] left-[2%] bg-slate-900 dark:bg-[#0f172a] dark:border dark:border-white/10 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 z-30"
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
    { icon: Layout, title: "Visual Designer", description: "Design with 10+ cinematic templates. Full control over typography, colors, and layout aesthetics.", className: "md:col-span-2 md:row-span-2 bg-slate-900 dark:bg-[#1e293b] text-white border border-slate-900 dark:border-white/10" },
    { icon: Sparkles, title: "Smart Add", description: "Upload once, sync everywhere. Automatically generates high-res product galleries and thumbnails.", className: "bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-white/[0.05]" },
    { icon: Truck, title: "Logistics Hub", description: "Real-time dispatch tracking. Customers watch their package move on a live map.", className: "bg-emerald-50 dark:bg-emerald-950/10 border border-slate-100 dark:border-white/[0.05]" },
    { icon: Shield, title: "Multi-Brand", description: "Manage multiple stores from a single professional workspace. Perfect for scaling vendors.", className: "bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-white/[0.05]" },
    { icon: MessageSquare, title: "Social Hub", description: "Integrated community wall for verified customer reviews and real-time social proof.", className: "md:col-span-2 bg-white dark:bg-[#0f172a] border-2 border-slate-100 dark:border-white/[0.05]" },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 bg-white dark:bg-[#090d16] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">
            The Infrastructure
          </motion.span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            High-Performance tools,<br />built for the elite.
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
                "p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.05] flex flex-col justify-between transition-all hover:shadow-2xl group min-h-[320px]",
                f.className
              )}
            >
              <div>
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110", f.className?.includes("bg-slate-900") || f.className?.includes("bg-[#1e293b]") ? "bg-white/10 text-white" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900")}>
                    <f.icon size={28} />
                 </div>
                 <h3 className={cn("text-2xl font-black uppercase tracking-tight italic mb-3", f.className?.includes("bg-slate-900") || f.className?.includes("bg-[#1e293b]") ? "text-white" : "text-slate-900 dark:text-white")}>{f.title}</h3>
                 <p className={cn("text-base font-medium leading-relaxed opacity-70", f.className?.includes("bg-slate-900") || f.className?.includes("bg-[#1e293b]") ? "text-slate-300" : "text-slate-500 dark:text-slate-400")}>
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
    { number: "01", title: "Deploy your Hub", description: "Create your workspace and choose from 10+ cinematic templates. Your professional URL is live in 60s." },
    { number: "02", title: "Smart Cataloging", description: "Use Smart Add to bulk-upload product imagery. Organise items into high-fidelity, searchable categories." },
    { number: "03", title: "Scale & Track", description: "Receive orders on WhatsApp. Manage fulfillment through our logistics hub with real-time map tracking." },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#fafafa] dark:bg-[#020617] transition-colors duration-300">
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
              <div className="absolute -inset-10 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-emerald-200/50 transition-colors" />
              <div className="scale-90 sm:scale-100 transition-transform duration-700 group-hover:scale-[1.02]">
                 <LivePreview />
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <div className="order-1 lg:order-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 block">The Workflow</span>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-12 italic uppercase">
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
                    <span className="text-5xl font-black text-slate-200 dark:text-slate-800 group-hover:text-emerald-500 transition-colors duration-500 leading-none tabular-nums tracking-tighter">{step.number}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{step.title}</h3>
                    <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.description}</p>
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
    <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 bg-white dark:bg-[#090d16] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">
            Pricing
          </motion.span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
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
                p.variant === "black" ? "bg-slate-900 dark:bg-[#0f172a] text-white border-slate-900 dark:border-white/10 shadow-2xl scale-[1.05] z-10" : "bg-[#f8fafc] dark:bg-[#0f172a]/40 text-slate-900 dark:text-white border-slate-100 dark:border-white/[0.05]"
              )}
            >
              {p.featured && (
                <div className="absolute top-6 right-8">
                   <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-4", p.variant === "black" ? "text-emerald-400" : "text-slate-400 dark:text-slate-500")}>{p.name}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={cn("text-4xl sm:text-5xl font-black tracking-tighter", p.variant === "black" ? "text-white" : "text-slate-900 dark:text-white")}>{p.price}</span>
                  {p.period && <span className={cn("text-sm font-bold opacity-60", p.variant === "black" ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>{p.period}</span>}
                </div>
                <p className={cn("text-sm font-medium leading-relaxed mb-10", p.variant === "black" ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>{p.description}</p>
                
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
                  p.variant === "black" ? "bg-white dark:bg-white text-slate-900 dark:text-slate-900 hover:bg-emerald-400" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-500 dark:hover:bg-emerald-400 shadow-lg"
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
  <section className="py-24 sm:py-32 px-4 sm:px-6 bg-white dark:bg-[#020617] overflow-hidden relative transition-colors duration-300">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full">
       <div className="absolute top-[20%] left-[-10%] w-[40%] aspect-square bg-emerald-100/50 dark:bg-emerald-500/5 rounded-full blur-[100px]" />
       <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square bg-blue-50/50 dark:bg-blue-500/5 rounded-full blur-[100px]" />
    </div>

    <div className="max-w-5xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-slate-900 dark:bg-[#0f172a] rounded-[3.5rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl dark:border dark:border-white/10"
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
  <footer className="py-20 px-4 sm:px-6 bg-[#fafafa] dark:bg-[#090d16] border-t border-slate-100 dark:border-white/[0.05] transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center gap-2 mb-6">
               <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
               <span className="text-xl font-black text-slate-900 dark:text-white uppercase italic">SwiftLink</span>
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs leading-relaxed">
                The high-performance command center for modern WhatsApp commerce.
             </p>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6">Product</h4>
             <ul className="space-y-4">
                <li><a href="#features" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Capabilities</a></li>
                <li><a href="#how-it-works" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Workflow</a></li>
                <li><a href="#pricing" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Pricing</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6">Company</h4>
             <ul className="space-y-4">
                <li><Link href="/terms" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@swiftlink.pro" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Support</a></li>
             </ul>
          </div>
       </div>
       <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200/60 dark:border-white/[0.05] gap-4">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 SwiftLink Workspace.</p>
          <div className="flex gap-6">
             {["Twitter", "Instagram", "WhatsApp"].map(social => (
                <span key={social} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors">{social}</span>
             ))}
          </div>
       </div>
    </div>
  </footer>
);

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2200;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ background: "#010c07" }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Single deep glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)" }} />

      {/* Core content */}
      <div className="relative z-10 flex flex-col items-center" style={{ width: 280 }}>

        {/* Compact logo + wordmark row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-10"
        >
          {/* Logo box */}
          <motion.div
            animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0.15)", "0 0 20px rgba(16,185,129,0.4)", "0 0 0px rgba(16,185,129,0.15)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <img src="/logo.png" alt="SwiftLink" style={{ width: 22, height: 22 }} />
          </motion.div>

          {/* Name block */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <div className="flex gap-[1px]">
                {"SWIFTLINK".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i + 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-white font-black"
                    style={{ fontSize: 17, letterSpacing: "0.1em", lineHeight: 1 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.3 }}
                className="font-black"
                style={{ fontSize: 11, color: "#10b981", letterSpacing: "0.1em", lineHeight: 1 }}
              >
                PRO
              </motion.span>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              style={{ fontSize: 7, color: "rgba(16,185,129,0.4)", letterSpacing: "0.45em", textTransform: "uppercase", fontWeight: 700, marginTop: 3 }}
            >
              Commerce OS
            </motion.span>
          </div>
        </motion.div>

        {/* Progress section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full flex flex-col gap-2.5"
        >
          {/* Razor-thin progress track */}
          <div className="w-full overflow-hidden" style={{ height: 1.5, borderRadius: 99, background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                borderRadius: 99,
                background: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                boxShadow: "0 0 8px rgba(16,185,129,0.7)",
                transition: "width 0.04s linear",
              }}
            />
          </div>

          {/* Status + counter row */}
          <div className="flex items-center justify-between">
            <motion.span
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ fontSize: 8, color: "rgba(16,185,129,0.55)", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, fontFamily: "monospace" }}
            >
              {progress < 35 ? "Initializing" : progress < 70 ? "Loading" : progress < 95 ? "Almost ready" : "Launching"}
            </motion.span>
            <span style={{ fontSize: 11, color: "#fff", fontFamily: "monospace", fontWeight: 900, letterSpacing: "0.05em" }}>
              {String(progress).padStart(3, "0")}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <AnimatePresence>
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>
      <main className="bg-white dark:bg-[#020617] min-h-screen text-slate-900 dark:text-white selection:bg-emerald-500/30 transition-colors duration-300">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
