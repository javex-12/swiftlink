"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, Moon, Sun } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { getPublicStoreSlug, cn } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CountrySelector } from "@/components/CountrySelector";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Logo } from "@/components/Logo";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";

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
 * Google button.
 *
 * Without a client id we render a disabled-looking button rather than the old
 * behaviour, which was to silently enter "demo mode" — i.e. pretend to sign in
 * with no session at all. Demo mode is reachable explicitly from the
 * "Supabase not configured" notice; a Google button must not fake a login.
 *
 * Google renders its own iframe, so we lay it — transparent, clipped and
 * non-scaling — over our styled button. The old version scaled it 1.5×, which
 * pushed the invisible hit area past the form column and made phones scroll
 * sideways.
 */
function GoogleButton({
  onSuccess,
  onError,
  label,
  loading,
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
  label: string;
  loading: boolean;
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
      <div className="relative w-full overflow-hidden rounded-lg">
        <Button type="button" variant="outline" block loading={loading}>
          {loading ? null : <GoogleLogo />}
          <span>{label}</span>
        </Button>
        {/* Interactive GoogleLogin iframe, transparent over the styled button. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center opacity-0",
            loading && "pointer-events-none",
          )}
        >
          <GoogleLogin
            onSuccess={(res) => {
              if (res.credential) onSuccess(res.credential);
            }}
            onError={onError}
            width="400"
            shape="pill"
            text="continue_with"
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

/** Segmented switch between the two forms. */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div
      role="group"
      aria-label="Sign in or create an account"
      className="grid grid-cols-2 gap-1 rounded-xl border border-app-border bg-app-surface-2 p-1"
    >
      {(["login", "signup"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={mode === value}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring",
            mode === value
              ? "bg-app-surface text-app-text shadow-xs"
              : "text-app-text-muted hover:text-app-text",
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

  const isSignup = mode === "signup";

  return (
    <div className="relative min-h-[100dvh] bg-app-bg font-sans text-app-text">
      {/* Decorative wash, token-driven so it follows the console theme. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, var(--app-accent-subtle), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size="sm" showWordmark={true} />
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
          <div className="mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key={`${mode}-form`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-app-border bg-app-surface p-6 shadow-sm sm:p-8"
                >
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                      {isSignup ? "Create your store" : "Welcome back"}
                    </h1>
                    <p className="text-sm text-app-text-muted">
                      {isSignup
                        ? "Set up your WhatsApp storefront in minutes."
                        : "Sign in to open your workspace."}
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
                    <div className="mt-5 rounded-lg border border-app-warning bg-app-warning-subtle p-4 text-sm">
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
                      className="mt-5 flex items-start gap-2.5 rounded-lg border border-app-danger bg-app-danger-subtle p-3.5 text-sm text-app-danger"
                    >
                      <AlertCircle width={16} height={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="mt-6 flex flex-col gap-4" noValidate>
                    {isSignup && (
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

                    <Field
                      label="Password"
                      required
                      hint={isSignup ? "At least 8 characters." : undefined}
                    >
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          autoComplete={isSignup ? "new-password" : "current-password"}
                          minLength={isSignup ? 8 : undefined}
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

                    {!isSignup && (
                      <div className="-mt-1 text-right">
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
                          {isSignup ? "Create account" : "Sign in"}
                          <ArrowRight width={16} height={16} aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 flex items-center gap-4" aria-hidden="true">
                    <div className="h-px flex-1 bg-app-border" />
                    <span className="text-xs text-app-text-subtle">or</span>
                    <div className="h-px flex-1 bg-app-border" />
                  </div>

                  <div className="mt-6">
                    <GoogleButton
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        setError("Google sign-in was cancelled.");
                        setLoading(null);
                      }}
                      label={isSignup ? "Sign up with Google" : "Sign in with Google"}
                      loading={loading === "google"}
                    />
                  </div>

                  <p className="mt-6 text-center text-xs text-app-text-subtle">
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
                  className="flex flex-col items-center gap-5 rounded-2xl border border-app-border bg-app-surface p-8 text-center shadow-sm"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent-subtle">
                    <Mail width={26} height={26} className="text-app-accent-text" aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
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

            <p className="mt-6 text-center text-xs text-app-text-subtle">
              Prefer to look around first?{" "}
              <Link href="/" className="font-medium text-app-accent-text hover:underline">
                Explore SwiftLink
              </Link>
            </p>
          </div>
          <DesignRail />
          </div>
        </main>

        <footer className="px-5 pb-6 pt-2 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-app-text-subtle">
            <span>© 2026 SwiftLink</span>
            <Link href="/terms" className="hover:text-app-text">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-app-text">
              Privacy
            </Link>
            <a href="mailto:support@swiftlink.pro" className="hover:text-app-text">
              Support
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * The three websites, shown beside the form on wide screens only.
 * Phones stay a single column so the sign-in action is never pushed below the fold.
 */
function DesignRail() {
  const { theme } = useSwiftLink();
  const appearance = theme === "dark" ? "dark" : "light";
  const [active, setActive] = useState<WebsiteTemplateId>("editorial");

  return (
    <aside className="hidden min-w-0 lg:block" aria-label="Website previews">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
        Three websites
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-app-text">
        Pick a look after you sign in.
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-app-text-muted">
        Editorial, Boutique, and Bold are complete shops, each in light and dark. Your customers order on WhatsApp.
      </p>
      <div className="mt-5 flex gap-2" role="group" aria-label="Preview a website">
        {websiteTemplates.map((template) => {
          const selected = active === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => setActive(template.id)}
              aria-pressed={selected}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
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
      <div className="mt-4">
        <TemplateFrame
          id={active}
          appearance={appearance}
          size="card"
          className="rounded-2xl border border-app-border shadow-lg"
        />
      </div>
    </aside>
  );
}

/** Theme toggle lives at page level so the brand panel stays server-pure. */
function ThemeToggle() {
  const { toggleTheme } = useSwiftLink();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-text-muted transition-colors hover:bg-app-surface-2 hover:text-app-text"
    >
      <Sun width={15} height={15} className="hidden dark:block" aria-hidden="true" />
      <Moon width={15} height={15} className="dark:hidden" aria-hidden="true" />
    </button>
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
