"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
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
} from "@/lib/theme/templates";
import { Logo } from "@/components/Logo";
import {
  FREE_PRODUCT_LIMIT,
  PRO_PRODUCT_LIMIT,
  BUSINESS_PRODUCT_LIMIT,
  MAX_STORES_PER_USER,
  PRO_STORE_LIMIT,
} from "@/lib/plans";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Scroll Progress Hairline ─────────────────────────────────────────────────
function ScrollProgressBar() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#5be3a0] via-[#b8f2d3] to-[#5be3a0] z-[60] pointer-events-none"
    />
  );
}

// ─── Floating Top Pill Navbar ─────────────────────────────────────────────────
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

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const navItems = [
    { href: "#templates", label: "Templates" },
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <>
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[min(1140px,calc(100%-24px))] z-50">
        <nav
          aria-label="Primary navigation"
          className={cn(
            "flex items-center justify-between gap-4 sm:gap-8 px-3.5 sm:px-5 py-2.5 rounded-full transition-all duration-300",
            isScrolled
              ? "bg-[#101d17]/92 backdrop-blur-xl border border-[#27402f] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]"
              : "bg-[#101d17]/80 backdrop-blur-lg border border-[#182a22]/90"
          )}
        >
          <Link
            href="#top"
            className="flex items-center gap-2 m3-spring-btn shrink-0 whitespace-nowrap"
          >
            <Logo
              size="sm"
              showWordmark={true}
              wordmarkClassName="font-extrabold tracking-tight text-lg sm:text-xl text-[#e4f0e9]"
            />
          </Link>

          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 rounded-full text-sm font-semibold text-[#9db4a8] hover:text-[#e4f0e9] hover:bg-[#182a22] transition-colors whitespace-nowrap shrink-0"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              href={user ? "/pro" : "/signup?mode=signup"}
              className="h-[42px] px-6 rounded-full bg-[#5be3a0] text-[#00391f] text-sm font-extrabold flex items-center justify-center transition-all m3-spring-btn hover:bg-[#4ad993] shadow-sm whitespace-nowrap shrink-0"
            >
              {user ? "Open dashboard" : "Start free"}
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link
              href={user ? "/pro" : "/signup?mode=signup"}
              className="h-10 px-4 rounded-full bg-[#5be3a0] text-[#00391f] text-xs font-extrabold flex items-center justify-center m3-spring-btn whitespace-nowrap shrink-0"
            >
              {user ? "Dashboard" : "Start free"}
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="w-10 h-10 rounded-full border border-[#27402f] bg-[#101d17] flex items-center justify-center text-[#e4f0e9] m3-spring-btn shrink-0"
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
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            className="fixed top-[72px] inset-x-3 z-40 bg-[#101d17]/98 backdrop-blur-2xl border border-[#27402f] rounded-[28px] p-5 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-1.5">
              {navItems.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="min-h-[44px] flex items-center px-4 py-2.5 rounded-2xl text-base font-semibold text-[#9db4a8] hover:text-[#e4f0e9] hover:bg-[#182a22]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#182a22] flex flex-col gap-2.5">
              <Link
                href={user ? "/pro" : "/signup?mode=signup"}
                onClick={() => setIsMenuOpen(false)}
                className="w-full min-h-[46px] flex items-center justify-center rounded-full bg-[#5be3a0] text-[#00391f] font-extrabold text-sm m3-spring-btn"
              >
                {user ? "Open dashboard" : "Start free"}
              </Link>
              {!user && (
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full min-h-[46px] flex items-center justify-center rounded-full border border-[#27402f] bg-[#182a22] text-[#e4f0e9] font-semibold text-sm"
                >
                  Log in
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero Section with Interactive 3D Phone & Multi-Channel Showcase ──────────
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
    buyerPrefix: "Hi! I would like to order",
    merchantReply: "In stock! Confirming delivery details now.",
  },
  {
    id: "instagram",
    label: "Instagram",
    cta: "Message on Instagram",
    sheetHeader: "Instagram DM · Kemi Studio",
    buyerPrefix: "Saw this on your IG link — is",
    merchantReply: "Yes! Ready to ship today. Reserve yours?",
  },
  {
    id: "tiktok",
    label: "TikTok",
    cta: "Order via TikTok",
    sheetHeader: "TikTok Bio · Kemi Studio",
    buyerPrefix: "Came from your TikTok video for",
    merchantReply: "Listed price applies — sending pickup options.",
  },
  {
    id: "facebook",
    label: "Facebook",
    cta: "Message on Facebook",
    sheetHeader: "Messenger · Kemi Studio",
    buyerPrefix: "Hello! Checking availability for",
    merchantReply: "Available in your size. Express or standard?",
  },
] as const;

function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const [activeProductIndex, setActiveProductIndex] = useState<number>(0);
  const [activeChannelIndex, setActiveChannelIndex] = useState<number>(0);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [typingIn, setTypingIn] = useState<boolean>(false);
  const [bubble1In, setBubble1In] = useState<boolean>(false);
  const [bubble2In, setBubble2In] = useState<boolean>(false);
  const [userTouched, setUserTouched] = useState<boolean>(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Scroll-driven depth parallax for stage & ambient layers
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const stageParallaxY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 48]);
  const copyParallaxY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 20]);

  // Pointer-driven 3D tilt springs (compositor transforms only)
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 170, damping: 24, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 170, damping: 24, mass: 0.6 });

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
      }, 420);

      const t2 = setTimeout(() => {
        setBubble2In(true);
      }, 1250);

      const t3 = setTimeout(() => {
        setShowChat(false);
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
    }, 850);

    const interval = setInterval(() => {
      triggerOrderDemo(step % DEMO_PRODUCTS.length, step % DEMO_CHANNELS.length);
      step++;
    }, 6200);

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
    rawRotateX.set(-yPct * 10);
  };

  const handleStageMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  const activeChannel = DEMO_CHANNELS[activeChannelIndex];
  const activeProduct = DEMO_PRODUCTS[activeProductIndex] ?? DEMO_PRODUCTS[0];

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative overflow-x-clip w-full pt-24 sm:pt-32 lg:pt-36 pb-16 sm:pb-24"
    >
      {/* Ambient Radial Mesh Backlights */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 45% at 75% 32%, rgba(15, 81, 51, 0.36) 0%, rgba(8, 17, 13, 0) 70%), radial-gradient(45% 35% at 15% 18%, rgba(91, 227, 160, 0.09) 0%, rgba(8, 17, 13, 0) 70%)",
        }}
      />

      <div className="relative w-[min(1180px,calc(100%-32px))] mx-auto grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-8 items-center">
        {/* Left Column: Kinetic Typography & Conversion Actions */}
        <motion.div
          style={{ y: copyParallaxY }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          className="text-center lg:text-left"
        >
          {/* Clean Unboxed Kicker */}
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#5be3a0] inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <span>Social storefront builder</span>
            <span aria-hidden="true" className="text-[#27402f]">·</span>
            <span className="text-[#bdf3d6]/90">Instagram, TikTok, WhatsApp &amp; Facebook</span>
          </p>

          {/* Fluid Responsive Display Headline */}
          <h1 className="mt-4 [text-wrap:balance] text-[clamp(36px,7.2vw,84px)] font-extrabold leading-[1.0] tracking-tight text-[#e4f0e9]">
            Stop sending prices{" "}
            <span className="relative inline-block text-[#5be3a0]">
              <span>one by one.</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 280 18"
                fill="none"
                className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-[12px] sm:h-[14px] overflow-visible pointer-events-none"
              >
                <motion.path
                  d="M3 12C48 3 94 17 140 9C186 1 232 15 277 7"
                  stroke="#5be3a0"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.85, delay: 0.25, ease: EASE_OUT_EXPO }}
                />
              </svg>
            </span>
          </h1>

          {/* Value Proposition */}
          <p className="mt-6 sm:mt-7 text-base sm:text-lg lg:text-xl text-[#9db4a8] max-w-[540px] mx-auto lg:mx-0 leading-relaxed">
            Put your whole catalog on one fast link for Instagram, TikTok, WhatsApp, Facebook, or your bio. Buyers browse, pick items, and send ready-to-confirm orders straight to you.
          </p>

          {/* Primary & Secondary Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <Link
              href="/signup?mode=signup"
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 h-[52px] sm:h-[56px] px-7 sm:px-8 rounded-full bg-[#5be3a0] text-[#00391f] font-extrabold text-sm sm:text-base transition-all m3-spring-btn hover:bg-[#4ad993] shadow-[0_14px_34px_-10px_rgba(91,227,160,0.5)] hover:rounded-[20px] whitespace-nowrap shrink-0"
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
              className="inline-flex items-center justify-center h-[52px] sm:h-[56px] px-6 sm:px-7 rounded-full bg-[#182a22] text-[#e4f0e9] border border-[#27402f] font-bold text-sm sm:text-base transition-all m3-spring-btn hover:bg-[#203629] hover:rounded-[20px] whitespace-nowrap shrink-0"
            >
              See the templates
            </a>
          </div>

          {/* Unboxed Proof Row */}
          <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-[#9db4a8]">
            <span className="inline-flex items-center gap-1.5">
              <Check size={15} strokeWidth={3} className="text-[#5be3a0]" />
              Free to start
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={15} strokeWidth={3} className="text-[#5be3a0]" />
              No card needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={15} strokeWidth={3} className="text-[#5be3a0]" />
              Live in minutes
            </span>
          </div>
        </motion.div>

        {/* Right Column: Responsive 3D Interactive Stage */}
        <motion.div
          style={{ y: stageParallaxY, perspective: 1100 }}
          onMouseMove={handleStageMouseMove}
          onMouseLeave={handleStageMouseLeave}
          className="relative flex flex-col items-center justify-center w-full select-none pt-2"
        >
          {/* Architectural Dot Grid + Orbital Accent */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(rgba(91,227,160,0.22) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(circle at center, black 35%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(circle at center, black 35%, transparent 72%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#0f5133]/55 blur-2xl m3-blob pointer-events-none"
          />
          {!shouldReduceMotion && (
            <motion.div
              aria-hidden="true"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="hidden sm:block absolute w-[420px] h-[420px] lg:w-[450px] lg:h-[450px] rounded-full border border-dashed border-[#5be3a0]/20 pointer-events-none"
            />
          )}

          {/* Responsive Channel Switcher with LayoutId Spring Indicator */}
          <div
            role="tablist"
            aria-label="Preview customer order channel"
            className="relative z-30 mb-4 max-w-full overflow-x-auto scrollbar-hide inline-flex items-center gap-1 p-1 rounded-full bg-[#101d17]/95 backdrop-blur-md border border-[#27402f] shadow-lg"
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
                    triggerOrderDemo(activeProductIndex, idx);
                  }}
                  className={cn(
                    "relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0",
                    isSelected ? "text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="hero-channel-pill"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.05 }
                          : { type: "spring", stiffness: 360, damping: 28 }
                      }
                      className="absolute inset-0 rounded-full bg-[#5be3a0]"
                    />
                  )}
                  <span className="relative z-10">{ch.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive 3D Phone Mockup Container */}
          <motion.div
            style={shouldReduceMotion ? undefined : { rotateX, rotateY }}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="relative z-20 will-change-transform flex flex-col items-center w-full"
          >
            {/* Desktop Floating Order Card */}
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden lg:flex items-center gap-2.5 absolute -left-8 xl:-left-12 top-20 z-30 bg-[#14231c]/95 backdrop-blur-md border border-[#27402f] rounded-[20px] px-4 py-2.5 text-xs font-bold text-[#e4f0e9] shadow-2xl"
            >
              <span className="w-7 h-7 rounded-full bg-[#0f5133] text-[#5be3a0] grid place-items-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </span>
              <div>
                <div className="text-[#e4f0e9]">Instant order</div>
                <div className="text-[11px] font-medium text-[#9db4a8] tabular-nums">
                  {activeProduct.price} · {activeChannel.label}
                </div>
              </div>
            </motion.div>

            {/* Desktop Floating Channel Sync Card */}
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="hidden lg:flex items-center gap-2.5 absolute -right-6 xl:-right-10 bottom-24 z-30 bg-[#14231c]/95 backdrop-blur-md border border-[#27402f] rounded-[20px] px-4 py-2.5 text-xs font-bold text-[#e4f0e9] shadow-2xl"
            >
              <span className="w-7 h-7 rounded-full bg-[#5be3a0] text-[#00391f] grid place-items-center shrink-0">
                <Package size={14} strokeWidth={2.5} />
              </span>
              <div>
                <div className="text-[#e4f0e9]">1 link, whole shop</div>
                <div className="text-[11px] font-medium text-[#9db4a8]">Tap an item to test</div>
              </div>
            </motion.div>

            {/* Phone Shell */}
            <div className="relative w-full max-w-[300px] h-[545px] sm:h-[580px] bg-[#0b0f0d] rounded-[44px] p-2.5 border-2 border-[#27402f] shadow-[0_40px_90px_-25px_rgba(0,40,20,0.75)]">
              <div className="bg-[#14231c] rounded-[36px] h-full overflow-hidden relative p-3.5 flex flex-col">
                <div
                  aria-hidden="true"
                  className="w-20 h-4 bg-[#08110d] rounded-full mx-auto mb-2.5 border border-[#182a22]"
                />

                <div className="text-center pb-2">
                  <div className="w-11 h-11 rounded-[16px_16px_16px_6px] bg-[#5be3a0] text-[#00391f] grid place-items-center font-extrabold text-lg mx-auto mb-1.5 shadow-sm">
                    K
                  </div>
                  <b className="block text-sm font-bold text-[#e4f0e9]">Kemi Studio</b>
                  <small className="text-[11px] text-[#9db4a8]">
                    Clothing, bags and curated essentials
                  </small>
                </div>

                {/* Active Social Channel Button */}
                <button
                  type="button"
                  onClick={() => {
                    setUserTouched(true);
                    triggerOrderDemo(activeProductIndex, activeChannelIndex);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#5be3a0] hover:bg-[#4ad993] text-[#00391f] rounded-full h-10 font-bold text-xs my-2 shadow-sm transition-colors m3-spring-btn shrink-0"
                >
                  <MessageSquare size={14} className="fill-current" />
                  <span>{activeChannel.cta}</span>
                </button>

                {/* Interactive 2x2 Product Grid */}
                <div className="grid grid-cols-2 gap-2 mt-1 flex-1 content-start">
                  {DEMO_PRODUCTS.map((p, i) => {
                    const isActive = activeProductIndex === i && showChat;
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
                          className="relative h-[68px] sm:h-[74px] rounded-[14px] mb-1.5 overflow-hidden"
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
                      className="absolute inset-x-0 bottom-0 bg-[#0d2a1c] text-[#e4f0e9] rounded-t-[26px] p-4 pb-5 border-t border-[#27402f] shadow-2xl"
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
                          }}
                          aria-label="Dismiss order preview"
                          className="text-[11px] font-semibold text-[#9db4a8] hover:text-white px-2 py-1 rounded"
                        >
                          Close
                        </button>
                      </div>

                      {typingIn && !bubble1In && (
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1f7a52]/60 text-white text-[11px]">
                          <span>Preparing order message...</span>
                        </div>
                      )}

                      {bubble1In && (
                        <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.22 }}
                          className="max-w-[92%] p-2.5 px-3 rounded-[16px_16px_4px_16px] bg-[#1f7a52] text-xs font-medium text-white ml-auto"
                        >
                          {`${activeChannel.buyerPrefix} ${activeProduct.name} (${activeProduct.price}).`}
                        </motion.div>
                      )}

                      {bubble2In && (
                        <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.22 }}
                          className="max-w-[92%] p-2.5 px-3 rounded-[16px_16px_16px_4px] bg-[#1c2b24] text-xs font-medium text-[#e4f0e9] mt-2"
                        >
                          {activeChannel.merchantReply}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Compact Responsive Order Activity Strip on Mobile / Tablet */}
            <div className="mt-4 flex lg:hidden items-center justify-between gap-3 w-full max-w-[320px] rounded-[20px] border border-[#27402f] bg-[#14231c]/95 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-[#0f5133] text-[#5be3a0] grid place-items-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </span>
                <div className="truncate">
                  <div className="font-bold text-[#e4f0e9] truncate">{activeProduct.name}</div>
                  <div className="text-[11px] text-[#9db4a8] tabular-nums">
                    {activeProduct.price} · {activeChannel.label}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#5be3a0] shrink-0">Tap item</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Kinetic Metrics / Facts Section ──────────────────────────────────────────
function FactsSection() {
  const shouldReduceMotion = useReducedMotion();

  const facts = [
    {
      figure: "1 link",
      copy: "for your whole shop, in every bio and story",
      tone: "bg-[#101d17] border border-[#182a22] text-[#e4f0e9] rounded-[32px] sm:rounded-[40px]",
      figureColor: "text-[#e4f0e9]",
    },
    {
      figure: "100%",
      copy: "of your revenue stays with you, on every plan",
      tone: "bg-[#4a3a0f] border border-[#ffe3a3]/20 text-[#ffe3a3] rounded-[32px] sm:rounded-[40px_40px_14px_40px]",
      figureColor: "text-[#ffe3a3]",
    },
    {
      figure: "₦0",
      copy: "to start. No card, no trial clock",
      tone: "bg-[#101d17] border border-[#182a22] text-[#e4f0e9] rounded-[32px] sm:rounded-[14px_40px_40px_40px]",
      figureColor: "text-[#5be3a0]",
    },
  ];

  return (
    <section className="w-[min(1180px,calc(100%-32px))] mx-auto py-8 sm:py-14 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {facts.map((fact, idx) => (
        <motion.div
          key={fact.figure}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={shouldReduceMotion ? undefined : { y: -4 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
          className={cn(
            "p-6 sm:p-8 flex flex-col justify-between min-h-[148px] sm:min-h-[168px] transition-shadow hover:shadow-xl",
            fact.tone
          )}
        >
          <b
            className={cn(
              "text-[clamp(38px,5vw,58px)] font-extrabold leading-none tracking-tight tabular-nums",
              fact.figureColor
            )}
          >
            {fact.figure}
          </b>
          <span className="text-sm font-medium opacity-85 mt-3 leading-relaxed">
            {fact.copy}
          </span>
        </motion.div>
      ))}
    </section>
  );
}

// ─── Interactive Templates Section ────────────────────────────────────────────
const TEMPLATE_PREVIEWS = [
  {
    id: "editorial",
    name: "Editorial",
    desc: "A spacious editorial layout suited for clothing, accessories and home goods.",
    headline: "Timeless quality for daily life",
    accentLight: "#111111",
    accentDark: "#5be3a0",
    radius: "rounded-[10px]",
  },
  {
    id: "boutique",
    name: "Boutique",
    desc: "A warm, artisanal boutique layout suited for gifts, beauty and curated goods.",
    headline: "Something lovely, made for you",
    accentLight: "#be185d",
    accentDark: "#f472b6",
    radius: "rounded-[20px]",
  },
  {
    id: "bold",
    name: "Bold",
    desc: "A compact, high-contrast grid suited for electronics and retail goods.",
    headline: "New drop. No waiting.",
    accentLight: "#0f766e",
    accentDark: "#2dd4bf",
    radius: "rounded-[14px]",
  },
] as const;

function TemplatesSection() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [orderedItem, setOrderedItem] = useState<string | null>(null);

  const current = TEMPLATE_PREVIEWS[selectedTemplateIndex];
  const accentColor = isDarkMode ? current.accentDark : current.accentLight;

  return (
    <section
      id="templates"
      className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-14 sm:py-20"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        <span className="text-xs font-bold tracking-[0.14em] uppercase text-[#5be3a0]">
          Storefront templates
        </span>
        <h2 className="mt-2.5 [text-wrap:balance] text-[clamp(30px,5vw,56px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          Pick a look that fits your brand.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-[#9db4a8] max-w-xl leading-relaxed">
          Choose a complete storefront theme — not a pile of mismatched blocks. Every template adapts smoothly across mobile and desktop, in light and dark.
        </p>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="mt-8 sm:mt-10 bg-[#101d17] border border-[#182a22] rounded-[32px] sm:rounded-[48px] p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-7 sm:gap-8 items-center"
      >
        {/* Left Controls */}
        <div>
          {/* Segmented Light / Dark Toggle with spring indicator */}
          <div className="inline-flex gap-1 bg-[#08110d] p-1 rounded-full border border-[#182a22]">
            {[
              { id: "light", label: "Light", dark: false },
              { id: "dark", label: "Dark", dark: true },
            ].map((mode) => {
              const active = isDarkMode === mode.dark;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setIsDarkMode(mode.dark)}
                  className={cn(
                    "relative h-10 px-5 rounded-full text-xs font-extrabold transition-colors whitespace-nowrap shrink-0",
                    active ? "text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="template-theme-pill"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.05 }
                          : { type: "spring", stiffness: 360, damping: 28 }
                      }
                      className="absolute inset-0 rounded-full bg-[#5be3a0]"
                    />
                  )}
                  <span className="relative z-10">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Template Choice Tabs */}
          <div className="flex flex-col gap-2.5 my-5 sm:my-6">
            {TEMPLATE_PREVIEWS.map((tpl, i) => {
              const isSelected = selectedTemplateIndex === i;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateIndex(i);
                    setOrderedItem(null);
                  }}
                  className={cn(
                    "relative text-left p-4 sm:p-5 rounded-[22px] transition-all m3-spring-btn",
                    isSelected
                      ? "bg-[#0f5133] text-[#bdf3d6] rounded-[22px_22px_22px_8px] border border-[#5be3a0]/40 shadow-lg"
                      : "bg-[#08110d] text-[#e4f0e9] border border-[#182a22] hover:border-[#27402f]"
                  )}
                >
                  <b className="block text-base sm:text-lg font-bold text-inherit">{tpl.name}</b>
                  <span
                    className={cn(
                      "text-xs leading-relaxed block mt-1",
                      isSelected ? "text-[#bdf3d6]/90" : "text-[#9db4a8]"
                    )}
                  >
                    {tpl.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[#9db4a8] leading-relaxed">
            Showing {featuredWebsiteTemplates.length} of our {websiteTemplates.length} complete templates. Your products carry over seamlessly whenever you switch.
          </p>
        </div>

        {/* Right Responsive Live Browser Frame */}
        <div
          className={cn(
            "rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#27402f] shadow-2xl transition-colors duration-300",
            isDarkMode ? "bg-[#0f1a2e] text-[#eef2f8]" : "bg-white text-[#14202b]"
          )}
        >
          {/* Browser Chrome */}
          <div
            className={cn(
              "flex items-center justify-between px-4 py-3 border-b",
              isDarkMode ? "bg-[#1b2a42] border-[#223554]" : "bg-[#eef2f6] border-[#dde3ea]"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <span
              className={cn(
                "text-[11px] font-medium truncate",
                isDarkMode ? "text-[#8c9bb0]" : "text-[#5d6b78]"
              )}
            >
              kemistudio.swiftlink.pro
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${current.id}-${isDarkMode ? "dark" : "light"}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            >
              {/* Storefront Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5">
                <b className="text-base font-extrabold tracking-tight">Kemi Studio</b>
                <span
                  className="w-8 h-8 rounded-full text-white grid place-items-center shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  <ShoppingBag size={15} />
                </span>
              </div>

              {/* Storefront Hero Copy */}
              <div className="px-4 sm:px-5 py-2.5">
                <p className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight [text-wrap:balance]">
                  {current.headline}
                </p>
                <small
                  className={cn(
                    "text-xs block mt-1",
                    isDarkMode ? "text-[#8c9bb0]" : "text-[#5d6b78]"
                  )}
                >
                  Tap any item below to preview direct ordering.
                </small>
              </div>

              {/* Responsive 1-col mobile -> 3-col desktop product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-4 pt-2">
                {DEMO_PRODUCTS.slice(0, 3).map((p) => {
                  const isAdded = orderedItem === p.name;
                  return (
                    <div
                      key={p.name}
                      className={cn(
                        "p-2.5 flex sm:block items-center gap-3",
                        current.radius,
                        isDarkMode ? "bg-[#1b2a42]" : "bg-[#eef2f6]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-16 h-16 sm:w-full sm:h-[74px] shrink-0 sm:mb-2",
                          current.radius
                        )}
                        style={{ background: p.gradient }}
                      />
                      <div className="flex-1 min-w-0">
                        <b className="block text-xs font-bold truncate">{p.name}</b>
                        <small
                          className={cn(
                            "block text-[11px] font-semibold tabular-nums",
                            isDarkMode ? "text-[#8c9bb0]" : "text-[#5d6b78]"
                          )}
                        >
                          {p.price}
                        </small>
                        <button
                          type="button"
                          onClick={() => setOrderedItem(p.name)}
                          className="mt-2 w-full rounded-[8px] text-white text-[11px] font-bold py-1.5 px-2 transition-transform active:scale-95 whitespace-nowrap"
                          style={{ backgroundColor: accentColor }}
                        >
                          {isAdded ? "Order ready" : "Order now"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Interactive Bento Capabilities Grid ──────────────────────────────────────
const CHANNEL_TELEMETRY = [
  { name: "WhatsApp", share: 44, scale: 1 },
  { name: "Instagram", share: 31, scale: 0.72 },
  { name: "TikTok", share: 18, scale: 0.45 },
  { name: "Facebook", share: 7, scale: 0.26 },
] as const;

function BentoFeaturesSection() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeChannelStat, setActiveChannelStat] = useState(0);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stockBySize = { S: 5, M: 12, L: 3 } as const;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard?.writeText("WELCOME10");
    } catch {
      // Clipboard API may be blocked in unprivileged frames; visual feedback still signals state change.
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopiedCode(true);
    copyTimerRef.current = setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <section
      id="features"
      className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-14 sm:py-20"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5be3a0]">
          What you get
        </span>
        <h2 className="mt-2.5 [text-wrap:balance] text-[clamp(30px,5vw,56px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          Everything a small store needs, nothing it doesn’t.
        </h2>
      </motion.div>

      <div className="mt-8 sm:mt-10 grid gap-3.5 grid-cols-1 md:grid-cols-6">
        {/* Card 1: Interactive Variant Catalog */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, delay: 0.05, ease: EASE_OUT_EXPO }}
          className="md:col-span-4 bg-[#101d17] border border-[#182a22] rounded-[32px] sm:rounded-[44px_44px_44px_14px] p-6 sm:p-8 flex flex-col justify-between min-h-[240px]"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#e4f0e9]">
                Product catalog
              </h3>
              <p className="mt-2 text-sm text-[#9db4a8] max-w-md">
                Add items with photos, variants and live inventory. Shoppers pick what fits before messaging you.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#08110d] border border-[#182a22] self-start shrink-0">
              {(["S", "M", "L"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-bold transition-colors",
                    selectedSize === sz
                      ? "bg-[#5be3a0] text-[#00391f]"
                      : "text-[#9db4a8] hover:text-[#e4f0e9]"
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 mt-6">
            <div className="bg-[#14231c] border border-[#27402f] rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#e4f0e9]">
              <span>Linen Shirt</span>
              <span className="text-[#5be3a0] font-bold tabular-nums">
                Size {selectedSize} · {stockBySize[selectedSize]} in stock
              </span>
            </div>
            <div className="bg-[#14231c] border border-[#27402f] rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#e4f0e9]">
              <span>Leather Tote</span>
              <span className="text-[#9db4a8] font-normal tabular-nums">5 in stock</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Storefront Templates */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="md:col-span-2 md:row-span-2 bg-[#5be3a0] text-[#00391f] rounded-[32px] sm:rounded-[44px_14px_44px_44px] p-6 sm:p-8 flex flex-col justify-between min-h-[240px]"
        >
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold">Storefront templates</h3>
            <p className="mt-2 text-sm font-medium opacity-90 leading-relaxed">
              Ten curated light and dark looks built for fast browsing on every screen size.
            </p>
          </div>
          <div className="flex gap-2.5 mt-8">
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06, rotate: -3 }}
              className="flex-1 h-24 rounded-[26px] bg-[#00391f]"
            />
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06, y: -4 }}
              className="flex-1 h-24 rounded-full bg-[#d9627f]"
            />
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06, rotate: 3 }}
              className="flex-1 h-24 rounded-[12px] bg-[#ffd23f]"
            />
          </div>
        </motion.div>

        {/* Card 3: Interactive Copyable Discount Codes */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, delay: 0.14, ease: EASE_OUT_EXPO }}
          className="md:col-span-3 bg-[#4a3a0f] text-[#ffe3a3] border border-[#ffe3a3]/20 rounded-[32px] sm:rounded-[44px] p-6 sm:p-8 flex flex-col justify-between min-h-[210px]"
        >
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold">Discount codes</h3>
            <p className="mt-2 text-sm opacity-90">
              Give repeat buyers an instant incentive to complete their basket.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="mt-6 w-full flex items-center justify-between text-2xl sm:text-3xl font-extrabold tracking-wider bg-[#14231c] text-[#ffe3a3] rounded-2xl py-3 px-5 border-2 border-dashed border-[#ffe3a3]/50 hover:border-[#ffe3a3] transition-colors m3-spring-btn"
          >
            <span>WELCOME10</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-normal text-[#5be3a0]">
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              {copiedCode ? "Copied" : "Copy"}
            </span>
          </button>
        </motion.div>

        {/* Card 4: Social Order Inbox */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, delay: 0.18, ease: EASE_OUT_EXPO }}
          className="md:col-span-3 bg-[#0f5133] text-[#bdf3d6] rounded-[32px] sm:rounded-[14px_44px_44px_44px] p-6 sm:p-8 flex flex-col justify-between min-h-[210px]"
        >
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#e4f0e9]">
              Direct chat order slips
            </h3>
            <p className="mt-2 text-sm opacity-90">
              Every inquiry arrives structured with product names, selected variants and totals.
            </p>
          </div>
          <div className="grid gap-2 mt-6 text-xs font-semibold">
            <span className="p-2.5 px-3.5 rounded-[16px_16px_16px_4px] bg-[#1c2b24] text-[#e4f0e9] max-w-[90%]">
              Order: Linen Shirt (Size M) · 1x
            </span>
            <span className="p-2.5 px-3.5 rounded-[16px_16px_4px_16px] bg-[#1f7a52] text-white ml-auto tabular-nums">
              Total: ₦9,500
            </span>
          </div>
        </motion.div>

        {/* Card 5: Interactive Channel Attribution Chart */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, delay: 0.22, ease: EASE_OUT_EXPO }}
          className="md:col-span-6 bg-[#101d17] border border-[#182a22] rounded-[32px] sm:rounded-[44px_14px_44px_44px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#e4f0e9]">
              See where buyers come from
            </h3>
            <p className="mt-2 text-sm text-[#9db4a8] max-w-lg leading-relaxed">
              Every channel tap is tracked automatically — tap a bar to compare WhatsApp, Instagram, TikTok, and Facebook conversion share.
            </p>
            <div className="mt-3 text-xs font-bold text-[#5be3a0] tabular-nums">
              {CHANNEL_TELEMETRY[activeChannelStat].name} ·{" "}
              {CHANNEL_TELEMETRY[activeChannelStat].share}% of store checkouts
            </div>
          </div>

          <div className="flex items-end gap-3 h-24 shrink-0 self-start md:self-auto">
            {CHANNEL_TELEMETRY.map((bar, idx) => {
              const isSelected = activeChannelStat === idx;
              return (
                <button
                  key={bar.name}
                  type="button"
                  onClick={() => setActiveChannelStat(idx)}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                  aria-label={`${bar.name}: ${bar.share}%`}
                >
                  <div className="w-7 sm:w-8 h-16 flex items-end justify-center">
                    <motion.div
                      initial={shouldReduceMotion ? { scaleY: bar.scale } : { scaleY: 0 }}
                      whileInView={{ scaleY: bar.scale }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.65, delay: 0.08 * idx, ease: EASE_OUT_EXPO }}
                      style={{ transformOrigin: "bottom" }}
                      className={cn(
                        "w-full h-full rounded-full transition-colors",
                        isSelected
                          ? "bg-[#5be3a0]"
                          : "bg-[#27402f] group-hover:bg-[#3a6348]"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold transition-colors",
                      isSelected ? "text-[#5be3a0]" : "text-[#9db4a8]"
                    )}
                  >
                    {bar.name.slice(0, 2)}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works (Interactive Step Progression) ──────────────────────────────
function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      num: "01",
      title: "Create your store",
      desc: "Sign up, add your store name, and connect the WhatsApp or social messaging handles where buyers reach you.",
      shape: "rounded-[32px] sm:rounded-[44px]",
    },
    {
      num: "02",
      title: "Choose a template",
      desc: "Pick a complete responsive layout tailored to your brand, upload products, and watch the whole shop update immediately.",
      shape: "rounded-[32px] sm:rounded-[44px_44px_14px_44px]",
    },
    {
      num: "03",
      title: "Share one link",
      desc: "Drop your store link into Instagram, TikTok, Facebook, or WhatsApp statuses. Orders arrive formatted and ready to confirm.",
      shape: "rounded-[32px] sm:rounded-[14px_44px_44px_44px]",
    },
  ];

  return (
    <section
      id="how"
      className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-14 sm:py-20"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5be3a0]">
          How it works
        </span>
        <h2 className="mt-2.5 [text-wrap:balance] text-[clamp(30px,5vw,56px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          From nothing to a live store in minutes.
        </h2>
      </motion.div>

      <div className="mt-8 sm:mt-10 grid gap-3.5 grid-cols-1 md:grid-cols-3">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <motion.button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(idx)}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
              className={cn(
                "text-left p-6 sm:p-8 flex flex-col min-h-[230px] sm:min-h-[280px] transition-colors cursor-pointer",
                step.shape,
                isActive
                  ? "bg-[#0f5133] text-[#bdf3d6] border border-[#5be3a0]/40 shadow-xl"
                  : "bg-[#101d17] text-[#e4f0e9] border border-[#182a22] hover:border-[#27402f]"
              )}
            >
              <div
                className={cn(
                  "text-[64px] sm:text-[88px] font-extrabold leading-[0.9] tracking-tighter mb-auto tabular-nums transition-colors",
                  isActive ? "text-[#bdf3d6]" : "text-[#5be3a0]"
                )}
              >
                {step.num}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#e4f0e9] mt-6 mb-2">
                {step.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isActive ? "text-[#bdf3d6]/90" : "text-[#9db4a8]"
                )}
              >
                {step.desc}
              </p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Animated Pricing Section ─────────────────────────────────────────────────
function PricingSection() {
  const shouldReduceMotion = useReducedMotion();
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
        "Direct social & WhatsApp checkout",
        "3 starter templates",
        "SwiftLink branding shown",
      ],
      cta: "Start free",
      isPro: false,
      shape: "rounded-[32px] sm:rounded-[44px]",
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
        "All 10 storefront templates",
        "Discount codes",
        "Detailed channel analytics",
        "CSV export",
      ],
      cta: "Go Pro",
      isPro: true,
      shape: "rounded-[32px] sm:rounded-[44px_44px_14px_44px]",
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
        "Remove SwiftLink branding",
        "Custom preloader screen",
        "Priority support",
      ],
      cta: "Go Business",
      isPro: false,
      shape: "rounded-[32px] sm:rounded-[14px_44px_44px_44px]",
    },
  ];

  return (
    <section
      id="pricing"
      className="scroll-mt-24 w-[min(1180px,calc(100%-32px))] mx-auto py-14 sm:py-20"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5be3a0]">
          Pricing
        </span>
        <h2 className="mt-2.5 [text-wrap:balance] text-[clamp(30px,5vw,56px)] font-extrabold tracking-tight text-[#e4f0e9] leading-[1.05]">
          Simple plans for ambitious brands.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-[#9db4a8] max-w-xl leading-relaxed">
          Start free, upgrade when you outgrow it, and keep 100% of your revenue either way.
        </p>

        {/* Billing Segment Toggle with Spring Slide */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 bg-[#08110d] p-1 rounded-full border border-[#182a22]">
            {[
              { id: "monthly", label: "Monthly", yearly: false },
              { id: "yearly", label: "Yearly", yearly: true },
            ].map((option) => {
              const active = isYearly === option.yearly;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setIsYearly(option.yearly)}
                  className={cn(
                    "relative h-10 px-5 rounded-full text-xs font-extrabold transition-colors whitespace-nowrap shrink-0",
                    active ? "text-[#00391f]" : "text-[#9db4a8] hover:text-[#e4f0e9]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="billing-period-pill"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.05 }
                          : { type: "spring", stiffness: 360, damping: 28 }
                      }
                      className="absolute inset-0 rounded-full bg-[#5be3a0]"
                    />
                  )}
                  <span className="relative z-10">{option.label}</span>
                </button>
              );
            })}
          </div>
          <span className="text-xs font-bold text-[#5be3a0]">Pay for 10 months, get 12</span>
        </div>
      </motion.div>

      <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 md:grid-cols-3 items-stretch">
        {plans.map((p, idx) => (
          <motion.div
            key={p.name}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
            className={cn(
              "p-6 sm:p-8 flex flex-col gap-2 transition-shadow duration-300",
              p.shape,
              p.isPro
                ? "bg-[#5be3a0] text-[#00391f] shadow-2xl md:-mt-2"
                : "bg-[#101d17] border border-[#182a22] text-[#e4f0e9]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <small
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  p.isPro ? "text-[#00391f]" : "text-[#9db4a8]"
                )}
              >
                {p.badge}
              </small>
              {p.isPro && (
                <span className="text-[11px] font-extrabold text-[#00391f] uppercase tracking-wider">
                  Most popular
                </span>
              )}
            </div>

            <div className="mt-3 h-12 flex items-baseline overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${p.name}-${isYearly ? "y" : "m"}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-none tabular-nums"
                >
                  {p.price}
                  {p.period && (
                    <span className="text-sm sm:text-base font-normal opacity-75 ml-1">
                      {p.period}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <p
              className={cn(
                "text-xs leading-relaxed mt-1",
                p.isPro ? "opacity-90" : "text-[#9db4a8]"
              )}
            >
              {p.desc}
            </p>

            <ul className="my-6 space-y-2.5 text-sm flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check
                    size={16}
                    strokeWidth={3}
                    className={cn(
                      "mt-0.5 shrink-0",
                      p.isPro ? "text-[#00391f]" : "text-[#5be3a0]"
                    )}
                  />
                  <span className={p.isPro ? "font-semibold" : "text-[#e4f0e9]"}>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/signup?mode=signup&plan=${p.name.toLowerCase()}`}
              className={cn(
                "w-full h-12 rounded-full font-extrabold text-sm flex items-center justify-center transition-all m3-spring-btn whitespace-nowrap",
                p.isPro
                  ? "bg-[#00391f] text-[#5be3a0] hover:bg-[#062617]"
                  : "bg-[#182a22] text-[#e4f0e9] border border-[#27402f] hover:bg-[#203629]"
              )}
            >
              {p.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Closing CTA Banner ───────────────────────────────────────────────────────
function ClosingCTA() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-[min(1180px,calc(100%-32px))] mx-auto my-12 sm:my-16">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="relative overflow-hidden bg-[#0f5133] text-[#e4f0e9] rounded-[36px] sm:rounded-[56px] p-8 sm:p-16 lg:p-20 text-center border border-[#5be3a0]/30 shadow-2xl"
      >
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#5be3a0]/20 blur-2xl m3-blob pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -right-24 w-72 h-72 rounded-full bg-[#5be3a0]/20 blur-2xl m3-blob pointer-events-none"
          style={{ animationDelay: "-4s" }}
        />

        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="[text-wrap:balance] text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#bdf3d6]">
            Your storefront is one link away.
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-[#bdf3d6]/90 leading-relaxed">
            Join small business sellers across Instagram, TikTok, WhatsApp, and Facebook on SwiftLink. Free to start, no card needed.
          </p>
          <div className="mt-7 sm:mt-8 flex justify-center">
            <Link
              href="/signup?mode=signup"
              className="group inline-flex items-center justify-center gap-2.5 h-[52px] sm:h-[56px] px-7 sm:px-8 rounded-full bg-[#5be3a0] text-[#00391f] font-extrabold text-sm sm:text-base transition-all m3-spring-btn hover:bg-[#4ad993] shadow-lg whitespace-nowrap"
            >
              <span>Get started free</span>
              <ArrowRight
                size={18}
                strokeWidth={2.5}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-[min(1180px,calc(100%-32px))] mx-auto py-10 sm:py-12 border-t border-[#182a22] grid gap-8 grid-cols-1 sm:grid-cols-3 text-sm">
      <div>
        <Link href="#top" className="inline-flex items-center gap-2 m3-spring-btn">
          <Logo
            size="sm"
            showWordmark={true}
            wordmarkClassName="font-extrabold tracking-tight text-xl text-[#e4f0e9]"
          />
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
          <a href="#templates" className="hover:text-[#e4f0e9] transition-colors">
            Templates
          </a>
          <a href="#features" className="hover:text-[#e4f0e9] transition-colors">
            Capabilities
          </a>
          <a href="#how" className="hover:text-[#e4f0e9] transition-colors">
            Workflow
          </a>
          <a href="#pricing" className="hover:text-[#e4f0e9] transition-colors">
            Pricing
          </a>
        </div>
      </div>

      <div>
        <h6 className="text-xs font-bold uppercase tracking-wider text-[#9db4a8] mb-3">
          Company
        </h6>
        <div className="flex flex-col gap-2 text-xs font-semibold text-[#9db4a8]">
          <Link href="/terms" className="hover:text-[#e4f0e9] transition-colors">
            Terms of service
          </Link>
          <Link href="/privacy" className="hover:text-[#e4f0e9] transition-colors">
            Privacy and cookies
          </Link>
          <a href="mailto:support@swiftlink.pro" className="hover:text-[#e4f0e9] transition-colors">
            Support
          </a>
        </div>
      </div>

      <div className="sm:col-span-3 pt-6 border-t border-[#182a22] text-xs text-[#9db4a8] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p>© 2026 SwiftLink. All rights reserved.</p>
        <p>Built for merchants who sell where their customers are.</p>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-clip bg-[#08110d] font-sans text-[#e4f0e9] selection:bg-[#5be3a0]/30 selection:text-[#5be3a0]">
      <ScrollProgressBar />
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
