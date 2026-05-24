"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Zap, Shield, Eye, EyeOff, AlertCircle, Loader2, Store, Sparkles, MessageSquare, Phone
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getPublicStoreSlug, normalizeStoreUsername } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CountrySelector } from "@/components/CountrySelector";

const PERKS = [
  "Launch your store in 60 seconds",
  "WhatsApp checkout, zero friction",
  "Live inventory management",
  "Professional dispatch tracking",
  "Works on all your devices",
];

type Mode = "signup" | "login";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState<"google" | "email" | "reset" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+234");
  const [step, setStep] = useState<"form" | "verify">("form");
  
  const [form, setForm] = useState({ bizName: "", storeUsername: "", phone: "", email: "", password: "" });

  useEffect(() => {
    setMounted(true);
    const m = searchParams.get("mode") as Mode;
    if (m === "login" || m === "signup") setMode(m);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/pro");
    };
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push("/pro");
    });

    return () => subscription.unsubscribe();
  }, [searchParams, router]);

  const saveUserStore = useCallback(async (
    uid: string,
    email: string | undefined,
    extra?: { bizName?: string; phone?: string; storeUsername?: string },
  ) => {
    try {
      const { data: storeData } = await supabase.from('stores').select('*').eq('id', uid).single();
      const bizName = extra?.bizName || (storeData?.state_json as any)?.bizName || "";
      const storeUsername = extra?.storeUsername || (storeData?.state_json as any)?.storeUsername || "";
      const slug = getPublicStoreSlug({ storeUsername, bizName });
      
      const GOD_MODE_EMAILS = ["michaeldosunmu22@gmail.com", "dosunmumichael26@gmail.com"];
      const emailToCheck = email || form.email;
      const isGodMode = emailToCheck && GOD_MODE_EMAILS.includes(emailToCheck);
      const initialPlan = isGodMode ? "pro" : (searchParams.get("plan") || "free");

      const nextState = {
        id: uid,
        plan: initialPlan,
        bizName,
        storeUsername,
        phone: extra?.phone || (storeData?.state_json as any)?.phone || "",
        products: (storeData?.state_json as any)?.products || [],
        deliveries: (storeData?.state_json as any)?.deliveries || [],
        currency: (storeData?.state_json as any)?.currency || "₦",
        bizImage: (storeData?.state_json as any)?.bizImage || "",
        bizDesc: (storeData?.state_json as any)?.bizDesc || "",
        bizColor: (storeData?.state_json as any)?.bizColor || "#10b981",
        publishedStoreSlug: slug,
      };

      await supabase.from('stores').upsert({
        id: uid,
        biz_name: nextState.bizName,
        store_username: nextState.storeUsername,
        phone: nextState.phone,
        state_json: nextState,
        updated_at: new Date().toISOString()
      });

      if (slug) {
        await supabase.from('slugs').upsert({ slug, shop_id: uid, updated_at: new Date().toISOString() });
      }
      
      localStorage.setItem("swiftlink_state", JSON.stringify(nextState));
    } catch (err) {
      console.error("Store Save Error:", err);
    }
  }, [searchParams, form.email]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading("google");
    setError(null);
    try {
      if (!credentialResponse.credential) throw new Error("No ID token returned from Google");
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });
      if (error) throw error;
      if (data.user) {
        await saveUserStore(data.user.id, data.user.email);
        router.push("/pro");
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed or was cancelled.");
    setLoading(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    setError(null);
    try {
      if (mode === "login") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (authError) throw authError;
        if (data.user) {
          await saveUserStore(data.user.id, data.user.email);
          router.push("/pro");
        }
      } else {
        let formattedPhone = countryCode + form.phone.replace(/^0+/, '').trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { display_name: form.bizName, phone: formattedPhone }
          }
        });
        if (authError) throw authError;
        if (data.user) {
          await saveUserStore(data.user.id, data.user.email, {
            bizName: form.bizName,
            phone: formattedPhone,
            storeUsername: form.storeUsername,
          });
          if (data.session) router.push("/pro");
          else setStep("verify");
        }
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <main className="min-h-screen bg-[#020617] flex relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* High-Fidelity Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.08)_0%,transparent_40%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.08)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      {/* Split Layout: Visual Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-24 xl:p-32 relative z-10 border-r border-white/[0.03]">
        <div className="relative group">
           <Link href="/" className="flex items-center gap-4 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(255,255,255,0.1)] group-hover:rotate-3 transition-all duration-500">
                <img src="/logo.png" alt="SwiftLink" className="w-7 h-7" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase italic">SwiftLink<span className="text-emerald-500 not-italic ml-1">PRO</span></span>
           </Link>
        </div>

        <div className="max-w-xl">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
             <h1 className="text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-12">
               SELL MORE<br />ON WHATSAPP<br /><span className="text-emerald-500 italic">EVERY DAY.</span>
             </h1>
             <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-sm">
               The professional workspace for Nigeria&apos;s most ambitious commerce brands.
             </p>
           </motion.div>
           <div className="mt-20 flex items-center gap-12">
              <div>
                 <p className="text-4xl font-black text-white italic tracking-tighter mb-1">60s</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Setup Node</p>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div>
                 <p className="text-4xl font-black text-white italic tracking-tighter mb-1">Zero</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Commissions</p>
              </div>
           </div>
        </div>
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] leading-none">Global Infrastructure • Optimized for Scale</p>
      </div>

      {/* Auth Interface */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-16 relative z-10 bg-white dark:bg-transparent">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
          <div className="mb-14">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 uppercase italic">
               {mode === "signup" ? "Sign Up" : "Log In"}
             </h2>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
               {mode === "signup" ? "Join the community of elite vendors." : "Sign in to manage your operations."}
             </p>
          </div>

          <div className="space-y-10">
            <div className="flex bg-slate-50 dark:bg-white/[0.03] p-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.05]">
               {(["signup", "login"] as Mode[]).map((m) => (
                 <button key={m} onClick={() => {setMode(m); setError(null);}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${mode === m ? "bg-white dark:bg-[#020617] text-slate-900 dark:text-white shadow-xl" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                   {m === "signup" ? "Sign Up" : "Log In"}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="w-full flex justify-center">
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        shape="pill"
                        theme="filled_black"
                        size="large"
                        width="100%"
                        text={mode === "signup" ? "signup_with" : "signin_with"}
                      />
                    </GoogleOAuthProvider>
                  </div>

                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/[0.05]"></div></div>
                    <span className="relative px-6 bg-white dark:bg-[#020617] text-[8px] font-black uppercase text-slate-400 dark:text-slate-800 tracking-[0.4em]">Node Authentication</span>
                  </div>

                  {error && (
                    <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} className="flex gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                       <AlertCircle size={18} className="text-red-500 shrink-0" />
                       <p className="text-[11px] font-bold text-red-500 dark:text-red-400 italic leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                  
                  <form onSubmit={handleEmailAuth} className="space-y-6">
                    {mode === "signup" && (
                      <>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600 ml-1">Business Name</label>
                           <input required type="text" value={form.bizName} onChange={e => setForm({...form, bizName: e.target.value})} placeholder="e.g. Emerald Luxe" className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/30 text-slate-900 dark:text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600 ml-1">WhatsApp Line</label>
                           <div className="flex gap-3">
                              <CountrySelector value={countryCode} onChange={setCountryCode} />
                              <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="808 000 0000" className="flex-1 w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/30 text-slate-900 dark:text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800" />
                           </div>
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600 ml-1">Work Email</label>
                       <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@business.com" className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/30 text-slate-900 dark:text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600 ml-1">Secure Password</label>
                      <div className="relative group">
                        <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/30 text-slate-900 dark:text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading !== null} className="w-full mt-6 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all duration-500 flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 group">
                      {loading === "email" ? <Loader2 className="animate-spin" size={20} /> : (
                        <><span>{mode === "signup" ? "Sign Up" : "Log In"}</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
                  <div className="w-20 h-20 bg-emerald-500/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-emerald-500/10">
                    <MessageSquare size={32} className="text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase italic">Check your email.</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-12 leading-relaxed">We sent a verification link to <br /><span className="text-slate-900 dark:text-white font-bold">{form.email}</span></p>
                  <button onClick={() => {setStep("form"); setMode("login")}} className="w-full py-5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Back to Login</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-200 dark:border-white/[0.03] flex items-center justify-between">
             <Link href="/?v=landing" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-emerald-500 transition-colors">Return to Hub</Link>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-800">SwiftLink Pro v1.0.1</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}