"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Zap, Shield, Eye, EyeOff, AlertCircle, Loader2, Store, Sparkles, MessageSquare, Phone
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, updateProfile, sendEmailVerification, signOut
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase-client";
import { getPublicStoreSlug, normalizeStoreUsername } from "@/lib/utils";

type Mode = "signup" | "login";

const PERKS = [
  "Launch your store in 60 seconds",
  "WhatsApp checkout, zero friction",
  "Live inventory management",
  "Professional dispatch tracking",
  "Works on all your devices",
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+234");
  const [step, setStep] = useState<"form" | "verify">("form");
  
  const [form, setForm] = useState({ bizName: "", storeUsername: "", phone: "", email: "", password: "" });

  // Allow deep-linking directly into login mode: /signup?mode=login
  useEffect(() => {
    const m = (searchParams.get("mode") || "").toLowerCase();
    if (m === "login") setMode("login");
    if (m === "signup") setMode("signup");
  }, [searchParams]);

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setError(null);
  };

  const saveUserStore = async (
    uid: string,
    extra?: { bizName?: string; phone?: string; storeUsername?: string },
  ) => {
    const { db } = getFirebase();
    if (!db) return;
    const ref = doc(db, "swiftlink_stores", uid);
    const snap = await getDoc(ref);
    const bizName = extra?.bizName || "";
    const storeUsername = extra?.storeUsername
      ? normalizeStoreUsername(extra.storeUsername).slice(0, 32)
      : "";
    const slug = getPublicStoreSlug({ storeUsername: storeUsername || undefined, bizName });
    if (!snap.exists()) {
      await setDoc(ref, {
        id: uid,
        bizName,
        storeUsername,
        phone: extra?.phone || "",
        products: [],
        deliveries: [],
        currency: "₦",
        bizImage: "",
        bizDesc: "",
        bizColor: "#10b981",
        createdAt: new Date().toISOString(),
        publishedStoreSlug: slug,
      });
    } else {
      // Keep store identity fields up-to-date.
      await setDoc(
        ref,
        {
          bizName: bizName || undefined,
          phone: extra?.phone || undefined,
          storeUsername: storeUsername || undefined,
          publishedStoreSlug: slug || undefined,
        },
        { merge: true },
      );
    }
    // Always ensure the public slug registry is present (for /store/[slug] lookups).
    if (slug) {
      await setDoc(
        doc(db, "swiftlink_slugs", slug),
        {
          shopId: uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    if (typeof window !== "undefined") {
      const d = snap.exists() ? snap.data() : {};
      localStorage.setItem(
        "swiftlink_state",
        JSON.stringify({
          ...d,
          id: uid,
          bizName: bizName || (d as any)?.bizName || "",
          phone: extra?.phone || (d as any)?.phone || "",
          storeUsername: storeUsername || (d as any)?.storeUsername || "",
        }),
      );
      localStorage.setItem("swiftlink_tour_done", "true");
    }
  };

  const handleGoogle = async () => {
    setLoading("google"); setError(null);
    try {
      const { auth } = getFirebase();
      if (!auth) throw new Error("Firebase not ready");
      const provider = new GoogleAuthProvider();
      // Removed provider.setCustomParameters({ prompt: "select_account" }) to fix "invalid_request"
      const result = await signInWithPopup(auth, provider);
      await saveUserStore(result.user.uid, {
        bizName: result.user.displayName || "",
        storeUsername: form.storeUsername,
      });
      router.push("/pro");
    } catch (e: unknown) {
      console.error(e);
      const code = (e as { code?: string })?.code;
      const message = (e as { message?: string })?.message || "";
      
      if (code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled.");
      } else if (message.includes("requests-from-referer") || code === "auth/unauthorized-domain") {
        const domain = typeof window !== "undefined" ? window.location.hostname : "your domain";
        setError(`Firebase Error: Domain '${domain}' is not authorized. Fix: Firebase Console -> Authentication -> Settings -> Authorized Domains -> Add '${domain}'.`);
      } else if (code === "auth/operation-not-allowed") {
        setError("Google Sign-in is disabled. Fix: Firebase Console -> Authentication -> Sign-in Method -> Enable Google.");
      } else {
        setError("Google sign-in failed. Verify your Firebase API Key and project settings in the console.");
      }
    } finally { setLoading(null); }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    
    // Login flow
    if (mode === "login") {
      setLoading("email"); setError(null);
      try {
        const { auth } = getFirebase();
        if (!auth) throw new Error("Firebase not ready");
        const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
        
        if (!cred.user.emailVerified) {
          await signOut(auth);
          await sendEmailVerification(cred.user);
          setError("Please verify your email address. We resent a new link to your inbox.");
          return;
        }

        await saveUserStore(cred.user.uid);
        router.push("/pro");
      } catch (e: unknown) {
        setError("Invalid email or password.");
      } finally {
        setLoading(null);
      }
      return;
    }

    // Signup Flow
    if (!form.bizName || !form.phone) return;
    let formattedPhone = countryCode + form.phone.replace(/^0+/, '').trim();
    if (!formattedPhone.startsWith("+")) {
       setError("Phone number must include country code (e.g. +23480...)");
       return;
    }

    setLoading("email"); setError(null);
    try {
      const { auth } = getFirebase();
      if (!auth) throw new Error("Firebase not ready");
      
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCred.user, { displayName: form.bizName });
      await saveUserStore(userCred.user.uid, {
        bizName: form.bizName,
        phone: formattedPhone,
        storeUsername: form.storeUsername,
      });
      
      await sendEmailVerification(userCred.user);
      await signOut(auth);
      setStep("verify");
      
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to create account. Email might be in use.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#080d18] flex relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-14 xl:p-20 relative z-10 border-r border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="SwiftLink" className="w-10 h-10" />
          <span className="text-2xl font-black text-white">SwiftLink<span className="text-emerald-400">Pro</span></span>
        </Link>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-6">
            <Sparkles size={9} /> Launch fast
          </span>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-5">
            Your Business,<br />
            <span className="text-emerald-400 italic">Supercharged.</span>
          </h1>
          <p className="text-slate-400 text-base font-medium leading-relaxed max-w-sm mb-10">
            Turn WhatsApp into your most powerful sales channel. Manage stores, dispatch, and customers — all in one place.
          </p>
          <div className="space-y-3.5">
            {PERKS.map((perk, i) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {["Store link", "Catalog", "WhatsApp orders"].map((t, i) => (
            <div key={t} className="flex items-center gap-3">
              {i > 0 && <div className="w-px h-6 bg-white/10" />}
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {t}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 relative z-10 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
            <span className="text-xl font-black text-white">SwiftLink<span className="text-emerald-400">Pro</span></span>
          </Link>

          <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-6 sm:p-8 shadow-2xl overflow-hidden relative">
            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  
                  {/* Mode toggle */}
                <div className="flex bg-white/[0.05] rounded-xl p-1 mb-7">
                  {(["signup", "login"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(null); }}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        mode === m ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {m === "signup" ? "Sign Up" : "Log In"}
                    </button>
                  ))}
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-5"
                >
                  {loading === "google" ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                  {loading === "google" ? "Connecting..." : "Continue with Google"}
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-4 text-[11px] font-bold">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {mode === "signup" && (
                      <motion.div key="extra" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 ml-0.5">Business Name</label>
                          <div className="relative">
                            <Store size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input required type="text" value={form.bizName} onChange={setField("bizName")} placeholder="e.g. Elite Fashion" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white placeholder:text-slate-600 pl-9 pr-4 py-3.5 rounded-xl outline-none transition-all font-bold text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 ml-0.5">Store Handle (optional)</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={form.storeUsername}
                              onChange={setField("storeUsername")}
                              placeholder="e.g. elitefashion"
                              inputMode="url"
                              className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white placeholder:text-slate-600 px-4 py-3.5 rounded-xl outline-none transition-all font-bold text-sm"
                            />
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 ml-0.5 font-medium">
                            This becomes your public link: <span className="text-slate-300 font-bold">/store/your-handle</span>
                          </p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 ml-0.5">WhatsApp Number <span className="text-emerald-500">*</span></label>
                          <div className="flex gap-2 relative">
                            <div className="relative w-[110px] sm:w-28 flex-shrink-0">
                              <select 
                                value={countryCode} 
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="w-full h-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white pl-3.5 pr-2 py-3.5 rounded-xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                              >
                                <option className="bg-slate-900" value="+234">🇳🇬 +234</option>
                                <option className="bg-slate-900" value="+1">🇺🇸 +1</option>
                                <option className="bg-slate-900" value="+44">🇬🇧 +44</option>
                                <option className="bg-slate-900" value="+27">🇿🇦 +27</option>
                                <option className="bg-slate-900" value="+254">🇰🇪 +254</option>
                                <option className="bg-slate-900" value="+233">🇬🇭 +233</option>
                                <option className="bg-slate-900" value="+91">🇮🇳 +91</option>
                                <option className="bg-slate-900" value="+971">🇦🇪 +971</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
                            </div>
                            <div className="relative flex-1 min-w-0">
                              <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input required type="tel" value={form.phone} onChange={setField("phone")} placeholder="801 234..." className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white placeholder:text-slate-600 pl-9 pr-4 py-3.5 rounded-xl outline-none transition-all font-bold text-sm" />
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 ml-0.5 font-medium">Select your code. Do not include leading zeros.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 ml-0.5">Email</label>
                    <input required type="email" value={form.email} onChange={setField("email")} placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white placeholder:text-slate-600 px-4 py-3.5 rounded-xl outline-none transition-all font-bold text-sm" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 ml-0.5">Password</label>
                    <div className="relative">
                      <input required type={showPassword ? "text" : "password"} value={form.password} onChange={setField("password")} placeholder="Min. 6 characters" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white placeholder:text-slate-600 px-4 pr-11 py-3.5 rounded-xl outline-none transition-all font-bold text-sm" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading !== null} className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading === "email" ? <Loader2 size={17} className="animate-spin" /> : <>{mode === "signup" ? "Create Store" : "Log In"} <ArrowRight size={17} /></>}
                  </button>
                </form>

                <div className="flex items-center justify-center gap-2 mt-5">
                  <Shield size={10} className="text-slate-600" />
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Secure sign-in · Works on all devices</p>
                </div>

                <p className="mt-3 text-center text-[10px] font-bold text-slate-600 hover:text-emerald-500 transition-colors">
                  <Link href="/terms">Terms & Privacy Policy</Link>
                </p>
              </motion.div>
              )}
              
              {step === "verify" && (
                <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pt-2 pb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <MessageSquare size={20} className="text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-black text-white text-center mb-1">Check your inbox</h2>
                  <p className="text-xs text-slate-400 text-center mb-6 px-4">
                    We just sent a secure verification link to<br/><span className="text-white font-bold">{form.email}</span>
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                    <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium">
                      Click the link in the email to activate your account. Once verified, you can return here and safely log in to open your storefront.
                    </p>
                  </div>
                  
                  <button type="button" onClick={() => { setStep("form"); setMode("login"); setError(null); }} className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-emerald-500/20">
                    I&apos;ve verified my email
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center mt-6">
            <Link href="/" className="text-slate-500 hover:text-emerald-400 font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2">
              <Zap size={11} /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
