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
  Menu,
  Moon,
  Shield,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";

/**
 * The marketing page.
 *
 * Rebuilt on design tokens (`docs/03-DECISIONS.md` D12). The previous version was
 * a patchwork of literal `slate-*`/`emerald-*` utilities with hard-coded `#020617`
 * dark surfaces, so it drifted from the console and could not be re-themed. It
 * also opened with a 1.2s fake preloader and carried a "cybernetic holographic
 * HUD", a double marquee and an auto-playing phone demo — four separate things
 * competing for attention before a visitor read what the product does.
 *
 * What is left is one calm column that says what SwiftLink is, three features,
 * three steps to go live, three plans, and a way in. Nothing is claimed that the
 * product does not do.
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

// ─── Navbar ───────────────────────────────────────────────────────────────────
function ThemeButton({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-text-muted transition-colors hover:bg-app-surface-2 hover:text-app-text"
    >
      <Sun width={15} height={15} className={cn(!isDark && "hidden")} aria-hidden="true" />
      <Moon width={15} height={15} className={cn(isDark && "hidden")} aria-hidden="true" />
    </button>
  );
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
  const { theme, toggleTheme } = useSwiftLink();
  const isDark = theme === "dark";

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
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-base font-semibold tracking-tight text-app-text">SwiftLink</span>
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

        <div className="hidden items-center gap-2 md:flex">
          <ThemeButton isDark={isDark} onToggle={toggleTheme} />
          <Link
            href="/signup"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup?mode=signup"
            className="rounded-lg bg-app-accent px-5 py-2 text-sm font-semibold text-app-accent-fg shadow-xs transition-colors hover:bg-app-accent-hover"
          >
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeButton isDark={isDark} onToggle={toggleTheme} />
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
              <Link
                href="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg border border-app-border px-4 py-3 text-center text-sm font-medium text-app-text"
              >
                Sign in
              </Link>
              <Link
                href="/signup?mode=signup"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg bg-app-accent px-4 py-3 text-center text-sm font-semibold text-app-accent-fg"
              >
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero visual: one of the three real website templates ────────────────────
function StorePreview() {
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
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Preview a website">
          {websiteTemplates.map((template) => {
            const selected = active === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setActive(template.id)}
                aria-pressed={selected}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring",
                  selected
                    ? "border-app-accent bg-app-accent-subtle text-app-text"
                    : "border-app-border bg-app-surface text-app-text-muted hover:text-app-text",
                )}
              >
                {template.name}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
const VALUE_PROPS = ["No transaction fees", "Live in minutes", "Order tracking", "Multi-store workspace"];

function Hero() {
  return (
    <section className="relative px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
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
            <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs font-medium text-app-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-app-accent" aria-hidden="true" />
              WhatsApp-first commerce
            </span>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-app-text sm:text-5xl lg:text-6xl">
              Sell on WhatsApp <span className="text-app-accent-text">like a pro.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-app-text-muted sm:text-lg lg:mx-0">
              Build a storefront, add your products, and share one link. Your customers order in the
              app they already use — and every order lands in your dashboard.
            </p>
          </FadeUp>

          <FadeUp delay={0.24}>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href="/signup?mode=signup"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-app-accent px-6 py-3.5 text-sm font-semibold text-app-accent-fg shadow-sm transition-colors hover:bg-app-accent-hover"
              >
                Start selling free
                <ArrowRight
                  width={16}
                  height={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-app-border px-6 py-3.5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-2"
              >
                See how it works
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.32}>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start">
              {VALUE_PROPS.map((prop) => (
                <li key={prop} className="flex items-center gap-2 text-xs font-medium text-app-text-muted">
                  <Check width={14} height={14} className="text-app-accent-text" aria-hidden="true" />
                  {prop}
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>

        <StorePreview />
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Sparkles,
    title: "Smart catalog",
    description: "Add products with photos, variants and stock. The storefront keeps itself organised.",
  },
  {
    icon: Layers,
    title: "Three complete websites",
    description: "Editorial, Boutique, or Bold. Each is a whole shop, in light and in dark. You pick one look.",
  },
  {
    icon: Shield,
    title: "Workspace for real shops",
    description: "Run more than one store from a single account, with orders and customers in one place.",
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
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-accent-subtle">
                <feature.icon width={20} height={20} className="text-app-accent-text" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-app-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{feature.description}</p>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── The three websites ───────────────────────────────────────────────────────
function Templates() {
  const currency = useCurrency();
  const [appearance, setAppearance] = useState<"light" | "dark">("light");

  return (
    <section id="templates" className="scroll-mt-20 border-t border-app-border px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <InView className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent-text">
              Websites
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
              Three shops. Light and dark.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-app-text-muted sm:text-base">
              You choose a whole website, not a pile of sections. The same brand stays readable in both appearances.
            </p>
          </InView>
          <div
            role="group"
            aria-label="Template appearance"
            className="inline-flex rounded-lg border border-app-border bg-app-surface p-1"
          >
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAppearance(mode)}
                aria-pressed={appearance === mode}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring",
                  appearance === mode
                    ? "bg-app-surface-2 text-app-text shadow-xs"
                    : "text-app-text-muted hover:text-app-text",
                )}
              >
                {mode === "light" ? <Sun width={14} height={14} aria-hidden="true" /> : <Moon width={14} height={14} aria-hidden="true" />}
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {websiteTemplates.map((template, index) => (
            <InView key={template.id} delay={index * 0.08} className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
              <TemplateFrame id={template.id} appearance={appearance} currency={currency} size="card" />
              <div className="border-t border-app-border p-5">
                <h3 className="text-base font-semibold text-app-text">{template.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-app-text-muted">{template.description}</p>
              </div>
            </InView>
          ))}
        </div>
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
    title: "Choose a website",
    description: "Pick Editorial, Boutique, or Bold, then add your products. The whole shop follows that look.",
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
        { label: "WhatsApp checkout" },
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
        { label: "Paystack / Flutterwave" },
        { label: "Delivery tracking" },
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
        { label: "Multiple payment gateways" },
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
    { href: "#templates", label: "Websites" },
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
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
              <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
              <span className="text-base font-semibold text-app-text">SwiftLink</span>
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
  return (
    <main className="min-h-[100dvh] bg-app-bg font-sans text-app-text">
      <Navbar />
      <Hero />
      <Templates />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTASection />
      <Footer />
    </main>
  );
}
