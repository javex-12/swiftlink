"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { getPublicStoreSlug, cn } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CountrySelector } from "@/components/CountrySelector";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Logo } from "@/components/Logo";

/**
 * Sign in / sign up.
 *
 * Redesign (docs/03-DECISIONS.md D12): the split brand-panel layout was dropped
 * for one calm, centred column. The old screen spent half the viewport on a
 * marketing panel, put the primary action below a scroll on phones, and carried
 * a decorative phone mockup with invented stats. This is a login form — it now
 * looks like one, on any width.
 *
 * Two real bugs are also fixed here:
 *
 * 1. **The orphan store.** `saveUserStore` used to upsert `id: uid` with no
 *    `owner_id`. `stores.id` is a free UUID (P0 corrected the model so a user can
 *    own several stores), so for a returning user this *inserted a second row*
 *    with a NULL owner — invisible to the dashboard, which queries
 *    `owner_id = user.id`. The live database already has 2 such orphans. The
 *    lookup/upsert is now owner-correlated.
 *
 * 2. **The lost redirect.** Middleware (F-01) redirects unauthenticated users to
 *    `/signup?next=/pro`, but nothing ever read `next`. Every login landed on the
 *    dashboard root regardless of where the merchant was heading.
 */

type Mode = "login" | "signup";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4" />
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853" />
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335" />
    </svg>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/**
 * Width, in pixels, that Google Identity Services should draw its button at.
 *
 * GIS renders its own iframe at a *fixed* pixel width, so the previous
 * hard-coded `width={380}` was wider than the form column it sat in (420px card
 * minus `p-6`/`sm:p-8` padding leaves 356-372px), which pushed the whole page
 * sideways on every phone and on the desktop card. JS cannot shrink that iframe
 * with CSS without clipping Google's logo and label, and GIS only accepts
 * 200-400 anyway — so we measure the slot we actually have and feed it back in.
 * `width` is a dependency of the library's render effect, so a new value
 * re-renders the button.
 */
function useGoogleButtonWidth() {
  const slotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    const measure = () => {
      const available = Math.floor(slot.clientWidth);
      if (available <= 0) return;
      setWidth(Math.min(400, Math.max(200, available)));
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return { slotRef, width };
}

/**
 * Google button — Google Identity Services.
 *
 * Uses @react-oauth/google and Google Identity Services with NEXT_PUBLIC_GOOGLE_CLIENT_ID.
 * By rendering Google's official GIS button directly (without an invisible overlay
 * that triggers desktop clickjacking blocks), desktop and mobile clicks work reliably,
 * and the Google consent popup displays swiftlinkpro.vercel.app directly.
 * The credential token is exchanged seamlessly with supabase.auth.signInWithIdToken.
 */
function GoogleButton({
  label,
  onSuccess,
  onError,
}: {
  label: string;
  onSuccess: (credential: string) => void;
  onError: (msg: string) => void;
}) {
  // Must run before the early return below: hooks may not be conditional.
  const { slotRef, width } = useGoogleButtonWidth();

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button type="button" variant="outline" block disabled aria-disabled="true">
        <GoogleLogo />
        <span>Google sign-in not configured</span>
      </Button>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div ref={slotRef} className="w-full [&>div]:w-full">
        <GoogleLogin
          onSuccess={(res) => {
            if (res.credential) {
              onSuccess(res.credential);
            } else {
              onError("No credential returned from Google.");
            }
          }}
          onError={() => onError("Google sign-in was cancelled or encountered an error.")}
          theme="outline"
          size="large"
          text={label.toLowerCase().includes("sign up") ? "signup_with" : "signin_with"}
          shape="rectangular"
          width={width}
        />
      </div>
    </GoogleOAuthProvider>
  );
}


