"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Layout,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
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
 * - Hero with "Built for WhatsApp sellers" pulsing pill and wavy headline
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

// ─── Hero Section with Interactive Phone & Chat Animation ─────────────────────
const DEMO_PRODUCTS = [
  { name: "Linen Shirt", price: "₦9,500", gradient: "linear-gradient(135deg,#eadcc2,#cdb48a)" },
  { name: "Leather Tote", price: "₦14,000", gradient: "linear-gradient(135deg,#b98a62,#7d5336)" },
  { name: "Silk Scarf", price: "₦6,000", gradient: "linear-gradient(135deg,#f3b9c8,#d9627f)" },
  { name: "Canvas Sneakers", price: "₦18,000", gradient: "linear-gradient(135deg,#bcd6c9,#6ea58a)" },
];

function HeroSection() {
  const [activeProductIndex, setActiveProductIndex] = useState<number>(-1);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [bubble1In, setBubble1In] = useState<boolean>(false);
  const [bubble2In, setBubble2In] = useState<boolean>(false);
  const [userTouched, setUserTouched] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerOrderDemo = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveProductIndex(index);
    setBubble1In(false);
    setBubble2In(false);
    setShowChat(true);

    setTimeout(() => setBubble1In(true), 400);
    setTimeout(() => setBubble2In(true), 1300);

    timerRef.current = setTimeout(() => {
      setShowChat(false);
      setActiveProductIndex(-1);
    }, 4500);
  };

  // Auto-cycle demo when idle
  useEffect(() => {
    if (userTouched) return;
    let step = 0;
    const interval = setInterval(() => {
      triggerOrderDemo(step % DEMO_PRODUCTS.length);
      step++;
    }, 6000);
    return () => clearInterval(interval);
  }, [userTouched]);

  return (
    <section id="top" className="w-[min(1180px,calc(100%-32px))] mx-auto pt-32 sm:pt-40 pb-16 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
      <div>
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[#0f5133] text-[#bdf3d6] px-4 py-1.5 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#5be3a0] m3-dot" />
          <span>Built for WhatsApp sellers</span>
        </div>

        {/* Headline */}
        <h1 className="mt-5 text-[clamp(44px,7.5vw,94px)] font-extrabold leading-[1.0] tracking-tight text-[#e4f0e9]">
          Stop sending prices{" "}
          <em className="text-[#5be3a0] not-italic underline decoration-wavy underline-offset-[8px]">
            one by one.
          </em>
        </h1>

        {/* Lead Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-[#9db4a8] max-w-[520px] leading-relaxed">
          Put your products on one clean store link. Buyers browse, tap, and land in your WhatsApp chat, ready to order.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <Link
            href="/signup?mode=signup"
            className="inline-flex items-center justify-center gap-2.5 h-[56px] px-8 rounded-full bg-[#5be3a0] text-[#00391f] font-extrabold text-base transition-all m3-spring-btn hover:bg-[#4ad993] shadow-md hover:rounded-[20px]"
          >
            <span>Create your store free</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
          <a
            href="#templates"
            className="inline-flex items-center justify-center h-[56px] px-7 rounded-full bg-[#182a22] text-[#e4f0e9] border border-[#27402f] font-bold text-base transition-all m3-spring-btn hover:bg-[#203629] hover:rounded-[20px]"
          >
            See the templates
          </a>
        </div>

        {/* Ticks */}
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
      </div>

      {/* Stage: Phone + Morphing Blob + Interactive Chat Sheet */}
      <div className="relative grid place-items-center min-h-[580px] select-none">
        {/* Morphing Blob Background */}
        <div
          aria-hidden="true"
          className="absolute w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full bg-[#0f5133]/60 blur-xl m3-blob"
        />

        {/* Floating Badge 1 */}
        <div className="absolute left-0 sm:-left-3 top-24 z-20 bg-[#14231c] border border-[#27402f] rounded-[20px] px-4 py-2.5 font-bold text-sm text-[#e4f0e9] shadow-2xl flex items-center gap-2 m3-float">
          <Check size={16} strokeWidth={3} className="text-[#5be3a0]" />
          <span>Order received</span>
        </div>

        {/* Floating Badge 2 */}
        <div className="absolute right-0 sm:-right-3 bottom-28 z-20 bg-[#14231c] border border-[#27402f] rounded-[20px] px-4 py-2.5 font-bold text-sm text-[#e4f0e9] shadow-2xl flex items-center gap-2 m3-float-delayed">
          <Check size={16} strokeWidth={3} className="text-[#5be3a0]" />
          <span>One link. Whole shop.</span>
        </div>

        {/* Phone Shell */}
        <div className="relative w-[292px] h-[590px] bg-[#0b0f0d] rounded-[46px] p-2.5 border-2 border-[#27402f] shadow-[0_40px_80px_-30px_rgba(0,40,20,0.6)] z-10">
          <div className="bg-[#14231c] rounded-[38px] h-full overflow-hidden relative p-3.5 flex flex-col">
            {/* Header */}
            <div className="text-center pt-2 pb-2">
              <div className="w-12 h-12 rounded-[18px_18px_18px_6px] bg-[#5be3a0] text-[#00391f] grid place-items-center font-extrabold text-lg mx-auto mb-1.5 shadow-sm">
                K
              </div>
              <b className="block text-sm font-bold text-[#e4f0e9]">Kemi Studio</b>
              <small className="text-[11px] text-[#9db4a8]">Clothing, bags and good goods.</small>
            </div>

            {/* Chat on WhatsApp bar */}
            <div className="flex items-center justify-center gap-2 bg-[#5be3a0] text-[#00391f] rounded-full h-10 font-bold text-xs my-2 shadow-sm">
              <MessageSquare size={14} className="fill-current" />
              <span>Chat on WhatsApp</span>
            </div>

            {/* 2x2 Product Grid */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {DEMO_PRODUCTS.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setUserTouched(true);
                    triggerOrderDemo(i);
                  }}
                  className={cn(
                    "text-left p-2 rounded-[20px] transition-all m3-spring-btn",
                    activeProductIndex === i
                      ? "bg-[#0f5133] border border-[#5be3a0] scale-[0.96]"
                      : "bg-[#101d17] border border-[#182a22] hover:border-[#27402f]"
                  )}
                >
                  <i
                    className="block h-[78px] rounded-[14px] mb-1.5"
                    style={{ background: p.gradient }}
                  />
                  <b className="block text-xs font-bold text-[#e4f0e9] truncate">{p.name}</b>
                  <small className="text-[11px] font-extrabold text-[#5be3a0]">{p.price}</small>
                </button>
              ))}
            </div>

            {/* Sliding WhatsApp Chat Sheet */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 bg-[#0d2a1c] text-[#e4f0e9] rounded-t-[28px] p-4 pb-5 border-t border-[#182a22] transition-transform duration-500 shadow-2xl",
                showChat ? "translate-y-0" : "translate-y-[105%]"
              )}
            >
              <h6 className="text-xs font-bold mb-2 flex items-center gap-1.5 text-[#bdf3d6]">
                <MessageSquare size={13} className="fill-current" />
                <span>WhatsApp · Kemi Studio</span>
              </h6>
              {/* Buyer message */}
              <div
                className={cn(
                  "max-w-[88%] p-2.5 px-3 rounded-[16px_16px_4px_16px] bg-[#1f7a52] text-xs font-medium text-white ml-auto transition-all duration-300",
                  bubble1In ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
              >
                {activeProductIndex >= 0
                  ? `Hi, I am interested in ${DEMO_PRODUCTS[activeProductIndex].name} (${DEMO_PRODUCTS[activeProductIndex].price})`
                  : "Hi, I would like to order."}
              </div>
              {/* Merchant reply */}
              <div
                className={cn(
                  "max-w-[88%] p-2.5 px-3 rounded-[16px_16px_16px_4px] bg-[#1c2b24] text-xs font-medium text-[#e4f0e9] mt-2 transition-all duration-300",
                  bubble2In ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
              >
                Hi! Yes, it’s available. Sending details now.
              </div>
            </div>
          </div>
        </div>
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
            Join the merchants selling on WhatsApp with SwiftLink. Free to start, no card needed.
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
          The storefront builder for merchants who do business on WhatsApp.
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
