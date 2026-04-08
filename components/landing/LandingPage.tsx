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
  Box
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ThreeScene from "./ThreeScene";
import { AnimatedText } from "./AnimatedText";
import { LivePreview } from "./LivePreview";

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

  return (
    <section className="relative min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6 overflow-hidden flex items-center bg-white">
      {/* Background orbs — decorative only */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/60 rounded-full blur-[120px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100/80 rounded-full blur-[100px] pointer-events-none translate-y-1/4 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ── Left: Copy ─────────────────────────────── */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <FadeUp delay={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                The Next Evolution of E-Commerce
              </span>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.0] tracking-tighter mb-6">
                Turn your<br />
                WhatsApp into a{" "}
                <span className="text-emerald-500 italic">Sales Machine.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-base sm:text-lg lg:text-xl text-slate-500 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed font-medium">
                SwiftLink Pro empowers modern businesses with high-converting storefronts,
                live commerce tools, and professional dispatch management.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  href="/signup"
                  className="bg-slate-900 text-white px-7 py-4 rounded-2xl text-base font-black hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-slate-200 group"
                >
                  Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={scrollToDemo}
                  className="flex items-center justify-center gap-3 px-7 py-4 rounded-2xl text-slate-700 font-black hover:bg-slate-50 transition-all border-2 border-slate-200"
                >
                  View Demo <Sparkles size={18} className="text-emerald-500" />
                </button>
              </div>
            </FadeUp>

            <FadeUp delay={0.45}>
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-8">
                {[
                  { value: "1.2k+", label: "Stores Live" },
                  { value: "$2.4M", label: "Processed" },
                  { value: "99.9%", label: "Uptime" },
                ].map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    {i > 0 && <div className="h-8 w-px bg-slate-200 hidden sm:block" />}
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                      <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-slate-400">{stat.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* ── Right: 3D Scene + Floating Cards ───────── */}
          <FadeUp delay={0.1} className="relative order-1 lg:order-2">
            <div className="relative h-[340px] sm:h-[480px] lg:h-[700px] w-full">
              {/* Glow behind 3D */}
              <div className="absolute inset-[20%] rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />
              <ThreeScene />

              {/* Floating Card 1 — New Order */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[8%] right-[4%] bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl shadow-slate-200 border border-white/60 z-20 hidden sm:flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 flex-shrink-0">
                  <Zap size={16} fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase">New Order 🔥</p>
                  <p className="text-[10px] font-black text-emerald-500">+₦45,000</p>
                  <p className="text-[8px] text-slate-400">Just now</p>
                </div>
              </motion.div>

              {/* Floating Card 2 — Live Sync */}
              <motion.div
                animate={{ y: [0, 18, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                className="absolute top-[32%] left-[-2%] bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-2xl z-20 hidden sm:flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Layout size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide">Live Sync</p>
                  <p className="text-[9px] text-emerald-400 font-bold">● Active</p>
                </div>
              </motion.div>

              {/* Floating Card 3 — Revenue */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute bottom-[28%] right-[2%] bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 z-20 hidden sm:block"
              >
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Revenue Today</p>
                <p className="text-lg font-black text-slate-900">₦287,500</p>
                <p className="text-[9px] font-bold text-emerald-500">↑ 24% vs yesterday</p>
              </motion.div>

              {/* Floating Card 4 — Orders badge */}
              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[10%] left-[6%] bg-emerald-500 text-white p-3 sm:p-4 rounded-2xl shadow-lg shadow-emerald-200 z-20 hidden sm:block"
              >
                <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Orders Today</p>
                <p className="text-xl font-black">43</p>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8 }}
    className="group p-8 sm:p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all cursor-default relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-28 h-28 bg-slate-50 rounded-full -mr-14 -mt-14 group-hover:bg-emerald-50 transition-colors" />
    <div className="relative z-10">
      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:rotate-6 transition-all duration-300">
        <Icon size={28} strokeWidth={2} />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight italic group-hover:text-emerald-500 transition-colors">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm sm:text-base">{description}</p>
    </div>
  </motion.div>
);

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const features = [
    { icon: Store, title: "Smart Storefront", description: "A beautiful, lightning-fast catalog that lives right in your customer's WhatsApp chat. No downloads, no friction.", delay: 0.1 },
    { icon: Zap, title: "60s Setup", description: "Launch your entire business ecosystem in a minute. Name your store, add products, and start selling.", delay: 0.2 },
    { icon: MessageSquare, title: "Live Commerce", description: "Chat with customers in real-time, negotiate prices, and close deals directly where they're most comfortable.", delay: 0.3 },
    { icon: Smartphone, title: "Mobile First", description: "Manage your entire business from your phone. Our command center is built for the mobile entrepreneur.", delay: 0.4 },
    { icon: Box, title: "Inventory Sync", description: "Real-time tracking of your stock levels. Never oversell again with automated inventory management.", delay: 0.5 },
    { icon: Shield, title: "Secured Trust", description: "Enterprise-grade security for your data and your customer's privacy. Built for scale, built for Africa.", delay: 0.6 },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">
            Capabilities
          </motion.span>
          <AnimatedText
            text="Everything you need to dominate WhatsApp commerce."
            className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight justify-center text-center"
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </div>
    </section>
  );
};

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    { number: "01", title: "Create your Store", description: "Set up your business profile and branding in seconds. Your unique link is ready instantly." },
    { number: "02", title: "Upload Products", description: "Add items with prices, variants, and high-quality images. Organise into smart categories." },
    { number: "03", title: "Share & Sell", description: "Send your catalog link to WhatsApp groups or status. Close sales via our integrated dispatch system." },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Phone mockup — uses fixed px dimensions for reliability */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex justify-center relative"
          >
            <div className="relative">
              <div className="absolute -top-8 -left-8 w-36 h-36 bg-emerald-100 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-8 -right-8 w-52 h-52 bg-slate-100 rounded-full blur-3xl -z-10" />
              <LivePreview />
            </div>
          </motion.div>

          {/* Steps */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 block">The Workflow</span>
            <AnimatedText
              text="How it feels to use SwiftLink."
              className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-12"
            />
            <div className="space-y-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 group"
                >
                  <span className="text-4xl sm:text-5xl font-black text-emerald-100 group-hover:text-emerald-400 transition-colors duration-500 leading-none">{step.number}</span>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">{step.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{step.description}</p>
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

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="py-16 sm:py-20 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[3rem] p-10 sm:p-16 md:p-24 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <AnimatedText
            text="READY TO SCALE UP?"
            className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none justify-center"
          />
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-10 font-medium">
            Join thousands of businesses already growing with SwiftLink Pro. No credit card required. Start your 14-day free trial today.
          </motion.p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-emerald-500 text-slate-900 px-8 py-5 rounded-[2rem] text-lg font-black hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20"
          >
            Get My Store Link <ChevronRight size={22} />
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="py-16 sm:py-20 px-4 sm:px-6 border-t border-slate-100">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
      <div className="flex flex-col items-center sm:items-start gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SwiftLink" className="w-6 h-6" />
          <span className="text-lg font-black text-slate-900">SwiftLink<span className="text-emerald-500">Pro</span></span>
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global Commerce for Everyone</p>
      </div>
      <div className="flex gap-6 sm:gap-8">
        {["Twitter", "Instagram", "LinkedIn"].map((s) => (
          <a key={s} href="#" className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors">{s}</a>
        ))}
      </div>
      <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest text-center">© 2026 SwiftLink Pro. All Rights Reserved.</p>
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
      <CTASection />
      <Footer />
    </main>
  );
}
