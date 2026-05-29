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
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("@/components/landing/ThreeScene"), { ssr: false });

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
      
      const PRIVILEGED_USERS: Record<string, "pro" | "business"> = {
        "michaeldosunmu22@gmail.com": "business", 
        "dosunmumichael26@gmail.com": "pro",
      };
      const emailToCheck = email || form.email;
      const assignedPlan = emailToCheck ? PRIVILEGED_USERS[emailToCheck] : null;
      const initialPlan = assignedPlan || (searchParams.get("plan") || "free");

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
      setError("We couldn't sign you in with Google. Please try again.");
      setLoading(null);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In was cancelled. Try using your email instead.");
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
      setError(e.message.includes("invalid claim") ? "Incorrect email or password." : e.message);
      setLoading(null);
    }
  };

  if (!mounted) return <div className="h-screen bg-[#020617]" />;

  return (
    <main className="h-screen w-full bg-[#020617] flex relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.08)_0%,transparent_40%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.08)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay" />
      </div>

      {/* Brand Side: Exact Screen Height, Centered Content */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-16 xl:p-24 relative z-10 border-r border-white/[0.03] bg-gradient-to-b from-[#020617] to-[#01040f]">
        <div className="relative group shrink-0">
           <Link href="/" className="flex items-center gap-4 transition-transform hover:scale-105 w-fit">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(255,255,255,0.1)] group-hover:rotate-3 transition-all duration-500">
                <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase italic">SwiftLink<span className="text-emerald-500 not-italic ml-1">PRO</span></span>
           </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-3xl">
           <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
             <h1 className="text-7xl xl:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-10">
               YOUR STORE.<br />YOUR RULES.<br /><span className="text-emerald-500 italic">ON WHATSAPP.</span>
             </h1>
             <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
               The ultimate workspace for Nigerian entrepreneurs scaling their brands with SwiftLink.
             </p>
           </motion.div>
           
           <div className="mt-16 flex items-center gap-12">
              <div className="flex flex-col">
                 <p className="text-4xl font-black text-white italic tracking-tighter mb-1">60s</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Setup Time</p>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div className="flex flex-col">
                 <p className="text-4xl font-black text-white italic tracking-tighter mb-1">Zero</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Extra Fees</p>
              </div>
           </div>
        </div>
        
        <div className="flex items-center justify-between opacity-30 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] text-white font-black uppercase tracking-[0.5em] leading-none">SwiftLink Global Network</p>
           </div>
           <p className="text-[9px] text-white font-black uppercase tracking-[0.5em] leading-none">© 2026 Workspace</p>
        </div>

        <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
           <ThreeScene />
        </div>
      </div>

      {/* Form Side: Centered, No Scroll */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 bg-white dark:bg-transparent overflow-y-auto custom-scrollbar">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm py-12">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="Logo" className="w-6 h-6" />
             </div>
             <span className="text-xl font-black text-white tracking-tighter uppercase italic">SwiftLink</span>
          </div>

          <div className="mb-10">
             <h2 className="text-3xl font-black text-white tracking-tighter mb-3 uppercase italic">
               {mode === "signup" ? "Get Started" : "Welcome Back"}
             </h2>
             <p className="text-slate-400 font-medium text-sm">
               {mode === "signup" ? "Create your professional link in seconds." : "Enter your workspace dashboard."}
             </p>
          </div>

          <div className="space-y-10">
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08]">
               {(["signup", "login"] as Mode[]).map((m) => (
                 <button key={m} onClick={() => {setMode(m); setError(null);}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all ${mode === m ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-300"}`}>
                   {m === "signup" ? "Signup" : "Login"}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
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
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.05]"></div></div>
                    <span className="relative px-6 bg-[#020617] text-[8px] font-black uppercase text-slate-700 tracking-[0.5em]">OR EMAIL</span>
                  </div>

                  {error && (
                    <motion.div initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="flex gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                       <AlertCircle size={18} className="text-red-500 shrink-0" />
                       <p className="text-[11px] font-bold text-red-500 italic leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                  
                  <form onSubmit={handleEmailAuth} className="space-y-5">
                    {mode === "signup" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-5 overflow-hidden">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 ml-1">Business Name</label>
                           <input required type="text" value={form.bizName} onChange={e => setForm({...form, bizName: e.target.value})} placeholder="Elite Luxe" className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 ml-1">WhatsApp Number</label>
                           <div className="flex gap-3">
                              <CountrySelector value={countryCode} onChange={setCountryCode} />
                              <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="808 000 0000" className="flex-1 w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-800" />
                           </div>
                        </div>
                      </motion.div>
                    )}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 ml-1">Email Address</label>
                       <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 ml-1">Password</label>
                      <div className="relative">
                        <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-5 py-4 rounded-xl outline-none font-bold text-sm transition-all placeholder:text-slate-800" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-500 transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading !== null} className="w-full mt-6 py-5 bg-white text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all duration-500 flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] disabled:opacity-50 group">
                      {loading === "email" ? <Loader2 className="animate-spin" size={20} /> : (
                        <><span>{mode === "signup" ? "Create Account" : "Enter Dashboard"}</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                    <MessageSquare size={32} className="text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase italic">Check your email.</h2>
                  <p className="text-slate-400 font-medium text-sm mb-12 leading-relaxed">We sent a secure link to <br /><span className="text-white font-bold">{form.email}</span></p>
                  <button onClick={() => {setStep("form"); setMode("login")}} className="w-full py-5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all">Back to Login</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}