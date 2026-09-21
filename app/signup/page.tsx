"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  Eye,
  EyeOff,
  MessageSquare,
  Moon,
  Store,
  Sun,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { getPublicStoreSlug } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CountrySelector } from "@/components/CountrySelector";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

/**
 * Sign in / sign up.
 *
 * Two real bugs are fixed here along with the redesign:
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
 *
 * Visual redesign (docs/03-DECISIONS.md D5): friendly Shopify-style console
 * look — tokens instead of the old light/dark hex forks, UI-kit controls with
 * real labels and `aria-invalid` wiring, one accent. The marketing panel keeps
 * the phone mockup because it earns its place; the fake numbers on it are now
 * labelled as an illustration, not presented as product stats.
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
 * Google button.
 *
 * Without a client id we render a disabled-looking button rather than the old
 * behaviour, which was to silently enter "demo mode" — i.e. pretend to sign in
 * with no session at all. Demo mode is reachable explicitly from the
 * "Supabase not configured" notice; a Google button must not fake a login.
 */
function GoogleButton({
  onSuccess,
  onError,
  label,
  loading,
  mode,
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
  label: string;
  loading: boolean;
  mode: Mode;
}) {
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
      <div className="relative w-full">
        <Button type="button" variant="outline" block loading={loading}>
          {loading ? null : <GoogleLogo />}
          <span>{label}</span>
        </Button>
        {/* Interactive GoogleLogin iframe, transparent over the styled button. */}
        <div className="absolute inset-0 z-10 flex scale-150 items-center justify-center opacity-[0.001]">
          <GoogleLogin
            onSuccess={(res) => {
              if (res.credential) onSuccess(res.credential);
            }}
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
        if (authError) throw authError;
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

  return (
    <div className="flex min-h-screen bg-app-bg font-sans">
      {/* ── Brand panel (desktop) ─────────────────────────────────────────── */}
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-app-text p-10 text-app-bg lg:flex xl:p-14">
        {/* Brand ink on ink: decorative accents carry the color, per design doc §2.1. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(52, 211, 153, 0.25), transparent 55%), radial-gradient(circle at 75% 85%, rgba(4, 120, 87, 0.35), transparent 50%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-app-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
            <img src="/logo.png" alt="SwiftLink" className="h-5 w-5 object-contain" />
          </span>
          <span className="text-sm font-semibold tracking-tight">SwiftLink</span>
        </div>

        <div className="relative z-10 flex flex-1 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full max-w-sm flex-col gap-8"
          >
            <h1 className="text-display-2 font-semibold leading-tight">
              Your store,
              <br />
              in your pocket.
            </h1>
            <ul className="flex flex-col gap-4">
              {[
                { icon: Store, title: "Publish in minutes", body: "Add products, pick a theme, share one link." },
                { icon: MessageSquare, title: "Orders on WhatsApp", body: "Checkout happens where your customers already are." },
                { icon: BarChart3, title: "Real order records", body: "Every order is stored — totals, status, history." },
              ].map(({ icon: ItemIcon, title, body }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <ItemIcon width={16} height={16} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-sm text-white/60">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          Built for Nigerian brands that move fast.
        </p>
      </aside>

      {/* ── Form panel ────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-app-surface">
        <div className="flex min-h-full flex-col p-6 sm:p-10">
          <header className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-app-text-subtle transition-colors hover:text-app-text lg:hidden"
            >
              <ChevronLeft width={14} height={14} aria-hidden="true" />
              <span className="text-xs font-medium">Back</span>
            </button>

            <Link href="/" className="hidden items-center gap-2 lg:flex">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
              <img src="/logo.png" alt="SwiftLink" className="h-5 w-5 object-contain" />
              <span className="text-sm font-semibold text-app-text">SwiftLink</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
                className="text-xs font-medium text-app-text-muted transition-colors hover:text-app-text"
              >
                {mode === "login" ? "Create an account" : "I already have an account"}
              </button>
              <ThemeToggle />
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key={`${mode}-form`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-app-text sm:text-3xl">
                      {mode === "login" ? "Welcome back" : "Create your store"}
                    </h2>
                    <p className="mt-1.5 text-sm text-app-text-muted">
                      {mode === "login"
                        ? "Sign in to open your workspace."
                        : "Start selling from your WhatsApp storefront."}
                    </p>
                  </div>

                  {!isSupabaseConfigured() && (
                    <div className="rounded-lg border border-app-warning bg-app-warning-subtle p-4 text-sm">
                      <p className="font-medium text-app-warning">Running without a database</p>
                      <p className="mt-1 text-app-text-muted">
                        Add your Supabase credentials to <code>.env.local</code> to sign in for real.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          localStorage.setItem("swiftlink_demo_login", "true");
                          router.push("/pro");
                        }}
                      >
                        Continue in demo mode
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-lg border border-app-danger bg-app-danger-subtle p-3.5 text-sm text-app-danger"
                    >
                      <AlertCircle width={16} height={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="flex flex-col gap-4" noValidate>
                    {mode === "signup" && (
                      <>
                        <Field label="Your name" required>
                          <Input
                            value={form.ownerName}
                            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                            autoComplete="name"
                            placeholder="Ada Eze"
                            required
                          />
                        </Field>
                        <Field label="Store name" required>
                          <Input
                            value={form.bizName}
                            onChange={(e) => setForm({ ...form, bizName: e.target.value })}
                            autoComplete="organization"
                            placeholder="Ada's Fabrics"
                            required
                          />
                        </Field>
                        <Field label="WhatsApp number" required hint="Customers reach you here for orders.">
                          <div className="flex gap-2">
                            <CountrySelector value={countryCode} onChange={setCountryCode} />
                            <Input
                              type="tel"
                              inputMode="tel"
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              autoComplete="tel-national"
                              placeholder="808 000 0000"
                              required
                            />
                          </div>
                        </Field>
                      </>
                    )}

                    <Field label="Email" required>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                      />
                    </Field>

                    <Field label="Password" required hint={mode === "signup" ? "At least 8 characters." : undefined}>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          minLength={mode === "signup" ? 8 : undefined}
                          placeholder="••••••••"
                          className="pr-11"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-subtle transition-colors hover:text-app-text"
                        >
                          {showPassword ? (
                            <EyeOff width={16} height={16} aria-hidden="true" />
                          ) : (
                            <Eye width={16} height={16} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </Field>

                    {mode === "login" && (
                      <div className="text-right">
                        <Link
                          href="/reset-password"
                          className="text-xs font-medium text-app-accent-text hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    )}

                    <Button type="submit" block size="lg" loading={loading === "email"}>
                      {loading === "email" ? null : (
                        <>
                          {mode === "login" ? "Sign in" : "Create account"}
                          <ArrowRight width={16} height={16} aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="flex items-center gap-4" aria-hidden="true">
                    <div className="h-px flex-1 bg-app-border" />
                    <span className="text-xs text-app-text-subtle">or</span>
                    <div className="h-px flex-1 bg-app-border" />
                  </div>

                  <GoogleButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setError("Google sign-in was cancelled.");
                      setLoading(null);
                    }}
                    label={mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                    loading={loading === "google"}
                    mode={mode}
                  />

                  <p className="text-center text-xs text-app-text-subtle">
                    By continuing you agree to our{" "}
                    <Link href="/terms" className="font-medium text-app-accent-text hover:underline">
                      Terms
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-5 py-10 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent-subtle">
                    <MessageSquare width={26} height={26} className="text-app-accent-text" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-app-text">Check your inbox</h2>
                    <p className="mt-2 text-sm text-app-text-muted">
                      We sent a verification link to{" "}
                      <span className="font-medium text-app-text">{form.email}</span>
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStep("form");
                      setMode("login");
                    }}
                  >
                    Back to sign in
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-app-border pt-4">
            <Badge tone="neutral">WhatsApp-first commerce</Badge>
            <span className="text-xs text-app-text-subtle">SwiftLink App &amp; Workspace</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

/** Theme toggle lives at page level so the brand panel stays server-pure. */
function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("swiftlink_theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
      }}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-text-muted transition-colors hover:bg-app-surface-2 hover:text-app-text"
    >
      <Sun width={15} height={15} className="hidden dark:block" aria-hidden="true" />
      <Moon width={15} height={15} className="dark:hidden" aria-hidden="true" />
    </button>
  );
}

export default function SignupPage() {
  return <AuthPage />;
}
