"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Menu,
  MessageSquare,
  Package,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import {
  featuredWebsiteTemplates,
  websiteTemplates,
  type WebsiteTemplateId,
} from "@/lib/theme/templates";
import { Logo } from "@/components/Logo";
import {
  FREE_PRODUCT_LIMIT,
  PRO_PRODUCT_LIMIT,
  BUSINESS_PRODUCT_LIMIT,
  MAX_STORES_PER_USER,
  PLAN_PRICE_NGN,
  PLAN_PRICE_YEARLY_NGN,
  PRO_STORE_LIMIT,
  type BillingInterval,
} from "@/lib/plans";

/**
 * Marketing Landing Page — Google Material 3 (M3) Expressive Design System
 * 
 * Accurately matching /public/assets/aistudio/SwiftLink_Landing_Page___M3_Expressive_853db5e7.html:
 * - Floating top pill navbar with real SwiftLink Logo
 * - Hero with multi-channel social kicker, wavy stroke reveal, and 3D showcase
 * - Interactive phone stage with 4 product taps and animated WhatsApp chat order sheet
 * - 3 Facts curved cards (1 link, 100% revenue money card, ₦0 to start)
 * - Interactive Storefront Templates browser with Light/Dark toggle and Editorial/Boutique/Bold tabs
 * - 5-card M3 Bento Grid (Catalog, Templates, Discount code, Order inbox, Channel attribution bars)
 * - How it works with huge numerals 1, 2, 3
 * - Pricing with Monthly/Yearly toggle
 * - Closing CTA with dual morphing blobs
 * - Real SwiftLink Logo in nav and footer (no manual S letters)
 */

