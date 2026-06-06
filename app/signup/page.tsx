"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, EyeOff, AlertCircle, Loader2, MessageSquare,
  ChevronLeft, Sun, Moon, Package, TrendingUp, Users, Star
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getPublicStoreSlug } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CountrySelector } from "@/components/CountrySelector";
import { useSwiftLink } from "@/context/SwiftLinkContext";

type Mode = "signup" | "login";

// ─── Floating metric cards for the brand panel ───────────────────────────────
const metrics = [
  { icon: Package, label: "Orders today", value: "₦284,500", color: "emerald", delay: 0 },
  { icon: TrendingUp, label: "Conversion rate", value: "18.4%", color: "blue", delay: 0.15 },
  { icon: Users, label: "Active buyers", value: "1,240", color: "violet", delay: 0.3 },
  { icon: Star, label: "Store rating", value: "4.9 / 5", color: "amber", delay: 0.45 },
];

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  violet:  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  amber:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

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
            ? "top-2 text-[9px] tracking-[0.18em] uppercase text-emerald-500"
            : "top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500"
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
        className={`w-full pt-6 pb-3 px-4 rounded-2xl outline-none text-sm font-semibold transition-all duration-200
          bg-slate-50 dark:bg-white/[0.04]
          border ${focused ? "border-emerald-500/60 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]" : "border-slate-200 dark:border-white/[0.08]"}
          text-slate-900 dark:text-white
          placeholder:text-slate-300 dark:placeholder:text-slate-700`}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSwiftLink();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+234");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [form, setForm] = useState({ bizName: "", storeUsername: "", phone: "", email: "", password: "" });

  useEffect(() => {
    setMounted(true);
    const m = searchParams.get("mode") as Mode;
    if (m === "login" || m === "signup") setMode(m);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/pro");
    });
  }, [searchParams, router]);

  const saveUserStore = useCallback(async (
    uid: string, email: string | undefined,
    extra?: { bizName?: string; phone?: string; storeUsername?: string },
  ) => {
    try {
      const { data: storeData } = await supabase.from("stores").select("*").eq("id", uid).single();
      const bizName = extra?.bizName || (storeData?.state_json as any)?.bizName || "";
      const storeUsername = extra?.storeUsername || (storeData?.state_json as any)?.storeUsername || "";
      const slug = getPublicStoreSlug({ storeUsername, bizName });
      const PRIVILEGED: Record<string, "pro" | "business"> = {
        "michaeldosunmu22@gmail.com": "business",
        "dosunmumichael26@gmail.com": "pro",
      };
      const emailToCheck = email || form.email;
      const initialPlan = (emailToCheck && PRIVILEGED[emailToCheck]) || searchParams.get("plan") || "free";
      const nextState = {
        id: uid, plan: initialPlan, bizName, storeUsername,
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
        phone: nextState.phone, state_json: nextState, updated_at: new Date().toISOString(),
      });
      localStorage.setItem("swiftlink_state", JSON.stringify(nextState));
    } catch (err) {
      console.error("Store Save Error:", err);
    }
  }, [form.email, searchParams]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading("google"); setError(null);
    try {
      if (!credentialResponse.credential) throw new Error("No ID token from Google");
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: credentialResponse.credential });
      if (error) throw error;
      if (data.user) { await saveUserStore(data.user.id, data.user.email); router.push("/pro"); }
    } catch (e: any) { setError(e.message || "Google Sign-In failed."); setLoading(null); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading("email"); setError(null);
    try {
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
          await saveUserStore(data.user.id, data.user.email, { bizName: form.bizName, phone: formattedPhone, storeUsername: form.storeUsername });
          if (data.session) router.push("/pro"); else setStep("verify");
        }
      }
    } catch (e: any) { setError(e.message); setLoading(null); }
  };

  if (!mounted) return <div className="min-h-screen bg-white dark:bg-[#020617]" />;

  return (
    <main className="min-h-screen w-full bg-white dark:bg-[#020617] flex flex-col lg:flex-row relative font-sans overflow-hidden transition-colors duration-300">

      {/* ═══ LEFT PANEL — Brand / Social Proof ══════════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[46%] xl:w-[42%] min-h-screen sticky top-0 relative overflow-hidden">
        {/* Deep dark background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#01120a] via-[#020e06] to-[#010c07]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.07] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-emerald-400/[0.04] blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <img src="/logo.png" alt="SwiftLink" className="w-5 h-5" />
            </div>
            <span className="text-base font-black text-white uppercase tracking-widest">
              Swift<span className="text-emerald-400">Link</span>
            </span>
          </Link>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-400">Live on 10,000+ stores</span>
              </div>

              <h1 className="text-4xl xl:text-6xl 2xl:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-6">
                Your store.<br />
                <span className="text-emerald-400 italic">Fully loaded.</span>
              </h1>
              <p className="text-slate-400 font-medium leading-relaxed max-w-[340px] text-sm xl:text-base">
                The professional workspace for Nigerian brands scaling on WhatsApp. Set up in 60 seconds. Zero transaction fees.
              </p>
            </motion.div>

            {/* Live metric cards */}
            <div className="mt-12 grid grid-cols-2 gap-3">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + m.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm hover:bg-white/[0.06] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${colorMap[m.color]}`}>
                    <m.icon size={15} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{m.label}</p>
                  <p className="text-base font-black text-white">{m.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom footer */}
          <div className="flex items-center justify-between opacity-30 mt-8">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">© 2026 SwiftLink</p>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Commerce Infrastructure</p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Auth Form ════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-10 lg:p-14 relative min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300">

        {/* Subtle background for light mode */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.04),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all shadow-sm"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Mobile top bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 lg:hidden" />

        <div className="relative z-10 w-full max-w-[400px]">
          {/* Mobile back */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-500 mb-8 transition-colors group">
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="SwiftLink" className="w-6 h-6" />
            <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">
              Swift<span className="text-emerald-500">Link</span>
            </span>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight mb-2">
              {mode === "signup" ? (
                <>Create your <span className="text-emerald-500 italic">workspace.</span></>
              ) : (
                <>Welcome <span className="text-emerald-500 italic">back.</span></>
              )}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {mode === "signup" ? "Your professional storefront is 60 seconds away." : "Open your dashboard and keep selling."}
            </p>
          </motion.div>

          {/* Tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-2xl border border-slate-200 dark:border-white/[0.06] mb-7"
          >
            {(["signup", "login"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`relative flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.28em] transition-all duration-200 ${
                  mode === m
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-white dark:bg-[#020617] rounded-xl shadow-sm border border-slate-200/60 dark:border-white/[0.06]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative">{m === "signup" ? "Register" : "Sign in"}</span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Google OAuth */}
                <div className="w-full flex justify-center">
                  <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => { setError("Google Sign-In was cancelled."); setLoading(null); }}
                      shape="pill"
                      theme={theme === "dark" ? "filled_black" : "outline"}
                      size="large"
                      width="400px"
                      text={mode === "signup" ? "signup_with" : "signin_with"}
                    />
                  </GoogleOAuthProvider>
                </div>

                {/* Divider */}
                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.05]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700">or email</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.05]" />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <AnimatePresence>
                    {mode === "signup" && (
                      <motion.div
                        key="signup-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-3 overflow-hidden"
                      >
                        <FloatInput
                          id="bizName" label="Store name" value={form.bizName}
                          onChange={(v) => setForm({ ...form, bizName: v })}
                          required placeholder="Elite Luxe"
                        />
                        {/* Phone row */}
                        <div className="flex gap-2">
                          <div className="shrink-0">
                            <CountrySelector value={countryCode} onChange={setCountryCode} />
                          </div>
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
                    id="email" label="Work email" type="email" value={form.email}
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
                        className="text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {mode === "login" && (
                    <div className="text-right">
                      <button type="button" className="text-[11px] font-bold text-slate-400 hover:text-emerald-500 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading !== null}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-60 group relative overflow-hidden
                      bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-500 dark:hover:bg-emerald-400 shadow-xl shadow-slate-900/10 dark:shadow-none"
                  >
                    {/* Shimmer */}
                    <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                    {loading === "email" ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <span>{mode === "signup" ? "Launch Workspace" : "Enter Dashboard"}</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Terms micro-copy */}
                {mode === "signup" && (
                  <p className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-600 leading-relaxed">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="text-emerald-500 hover:underline font-bold">Terms of Service</Link>
                  </p>
                )}
              </motion.div>
            ) : (
              /* ── Verify email state ── */
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare size={30} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                  Check your inbox.
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-[280px] mx-auto">
                  We sent a secure verification link to{" "}
                  <span className="text-slate-900 dark:text-white font-bold">{form.email}</span>
                </p>
                <button
                  onClick={() => { setStep("form"); setMode("login"); }}
                  className="w-full py-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                >
                  Back to Sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
