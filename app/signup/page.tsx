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

type Mode = "signup" | "login";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState<"google" | "email" | "reset" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+234");
  const [step, setStep] = useState<"form" | "verify">("form");
  
  const [form, setForm] = useState({ bizName: "", storeUsername: "", phone: "", email: "", password: "" });

  // 1. Detect if user is already logged in (Google Redirect returns here)
  useEffect(() => {
    setMounted(true);
    const m = searchParams.get("mode") as Mode;
    if (m === "login" || m === "signup") setMode(m);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Logged in session detected, moving to dashboard...");
        router.push("/pro");
      }
    };
    checkUser();
    
    // Also listen for state changes (handles the #access_token in URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/pro");
      }
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

  const handleGoogleLogin = async () => {
    setLoading("google");
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/signup?mode=login`,
        }
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
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

  if (!mounted) return <div className="min-h-screen bg-[#080d18]" />;

  return (
    <main className="min-h-screen bg-[#080d18] flex relative overflow-hidden font-sans text-slate-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="hidden lg:flex flex-col justify-between w-[44%] p-14 xl:p-20 relative z-10 border-r border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="SwiftLink" className="w-10 h-10" />
          <span className="text-2xl font-black text-white">SwiftLink<span className="text-emerald-400">Pro</span></span>
        </Link>
        <div>
          <h1 className="text-5xl font-black text-white leading-tight mb-5 tracking-tight">Your Business,<br /><span className="text-emerald-400 italic">Supercharged.</span></h1>
          <div className="space-y-4">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                </div>
                <span className="text-slate-400 text-sm font-semibold">{perk}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Store link · Catalog · WhatsApp orders</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-5 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                  <div className="flex bg-white/[0.05] rounded-2xl p-1.5 mb-8">
                    {(["signup", "login"] as Mode[]).map((m) => (
                      <button key={m} onClick={() => {setMode(m); setError(null);}} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === m ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}>
                        {m === "signup" ? "Sign Up" : "Log In"}
                      </button>
                    ))}
                  </div>

                  <button onClick={handleGoogleLogin} disabled={loading !== null} className="w-full flex items-center justify-center gap-3 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === "google" ? <Loader2 className="animate-spin text-emerald-600" size={18} /> : <GoogleIcon />}
                    {loading === "google" ? "Syncing..." : "Continue with Google"}
                  </button>

                  <div className="flex items-center gap-3 my-8">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Secure email login</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {error && <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-xs font-bold flex gap-3"><AlertCircle size={16} className="shrink-0"/>{error}</motion.div>}
                  {message && <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl mb-6 text-xs font-bold flex gap-3"><CheckCircle2 size={16} className="shrink-0"/>{message}</motion.div>}

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-4">
                        <input required type="text" value={form.bizName} onChange={e => setForm({...form, bizName: e.target.value})} placeholder="Business Name" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 text-white px-5 py-4 rounded-2xl outline-none font-bold text-sm transition-all" />
                        <div className="flex gap-2">
                           <div className="relative shrink-0">
                                <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="h-full bg-white/5 border border-white/10 text-white pl-4 pr-8 rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer">
                                    <option className="bg-slate-900" value="+234">🇳🇬 +234</option>
                                    <option className="bg-slate-900" value="+1">🇺🇸 +1</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-500">▼</div>
                           </div>
                           <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="WhatsApp Number" className="flex-1 bg-white/5 border border-white/10 focus:border-emerald-500/50 text-white px-5 py-4 rounded-2xl outline-none font-bold text-sm transition-all" />
                        </div>
                      </div>
                    )}
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email Address" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 text-white px-5 py-4 rounded-2xl outline-none font-bold text-sm transition-all" />
                    <div className="relative">
                      <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 text-white px-5 py-4 rounded-2xl outline-none font-bold text-sm transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                    </div>
                    <button type="submit" disabled={loading !== null} className="w-full py-4.5 bg-emerald-500 text-white rounded-2xl text-sm font-black uppercase tracking-[0.15em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 mt-2">
                      {loading === "email" ? <Loader2 className="animate-spin" size={20} /> : <>{mode === "signup" ? "Create Command Center" : "Login to Center"} <ArrowRight size={20} /></>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-4">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                    <MessageSquare size={32} className="text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Check your inbox</h2>
                  <p className="text-sm text-slate-400 mb-8 px-4">We sent a secure verification link to <br/><span className="text-white font-bold">{form.email}</span></p>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-8 text-xs text-slate-500 font-medium leading-relaxed">Click the link in the email to activate your business. You can then return here to log in.</div>
                  <button onClick={() => {setStep("form"); setMode("login")}} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl">I&apos;ve verified my email</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link href="/?v=landing" className="block text-center mt-10 text-slate-500 hover:text-emerald-400 font-bold text-[11px] uppercase tracking-[0.2em] transition-all">
            <Zap size={12} className="inline mr-2 -mt-0.5" /> Return to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
