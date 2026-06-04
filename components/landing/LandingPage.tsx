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
    <section className="relative min-h-screen flex items-center px-6 overflow-hidden bg-white dark:bg-black pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <FadeUp delay={0}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full mb-8">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Trusted by Nigerian Vendors</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-8">
                Sell on <span className="text-emerald-500">WhatsApp</span> <br />
                <span className="italic opacity-90">the easy way.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                The fastest way to build a professional storefront and manage your orders. No complicated tech—just results.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="bg-slate-900 dark:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200 dark:shadow-emerald-500/20"
                >
                  Create Your Store <ArrowRight size={18} />
                </Link>
                <Link
                  href="/signup?mode=login"
                  className="bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-8 py-4 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center active:scale-95"
                >
                  Merchant Login
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Right: Minimal Visual */}
          <FadeUp delay={0.2} className="relative flex justify-center w-full">
            <div className="relative w-full max-w-[500px] aspect-[4/5] sm:aspect-square">
               <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[3rem] blur-3xl" />
               <div className="relative h-full w-full flex items-center justify-center p-4">
                  <LivePreview />
               </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const features = [
    { icon: Layout, title: "Beautiful Templates", description: "Choose from our premium designs to make your brand stand out instantly.", className: "md:col-span-2 md:row-span-2 bg-slate-900 text-white" },
    { icon: Sparkles, title: "Easy Uploads", description: "Add your products in seconds and let us handle the formatting for you.", className: "bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10" },
    { icon: Truck, title: "Order Tracking", description: "Keep your customers happy with real-time updates on their deliveries.", className: "bg-emerald-500 text-white" },
    { icon: Shield, title: "Multi-Store", description: "Run all your businesses from one simple dashboard without the stress.", className: "bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10" },
    { icon: Globe, title: "Customer Reviews", description: "Show off what people are saying about your brand to build trust.", className: "md:col-span-2 bg-white dark:bg-black text-slate-900 dark:text-white border-slate-200 dark:border-white/10" },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-20 text-center lg:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 block">Everything you need</span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Simple tools for <br />
            <span className="opacity-40">ambitious brands.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-8 sm:p-12 rounded-[2.5rem] border border-transparent flex flex-col justify-between transition-all duration-300 hover:shadow-2xl min-h-[300px] sm:min-h-[350px] cursor-pointer",
                f.className
              )}
            >
              <div>
                 <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-8 bg-slate-100 dark:bg-white/10 shadow-lg">
                    <f.icon size={24} />
                 </div>
                 <h3 className="text-xl sm:text-2xl font-black italic mb-4">{f.title}</h3>
                 <p className="text-sm sm:text-base font-medium leading-relaxed opacity-70">
                    {f.description}
                 </p>
              </div>
              <div className="mt-8 flex justify-end">
                 <ArrowRight className="opacity-20 group-hover:opacity-100 transition-all" />
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
    <section id="workflow" className="py-24 sm:py-32 px-6 bg-slate-50 dark:bg-black relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
          <div className="flex justify-center relative order-2 lg:order-1 scale-90 sm:scale-100">
             <div className="absolute -inset-20 bg-emerald-500/10 rounded-full blur-[120px]" />
             <LivePreview />
          </div>

          <div className="order-1 lg:order-2 text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 block">How it works</span>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-12 italic">
              Simple. Fast. <br />
              <span className="text-emerald-500">Effective.</span>
            </h2>
            
            <div className="space-y-12">
              {[
                { n: "01", t: "Setup Your Store", d: "Create your workspace and choose a style. You'll be live in 60 seconds." },
                { n: "02", t: "Add Your Products", d: "Upload photos and details of what you sell. It's easy and looks great." },
                { n: "03", t: "Start Selling", d: "Share your link on WhatsApp and watch your business grow." }
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="flex gap-6 sm:gap-10 text-left">
                  <span className="text-4xl sm:text-5xl font-black text-slate-200 dark:text-white/10 italic shrink-0">{step.n}</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2 italic">{step.t}</h3>
                    <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{step.d}</p>
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
    { name: "Starter", price: "Free", desc: "Try out the basic tools for your new store.", feat: ["Up to 5 Products", "Standard Style", "SwiftLink Brand", "WhatsApp Orders"] },
    { name: "Pro", price: "₦5K", period: "/mo", desc: "Perfect for growing brands who want more.", feat: ["Unlimited Products", "Premium Styles", "Order Tracking", "Business Insights", "Custom Link"], featured: true },
    { name: "Business", price: "₦15K", period: "/mo", desc: "For running multiple businesses easily.", feat: ["Manage Many Stores", "Verified Business Badge", "Priority Support", "Advanced Sales Tools", "Team Access"] },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-20 sm:mb-32">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6 block">Pricing Plans</span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">
            Start small, <br />
            <span className="opacity-30 text-slate-400">grow big.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-[3rem] p-8 sm:p-12 border transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[500px] sm:min-h-[600px] cursor-pointer",
                p.featured ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-2xl scale-[1.02] z-10" : "bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 hover:border-emerald-500/30"
              )}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-50">{p.name} Plan</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl sm:text-5xl font-black tracking-tighter italic">{p.price}</span>
                  {p.period && <span className="text-xs font-bold uppercase tracking-widest opacity-50">{p.period}</span>}
                </div>
                <p className="text-sm font-medium leading-loose mb-12 opacity-80">{p.desc}</p>
                
                <div className="space-y-4 mb-16">
                   {p.feat.map(f => (
                     <div key={f} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-bold opacity-90">{f}</span>
                     </div>
                   ))}
                </div>
              </div>

              <Link
                href={`/signup?mode=signup&plan=${p.name.toLowerCase()}`}
                className={cn(
                  "w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center active:scale-95",
                  p.featured ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/20" : "bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 shadow-xl"
                )}
              >
                Choose Plan
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
  <section className="py-24 sm:py-32 px-6 bg-white dark:bg-black relative">
    <div className="max-w-[1200px] mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500 rounded-[3rem] sm:rounded-[4rem] p-12 sm:p-24 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20 group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10">
          <span className="text-white text-xs font-bold uppercase tracking-[0.4em] mb-8 block">Ready to start?</span>
          <h2 className="text-4xl sm:text-7xl font-black text-white mb-10 tracking-tighter leading-none italic uppercase">
            Build your <br />
            dream store today.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 sm:mt-16">
            <Link
              href="/signup?mode=signup"
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-2xl"
            >
              Get Started Now
            </Link>
            <Link
              href="/signup?mode=login"
              className="w-full sm:w-auto px-10 py-5 bg-white text-emerald-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-xl"
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
  <footer className="py-20 px-6 bg-slate-50 dark:bg-black border-t border-slate-100 dark:border-white/5">
    <div className="max-w-[1400px] mx-auto">
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16 mb-20">
          <div className="col-span-1 sm:col-span-2 space-y-8">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                 <img src="/logo.png" alt="SL" className="w-5 h-5 object-contain" />
               </div>
               <span className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">SwiftLink<span className="text-emerald-500">Pro</span></span>
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed text-sm">
                The easiest way for Nigerian vendors to build professional WhatsApp stores and manage orders without the stress.
             </p>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-8">Store</h4>
             <ul className="space-y-4">
                {["Features", "Workflow", "Pricing"].map(item => (
                   <li key={item}><a href={`#${item.toLowerCase()}`} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{item}</a></li>
                ))}
             </ul>
          </div>
          <div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-8">Support</h4>
             <ul className="space-y-4">
                <li><Link href="/terms" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@swiftlink.pro" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Contact Us</a></li>
             </ul>
          </div>
       </div>
       <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-slate-200 dark:border-white/5 gap-6">
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 SwiftLink Workspace.</p>
          <div className="flex gap-8">
             {["Twitter", "Instagram", "WhatsApp"].map(social => (
                <span key={social} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 cursor-pointer hover:text-emerald-500 transition-all">{social}</span>
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
