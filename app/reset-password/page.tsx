"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/signup?mode=login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null as any);
    }
  };

  return (
    <main className="min-h-screen bg-[#080d18] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-8 shadow-2xl">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Shield size={24} className="text-emerald-400" />
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-2 italic uppercase tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400 text-center mb-8">Secure your account with a strong password.</p>

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-6">
                <CheckCircle2 size={32} className="mx-auto mb-3" />
                <p className="font-bold">Password updated successfully!</p>
                <p className="text-[10px] mt-1 opacity-70 tracking-widest uppercase">Redirecting to login...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-[11px] font-bold">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 text-white placeholder:text-slate-600 px-4 pr-11 py-4 rounded-xl outline-none transition-all font-bold text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <>Update Password <ArrowRight size={17} /></>}
              </button>
            </form>
          )}
        </div>
        
        <div className="text-center mt-8">
           <Link href="/signup?mode=login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-400 transition-colors">Return to login</Link>
        </div>
      </div>
    </main>
  );
}