/** Segmented switch between the two forms with Google M3 Expressive pill shapes. */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div
      role="group"
      aria-label="Sign in or create an account"
      className="grid grid-cols-2 gap-1 rounded-full border border-[#182a22] bg-[#111e18] p-1.5"
    >
      {(["login", "signup"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={mode === value}
          className={cn(
            "rounded-full px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300",
            mode === value
              ? "bg-[#0f5133] text-[#b8f2d3] shadow-sm"
              : "text-[#9db4a8] hover:text-[#e2efe7]",
          )}
        >
          {value === "login" ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  );
}

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+234");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [form, setForm] = useState({
    ownerName: "",
    bizName: "",
    storeUsername: "",
    phone: "",
    email: "",
    password: "",
  });

  const nextPath = searchParams.get("next") || "/pro";

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "login" || m === "signup") setMode(m);

    if (isSupabaseConfigured()) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          // Only auto-forward for a same-site next path.
          if (session && nextPath.startsWith("/")) router.replace(nextPath);
        })
        .catch(() => {});
    } else {
      const isDemo = localStorage.getItem("swiftlink_demo_login") === "true";
      if (isDemo) router.replace("/pro");
    }
    // `nextPath` is derived from searchParams; including it would re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  /**
   * Owner-correlated store lookup/upsert.
   *
   * The previous version upserted `id: uid` — but `stores.id` is a free UUID, so
   * for a returning user that inserted a *second* row with a NULL `owner_id`,
   * which the dashboard (queries `owner_id = user.id`) could never load. Exactly
   * the two orphans now sitting in production.
   */
  const saveUserStore = useCallback(
    async (
      uid: string,
      email: string | undefined,
      extra?: { ownerName?: string; bizName?: string; phone?: string; storeUsername?: string },
    ) => {
      try {
        // Look up by owner, not by PK: this user's existing store, if any.
        const { data: existing } = await supabase
          .from("stores")
          .select("id, state_json")
          .eq("owner_id", uid)
          .limit(1)
          .maybeSingle();

        const legacy = (existing?.state_json ?? {}) as Record<string, unknown>;
        const bizName = extra?.bizName || (legacy.bizName as string) || "";
        const ownerName = extra?.ownerName || (legacy.ownerName as string) || "";
        const storeUsername = extra?.storeUsername || (legacy.storeUsername as string) || "";
        const slug = getPublicStoreSlug({ storeUsername, bizName });
        const initialPlan = searchParams.get("plan") || "free";

        const nextState = {
          id: existing?.id ?? uid,
          plan: initialPlan,
          ownerName,
          bizName,
          storeUsername,
          phone: extra?.phone || (legacy.phone as string) || "",
          products: legacy.products || [],
          currency: legacy.currency || "₦",
          bizImage: legacy.bizImage || "",
          bizDesc: legacy.bizDesc || "",
          bizColor: legacy.bizColor || "#047857",
          publishedStoreSlug: slug,
          onboarding_step: 5,
        };

        if (existing?.id) {
          await supabase
            .from("stores")
            .update({
              biz_name: bizName,
              store_username: storeUsername,
              phone: nextState.phone,
              plan: initialPlan,
              account_status: "active",
              state_json: nextState,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("stores").insert({
            owner_id: uid,
            biz_name: bizName,
            store_username: storeUsername || null,
            phone: nextState.phone,
            plan: initialPlan,
            account_status: "active",
            state_json: nextState,
          });
        }

        localStorage.setItem("swiftlink_state", JSON.stringify(nextState));
        localStorage.setItem("swiftlink_onboarding_dismissed", "true");
        localStorage.setItem("swiftlink_tour_done", "true");
      } catch (err) {
        // A store-provisioning failure must not block the session itself; the
        // dashboard provisions on first load as a fallback.
        console.error("Store Save Error:", err);
      }
    },
    [searchParams],
  );

  const handleGoogleSuccess = async (credential: string) => {
    setLoading("google");
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        router.push("/pro");
        return;
      }
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
      });
      if (authError) throw authError;
      if (data.user) {
        await saveUserStore(data.user.id, data.user.email);
        router.push(nextPath);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        localStorage.setItem("swiftlink_demo_login", "true");
        router.push("/pro");
        return;
      }
      if (mode === "login") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (authError) {
          // Surface a helpful hint when the user signed up via Google and has no
          // password set — Supabase returns "Invalid login credentials" for both
          // wrong passwords and social-only accounts.
          if (authError.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error(
              "Incorrect email or password. If you signed up with Google, use \"Sign in with Google\" above — or click Forgot password? to set an email password.",
            );
          }
          throw authError;
        }

        if (data.user) {
          await saveUserStore(data.user.id, data.user.email);
          router.push(nextPath);
        }
      } else {
        const formattedPhone = countryCode + form.phone.replace(/^0+/, "").trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { display_name: form.bizName, phone: formattedPhone } },
        });
        if (authError) throw authError;
        if (data.user) {
          await saveUserStore(data.user.id, data.user.email, {
            ownerName: form.ownerName,
            bizName: form.bizName,
            phone: formattedPhone,
            storeUsername: form.storeUsername,
          });
          if (data.session) router.push(nextPath);
          else setStep("verify");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="relative min-h-[100dvh] bg-[#0a130f] font-sans text-[#e2efe7] selection:bg-[#19C37D]/30">
      {/* Decorative ambient emerald wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% -15%, rgba(15, 81, 51, 0.45), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between">
        <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-2 m3-spring-btn">
            <Logo size="md" showWordmark={true} />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="mx-auto w-full max-w-[440px]">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key={`${mode}-form`}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                  className="rounded-[36px] sm:rounded-[44px] border border-[#182a22] bg-[#14231c]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
                >
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#e2efe7]">
                      {isSignup ? "Create your store" : "Welcome back"}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#9db4a8]">
                      {isSignup
                        ? "Set up your WhatsApp storefront in minutes."
                        : "Sign in to manage your store and orders."}
                    </p>
                  </div>

                  <div className="mt-6">
                    <ModeSwitch
                      mode={mode}
                      onChange={(m) => {
                        setMode(m);
                        setError(null);
                      }}
                    />
                  </div>

                  {!isSupabaseConfigured() && (
                    <div className="mt-5 rounded-[20px] border border-[#ffe3a3]/30 bg-[#4a3a0f]/40 p-4 text-xs text-[#ffe3a3]">
                      <p className="font-bold">Running without a database</p>
                      <p className="mt-1 text-[#ffe3a3]/80">
                        Add Supabase credentials to sign in for real.
                      </p>
                      <button
                        type="button"
                        className="mt-3 rounded-full bg-[#ffe3a3] text-[#3d2b00] px-4 py-1.5 font-bold text-xs"
                        onClick={() => {
                          localStorage.setItem("swiftlink_demo_login", "true");
                          router.push("/pro");
                        }}
                      >
                        Continue in demo mode
                      </button>
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="mt-5 flex items-start gap-2.5 rounded-[20px] border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300"
                    >
                      <AlertCircle width={16} height={16} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="mt-6 flex flex-col gap-4" noValidate>
                    {isSignup && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                            Your name
                          </label>
                          <input
                            type="text"
                            value={form.ownerName}
                            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                            autoComplete="name"
                            placeholder="Ada Eze"
                            required
                            className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-3 text-sm text-[#e2efe7] placeholder-[#9db4a8]/50 outline-none transition focus:border-[#5be3a0]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                            Store name
                          </label>
                          <input
                            type="text"
                            value={form.bizName}
                            onChange={(e) => setForm({ ...form, bizName: e.target.value })}
                            autoComplete="organization"
                            placeholder="Ada's Fabrics"
                            required
                            className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-3 text-sm text-[#e2efe7] placeholder-[#9db4a8]/50 outline-none transition focus:border-[#5be3a0]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                            WhatsApp number
                          </label>
                          <div className="flex gap-2">
                            <CountrySelector value={countryCode} onChange={setCountryCode} />
                            <input
                              type="tel"
                              inputMode="tel"
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              autoComplete="tel-national"
                              placeholder="808 000 0000"
                              required
                              className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-3 text-sm text-[#e2efe7] placeholder-[#9db4a8]/50 outline-none transition focus:border-[#5be3a0]"
                            />
                          </div>
                          <span className="block mt-1 text-[11px] text-[#9db4a8] ml-1">Customers reach you here for orders.</span>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-3 text-sm text-[#e2efe7] placeholder-[#9db4a8]/50 outline-none transition focus:border-[#5be3a0]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#9db4a8]">
                          Password
                        </label>
                        {!isSignup && (
                          <Link
                            href="/reset-password"
                            className="text-xs font-semibold text-[#5be3a0] hover:underline"
                          >
                            Forgot?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          autoComplete={isSignup ? "new-password" : "current-password"}
                          minLength={isSignup ? 8 : undefined}
                          placeholder="••••••••"
                          required
                          className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-3 pr-11 text-sm text-[#e2efe7] placeholder-[#9db4a8]/50 outline-none transition focus:border-[#5be3a0]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9db4a8] transition-colors hover:text-[#e2efe7]"
                        >
                          {showPassword ? (
                            <EyeOff width={16} height={16} aria-hidden="true" />
                          ) : (
                            <Eye width={16} height={16} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {isSignup && <span className="block mt-1 text-[11px] text-[#9db4a8] ml-1">At least 8 characters.</span>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading === "email"}
                      className="mt-2 w-full h-12 rounded-full bg-[#19C37D] text-[#00391f] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#19C37D]/20 hover:bg-[#16B070] active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
                    >
                      {loading === "email" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#00391f]" />
                      ) : (
                        <>
                          <span>{isSignup ? "Create account" : "Sign in"}</span>
                          <ArrowRight width={16} height={16} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 flex items-center gap-4" aria-hidden="true">
                    <div className="h-px flex-1 bg-[#27402f]" />
                    <span className="text-xs font-semibold text-[#9db4a8]">or</span>
                    <div className="h-px flex-1 bg-[#27402f]" />
                  </div>

                  <div className="mt-6">
                    <GoogleButton
                      label={isSignup ? "Sign up with Google" : "Sign in with Google"}
                      onSuccess={handleGoogleSuccess}
                      onError={(msg) => {
                        setError(msg);
                        setLoading(null);
                      }}
                    />
                  </div>

                  <p className="mt-6 text-center text-xs text-[#9db4a8]">
                    By continuing you agree to our{" "}
                    <Link href="/terms" className="font-semibold text-[#5be3a0] hover:underline">
                      Terms
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-5 rounded-[44px] border border-[#182a22] bg-[#14231c] p-8 text-center shadow-2xl"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#0f5133] text-[#b8f2d3] shadow-inner">
                    <Mail width={28} height={28} aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#e2efe7]">Check your inbox</h1>
                    <p className="mt-2 text-sm text-[#9db4a8]">
                      We sent a verification link to{" "}
                      <span className="font-semibold text-[#e2efe7]">{form.email}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setMode("login");
                    }}
                    className="h-11 px-6 rounded-full border border-[#27402f] bg-[#111e18] text-xs font-bold text-[#e2efe7] hover:bg-[#182a22] transition"
                  >
                    Back to sign in
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-xs text-[#9db4a8]">
              Prefer to look around first?{" "}
              <Link href="/" className="font-semibold text-[#5be3a0] hover:underline">
                Explore SwiftLink
              </Link>
            </p>
          </div>
        </main>

        <footer className="px-5 pb-6 pt-2 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#9db4a8]">
            <span>© 2026 SwiftLink</span>
            <Link href="/terms" className="hover:text-[#e2efe7] transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#e2efe7] transition">
              Privacy
            </Link>
            <a href="mailto:support@swiftlink.pro" className="hover:text-[#e2efe7] transition">
              Support
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Static shell shown while the form hydrates.
 *
 * `AuthPage` reads `useSearchParams`, so without a Suspense boundary Next bails
 * the whole route out to client-side rendering — meaning an empty `<body>` and a
 * blank flash on first paint. This keeps the chrome on screen and styled until
 * the interactive form takes over.
 */
function AuthFallback() {
  return (
    <div className="min-h-[100dvh] bg-app-bg font-sans text-app-text">
      <div className="flex min-h-[100dvh] items-center justify-center px-5">
        <div className="w-full max-w-[420px] rounded-2xl border border-app-border bg-app-surface p-6 shadow-sm sm:p-8">
          <div className="h-7 w-40 animate-pulse rounded-md bg-app-surface-2" />
          <div className="mt-3 h-4 w-56 animate-pulse rounded-md bg-app-surface-2" />
          <div className="mt-8 flex flex-col gap-4">
            <div className="h-11 w-full animate-pulse rounded-lg bg-app-surface-2" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-app-surface-2" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-app-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthPage />
    </Suspense>
  );
}
