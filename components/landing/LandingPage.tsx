"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Globe,
  Layers,
  Layout,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { TemplateFrame } from "@/components/storefront/template-frames";
import {
  featuredWebsiteTemplates,
  websiteTemplates,
  type WebsiteTemplateId,
} from "@/lib/theme/templates";
import { Logo } from "@/components/Logo";
import { FEATURE_FLAGS, isFeatureEnabled } from "@/lib/flags";

/**
 * The marketing page.
 *
 * Rebuilt on design tokens (`docs/03-DECISIONS.md` D12).
 * Hero v2 is gated behind FEATURE_FLAGS.landingV2.
 * Real SwiftLink logo is rendered via shared Logo component.
 */

// ─── Motion helpers ───────────────────────────────────────────────────────────
const FadeUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const InView = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

/** Auto-detect a local currency symbol so prices read right on first paint. */
function useCurrency(): "₦" | "$" {
  const [currency, setCurrency] = useState<"₦" | "$">("$");
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setCurrency(tz.includes("Lagos") || tz.includes("Africa") ? "₦" : "$");
    } catch {
      setCurrency("$");
    }
  }, []);
  return currency;
}

const NAV_LINKS = [
  { href: "#templates", label: "Templates" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // `/` is the landing page for signed-in owners too, so the call to action has
  // to know about the session — otherwise a merchant sees "Log in" on their own
  // logged-in site.
  const { user } = useSwiftLink();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-sticky transition-colors duration-200",
        isScrolled ? "glass border-b border-app-border" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="sm" showWordmark={true} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-2 hover:text-app-text"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              href="/pro"
              className="rounded-[10px] bg-app-accent px-5 py-2 text-sm font-semibold text-app-accent-fg shadow-xs transition-colors hover:bg-app-accent-hover"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-[10px] border border-[#1E2D27] bg-[#111C18]/60 px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-2"
              >
                Log in
              </Link>
              <Link
                href="/signup?mode=signup"
                className="rounded-[10px] bg-app-accent px-5 py-2 text-sm font-semibold text-app-accent-fg shadow-xs transition-colors hover:bg-app-accent-hover"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-text"
          >
            {isMenuOpen ? <X width={18} height={18} /> : <Menu width={18} height={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-t border-app-border bg-app-surface px-5 pb-5 pt-2 md:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-app-text-muted hover:bg-app-surface-2 hover:text-app-text"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-app-border pt-4">
              {user ? (
                <Link
                  href="/pro"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg bg-app-accent px-4 py-3 text-center text-sm font-semibold text-app-accent-fg"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg border border-app-border px-4 py-3 text-center text-sm font-medium text-app-text"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup?mode=signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg bg-app-accent px-4 py-3 text-center text-sm font-semibold text-app-accent-fg"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero Phone Mockup (Pure CSS/SVG, fictional sample data, no photos) ─────
function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[310px] sm:max-w-[340px] pt-4 lg:pt-0">
      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[44px] bg-[#19C37D]/10 blur-2xl"
      />

      {/* Phone Shell */}
      <div className="relative w-full rounded-[42px] border-[3px] border-[#1E2D27] bg-[#0A1210] p-4 sm:p-5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] select-none">
        {/* Dynamic Island / Speaker Pill */}
        <div className="w-24 h-3.5 bg-[#14231D] rounded-full mx-auto mb-4 border border-[#1E2D27] flex items-center justify-end pr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E2D27]" />
        </div>

        {/* Store Avatar & Info */}
        <div className="text-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#14231D] border border-[#24382F] mx-auto mb-2 flex items-center justify-center text-[#19C37D] shadow-inner">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#E8F1EC] tracking-tight">Kemi Studio</h3>
          <p className="text-[11px] sm:text-xs text-[#9DB3A8] mt-0.5">Clothing, bags, and home goods</p>
        </div>

        {/* Chat on WhatsApp CTA Button */}
        <div className="w-full py-2.5 px-4 rounded-[12px] bg-[#19C37D] text-[#04140D] font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.774.98-1.025 1.23-.25.251-.5.276-.801.126-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.787-1.676-2.088-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.526.15-.175.2-.301.301-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.231-.244-.587-.492-.507-.676-.516l-.576-.01c-.2 0-.526.075-.801.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.077 2.909 1.228 3.109.15.2 2.119 3.235 5.132 4.538.717.31 1.277.496 1.713.634.72.229 1.375.197 1.893.12.577-.087 1.78-.727 2.03-1.428.25-.702.25-1.304.175-1.43-.075-.125-.275-.2-.576-.351z" />
            <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.83.498 3.545 1.365 5.018L2 22l5.127-1.345A9.954 9.954 0 0 0 12.004 22c5.523 0 10.004-4.48 10.004-10s-4.481-10-10.004-10zm0 18.067c-1.579 0-3.056-.445-4.32-1.217l-.31-.188-3.048.8 1.026-2.973-.203-.326A8.04 8.04 0 0 1 3.937 12c0-4.448 3.619-8.067 8.067-8.067 4.448 0 8.067 3.619 8.067 8.067 0 4.448-3.619 8.067-8.067 8.067z" />
          </svg>
          <span>Chat on WhatsApp</span>
        </div>

        {/* 2x2 Product Grid (CSS/SVG geometric cards, no photos) */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {/* Item 1 */}
          <div className="bg-[#14231D] border border-[#1E2D27] rounded-xl p-2.5 aspect-square flex flex-col justify-between">
            <div className="w-full flex-1 rounded-lg bg-[#111C18] border border-[#1E2D27]/60 flex items-center justify-center text-[#9DB3A8]/70">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-[#E8F1EC] truncate">Linen Shirt</p>
              <p className="text-[10px] font-bold text-[#19C37D]">₦18,500</p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-[#14231D] border border-[#1E2D27] rounded-xl p-2.5 aspect-square flex flex-col justify-between">
            <div className="w-full flex-1 rounded-lg bg-[#111C18] border border-[#1E2D27]/60 flex items-center justify-center text-[#9DB3A8]/70">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-[#E8F1EC] truncate">Leather Tote</p>
              <p className="text-[10px] font-bold text-[#19C37D]">₦24,000</p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="bg-[#14231D] border border-[#1E2D27] rounded-xl p-2.5 aspect-square flex flex-col justify-between">
            <div className="w-full flex-1 rounded-lg bg-[#111C18] border border-[#1E2D27]/60 flex items-center justify-center text-[#9DB3A8]/70">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
              </svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-[#E8F1EC] truncate">Silk Scarf</p>
              <p className="text-[10px] font-bold text-[#19C37D]">₦9,200</p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="bg-[#14231D] border border-[#1E2D27] rounded-xl p-2.5 aspect-square flex flex-col justify-between">
            <div className="w-full flex-1 rounded-lg bg-[#111C18] border border-[#1E2D27]/60 flex items-center justify-center text-[#9DB3A8]/70">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect width="16" height="16" x="4" y="4" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-[#E8F1EC] truncate">Amber Candle</p>
              <p className="text-[10px] font-bold text-[#19C37D]">₦7,500</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Chat Bubble Overlapping Lower-Left Corner without Horizontal Scroll */}
        <div className="absolute -bottom-3 -left-2 sm:-bottom-4 sm:-left-6 z-20 w-[240px] sm:w-[270px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[#1E2D27] bg-[#111C18]/95 backdrop-blur-md p-3 sm:p-3.5 shadow-2xl">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#19C37D]">
            <span className="w-2 h-2 rounded-full bg-[#19C37D] animate-pulse" />
            <span>WhatsApp Order</span>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-[#E8F1EC] leading-relaxed">
            &ldquo;Hi, I am interested in Linen Shirt (₦18,500).&rdquo;
          </p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#9DB3A8]">
            <span>10:42 AM</span>
            <svg className="w-3.5 h-3.5 text-[#19C37D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m18 6-9.5 9.5-4-4" />
              <path d="m22 10-9.5 9.5L11 18" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero v2 (Active redesign) ────────────────────────────────────────────────
function HeroV2() {
  return (
    <section className="relative overflow-x-clip px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background: "radial-gradient(60% 100% at 50% 0%, var(--app-accent-subtle), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <FadeUp>
            <div className="inline-flex items-center rounded-full border border-[#E8B93A]/30 bg-[#1A1910] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E8B93A]">
              BUILT FOR WHATSAPP SELLERS
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[62px] font-bold leading-[1.06] tracking-tight text-[#E8F1EC]">
              Stop sending prices{" "}
              <span className="text-[#19C37D]">one by one.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#9DB3A8] sm:text-lg lg:mx-0">
              Put your products on one clean store link. Buyers browse, tap, and land in your WhatsApp chat, ready to order.
            </p>
          </FadeUp>

          <FadeUp delay={0.24}>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-center lg:justify-start">
              <Link
                href="/signup?mode=signup"
                className="inline-flex items-center justify-center min-h-[48px] px-7 py-3.5 rounded-[12px] bg-[#19C37D] hover:bg-[#15A86B] text-[#04140D] font-bold text-sm sm:text-base shadow-sm transition-colors"
              >
                Create your store free
              </Link>
              <a
                href="#templates"
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3.5 rounded-[12px] border border-[#1E2D27] bg-[#111C18]/60 hover:bg-[#14231D] text-[#E8F1EC] font-semibold text-sm sm:text-base transition-colors"
              >
                See the templates
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.32}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {["Free to start", "No card needed", "Live in minutes"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-medium text-app-text-muted">
                  <Check width={14} height={14} className="text-[#19C37D]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>

        <FadeUp delay={0.2}>
          <HeroPhoneMockup />
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Legacy Hero (Preserved behind feature flag) ───────────────────────────────
function StorePreviewLegacy() {
  const currency = useCurrency();
  const { theme } = useSwiftLink();
  const appearance = theme === "dark" ? "dark" : "light";
  const [active, setActive] = useState<WebsiteTemplateId>("editorial");

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8"
        style={{
          background: "radial-gradient(50% 50% at 50% 50%, var(--app-accent-subtle), transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="relative"
      >
        <TemplateFrame id={active} appearance={appearance} currency={currency} size="stage" />
      </motion.div>
    </div>
  );
}

function HeroLegacy() {
  return (
    <section className="relative px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-semibold text-app-text sm:text-5xl">
            Sell on WhatsApp <span className="text-app-accent-text">like a pro.</span>
          </h1>
          <p className="mt-5 text-base text-app-text-muted">
            Build a storefront, add your products, and share one link.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup?mode=signup" className="rounded-lg bg-app-accent px-6 py-3.5 text-sm font-semibold text-app-accent-fg">
              Create your store free
            </Link>
          </div>
        </div>
        <StorePreviewLegacy />
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Package,
    title: "Product catalog",
    description: "Add products with photos, variants and stock. The storefront keeps itself organised.",
  },
  {
    icon: Layout,
    title: "Storefront templates",
    description: "Pick a look that fits your brand. Each is a whole shop in light and dark, designed for fast browsing.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp order inbox",
    description: "Receive orders directly in chat with product details and customer selections.",
  },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-app-border px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <InView className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent-text">
            What you get
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
            Everything a small store needs, nothing it doesn&apos;t.
          </h2>
        </InView>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <InView
              key={feature.title}
              delay={index * 0.08}
              className="rounded-2xl border border-app-border bg-app-surface p-6 sm:p-7"
            >
              <feature.icon width={22} height={22} className="text-app-accent-text" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-app-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{feature.description}</p>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Storefront Templates (three examples, light + dark) ──────────────────────
function Templates() {
  const currency = useCurrency();
  const [appearance, setAppearance] = useState<"light" | "dark">("light");

  return (
    <section id="templates" className="scroll-mt-20 border-t border-app-border px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <InView className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent-text">
              Storefront Templates
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
              Pick a look that fits your brand.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-app-text-muted sm:text-base">
              You choose a whole website, not a pile of sections. Showing {" "}
              {featuredWebsiteTemplates.length} of our {websiteTemplates.length} looks — every one of
              them ships in light and dark.
            </p>
          </InView>

          {/* Light / dark — the same template, not a different one. */}
          <InView delay={0.1}>
            <div
              role="group"
              aria-label="Template appearance"
              className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-surface p-1"
            >
              {([
                { value: "light" as const, label: "Light", Icon: Sun },
                { value: "dark" as const, label: "Dark", Icon: Moon },
              ]).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={appearance === value}
                  onClick={() => setAppearance(value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    appearance === value
                      ? "bg-app-accent text-app-accent-fg"
                      : "text-app-text-muted hover:text-app-text"
                  )}
                >
                  <Icon width={14} height={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </InView>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredWebsiteTemplates.map((template, index) => (
            <InView
              key={template.id}
              delay={index * 0.08}
              className="overflow-hidden rounded-2xl border border-app-border bg-app-surface"
            >
              <TemplateFrame
                key={`${template.id}-${appearance}`}
                id={template.id}
                appearance={appearance}
                currency={currency}
                size="card"
              />
              <div className="border-t border-app-border p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-app-text">{template.name}</h3>
                  <span className="rounded-full bg-app-accent-subtle px-2 py-0.5 text-[10px] font-semibold text-app-accent-text uppercase">
                    {appearance === "dark" ? "Dark" : "Light"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-app-text-muted">{template.description}</p>
              </div>
            </InView>
          ))}
        </div>

        <p className="mt-6 text-xs text-app-text-muted">
          Every template is included on every plan — switch whenever you like, and your products stay put.
        </p>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    title: "Create your store",
    description: "Sign up, name your store and add the WhatsApp number customers should reach.",
    icon: Globe,
  },
  {
    title: "Choose a template",
    description: "Pick a design that fits your brand, then add your products. Your whole shop follows that look.",
    icon: Layers,
  },
  {
    title: "Share one link",
    description: "Post your store link anywhere. Orders open in WhatsApp, ready to confirm.",
    icon: BarChart3,
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-app-border bg-app-surface-2 px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <InView className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent-text">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
            From nothing to a live store in an afternoon.
          </h2>
        </InView>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <InView key={step.title} delay={index * 0.08} className="relative">
              <div className="h-full rounded-2xl border border-app-border bg-app-surface p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border text-app-text-muted">
                    <step.icon width={20} height={20} aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-semibold tabular-nums text-app-border-strong">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-app-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{step.description}</p>
              </div>
            </InView>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: { label: string; soon?: boolean }[];
  cta: string;
  featured?: boolean;
};

function Pricing() {
  const currency = useCurrency();

  const plans: Plan[] = [
    {
      name: "Starter",
      price: "Free",
      description: "Try the whole workflow. No card required.",
      features: [
        { label: "5 live products" },
        { label: "WhatsApp order inquiries" },
        { label: "Basic order tracking" },
        { label: "SwiftLink branding" },
        { label: "Community support" },
      ],
      cta: "Start free",
    },
    {
      name: "Pro",
      price: currency === "₦" ? "₦5,000" : "$10",
      period: "/mo",
      description: "Everything you need to run a serious store.",
      features: [
        { label: "Unlimited products" },
        { label: "Custom branding" },
        { label: "Detailed analytics" },
        { label: "Discount codes" },
        { label: "Export orders (CSV)" },
        { label: "Priority support" },
      ],
      cta: "Upgrade to Pro",
      featured: true,
    },
    {
      name: "Business",
      price: currency === "₦" ? "₦15,000" : "$29",
      period: "/mo",
      description: "For established brands and small teams.",
      features: [
        { label: "Everything in Pro" },
        { label: "Multi-store management" },
        { label: "Team roles" },
        { label: "Custom domain" },
        { label: "White-label experience" },
        { label: "API access & webhooks", soon: true },
        { label: "Audit logs & backups", soon: true },
      ],
      cta: "Talk to us",
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-app-border px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <InView className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent-text">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
            Simple plans for ambitious brands.
          </h2>
          <p className="mt-4 text-base text-app-text-muted">
            Start free, upgrade when you outgrow it, and keep 100% of your revenue either way.
          </p>
        </InView>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-start">
          {plans.map((plan, index) => (
            <InView
              key={plan.name}
              delay={index * 0.08}
              className={cn(
                "flex flex-col rounded-2xl border p-6 sm:p-7",
                plan.featured
                  ? "border-app-accent bg-app-surface shadow-lg lg:-mt-4"
                  : "border-app-border bg-app-surface",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-app-text-muted">
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="rounded-full bg-app-accent-subtle px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-app-accent-text">
                    Most popular
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums text-app-text">
                  {plan.price}
                </span>
                {plan.period && <span className="text-sm text-app-text-subtle">{plan.period}</span>}
              </div>

              <p className="mt-3 text-sm text-app-text-muted">{plan.description}</p>

              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-3 text-sm text-app-text">
                    <CheckCircle2
                      width={15}
                      height={15}
                      className="shrink-0 text-app-accent-text"
                      aria-hidden="true"
                    />
                    <span className="text-app-text-muted">{feature.label}</span>
                    {feature.soon && (
                      <span className="ml-auto shrink-0 rounded-full border border-app-border px-2 py-0.5 text-[10px] font-medium text-app-text-subtle">
                        Soon
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?mode=signup&plan=${plan.name.toLowerCase()}`}
                className={cn(
                  "mt-8 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors",
                  plan.featured
                    ? "bg-app-accent text-app-accent-fg hover:bg-app-accent-hover"
                    : "border border-app-border text-app-text hover:bg-app-surface-2",
                )}
              >
                {plan.cta}
              </Link>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="border-t border-app-border px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <InView className="relative overflow-hidden rounded-3xl border border-app-border bg-app-surface-2 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(60% 90% at 50% 0%, var(--app-accent-subtle), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
              Your storefront is one link away.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-app-text-muted">
              Join the merchants selling on WhatsApp with SwiftLink. Free to start, no card needed.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/signup?mode=signup"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-app-accent px-6 py-3.5 text-sm font-semibold text-app-accent-fg shadow-sm transition-colors hover:bg-app-accent-hover"
              >
                Get started free
                <ArrowRight
                  width={16}
                  height={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const productLinks = [
    { href: "#templates", label: "Templates" },
    { href: "#features", label: "Capabilities" },
    { href: "#how-it-works", label: "Workflow" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <footer className="border-t border-app-border px-5 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Logo size="sm" showWordmark={true} />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-app-text-muted">
              The storefront builder for merchants who do business on WhatsApp.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
              Product
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-app-text-muted transition-colors hover:text-app-text">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
              Company
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/terms" className="text-sm text-app-text-muted transition-colors hover:text-app-text">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-app-text-muted transition-colors hover:text-app-text">
                  Privacy &amp; cookies
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@swiftlink.pro"
                  className="text-sm text-app-text-muted transition-colors hover:text-app-text"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-app-border pt-6 sm:flex-row">
          <p className="text-xs text-app-text-subtle">© 2026 SwiftLink</p>
          <p className="text-xs text-app-text-subtle">Built for merchants who sell where their customers are.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const isV2 = FEATURE_FLAGS.landingV2;

  return (
    <main className="min-h-[100dvh] bg-app-bg font-sans text-app-text">
      <Navbar />
      {isV2 ? <HeroV2 /> : <HeroLegacy />}
      <Templates />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTASection />
      <Footer />
    </main>
  );
}
