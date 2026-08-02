"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Shield, MessageSquare, Menu, X, Globe, Sparkles,
  Truck, Sun, Moon, TrendingUp, Package, Users, Star, CheckCircle2,
  UserPlus, Layers, Send, ShoppingBag, ArrowUpRight, Play, Check
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FadeUp = ({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const InView = ({
  children, delay = 0, className = "", once = true,
}: { children: React.ReactNode; delay?: number; className?: string; once?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Marquee ──────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "WhatsApp Commerce", "Instant Checkout", "Live Tracking", "Zero Fees",
  "Smart Catalog", "Multi-Store", "Payment Gateway", "Real-Time Analytics",
];

function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="relative flex overflow-hidden select-none">
      <motion.div
        animate={{ x: reverse ? ["0%", "50%"] : ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        className="flex shrink-0 gap-6 pr-6"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-5 py-2.5 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {item}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Interactive Phone Workflow Demo ──────────────────────────────────────────
function PhoneWorkflowDemo() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");

  useEffect(() => {
    // Auto detect user location / currency
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone.includes("Lagos") || timeZone.includes("Africa")) {
        setCurrencySymbol("₦");
      } else {
        setCurrencySymbol("$");
      }
    } catch {
      setCurrencySymbol("$");
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const flowSteps = [
    {
      id: 0,
      title: "1. Quick Account Creation",
      desc: "Sign up in 30s and launch swiftlink.store/yourbrand.",
      badge: "Step 01",
    },
    {
      id: 1,
      title: "2. Manage Products & Catalog",
      desc: "Add products, variants, and stock in one clean dashboard.",
      badge: "Step 02",
    },
    {
      id: 2,
      title: "3. Direct WhatsApp Checkout",
      desc: "Customers order and send ready-to-pay chats straight to you.",
      badge: "Step 03",
    },
    {
      id: 3,
      title: "4. Dispatch & Live GPS Tracking",
      desc: "Send tracking links so buyers trace deliveries in real-time.",
      badge: "Step 04",
    },
  ];

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-12 items-start">
      {/* Phone Mockup — shown first on mobile */}
      <div className="lg:col-span-5 flex justify-center order-first">
        <div className="relative w-[260px] sm:w-[280px] h-[520px] sm:h-[560px] rounded-[2.8rem] border-[10px] border-slate-900 dark:border-slate-950 bg-white dark:bg-[#060e0a] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.25)] flex flex-col justify-between overflow-hidden">
          {/* Phone Notch */}
          <div className="mx-auto h-3.5 w-20 rounded-full bg-slate-900 dark:bg-slate-950 mb-3" />

          {/* Screen Content Container */}
          <div className="flex-1 overflow-hidden relative flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4 pt-2"
                >
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="SwiftLink" className="h-6 w-6 object-contain" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">Create Account</span>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-2.5 bg-slate-50 dark:bg-white/5">
                      <p className="text-[8px] font-black uppercase text-slate-400">Store Name</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Luxe Boutique</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-2.5 bg-slate-50 dark:bg-white/5">
                      <p className="text-[8px] font-black uppercase text-slate-400">WhatsApp Number</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">+1 (555) 019-2834</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500 p-3 text-center text-white font-black text-xs shadow-lg shadow-emerald-500/20">
                      Launch My Storefront
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-center">
                    <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">swiftlink.store/luxeboutique ✓</p>
                  </div>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3 pt-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Smart Catalog</span>
                    <span className="text-[9px] font-bold text-emerald-500">+ Add Product</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Silk Evening Dress", price: `${currencySymbol}${currencySymbol === "$" ? "85.00" : "45,000"}` },
                      { name: "Minimalist Watch", price: `${currencySymbol}${currencySymbol === "$" ? "120.00" : "65,000"}` },
                      { name: "Leather Tote Bag", price: `${currencySymbol}${currencySymbol === "$" ? "95.00" : "50,000"}` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Package size={14} className="text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-[8px] font-extrabold text-emerald-500">{item.price}</p>
                          </div>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3 pt-2"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <MessageSquare size={16} />
                    <span className="text-xs font-black">WhatsApp Order</span>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 p-3 text-slate-800 dark:text-slate-200">
                    <p className="text-[9px] font-mono leading-relaxed">
                      👋 Hi Luxe Boutique! I want to order:<br />
                      • Silk Evening Dress (Qty: 1)<br />
                      • Total: {currencySymbol === "$" ? "$85.00" : "₦45,000"}<br />
                      Deliver to: 14 Ocean View Ave.
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#25D366] p-2.5 text-center text-white font-black text-xs flex items-center justify-center gap-2 shadow-md">
                    <Send size={12} /> Send Order on WhatsApp
                  </div>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3 pt-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Live Tracking</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500">In Transit</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50 dark:bg-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-emerald-500" />
                      <div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white">Driver assigned</p>
                        <p className="text-[8px] text-slate-400">Estimated delivery: 12 mins</p>
                      </div>
                    </div>
                    <div className="h-16 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <span className="text-[9px] font-bold text-emerald-500">📍 Interactive GPS Map View</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-center">
            <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">Powered by SwiftLink</span>
          </div>
        </div>
      </div>

      {/* Interactive Step Selectors — below phone on mobile */}
      <div className="lg:col-span-7 space-y-3">
        {flowSteps.map((step, idx) => (
          <div
            key={step.id}
            onClick={() => setActiveStep(idx)}
            className={cn(
              "cursor-pointer rounded-2xl p-5 transition-all duration-300 border relative overflow-hidden",
              activeStep === idx
                ? "bg-white dark:bg-[#07130e] border-emerald-500/40 shadow-lg shadow-emerald-500/5 dark:shadow-none"
                : "bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 opacity-70 hover:opacity-100"
            )}
          >
            {activeStep === idx && (
              <motion.div
                layoutId="stepIndicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full"
              />
            )}
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0",
                activeStep === idx ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-200/50 dark:bg-white/5 text-slate-400"
              )}>
                {step.badge}
              </span>
              <div className="min-w-0">
                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">{step.title}</h4>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{step.desc}</p>
              </div>
              {activeStep === idx && (
                <span className="ml-auto flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cybernetic Holographic Hero Interface ──────────────────────────────────────
function CyberHeroVisual() {
  const [activeTab, setActiveTab] = useState<"store" | "live" | "checkout">("store");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone.includes("Lagos") || timeZone.includes("Africa")) {
        setCurrencySymbol("₦");
      } else {
        setCurrencySymbol("$");
      }
    } catch {
      setCurrencySymbol("$");
    }

    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === "store" ? "live" : prev === "live" ? "checkout" : "store"));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-[500px]">
      {/* Dynamic Background Glow */}
      <div className="pointer-events-none absolute -inset-10 overflow-visible">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 left-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-[90px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-10 right-0 h-72 w-72 rounded-full bg-teal-400/20 blur-[90px]"
        />
      </div>

      {/* Main Glass HUD Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 overflow-hidden rounded-[2.8rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#07130e]/90 p-6 backdrop-blur-2xl shadow-[0_32px_90px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
      >
        {/* Top Header Controls */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              swiftlink.store/luxe
            </span>
          </div>

          <div className="flex rounded-full bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/50 dark:border-white/5">
            {(["store", "live", "checkout"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-all",
                  activeTab === tab
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="relative min-h-[260px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === "store" && (
              <motion.div
                key="store"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Catalog</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Active Store</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: "Luxe Outfit", price: `${currencySymbol}${currencySymbol === "$" ? "45.00" : "35,000"}` },
                    { title: "Classic Watch", price: `${currencySymbol}${currencySymbol === "$" ? "68.00" : "48,000"}` },
                  ].map((item, idx) => (
                    <div key={idx} className="group relative rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-3 transition-all hover:border-emerald-500/30">
                      <div className="mb-2 h-20 w-full rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                        <Package size={24} className="text-emerald-500 opacity-60" />
                      </div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-[10px] font-extrabold text-emerald-500">{item.price}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "live" && (
              <motion.div
                key="live"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Real-Time Dispatch</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> GPS Active
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white">Order #SL-8849</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Rider assigned & en-route</p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <motion.div
                      animate={{ x: ["-100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full w-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "checkout" && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Direct WhatsApp Sync</span>
                  <span className="text-[9px] font-bold text-slate-400">1-Click Order</span>
                </div>

                <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] p-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Instant WhatsApp Invoice</p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Orders automatically structured into ready-to-pay WhatsApp chats.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Floating Stats Strip */}
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/5 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-[11px] font-black">Sales Activity Live</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">0% Commission</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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
        isScrolled
          ? "bg-white/90 dark:bg-[#020617]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/[0.05] py-3 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SwiftLink" className="w-8 h-8 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            SwiftLink
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {["#features", "#how-it-works", "#pricing"].map((href, i) => (
            <a
              key={href}
              href={href}
              className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
            >
              {["Features", "How it works", "Pricing"][i]}
            </a>
          ))}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 border border-slate-200/50 dark:border-white/5"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <Link
            href="/signup"
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-black hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all active:scale-95 shadow-lg"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200/50 dark:border-white/5"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button className="p-2 text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
            {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} className="text-base font-bold text-slate-700 dark:text-slate-200" onClick={() => setIsMobileMenuOpen(false)}>
                {label}
              </a>
            ))}
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
  return (
    <section className="relative min-h-screen pt-28 sm:pt-36 pb-0 overflow-hidden bg-[#f8fafb] dark:bg-[#020617] transition-colors duration-300">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Left: Copy ───────────────────────── */}
          <div className="text-center lg:text-left">
            <FadeUp delay={0.08}>
              <h1 className="text-[3rem] sm:text-[4.5rem] lg:text-[5.5rem] font-black text-slate-900 dark:text-white leading-[0.95] tracking-[-0.02em] mb-6">
                Sell on <span className="text-emerald-500">WhatsApp</span><br />
                like a <span className="italic text-emerald-500">pro.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                The high-performance storefront command center for modern vendors worldwide. Professional. Fast. Zero transaction fees.
              </p>
            </FadeUp>

            <FadeUp delay={0.28}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full text-sm font-black hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-slate-200/50 dark:shadow-none"
                >
                  Start Selling Now
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-black hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                  See How It Works
                </a>
              </div>
            </FadeUp>

            {/* Stats row */}
            <FadeUp delay={0.38} className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8">
              {[["60s", "Setup Time"], ["0%", "Transaction Fee"], ["Live", "Tracking"]].map(([v, l], i) => (
                <React.Fragment key={l}>
                  {i > 0 && <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />}
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{v}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{l}</p>
                  </div>
                </React.Fragment>
              ))}
            </FadeUp>
          </div>

          {/* ── Right: Cyber Hero Visual — hidden on mobile ── */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <CyberHeroVisual />
          </div>
        </div>

        {/* Marquee strip */}
        <div className="mt-20 -mx-4 sm:-mx-6 overflow-hidden">
          <div className="mb-3 opacity-40">
            <Marquee />
          </div>
          <div className="opacity-25">
            <Marquee reverse />
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Features (Bento Style - Cleaned up) ───────────────────────────────────────
const Features = () => {
  const features = [
    {
      icon: Sparkles,
      title: "Smart Catalog",
      description: "Upload once, sync everywhere. Auto-generates galleries and thumbnails.",
      className: "bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-white/[0.06]",
    },
    {
      icon: Truck,
      title: "Logistics Hub",
      description: "Real-time dispatch tracking. Customers watch their package move live.",
      className: "bg-emerald-50 dark:bg-emerald-950/20 border border-slate-100 dark:border-white/[0.06]",
    },
    {
      icon: Shield,
      title: "Multi-Brand Workspace",
      description: "Manage multiple stores seamlessly from one central command center.",
      className: "bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-white/[0.06]",
    },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 bg-white dark:bg-[#090d16] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <InView>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">
              The Infrastructure
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              High-performance tools,<br />built for the elite.
            </h2>
          </InView>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <InView
              key={i}
              delay={i * 0.08}
              className={cn(
                "rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-all hover:shadow-2xl hover:-translate-y-1 group min-h-[280px] cursor-default",
                f.className
              )}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-7 transition-transform group-hover:scale-110">
                  <f.icon size={22} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight italic mb-3 text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.description}
                </p>
              </div>
              <div className="mt-8 flex justify-end">
                <ArrowRight className="opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-slate-900 dark:text-white" />
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── How It Works (Clean & Real User Flow with Animated Interactive Demo) ──
const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#f8fafb] dark:bg-[#020617] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <InView>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">The Workflow</span>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              How SwiftLink Works.<br />Simple &amp; Seamless.
            </h2>
          </InView>
        </div>

        <InView>
          <PhoneWorkflowDemo />
        </InView>
      </div>
    </section>
  );
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
const Pricing = () => {
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone.includes("Lagos") || timeZone.includes("Africa")) {
        setCurrencySymbol("₦");
      } else {
        setCurrencySymbol("$");
      }
    } catch {
      setCurrencySymbol("$");
    }
  }, []);

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Dip your toes in. No card required.",
      features: [
        { label: "5 Live Products", soon: false },
        { label: "WhatsApp Checkout", soon: false },
        { label: "Basic Order Tracking", soon: false },
        { label: "SwiftLink Branding", soon: false },
        { label: "Community Support", soon: false },
      ],
      cta: "Start Free",
      featured: false,
      variant: "light" as const,
    },
    {
      name: "Pro",
      price: currencySymbol === "$" ? "$10" : "₦5,000",
      period: "/mo",
      description: "Everything you need to run a serious store.",
      features: [
        { label: "Unlimited Products", soon: false },
        { label: "Custom Branding", soon: false },
        { label: "Paystack / Flutterwave Integration", soon: false },
        { label: "Live Map Tracking", soon: false },
        { label: "Detailed Analytics", soon: false },
        { label: "Discount & Promo Codes", soon: false },
        { label: "Export Orders (CSV)", soon: false },
        { label: "Priority Support", soon: false },
      ],
      cta: "Upgrade to Pro",
      featured: true,
      variant: "dark" as const,
    },
    {
      name: "Business",
      price: currencySymbol === "$" ? "$29" : "₦15,000",
      period: "/mo",
      description: "Enterprise power for established brands & teams.",
      features: [
        { label: "Everything in Pro", soon: false },
        { label: "Multi-Store Management", soon: false },
        { label: "Team Collaboration & Roles", soon: false },
        { label: "Multiple Payment Gateways", soon: false },
        { label: "Custom Domain", soon: false },
        { label: "White-Label Experience", soon: false },
        { label: "API Access & Webhooks", soon: true },
        { label: "Audit Logs & Backups", soon: true },
        { label: "Dedicated Account Manager", soon: false },
      ],
      cta: "Contact Sales",
      featured: false,
      variant: "light" as const,
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 bg-white dark:bg-[#090d16] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <InView>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Pricing</span>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              Simple plans for<br />ambitious brands.
            </h2>
            <p className="mt-5 text-slate-500 dark:text-slate-400 text-base font-medium max-w-lg mx-auto">
              Start free. Upgrade when you&apos;re ready. Downgrade anytime.
            </p>
          </InView>
        </div>

        {/* Cards: single column mobile → 3 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-center">
          {plans.map((p, i) => (
            <InView
              key={p.name}
              delay={i * 0.1}
              className={cn(
                "rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 border relative overflow-hidden",
                p.variant === "dark"
                  ? "bg-slate-900 dark:bg-[#0f172a] text-white border-slate-900 dark:border-white/10 shadow-2xl lg:scale-[1.04] z-10 min-h-[560px]"
                  : "bg-[#f8fafb] dark:bg-[#0f172a]/40 text-slate-900 dark:text-white border-slate-100 dark:border-white/[0.06] min-h-[480px]"
              )}
            >
              {p.featured && (
                <div className="absolute top-6 right-7">
                  <span className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div>
                <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] mb-4", p.variant === "dark" ? "text-emerald-400" : "text-slate-400 dark:text-slate-500")}>
                  {p.name}
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl sm:text-5xl font-black tracking-tighter">{p.price}</span>
                  {p.period && <span className="text-sm font-bold opacity-50">{p.period}</span>}
                </div>
                <p className={cn("text-sm font-medium leading-relaxed mb-8", p.variant === "dark" ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>
                  {p.description}
                </p>
                <div className="space-y-3 mb-10">
                  {p.features.map(f => (
                    <div key={f.label} className="flex items-center gap-3">
                      <CheckCircle2 size={14} className={cn("shrink-0", p.variant === "dark" ? "text-emerald-400" : "text-emerald-500")} />
                      <span className="text-sm font-bold opacity-80">{f.label}</span>
                      {f.soon && (
                        <span className="ml-auto shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30">
                          Soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href={`/signup?mode=signup&plan=${p.name.toLowerCase()}`}
                className={cn(
                  "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-center active:scale-95 hover:brightness-105",
                  p.variant === "dark"
                    ? "bg-white text-slate-900 hover:bg-emerald-400"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-500 dark:hover:bg-emerald-400 shadow-lg"
                )}
              >
                {p.cta}
              </Link>
            </InView>
          ))}
        </div>

        {/* Bottom note */}
        <InView className="mt-14 text-center">
          <p className="text-xs font-medium text-slate-400">
            All plans include zero transaction fees. <span className="text-emerald-500 font-black">You keep 100% of your revenue.</span>
          </p>
        </InView>
      </div>
    </section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="py-24 sm:py-32 px-4 sm:px-6 bg-white dark:bg-[#020617] overflow-hidden relative transition-colors duration-300">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[20%] left-[-10%] w-[40%] aspect-square bg-emerald-100/50 dark:bg-emerald-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square bg-blue-50/50 dark:bg-blue-500/5 rounded-full blur-[100px]" />
    </div>

    <div className="max-w-5xl mx-auto relative z-10">
      <InView>
        <div className="bg-slate-900 dark:bg-[#0f172a] rounded-[3.5rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl dark:border dark:border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
          <div className="relative z-10">
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">
              Ready to Scale?
            </span>
            <h2 className="text-4xl sm:text-7xl font-black text-white mb-8 tracking-tighter leading-[1.0] italic uppercase">
              Deploy your<br />storefront today.
            </h2>
            <p className="text-slate-400 text-base sm:text-xl max-w-xl mx-auto mb-12 font-medium leading-relaxed">
              Join the global network of vendors using SwiftLink Pro to power their WhatsApp sales.
            </p>
            <div className="flex justify-center">
              <Link
                href="/signup?mode=signup&plan=pro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl text-base font-black hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                Get Started <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </InView>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="py-16 px-4 sm:px-6 bg-[#f8fafb] dark:bg-[#090d16] border-t border-slate-100 dark:border-white/[0.05] transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2.5 mb-5">
            <img src="/logo.png" alt="SwiftLink" className="w-8 h-8 object-contain" />
            <span className="text-xl font-black text-slate-900 dark:text-white uppercase italic">SwiftLink</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs leading-relaxed text-sm">
            The high-performance command center for modern WhatsApp commerce worldwide.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-5">Product</h4>
          <ul className="space-y-3.5">
            {[["#features", "Capabilities"], ["#how-it-works", "Workflow"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-5">Legal &amp; Trust</h4>
          <ul className="space-y-3.5">
            <li><Link href="/terms" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Privacy &amp; Cookie Policy</Link></li>
            <li><a href="mailto:support@swiftlink.pro" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Support</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200/60 dark:border-white/[0.05] gap-4">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 SwiftLink Workspace.</p>
        <div className="flex gap-6">
          {["Twitter", "Instagram", "WhatsApp"].map(s => (
            <span key={s} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors">{s}</span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── Simple Pulsing Logo Preloader ──────────────────────────────────────────────
const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#020617]"
    >
      <motion.div
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl" />
        <img src="/logo.png" alt="SwiftLink" className="relative z-10 h-16 w-16 object-contain" />
      </motion.div>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
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