// ─── Floating Top Pill Navbar ────────────────────────────────────────────────
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSwiftLink();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[min(1120px,calc(100%-24px))] z-50">
        <nav
          className={cn(
            "flex items-center justify-between px-3.5 sm:px-5 py-2.5 rounded-full transition-all duration-300",
            isScrolled
              ? "bg-[#101d17]/90 backdrop-blur-xl border border-[#182a22] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.8)]"
              : "bg-[#101d17]/80 backdrop-blur-lg border border-[#182a22]/80"
          )}
        >
          <Link href="#top" className="flex items-center gap-2 m3-spring-btn shrink-0">
            <Logo size="sm" showWordmark={true} wordmarkClassName="font-extrabold tracking-tight text-xl text-[#e4f0e9]" />
          </Link>

          <div className="hidden md:flex items-center gap-1.5">
            {[
              { href: "#templates", label: "Templates" },
              { href: "#features", label: "Features" },
              { href: "#how", label: "How it works" },
              { href: "#pricing", label: "Pricing" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-[#9db4a8] hover:text-[#e4f0e9] hover:bg-[#182a22] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                href="/pro"
                className="h-[44px] px-6 rounded-full bg-[#5be3a0] text-[#00391f] text-sm font-extrabold flex items-center justify-center transition-all m3-spring-btn hover:bg-[#4ad993] shadow-sm"
              >
                Open dashboard
              </Link>
            ) : (
              <Link
                href="/signup?mode=signup"
                className="h-[44px] px-6 rounded-full bg-[#5be3a0] text-[#00391f] text-sm font-extrabold flex items-center justify-center transition-all m3-spring-btn hover:bg-[#4ad993] shadow-sm"
              >
                Start free
              </Link>
            )}
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className="w-10 h-10 rounded-full border border-[#27402f] bg-[#101d17] flex items-center justify-center text-[#e4f0e9] m3-spring-btn"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 inset-x-4 z-40 bg-[#101d17]/95 backdrop-blur-2xl border border-[#27402f] rounded-[28px] p-6 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-2">
              {[
                { href: "#templates", label: "Templates" },
                { href: "#features", label: "Features" },
                { href: "#how", label: "How it works" },
                { href: "#pricing", label: "Pricing" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-2xl text-base font-semibold text-[#9db4a8] hover:text-[#e4f0e9] hover:bg-[#182a22]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#182a22] flex flex-col gap-2.5">
              <Link
                href="/signup?mode=signup"
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3.5 rounded-full bg-[#5be3a0] text-[#00391f] text-center font-extrabold text-sm m3-spring-btn"
              >
                Start free
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 rounded-full border border-[#27402f] bg-[#182a22] text-[#e4f0e9] text-center font-semibold text-sm"
              >
                Log in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero Section with Interactive 3D Phone & Multi-Channel Chat Showcase ───
const DEMO_PRODUCTS = [
  {
    name: "Linen Shirt",
    price: "₦9,500",
    tag: "Apparel",
    gradient: "linear-gradient(135deg,#eadcc2,#cdb48a)",
  },
  {
    name: "Leather Tote",
    price: "₦14,000",
    tag: "Bags",
    gradient: "linear-gradient(135deg,#b98a62,#7d5336)",
  },
  {
    name: "Silk Scarf",
    price: "₦6,000",
    tag: "Accessories",
    gradient: "linear-gradient(135deg,#f3b9c8,#d9627f)",
  },
  {
    name: "Canvas Sneakers",
    price: "₦18,000",
    tag: "Footwear",
    gradient: "linear-gradient(135deg,#bcd6c9,#6ea58a)",
  },
] as const;

const DEMO_CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    cta: "Order on WhatsApp",
    sheetHeader: "WhatsApp · Kemi Studio",
    buyerPrefix: "Hi! I'd like to order",
    merchantReply: "In stock! Confirming delivery details now.",
    accent: "#5be3a0",
  },
  {
    id: "instagram",
    label: "Instagram",
    cta: "Message on Instagram",
    sheetHeader: "Instagram DM · Kemi Studio",
    buyerPrefix: "Saw this on your IG link — is",
    merchantReply: "Yes! Ready to dispatch today. Want me to reserve it?",
    accent: "#f3b9c8",
  },
  {
    id: "tiktok",
    label: "TikTok",
    cta: "Order via TikTok",
    sheetHeader: "TikTok Bio · Kemi Studio",
    buyerPrefix: "Came from your TikTok video for",
    merchantReply: "Awesome! Same price as listed — sending checkout link.",
    accent: "#ffe3a3",
  },
  {
    id: "facebook",
    label: "Facebook",
    cta: "Message on Facebook",
    sheetHeader: "Messenger · Kemi Studio",
    buyerPrefix: "Hello! Checking availability for",
    merchantReply: "Available in your size. Express pickup or doorstep delivery?",
    accent: "#9fd6ff",
  },
] as const;

function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const [activeProductIndex, setActiveProductIndex] = useState<number>(-1);
  const [activeChannelIndex, setActiveChannelIndex] = useState<number>(0);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [typingIn, setTypingIn] = useState<boolean>(false);
  const [bubble1In, setBubble1In] = useState<boolean>(false);
  const [bubble2In, setBubble2In] = useState<boolean>(false);
  const [userTouched, setUserTouched] = useState<boolean>(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Pointer-driven 3D tilt springs (compositor transforms only)
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 180, damping: 24, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 180, damping: 24, mass: 0.6 });

  const clearScheduledTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const triggerOrderDemo = useCallback(
    (productIndex: number, channelIdx?: number) => {
      clearScheduledTimers();
      if (typeof channelIdx === "number") {
        setActiveChannelIndex(channelIdx);
      }
      setActiveProductIndex(productIndex);
      setTypingIn(true);
      setBubble1In(false);
      setBubble2In(false);
      setShowChat(true);

      const t1 = setTimeout(() => {
        setTypingIn(false);
        setBubble1In(true);
      }, 450);

      const t2 = setTimeout(() => {
        setBubble2In(true);
      }, 1350);

      const t3 = setTimeout(() => {
        setShowChat(false);
        setActiveProductIndex(-1);
      }, 4800);

      timersRef.current.push(t1, t2, t3);
    },
    [clearScheduledTimers]
  );

  // Auto-cycle showcase across products and social channels when idle
  useEffect(() => {
    if (userTouched) return;
    let step = 0;
    const initialTimer = setTimeout(() => {
      triggerOrderDemo(0, 0);
      step = 1;
    }, 900);

    const interval = setInterval(() => {
      triggerOrderDemo(step % DEMO_PRODUCTS.length, step % DEMO_CHANNELS.length);
      step++;
    }, 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      clearScheduledTimers();
    };
  }, [userTouched, triggerOrderDemo, clearScheduledTimers]);

  useEffect(() => clearScheduledTimers, [clearScheduledTimers]);

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotateY.set(xPct * 12);
    rawRotateX.set(-yPct * 12);
  };

  const handleStageMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  const activeChannel = DEMO_CHANNELS[activeChannelIndex];
  const activeProduct =
    activeProductIndex >= 0 ? DEMO_PRODUCTS[activeProductIndex] : DEMO_PRODUCTS[1];

  return (
    <section
      id="top"
      className="relative w-[min(1180px,calc(100%-32px))] mx-auto pt-32 sm:pt-40 pb-20 grid lg:grid-cols-[1.12fr_0.88fr] gap-12 lg:gap-10 items-center"
    >
      {/* Left Column: Typography & Conversion Actions */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Clean unboxed editorial kicker (zero pill badge, zero pulsing dot) */}
        <p className="text-sm font-semibold tracking-wide text-[#5be3a0] flex flex-wrap items-center gap-2">
          <span>Social storefront builder</span>
          <span aria-hidden="true" className="text-[#27402f]">·</span>
          <span className="text-[#bdf3d6]/90">Instagram, TikTok, WhatsApp &amp; Facebook</span>
        </p>

        {/* Display Headline with Kinetic SVG Underline */}
        <h1 className="mt-4 [text-wrap:balance] text-[clamp(42px,6.8vw,86px)] font-extrabold leading-[0.98] tracking-tight text-[#e4f0e9]">
          Stop sending prices{" "}
          <span className="relative inline-block text-[#5be3a0]">
            <span>one by one.</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 280 18"
              fill="none"
              className="absolute -bottom-2 left-0 w-full h-[14px] overflow-visible pointer-events-none"
            >
              <motion.path
                d="M3 12C48 3 94 17 140 9C186 1 232 15 277 7"
                stroke="#5be3a0"
                strokeWidth="4.5"
                strokeLinecap="round"
                initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
          </span>
        </h1>

        {/* Concrete Value Proposition */}
        <p className="mt-7 text-lg sm:text-xl text-[#9db4a8] max-w-[540px] leading-relaxed">
          Put your whole catalog on one fast link for Instagram, TikTok, WhatsApp, Facebook, or your bio. Buyers browse, pick items, and send ready-to-confirm orders straight to you.
        </p>

        {/* Primary & Secondary Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <Link
            href="/signup?mode=signup"
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 h-[56px] px-8 rounded-full bg-[#5be3a0] text-[#00391f] font-extrabold text-base transition-all m3-spring-btn hover:bg-[#4ad993] shadow-[0_14px_34px_-10px_rgba(91,227,160,0.55)] hover:rounded-[20px] whitespace-nowrap shrink-0"
          >
            <span>Create your store free</span>
            <ArrowRight
              size={18}
              strokeWidth={2.5}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
          <a
            href="#templates"
            className="inline-flex items-center justify-center h-[56px] px-7 rounded-full bg-[#182a22] text-[#e4f0e9] border border-[#27402f] font-bold text-base transition-all m3-spring-btn hover:bg-[#203629] hover:rounded-[20px] whitespace-nowrap shrink-0"
          >
            See the templates
          </a>
        </div>

        {/* Clean Unboxed Trust Line */}
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#9db4a8]">
          <span className="inline-flex items-center gap-1.5">
            <Check size={16} strokeWidth={3} className="text-[#5be3a0]" />
            Free to start
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={16} strokeWidth={3} className="text-[#5be3a0]" />
            No card needed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={16} strokeWidth={3} className="text-[#5be3a0]" />
            Live in minutes
          </span>
        </div>
      </motion.div>

      {/* Right Column: Pointer-Tracked 3D Stage + Interactive Multi-Channel Storefront */}
      <div
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
        className="relative flex flex-col items-center justify-center min-h-[620px] select-none"
        style={{ perspective: 1100 }}
      >
        {/* Architectural Grid & Aurora Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-4 rounded-[48px] pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(rgba(91,227,160,0.22) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(circle at center, black 35%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 35%, transparent 75%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] rounded-full bg-[#0f5133]/55 blur-2xl m3-blob pointer-events-none"
        />
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            className="absolute w-[390px] h-[390px] sm:w-[470px] sm:h-[470px] rounded-full border border-dashed border-[#5be3a0]/20 pointer-events-none"
          />
        )}

        {/* Interactive Channel Switcher Control */}
        <div
          role="tablist"
          aria-label="Preview customer order channel"
          className="relative z-30 mb-4 inline-flex items-center gap-1 p-1 rounded-full bg-[#101d17]/95 backdrop-blur-md border border-[#27402f] shadow-lg"
        >
          {DEMO_CHANNELS.map((ch, idx) => {
            const isSelected = activeChannelIndex === idx;
            return (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setUserTouched(true);
                  triggerOrderDemo(
                    activeProductIndex >= 0 ? activeProductIndex : idx % DEMO_PRODUCTS.length,
                    idx
                  );
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0",
                  isSelected
                    ? "bg-[#5be3a0] text-[#00391f]"
                    : "text-[#9db4a8] hover:text-[#e4f0e9]"
                )}
              >
                {ch.label}
              </button>
            );
          })}
        </div>

        {/* 3D Tilting Showcase Shell */}
        <motion.div
          style={shouldReduceMotion ? undefined : { rotateX, rotateY }}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 will-change-transform"
        >
          {/* Floating Order Event Card */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:flex items-center gap-2.5 absolute -left-16 top-20 z-30 bg-[#14231c]/95 backdrop-blur-md border border-[#27402f] rounded-[20px] px-4 py-2.5 text-xs font-bold text-[#e4f0e9] shadow-2xl"
          >
            <span className="w-6 h-6 rounded-full bg-[#0f5133] text-[#5be3a0] grid place-items-center shrink-0">
              <Check size={13} strokeWidth={3} />
            </span>
            <div>
              <div className="text-[#e4f0e9]">Instant order</div>
              <div className="text-[11px] font-medium text-[#9db4a8] tabular-nums">
                {activeProduct.price} · {activeChannel.label}
              </div>
            </div>
          </motion.div>

          {/* Floating Store Reach Card */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="hidden sm:flex items-center gap-2.5 absolute -right-14 bottom-24 z-30 bg-[#14231c]/95 backdrop-blur-md border border-[#27402f] rounded-[20px] px-4 py-2.5 text-xs font-bold text-[#e4f0e9] shadow-2xl"
          >
            <span className="w-6 h-6 rounded-full bg-[#5be3a0] text-[#00391f] grid place-items-center shrink-0">
              <Package size={13} strokeWidth={2.5} />
            </span>
            <div>
              <div className="text-[#e4f0e9]">1 link, whole shop</div>
              <div className="text-[11px] font-medium text-[#9db4a8]">Tap any item to preview</div>
            </div>
          </motion.div>

          {/* Phone Shell */}
          <div className="relative w-[296px] h-[590px] bg-[#0b0f0d] rounded-[46px] p-2.5 border-2 border-[#27402f] shadow-[0_40px_90px_-25px_rgba(0,40,20,0.75)]">
            <div className="bg-[#14231c] rounded-[38px] h-full overflow-hidden relative p-3.5 flex flex-col">
              {/* Dynamic Island */}
              <div
                aria-hidden="true"
                className="w-20 h-4 bg-[#08110d] rounded-full mx-auto mb-2.5 border border-[#182a22]"
              />

              {/* Store Header */}
              <div className="text-center pb-2">
                <div className="w-11 h-11 rounded-[16px_16px_16px_6px] bg-[#5be3a0] text-[#00391f] grid place-items-center font-extrabold text-lg mx-auto mb-1.5 shadow-sm">
                  K
                </div>
                <b className="block text-sm font-bold text-[#e4f0e9]">Kemi Studio</b>
                <small className="text-[11px] text-[#9db4a8]">
                  Clothing, bags and curated essentials
                </small>
              </div>

              {/* Channel Action Bar */}
              <button
                type="button"
                onClick={() => {
                  setUserTouched(true);
                  triggerOrderDemo(
                    activeProductIndex >= 0 ? activeProductIndex : 0,
                    activeChannelIndex
                  );
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#5be3a0] hover:bg-[#4ad993] text-[#00391f] rounded-full h-10 font-bold text-xs my-2 shadow-sm transition-colors m3-spring-btn"
              >
                <MessageSquare size={14} className="fill-current" />
                <span>{activeChannel.cta}</span>
              </button>

              {/* Interactive 2x2 Product Grid */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                {DEMO_PRODUCTS.map((p, i) => {
                  const isActive = activeProductIndex === i;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setUserTouched(true);
                        triggerOrderDemo(i, activeChannelIndex);
                      }}
                      className={cn(
                        "text-left p-2 rounded-[20px] transition-all m3-spring-btn",
                        isActive
                          ? "bg-[#0f5133] border border-[#5be3a0] scale-[0.97]"
                          : "bg-[#101d17] border border-[#182a22] hover:border-[#27402f]"
                      )}
                    >
                      <div
                        className="relative h-[76px] rounded-[14px] mb-1.5 overflow-hidden"
                        style={{ background: p.gradient }}
                      />
                      <span className="block text-[10px] font-semibold text-[#9db4a8] tracking-wide">
                        {p.tag}
                      </span>
                      <b className="block text-xs font-bold text-[#e4f0e9] truncate">{p.name}</b>
                      <small className="text-[11px] font-extrabold text-[#5be3a0] tabular-nums">
                        {p.price}
                      </small>
                    </button>
                  );
                })}
              </div>

              {/* Sliding Animated Order Drawer */}
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.05 }
                        : { type: "spring", stiffness: 320, damping: 30 }
                    }
                    className="absolute inset-x-0 bottom-0 bg-[#0d2a1c] text-[#e4f0e9] rounded-t-[28px] p-4 pb-5 border-t border-[#27402f] shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <h6 className="text-xs font-bold flex items-center gap-1.5 text-[#bdf3d6]">
                        <Send size={12} />
                        <span>{activeChannel.sheetHeader}</span>
                      </h6>
                      <button
                        type="button"
                        onClick={() => {
                          clearScheduledTimers();
                          setShowChat(false);
                          setActiveProductIndex(-1);
                        }}
                        aria-label="Dismiss order preview"
                        className="text-[11px] font-semibold text-[#9db4a8] hover:text-white px-1.5 py-0.5 rounded"
                      >
                        Close
                      </button>
                    </div>

                    {typingIn && !bubble1In && (
                      <div className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#1f7a52]/60 text-white text-[11px]">
                        <span>Preparing order message...</span>
                      </div>
                    )}

                    {/* Buyer message */}
                    {bubble1In && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="max-w-[90%] p-2.5 px-3 rounded-[16px_16px_4px_16px] bg-[#1f7a52] text-xs font-medium text-white ml-auto"
                      >
                        {`${activeChannel.buyerPrefix} ${activeProduct.name} (${activeProduct.price}).`}
                      </motion.div>
                    )}

                    {/* Merchant reply */}
                    {bubble2In && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="max-w-[90%] p-2.5 px-3 rounded-[16px_16px_16px_4px] bg-[#1c2b24] text-xs font-medium text-[#e4f0e9] mt-2"
                      >
                        {activeChannel.merchantReply}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Facts Section (3 Curved Cards) ──────────────────────────────────────────
function FactsSection() {
  return (
    <section className="w-[min(1180px,calc(100%-32px))] mx-auto py-8 sm:py-16 grid sm:grid-cols-3 gap-3.5">
      <div className="bg-[#101d17] border border-[#182a22] p-7 sm:p-8 rounded-[40px] flex flex-col justify-between min-h-[160px]">
        <b className="text-[clamp(44px,5vw,60px)] font-extrabold text-[#e4f0e9] leading-none tracking-tight">
          1 link
        </b>
        <span className="text-sm font-medium text-[#9db4a8] mt-3">
          for your whole shop, in every bio and status
        </span>
      </div>

      <div className="bg-[#4a3a0f] text-[#ffe3a3] border border-[#ffe3a3]/20 p-7 sm:p-8 rounded-[40px_40px_14px_40px] flex flex-col justify-between min-h-[160px]">
        <b className="text-[clamp(44px,5vw,60px)] font-extrabold leading-none tracking-tight">
          100%
        </b>
        <span className="text-sm font-semibold opacity-90 mt-3">
          of your revenue stays with you, on every plan
        </span>
      </div>

      <div className="bg-[#101d17] border border-[#182a22] p-7 sm:p-8 rounded-[14px_40px_40px_40px] flex flex-col justify-between min-h-[160px]">
        <b className="text-[clamp(44px,5vw,60px)] font-extrabold text-[#5be3a0] leading-none tracking-tight">
          ₦0
        </b>
        <span className="text-sm font-medium text-[#9db4a8] mt-3">
          to start. No card, no trial clock
        </span>
      </div>
    </section>
  );
}

// ─── Storefront Templates Section (Light/Dark + Live Preview Browser) ─────────
const TEMPLATE_PREVIEWS = [
  {
    id: "editorial",
    name: "Editorial",
    desc: "A spacious editorial layout suited for clothing, accessories and home goods.",
    headline: "Timeless quality for daily life",
  },
  {
    id: "boutique",
    name: "Boutique",
    desc: "A warm, artisanal boutique layout suited for gifts, beauty and curated goods.",
    headline: "Something lovely, made for you",
  },
  {
    id: "bold",
    name: "Bold",
    desc: "A compact, high-contrast grid suited for electronics and retail goods.",
    headline: "New drop. No waiting.",
  },
];

function TemplatesSection() {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const current = TEMPLATE_PREVIEWS[selectedTemplateIndex];

  return (
    <section id="templates" className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-16">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5be3a0]">
          Storefront templates
        </span>
        <h2 className="mt-2.5 text-[clamp(32px,5.5vw,58px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          Pick a look that fits your brand.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-[#9db4a8] max-w-xl">
          You choose a whole website, not a pile of sections. Each one works in light and dark.
        </p>
      </div>

      <div className="mt-10 bg-[#101d17] border border-[#182a22] rounded-[clamp(36px,5vw,56px)] p-6 sm:p-10 grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-center">
        {/* Left Controls */}
        <div>
          {/* Segmented Light / Dark Toggle */}
          <div className="inline-flex gap-1 bg-[#08110d] p-1 rounded-full border border-[#182a22]">
            <button
              type="button"
              onClick={() => setIsDarkMode(false)}
              className={cn(
                "h-10 px-5 rounded-full text-xs font-extrabold transition-all m3-spring-btn",
                !isDarkMode ? "bg-[#5be3a0] text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
              )}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode(true)}
              className={cn(
                "h-10 px-5 rounded-full text-xs font-extrabold transition-all m3-spring-btn",
                isDarkMode ? "bg-[#5be3a0] text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
              )}
            >
              Dark
            </button>
          </div>

          {/* Template Choice Tabs */}
          <div className="flex flex-col gap-3 my-6">
            {TEMPLATE_PREVIEWS.map((tpl, i) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateIndex(i)}
                className={cn(
                  "text-left p-4 sm:p-5 rounded-[24px] transition-all m3-spring-btn",
                  selectedTemplateIndex === i
                    ? "bg-[#0f5133] text-[#bdf3d6] rounded-[24px_24px_24px_8px] border border-[#5be3a0]/40"
                    : "bg-[#08110d] text-[#e4f0e9] border border-[#182a22] hover:border-[#27402f]"
                )}
              >
                <b className="block text-lg font-bold text-inherit">{tpl.name}</b>
                <span className={cn("text-xs leading-relaxed block mt-1", selectedTemplateIndex === i ? "text-[#bdf3d6]/90" : "text-[#9db4a8]")}>
                  {tpl.desc}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-[#9db4a8]">
            Showing {featuredWebsiteTemplates.length} of our {websiteTemplates.length} starter templates, and your products stay put when you switch.
          </p>
        </div>

        {/* Right Live Browser Frame (.fr) */}
        <div
          className={cn(
            "rounded-[28px] overflow-hidden border border-[#27402f] shadow-2xl transition-all duration-300",
            isDarkMode ? "bg-[#0f1a2e] text-[#eef2f8]" : "bg-white text-[#14202b]"
          )}
        >
          {/* Browser Dots Bar */}
          <div className={cn("flex items-center gap-1.5 px-4 py-3 border-b", isDarkMode ? "bg-[#1b2a42] border-[#223554]" : "bg-[#eef2f6] border-[#dde3ea]")}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-60" />
          </div>

          {/* Storefront Header */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <b className="text-base font-extrabold tracking-tight">Kemi Studio</b>
            <span className="w-8 h-8 rounded-full bg-[#13b878] text-white grid place-items-center">
              <ShoppingBag size={15} />
            </span>
          </div>

          {/* Storefront Banner */}
          <div className="px-5 py-3">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {current.headline}
            </p>
            <small className={cn("text-xs block mt-1", isDarkMode ? "text-[#8c9bb0]" : "text-[#5d6b78]")}>
              Instant order confirmation on WhatsApp.
            </small>
          </div>

          {/* 3 Product Grid */}
          <div className="grid grid-cols-3 gap-2.5 p-4 pt-1">
            {DEMO_PRODUCTS.slice(0, 3).map((p) => (
              <div
                key={p.name}
                className={cn("p-2 rounded-[18px]", isDarkMode ? "bg-[#1b2a42]" : "bg-[#eef2f6]")}
              >
                <i className="block h-[72px] rounded-[12px] mb-2" style={{ background: p.gradient }} />
                <b className="block text-xs font-bold truncate">{p.name}</b>
                <small className={cn("block text-[11px] font-semibold", isDarkMode ? "text-[#8c9bb0]" : "text-[#5d6b78]")}>{p.price}</small>
                <span className="block text-center mt-2 rounded-[8px] bg-[#13b878] text-white text-[10px] font-bold py-1">
                  Order on WhatsApp
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features (5-Card M3 Bento Grid) ──────────────────────────────────────────
function BentoFeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-16">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5be3a0]">
          What you get
        </span>
        <h2 className="mt-2.5 text-[clamp(32px,5.5vw,58px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          Everything a small store needs, nothing it doesn’t.
        </h2>
      </div>

      <div className="mt-10 grid gap-3.5 md:grid-cols-6">
        {/* b1: Product Catalog */}
        <div className="md:col-span-4 bg-[#101d17] border border-[#182a22] rounded-[44px_44px_44px_14px] p-7 sm:p-8 flex flex-col justify-between min-h-[250px]">
          <div>
            <h3 className="text-2xl font-extrabold text-[#e4f0e9]">Product catalog</h3>
            <p className="mt-2 text-sm text-[#9db4a8] max-w-md">
              Add products with photos, variants and stock. The storefront keeps itself organised.
            </p>
          </div>
          <div className="grid gap-2 mt-6">
            <div className="bg-[#14231c] border border-[#27402f] rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-semibold text-[#e4f0e9]">
              <span>Linen Shirt</span>
              <span className="text-[#9db4a8] font-normal">Size S, M, L · 12 in stock</span>
            </div>
            <div className="bg-[#14231c] border border-[#27402f] rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-semibold text-[#e4f0e9]">
              <span>Leather Tote</span>
              <span className="text-[#9db4a8] font-normal">5 in stock</span>
            </div>
          </div>
        </div>

        {/* b2: Storefront Templates */}
        <div className="md:col-span-2 md:row-span-2 bg-[#5be3a0] text-[#00391f] rounded-[44px_14px_44px_44px] p-7 sm:p-8 flex flex-col justify-between min-h-[250px]">
          <div>
            <h3 className="text-2xl font-extrabold">Storefront templates</h3>
            <p className="mt-2 text-sm font-medium opacity-90">
              A whole shop in light and dark, designed for fast browsing.
            </p>
          </div>
          <div className="flex gap-2 mt-8">
            <i className="flex-1 h-24 rounded-[26px] bg-[#00391f]" />
            <i className="flex-1 h-24 rounded-full bg-[#d9627f]" />
            <i className="flex-1 h-24 rounded-[10px] bg-[#ffd23f]" />
          </div>
        </div>

        {/* b3: Discount Codes */}
        <div className="md:col-span-3 bg-[#4a3a0f] text-[#ffe3a3] border border-[#ffe3a3]/20 rounded-[44px] p-7 sm:p-8 flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-2xl font-extrabold">Discount codes</h3>
            <p className="mt-2 text-sm opacity-90">Give repeat buyers a reason to come back.</p>
          </div>
          <div className="mt-6 text-3xl font-extrabold tracking-wider bg-[#14231c] text-[#ffe3a3] rounded-2xl py-3 px-5 text-center border-2 border-dashed border-[#ffe3a3]/50">
            WELCOME10
          </div>
        </div>

        {/* b4: WhatsApp Order Inbox */}
        <div className="md:col-span-3 bg-[#0f5133] text-[#bdf3d6] rounded-[14px_44px_44px_44px] p-7 sm:p-8 flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-2xl font-extrabold text-[#e4f0e9]">WhatsApp order inbox</h3>
            <p className="mt-2 text-sm opacity-90">
              Orders arrive in chat with product details and customer selections.
            </p>
          </div>
          <div className="grid gap-2 mt-6 text-xs font-semibold">
            <span className="p-2.5 px-3.5 rounded-[16px_16px_16px_4px] bg-[#1c2b24] text-[#e4f0e9] max-w-[85%]">
              Hi, I would like to order: Linen Shirt (Size M)
            </span>
            <span className="p-2.5 px-3.5 rounded-[16px_16px_4px_16px] bg-[#1f7a52] text-white ml-auto">
              Total: ₦9,500
            </span>
          </div>
        </div>

        {/* b5: Where buyers come from */}
        <div className="md:col-span-6 bg-[#101d17] border border-[#182a22] rounded-[44px_14px_44px_44px] p-7 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold text-[#e4f0e9]">See where buyers come from</h3>
            <p className="mt-2 text-sm text-[#9db4a8] max-w-lg">
              Every channel a buyer picks is counted, so you know whether WhatsApp, Instagram or TikTok pays.
            </p>
          </div>
          <div className="flex items-end gap-2 h-20 shrink-0">
            {[30, 55, 40, 80, 65, 100].map((h, idx) => (
              <i
                key={idx}
                className="w-4 rounded-full bg-[#5be3a0]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works (3 Steps with Huge Numerals) ────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-16">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5be3a0]">
          How it works
        </span>
        <h2 className="mt-2.5 text-[clamp(32px,5.5vw,58px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          From nothing to a live store in an afternoon.
        </h2>
      </div>

      <div className="mt-10 grid gap-3.5 md:grid-cols-3">
        {/* Step 1 */}
        <div className="bg-[#101d17] border border-[#182a22] rounded-[44px] p-8 flex flex-col min-h-[290px]">
          <div className="text-[100px] font-extrabold leading-[0.9] tracking-tighter text-[#5be3a0] mb-auto">
            1
          </div>
          <h3 className="text-2xl font-extrabold text-[#e4f0e9] mt-4 mb-2">Create your store</h3>
          <p className="text-sm text-[#9db4a8]">
            Sign up, name your store and add the WhatsApp number customers should reach.
          </p>
        </div>

        {/* Step 2 (Highlighted in container green) */}
        <div className="bg-[#0f5133] text-[#bdf3d6] rounded-[44px_44px_14px_44px] p-8 flex flex-col min-h-[290px]">
          <div className="text-[100px] font-extrabold leading-[0.9] tracking-tighter text-[#bdf3d6] mb-auto">
            2
          </div>
          <h3 className="text-2xl font-extrabold text-[#e4f0e9] mt-4 mb-2">Choose a template</h3>
          <p className="text-sm opacity-90">
            Pick a design that fits your brand, then add your products. Your whole shop follows that look.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-[#101d17] border border-[#182a22] rounded-[14px_44px_44px_44px] p-8 flex flex-col min-h-[290px]">
          <div className="text-[100px] font-extrabold leading-[0.9] tracking-tighter text-[#5be3a0] mb-auto">
            3
          </div>
          <h3 className="text-2xl font-extrabold text-[#e4f0e9] mt-4 mb-2">Share one link</h3>
          <p className="text-sm text-[#9db4a8]">
            Post your store link anywhere. Orders open in WhatsApp, ready to confirm.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────
function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Starter",
      badge: "Free",
      price: "₦0",
      period: "",
      desc: "Try the whole workflow. No card required.",
      features: [
        `Up to ${FREE_PRODUCT_LIMIT} products`,
        "1 store",
        "WhatsApp checkout and price requests for services",
        "3 starter templates",
        "SwiftLink branding shown",
      ],
      cta: "Start free",
      isPro: false,
      shape: "rounded-[44px]",
    },
    {
      name: "Pro",
      badge: "Pro",
      price: isYearly ? "₦50,000" : "₦5,000",
      period: isYearly ? "/ year" : "/ month",
      desc: "Everything you need to run a serious store.",
      features: [
        "Everything in Free",
        `Up to ${PRO_PRODUCT_LIMIT} products`,
        `Up to ${PRO_STORE_LIMIT} stores`,
        "All storefront templates",
        "Discount codes",
        "Detailed analytics",
        "CSV export",
        "SwiftLink branding shown",
      ],
      cta: "Go Pro",
      isPro: true,
      shape: "rounded-[44px_44px_14px_44px]",
    },
    {
      name: "Business",
      badge: "Business",
      price: isYearly ? "₦120,000" : "₦12,000",
      period: isYearly ? "/ year" : "/ month",
      desc: "For established brands and scaling teams.",
      features: [
        "Everything in Pro",
        `Up to ${BUSINESS_PRODUCT_LIMIT.toLocaleString()} products`,
        `Up to ${MAX_STORES_PER_USER} stores`,
        "Connect your own domain",
        "No SwiftLink branding",
        "Custom preloader screen",
        "Priority WhatsApp support",
      ],
      cta: "Go Business",
      isPro: false,
      shape: "rounded-[14px_44px_44px_44px]",
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-16">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5be3a0]">
          Pricing
        </span>
        <h2 className="mt-2.5 text-[clamp(32px,5.5vw,58px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          Simple plans for ambitious brands.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-[#9db4a8] max-w-xl">
          Start free, upgrade when you outgrow it, and keep 100% of your revenue either way.
        </p>

        {/* Billing Segment Toggle */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 bg-[#08110d] p-1 rounded-full border border-[#182a22]">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "h-10 px-5 rounded-full text-xs font-extrabold transition-all m3-spring-btn",
                !isYearly ? "bg-[#5be3a0] text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "h-10 px-5 rounded-full text-xs font-extrabold transition-all m3-spring-btn",
                isYearly ? "bg-[#5be3a0] text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
              )}
            >
              Yearly
            </button>
          </div>
          <span className="text-xs font-bold text-[#5be3a0]">Pay for 10 months, get 12</span>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3 items-stretch">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn(
              "p-8 flex flex-col gap-2 transition-all duration-300",
              p.shape,
              p.isPro
                ? "bg-[#5be3a0] text-[#00391f] shadow-2xl md:-mt-2"
                : "bg-[#101d17] border border-[#182a22] text-[#e4f0e9]"
            )}
          >
            <div className="flex items-center justify-between">
              <small className={cn("text-xs font-bold uppercase tracking-wider", p.isPro ? "text-[#00391f]" : "text-[#9db4a8]")}>
                {p.badge}
              </small>
              {p.isPro && (
                <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-[#00391f] text-[#5be3a0]">
                  Most popular
                </span>
              )}
            </div>

            <div className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {p.price}
              <span className="text-base font-normal opacity-75">{p.period}</span>
            </div>

            <p className={cn("text-xs leading-relaxed mt-1", p.isPro ? "opacity-90" : "text-[#9db4a8]")}>
              {p.desc}
            </p>

            <ul className="my-6 space-y-2.5 text-sm flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={16} strokeWidth={3} className={cn("mt-0.5 shrink-0", p.isPro ? "text-[#00391f]" : "text-[#5be3a0]")} />
                  <span className={p.isPro ? "font-semibold" : "text-[#e4f0e9]"}>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/signup?mode=signup&plan=${p.name.toLowerCase()}`}
              className={cn(
                "w-full h-12 rounded-full font-extrabold text-sm flex items-center justify-center transition-all m3-spring-btn",
                p.isPro
                  ? "bg-[#00391f] text-[#5be3a0] hover:bg-[#062617]"
                  : "bg-[#182a22] text-[#e4f0e9] border border-[#27402f] hover:bg-[#203629]"
              )}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Closing CTA Banner ───────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <section className="w-[min(1180px,calc(100%-32px))] mx-auto my-16">
      <div className="relative overflow-hidden bg-[#0f5133] text-[#e4f0e9] rounded-[clamp(40px,7vw,70px)] p-12 sm:p-20 text-center border border-[#5be3a0]/30 shadow-2xl">
        {/* Dual Morphing Blobs */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#5be3a0]/20 blur-2xl m3-blob pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -right-24 w-80 h-80 rounded-full bg-[#5be3a0]/20 blur-2xl m3-blob pointer-events-none"
          style={{ animationDelay: "-4s" }}
        />

        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#bdf3d6]">
            Your storefront is one link away.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#bdf3d6]/90 leading-relaxed">
            Join small business sellers across Instagram, TikTok, WhatsApp, and Facebook on SwiftLink. Free to start, no card needed.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/signup?mode=signup"
              className="inline-flex items-center justify-center gap-2.5 h-[56px] px-8 rounded-full bg-[#5be3a0] text-[#00391f] font-extrabold text-base transition-all m3-spring-btn hover:bg-[#4ad993] shadow-lg"
            >
              <span>Get started free</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-[min(1180px,calc(100%-32px))] mx-auto py-12 border-t border-[#182a22] grid gap-8 sm:grid-cols-3 text-sm">
      <div>
        <Link href="#top" className="inline-flex items-center gap-2 m3-spring-btn">
          <Logo size="sm" showWordmark={true} wordmarkClassName="font-extrabold tracking-tight text-xl text-[#e4f0e9]" />
        </Link>
        <p className="mt-3 text-xs text-[#9db4a8] leading-relaxed max-w-xs">
          The storefront builder for small businesses selling across social media.
        </p>
      </div>

      <div>
        <h6 className="text-xs font-bold uppercase tracking-wider text-[#9db4a8] mb-3">
          Product
        </h6>
        <div className="flex flex-col gap-2 text-xs font-semibold text-[#9db4a8]">
          <a href="#templates" className="hover:text-[#e4f0e9] transition-colors">Templates</a>
          <a href="#features" className="hover:text-[#e4f0e9] transition-colors">Capabilities</a>
          <a href="#how" className="hover:text-[#e4f0e9] transition-colors">Workflow</a>
          <a href="#pricing" className="hover:text-[#e4f0e9] transition-colors">Pricing</a>
        </div>
      </div>

      <div>
        <h6 className="text-xs font-bold uppercase tracking-wider text-[#9db4a8] mb-3">
          Company
        </h6>
        <div className="flex flex-col gap-2 text-xs font-semibold text-[#9db4a8]">
          <Link href="/terms" className="hover:text-[#e4f0e9] transition-colors">Terms of service</Link>
          <Link href="/privacy" className="hover:text-[#e4f0e9] transition-colors">Privacy and cookies</Link>
          <a href="mailto:support@swiftlink.pro" className="hover:text-[#e4f0e9] transition-colors">Support</a>
        </div>
      </div>

      <div className="sm:col-span-3 pt-6 border-t border-[#182a22] text-xs text-[#9db4a8] flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 SwiftLink. All rights reserved.</p>
        <p>Built for merchants who sell where their customers are.</p>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#08110d] font-sans text-[#e4f0e9] selection:bg-[#5be3a0]/30 selection:text-[#5be3a0]">
      <Navbar />
      <HeroSection />
      <FactsSection />
      <TemplatesSection />
      <BentoFeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <ClosingCTA />
      <Footer />
    </main>
  );
}
