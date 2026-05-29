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

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <main className="min-h-screen bg-[#020617] flex relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Visual background decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.08)_0%,transparent_40%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.08)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      {/* Brand Side: Large Screen only */}
      <div className="hidden lg:flex flex-col justify-between w-[50%] p-24 xl:p-32 relative z-10 border-r border-white/[0.03] bg-gradient-to-b from-[#020617] to-[#01040f]">
        <div className="relative group">
           <Link href="/" className="flex items-center gap-4 transition-transform hover:scale-105">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(255,255,255,0.1)] group-hover:rotate-3 transition-all duration-500">
                <img src="/logo.png" alt="SwiftLink" className="w-8 h-8" />
              </div>
              <span className="text-3xl font-black text-white tracking-tighter uppercase italic">SwiftLink<span className="text-emerald-500 not-italic ml-1">PRO</span></span>
           </Link>
        </div>

        <div className="max-w-2xl">
           <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
             <h1 className="text-7xl xl:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-12">
               YOUR STORE.<br />YOUR RULES.<br /><span className="text-emerald-500 italic">ON WHATSAPP.</span>
             </h1>
             <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
               Join thousands of modern business owners scaling their brands with SwiftLink.
             </p>
           </motion.div>
           
           <div className="mt-20 flex items-center gap-16">
              <div>
                 <p className="text-5xl font-black text-white italic tracking-tighter mb-1">60s</p>
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Getting Ready</p>
              </div>
              <div className="w-px h-12 bg-white/5" />
              <div>
                 <p className="text-5xl font-black text-white italic tracking-tighter mb-1">Zero</p>
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Extra Fees</p>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-4 opacity-30">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <p className="text-[10px] text-white font-black uppercase tracking-[0.5em] leading-none">Global Network • Always Online</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-20 relative z-10">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-16">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-6 h-6" />
             </div>
             <span className="text-xl font-black text-white tracking-tighter uppercase italic">SwiftLink</span>
          </div>

          <div className="mb-14 text-center lg:text-left">
             <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4 uppercase italic">
               {mode === "signup" ? "Get Started" : "Welcome Back"}
             </h2>
             <p className="text-slate-400 font-medium text-base">
               {mode === "signup" ? "Start selling to your customers today." : "Log in to manage your business."}
             </p>
          </div>

          <div className="space-y-12">
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08]">
               {(["signup", "login"] as Mode[]).map((m) => (
                 <button key={m} onClick={() => {setMode(m); setError(null);}} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all ${mode === m ? "bg-white text-slate-900 shadow-[0_10px_30px_rgba(255,255,255,0.1)]" : "text-slate-500 hover:text-slate-300"}`}>
                   {m === "signup" ? "Create Account" : "Log In"}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-10">
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
                    <span className="relative px-6 bg-[#020617] text-[9px] font-black uppercase text-slate-700 tracking-[0.5em]">OR USE EMAIL</span>
                  </div>

                  {error && (
                    <motion.div initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="flex gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                       <AlertCircle size={20} className="text-red-500 shrink-0" />
                       <p className="text-[12px] font-bold text-red-500 italic leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                  
                  <form onSubmit={handleEmailAuth} className="space-y-6">
                    {mode === "signup" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6 overflow-hidden">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Business Name</label>
                           <input required type="text" value={form.bizName} onChange={e => setForm({...form, bizName: e.target.value})} placeholder="e.g. Emerald Luxe" className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-6 py-5 rounded-2xl outline-none font-bold text-base transition-all placeholder:text-slate-800" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">WhatsApp Number</label>
                           <div className="flex gap-4">
                              <CountrySelector value={countryCode} onChange={setCountryCode} />
                              <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="808 000 0000" className="flex-1 w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-6 py-5 rounded-2xl outline-none font-bold text-base transition-all placeholder:text-slate-800" />
                           </div>
                        </div>
                      </motion.div>
                    )}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
                       <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@business.com" className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-6 py-5 rounded-2xl outline-none font-bold text-base transition-all placeholder:text-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
                      <div className="relative">
                        <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-emerald-500/40 text-white px-6 py-5 rounded-2xl outline-none font-bold text-base transition-all placeholder:text-slate-800" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-500 transition-colors">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading !== null} className="w-full mt-10 py-6 bg-white text-slate-900 rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-emerald-500 hover:text-white transition-all duration-500 flex items-center justify-center gap-4 shadow-[0_20px_60px_rgba(255,255,255,0.05)] active:scale-[0.98] disabled:opacity-50 group">
                      {loading === "email" ? <Loader2 className="animate-spin" size={24} /> : (
                        <><span>{mode === "signup" ? "Create Account" : "Enter Dashboard"}</span><ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-emerald-500/20">
                    <MessageSquare size={40} className="text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic">Check your email.</h2>
                  <p className="text-slate-400 font-medium text-base mb-16 leading-relaxed">We sent a secure link to <br /><span className="text-white font-bold">{form.email}</span></p>
                  <button onClick={() => {setStep("form"); setMode("login")}} className="w-full py-6 border border-white/10 text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-white/5 transition-all">Back to Login</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-24 pt-10 border-t border-white/[0.03] flex items-center justify-between">
             <Link href="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 hover:text-emerald-500 transition-colors">Return to Hub</Link>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800">SwiftLink Pro Version 1</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
