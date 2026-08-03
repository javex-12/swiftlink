"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, EyeOff, AlertCircle, Loader2, MessageSquare,
  ChevronLeft, Sun, Moon, Bookmark, Heart, Package, TrendingUp, Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { getPublicStoreSlug } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CountrySelector } from "@/components/CountrySelector";
import { useSwiftLink } from "@/context/SwiftLinkContext";

type Mode = "signup" | "login";

// ─── Input with floating label ────────────────────────────────────────────────
function FloatInput({
  id, label, type = "text", value, onChange, required, placeholder, suffix,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-200 pointer-events-none font-bold z-10 ${
          active
            ? "top-2 text-[8px] tracking-[0.16em] uppercase text-emerald-500"
            : "top-1/2 -translate-y-1/2 text-[11px] text-slate-400"
        }`}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        placeholder={active ? placeholder : ""}
        className={`w-full pt-5 pb-2.5 px-4 rounded-full outline-none text-[11px] font-semibold transition-all duration-200
          bg-white dark:bg-white/[0.04] border ${focused ? "border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "border-slate-200 dark:border-white/[0.09]"}
          text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600`}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

// ─── Google SVG logo ─────────────────────────────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Google Sign-In Button (uses GoogleLogin which returns a proper id_token JWT) ─
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function GoogleButton({
  onSuccess,
  onError,
  onDemoFallback,
  label,
  loading,
  mode,
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
  onDemoFallback: () => void;
  label: string;
  loading: boolean;
  mode: "signup" | "login";
}) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={onDemoFallback}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-900 bg-slate-950 px-5 py-3.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#111] dark:hover:bg-white/[0.07]"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <><GoogleLogo /><span>{label}</span></>}
      </button>
    );
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="relative w-full overflow-hidden rounded-full">
        {/* Visual custom button */}
        <button
          type="button"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-900 bg-slate-950 px-5 py-3.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#111] dark:hover:bg-white/[0.07]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><GoogleLogo /><span>{label}</span></>}
        </button>
        {/* Interactive GoogleLogin iframe overlay */}
        <div className="absolute inset-0 z-10 opacity-[0.001] cursor-pointer pointer-events-auto flex items-center justify-center scale-150">
          <GoogleLogin
            onSuccess={(res) => { if (res.credential) onSuccess(res.credential); }}
            onError={onError}
            width="400"
            shape="pill"
            text={mode === "signup" ? "signup_with" : "signin_with"}
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

// ─── Inner page content (needs GoogleOAuthProvider context) ──────────────────
function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSwiftLink();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [showForm, setShowForm] = useState(false); // mobile: show form panel
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+234");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [form, setForm] = useState({ ownerName: "", bizName: "", storeUsername: "", phone: "", email: "", password: "" });

  useEffect(() => {
    setMounted(true);
    const m = searchParams.get("mode") as Mode;
    if (m === "login" || m === "signup") setMode(m);

    // On desktop, always show form. On mobile, show landing first.
    const isDesktop = window.innerWidth >= 1024;
    setShowForm(isDesktop);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.push("/pro");
      }).catch(() => { /* Supabase not reachable */ });
    } else {
      const isDemo = localStorage.getItem("swiftlink_demo_login") === "true";
      if (isDemo) router.push("/pro");
    }
  }, [searchParams, router]);

  const saveUserStore = useCallback(async (
    uid: string, email: string | undefined,
    extra?: { ownerName?: string; bizName?: string; phone?: string; storeUsername?: string },
  ) => {
    try {
      const { data: storeData } = await supabase.from("stores").select("*").eq("id", uid).single();
      const bizName = extra?.bizName || (storeData?.state_json as any)?.bizName || "";
      const ownerName = extra?.ownerName || (storeData?.state_json as any)?.ownerName || "";
      const storeUsername = extra?.storeUsername || (storeData?.state_json as any)?.storeUsername || "";
      const slug = getPublicStoreSlug({ storeUsername, bizName });
      const initialPlan = searchParams.get("plan") || "free";
      const nextState = {
        id: uid, plan: initialPlan, ownerName, bizName, storeUsername,
        phone: extra?.phone || (storeData?.state_json as any)?.phone || "",
        products: (storeData?.state_json as any)?.products || [],
        deliveries: (storeData?.state_json as any)?.deliveries || [],
        currency: (storeData?.state_json as any)?.currency || "₦",
        bizImage: (storeData?.state_json as any)?.bizImage || "",
        bizDesc: (storeData?.state_json as any)?.bizDesc || "",
        bizColor: (storeData?.state_json as any)?.bizColor || "#10b981",
        publishedStoreSlug: slug,
      };
      await supabase.from("stores").upsert({
        id: uid, biz_name: bizName, store_username: storeUsername,
        phone: nextState.phone, plan: initialPlan, account_status: 'active', state_json: nextState, updated_at: new Date().toISOString(),
      });
      localStorage.setItem("swiftlink_state", JSON.stringify(nextState));
    } catch (err) {
      console.error("Store Save Error:", err);
    }
  }, [form.email, searchParams]);

  const handleGoogleSuccess = async (credential: string) => {
    setLoading("google"); setError(null);
    try {
      if (!isSupabaseConfigured()) {
        localStorage.setItem("swiftlink_demo_login", "true");
        router.push("/pro");
        return;
      }
      // GoogleLogin returns a proper JWT id_token as `credential` — exactly what signInWithIdToken needs
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
      });
      if (error) throw error;
      if (data.user) { await saveUserStore(data.user.id, data.user.email); router.push("/pro"); }
    } catch (e: any) { setError(e.message || "Google Sign-In failed."); setLoading(null); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading("email"); setError(null);
    try {
      if (!isSupabaseConfigured()) {
        localStorage.setItem("swiftlink_demo_login", "true");
        router.push("/pro");
        return;
      }
      if (mode === "login") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (authError) throw authError;
        if (data.user) { await saveUserStore(data.user.id, data.user.email); router.push("/pro"); }
      } else {
        const formattedPhone = countryCode + form.phone.replace(/^0+/, "").trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { display_name: form.bizName, phone: formattedPhone } },
        });
        if (authError) throw authError;
        if (data.user) {
          await saveUserStore(data.user.id, data.user.email, { ownerName: form.ownerName, bizName: form.bizName, phone: formattedPhone, storeUsername: form.storeUsername });
          if (data.session) router.push("/pro"); else setStep("verify");
        }
      }
    } catch (e: any) { setError(e.message); setLoading(null); }
  };

  if (!mounted) return <div className="fixed inset-0 bg-[#07110d]" />;

  return (
    // True full-screen: fixed inset-0 so nothing bleeds through
    <div className="fixed inset-0 flex overflow-hidden font-sans">

      {/* ── LEFT PANEL — Brand / Illustration (desktop only) ─────────────────── */}
      <div className="relative hidden w-[46%] flex-col overflow-hidden bg-[#07110d] p-10 text-white lg:flex xl:p-14">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(6,95,70,0.18),transparent_50%)]" />
        {/* Decorative rings */}
        <div className="pointer-events-none absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
        <div className="pointer-events-none absolute left-1/2 top-[30%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
            <img src="/logo.png" alt="SwiftLink" className="h-5 w-5 object-contain" />
          </span>
          <span className="text-[13px] font-black tracking-tight">SwiftLink</span>
        </div>

        <p className="relative z-10 mt-8 text-[9px] font-semibold text-white/40">
          WhatsApp commerce made simple — online payment solutions for your brand.
        </p>

        {/* Phone mockup illustration */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative flex flex-col items-center"
          >
            <h1 className="mb-6 text-center text-[2.6rem] font-black leading-[0.88] tracking-[-0.02em] xl:text-5xl">
              Manage<br />your store
            </h1>

            {/* Phone frame */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="w-[200px] rounded-[2rem] border-[10px] border-[#050505] bg-[#f8fafc] p-4 shadow-[0_32px_70px_rgba(0,0,0,0.55)]"
            >
              <div className="mx-auto mb-3.5 h-2.5 w-12 rounded-full bg-black" />
              <div className="rounded-2xl bg-emerald-50 p-3.5 text-slate-950">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-600">Today</p>
                    <p className="text-base font-black">₦97,200</p>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <TrendingUp size={13} />
                  </span>
                </div>
                <div className="mt-3 grid h-20 grid-cols-7 items-end gap-1">
                  {[34, 50, 42, 70, 58, 92, 76].map((height, index) => (
                    <span
                      key={index}
                      className="rounded-t-full bg-gradient-to-t from-emerald-700 to-emerald-300"
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                  <Package size={12} className="mb-4 text-emerald-400" />
                  <p className="text-[7px] font-black uppercase text-white/45">Orders</p>
                  <p className="text-xs font-black">128</p>
                </div>
                <div className="rounded-xl bg-slate-900 p-2.5 text-white">
                  <Users size={12} className="mb-4 text-emerald-400" />
                  <p className="text-[7px] font-black uppercase text-white/45">Buyers</p>
                  <p className="text-xs font-black">1.2k</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2 className="max-w-[340px] text-3xl font-black leading-none tracking-[-0.02em] xl:text-4xl">
            SwiftLink App &amp; Workspace
          </h2>
          <p className="mt-3 text-[10px] font-semibold text-white/35">
            Built for Nigerian brands that move fast.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Auth Form ───────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-white transition-colors duration-300 dark:bg-[#07110d]">

        {/* Mobile: Brand landing screen (shows before form) */}
        <AnimatePresence>
          {!showForm && (
            <motion.div
              key="mobile-intro"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#07110d] p-7 text-white lg:hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(16,185,129,0.2),transparent_55%)]" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <img src="/logo.png" alt="SwiftLink" className="h-5 w-5 object-contain" />
                  </span>
                  <span className="text-sm font-black">SwiftLink</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75"
                >
                  {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
                </button>
              </div>

              <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-black leading-[0.9] tracking-[-0.02em]">
                  Manage<br />your store
                </h1>
                <p className="mt-4 text-[10px] font-medium text-white/45">
                  WhatsApp commerce made simple.
                </p>

                {/* Progress bar */}
                <div className="mt-10 w-full max-w-[220px]">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                      onAnimationComplete={() => setShowForm(true)}
                      className="h-full rounded-full bg-emerald-400"
                    />
                  </div>
                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.28em] text-white/40">
                    Preparing your workspace
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl font-black leading-none tracking-tight">SwiftLink App &amp; Workspace</h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <motion.div
          initial={false}
          animate={showForm ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-h-full flex-col p-7 sm:p-10 lg:p-12"
        >
          {/* Form header */}
          <div className="flex items-center justify-between gap-4">
            {/* Back btn — mobile only */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-emerald-500 lg:hidden"
            >
              <ChevronLeft size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>

            {/* Desktop logo */}
            <Link href="/" className="hidden items-center gap-2 lg:flex">
              <img src="/logo.png" alt="SwiftLink" className="h-5 w-5 object-contain" />
              <span className="text-sm font-black text-slate-950 dark:text-white">SwiftLink</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                className="text-[10px] font-bold text-slate-500 transition-colors hover:text-emerald-500 dark:text-slate-400"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
              <button
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 dark:border-white/[0.1] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                aria-label="Toggle Theme"
              >
                {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
              </button>
            </div>
          </div>

          {/* Centered form area */}
          <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center py-8">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key={`${mode}-form`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl">
                      {mode === "login" ? "Sign In" : "Create Account"}
                    </h2>
                    <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                      {mode === "login" ? "Enter your details to open your workspace." : "Start selling from your WhatsApp storefront."}
                    </p>
                  </div>

                  {!isSupabaseConfigured() && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                      <div className="flex items-start gap-3">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Supabase Not Configured</p>
                          <p className="mt-1 text-[10px] font-medium leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                            No <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">.env.local</code> credentials found. Use demo mode to test locally.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("swiftlink_demo_login", "true");
                          router.push("/pro");
                        }}
                        className="mt-3 w-full rounded-full bg-amber-500 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-amber-600"
                      >
                        Enter Demo Mode
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 dark:border-red-500/20 dark:bg-red-500/10">
                          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                          <p className="text-xs font-semibold leading-relaxed text-red-600 dark:text-red-300">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    <AnimatePresence>
                      {mode === "signup" && (
                        <motion.div
                          key="signup-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="space-y-3 overflow-visible"
                        >
                          <FloatInput
                            id="ownerName" label="Your Full Name" value={form.ownerName}
                            onChange={(v) => setForm({ ...form, ownerName: v })}
                            required placeholder="e.g. Michael Dosunmu"
                          />
                          <FloatInput
                            id="bizName" label="Store name" value={form.bizName}
                            onChange={(v) => setForm({ ...form, bizName: v })}
                            required placeholder="Elite Luxe"
                          />
                          <div className="flex gap-2">
                            <CountrySelector value={countryCode} onChange={setCountryCode} />
                            <FloatInput
                              id="phone" label="WhatsApp number" type="tel" value={form.phone}
                              onChange={(v) => setForm({ ...form, phone: v })}
                              required placeholder="808 000 0000"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <FloatInput
                      id="email" label="Email or Username" type="email" value={form.email}
                      onChange={(v) => setForm({ ...form, email: v })}
                      required placeholder="you@example.com"
                    />

                    <FloatInput
                      id="password" label="Password" type={showPassword ? "text" : "password"}
                      value={form.password} onChange={(v) => setForm({ ...form, password: v })}
                      required placeholder="Min. 8 characters"
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-300 transition-colors hover:text-emerald-500"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />

                    {mode === "login" && (
                      <div className="text-left">
                        <Link href="/reset-password" className="text-[10px] font-bold text-emerald-500 transition-colors hover:text-emerald-600">
                          Forgot password?
                        </Link>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={loading !== null}
                      whileTap={{ scale: 0.98 }}
                      className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 py-3.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_18px_30px_rgba(16,185,129,0.24)] transition-all duration-300 hover:brightness-105 disabled:opacity-60"
                    >
                      {loading === "email" ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          <span>{mode === "signup" ? "Create Account" : "Sign In"}</span>
                          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  <div className="relative flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.08]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300 dark:text-slate-600">or</span>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.08]" />
                  </div>

                  {/* Custom Black Google Button */}
                  <GoogleButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => { setError("Google Sign-In was cancelled."); setLoading(null); }}
                    onDemoFallback={() => {
                      localStorage.setItem("swiftlink_demo_login", "true");
                      router.push("/pro");
                    }}
                    label={mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                    loading={loading === "google"}
                    mode={mode}
                  />

                  {mode === "signup" && (
                    <p className="text-center text-[10px] font-medium leading-relaxed text-slate-400 dark:text-slate-600">
                      By continuing, you agree to our{" "}
                      <Link href="/terms" className="font-bold text-emerald-500 hover:underline">Terms of Service</Link>
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-emerald-200 bg-emerald-50">
                    <MessageSquare size={30} className="text-emerald-500" />
                  </div>
                  <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    Check your inbox.
                  </h3>
                  <p className="mx-auto mb-10 max-w-[280px] text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                    We sent a secure verification link to{" "}
                    <span className="font-bold text-slate-950 dark:text-white">{form.email}</span>
                  </p>
                  <button
                    onClick={() => { setStep("form"); setMode("login"); }}
                    className="w-full rounded-full border border-slate-200 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 transition-all hover:bg-slate-50 dark:border-white/[0.09] dark:text-white dark:hover:bg-white/[0.05]"
                  >
                    Back to Sign in
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Page export ─────────────────────────────────────────────────────────────
export default function SignupPage() {
  return <SignupInner />;
}
