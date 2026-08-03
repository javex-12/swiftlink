"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Zap, Globe, Smartphone,
  CheckCircle2, AlertCircle, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountPage() {
  const { user, isSupabaseActive, authSignOut, handleSignOut, state, updateState, addToast } =
    useSwiftLink();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = `${user.id}/profile/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
    if (error) { addToast('Upload failed: ' + error.message, 'error'); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);
    updateState('bizImage', publicUrl);
    addToast('Profile picture updated!', 'success');
    setUploadingAvatar(false);
  };



  const authLabel = useMemo(() => {
    if (!isSupabaseActive) return "Offline mode (Supabase not configured)";
    if (!user) return "Connecting…";
    return user.email ? `${user.email}` : "Signed in";
  }, [isSupabaseActive, user]);

  const stats = [
    { label: "Active Products", value: state.products.length, icon: Zap, color: "text-emerald-500" },
    { label: "Total Deliveries", value: state.deliveries.length, icon: Smartphone, color: "text-blue-500" },
    { label: "Public Status", value: state.isLive ? "Live" : "Paused", icon: Globe, color: state.isLive ? "text-emerald-500" : "text-amber-500" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black px-4 md:px-6 py-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Back Navigation & Header Section */}
        <div>
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/60 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-full text-xs font-black uppercase tracking-widest transition-all mb-6 active:scale-95"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                  <div className="flex items-center gap-3">
                      <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Settings</h1>
                      {state.plan === "pro" && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase tracking-widest shadow-lg shadow-emerald-500/20">Pro</span>
                      )}
                  </div>
                  <p className="text-slate-400 dark:text-zinc-500 font-bold text-sm mt-1 uppercase tracking-widest">Manage your global merchant preferences.</p>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar Column */}
            <div className="lg:col-span-1 space-y-6">
                {/* Profile Card */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm text-center">
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <div className="relative w-24 h-24 mx-auto mb-4 group">
                        <label
                          htmlFor="account-avatar-upload"
                          onClick={() => avatarInputRef.current?.click()}
                          className="block w-full h-full rounded-[2rem] bg-slate-100 dark:bg-black border-2 border-slate-50 dark:border-white/5 overflow-hidden shadow-inner cursor-pointer relative"
                        >
                            {state.bizImage ? <img src={state.bizImage} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full flex items-center justify-center"><User size={32} className="text-slate-300" /></div>}
                            <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center rounded-[2rem] transition-opacity", uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                {uploadingAvatar ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={20} className="text-white" />}
                            </div>
                        </label>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 pointer-events-none">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Tap to change photo</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tight truncate">{state.bizName || "New Merchant"}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1 mb-6">{authLabel}</p>
                    
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-50 dark:border-white/5 pt-6">
                        {stats.map(s => (
                            <div key={s.label}>
                                <p className="text-[10px] font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plan Status */}
                <div className={cn(
                    "p-8 rounded-[2.5rem] relative overflow-hidden group transition-all",
                    state.plan === 'pro' ? "bg-slate-900 dark:bg-white text-white dark:text-black" : "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20"
                )}>
                    <div className="relative z-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1">Your Plan</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-2xl font-black italic uppercase">{state.plan === 'pro' ? 'Pro Unlimited' : 'Starter Pack'}</h2>
                        </div>
                        <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-6">
                            {state.plan === 'pro' 
                                ? "You have full access to all premium features and custom branding."
                                : "Upgrade to Pro for custom domains and unlimited product catalogs."
                            }
                        </p>
                        <button className={cn(
                            "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                            state.plan === 'pro' ? "bg-white/10 dark:bg-black/5 hover:bg-white/20" : "bg-white text-emerald-600 hover:scale-105"
                        )}>
                            {state.plan === 'pro' ? 'Manage Subscription' : 'Upgrade Now'}
                        </button>
                    </div>
                    <Zap size={100} className="absolute -bottom-6 -right-6 opacity-10 rotate-12" />
                </div>
            </div>

            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Identity Settings */}
                <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-black flex items-center justify-center text-slate-400">
                            <User size={18} />
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">Store Identity</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Full Name (Owner)</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <User size={14} className="text-slate-300 dark:text-zinc-700" />
                                    <input 
                                        type="text" 
                                        value={state.ownerName || ""} 
                                        onChange={(e) => updateState("ownerName", e.target.value)}
                                        placeholder="e.g. Michael Dosunmu"
                                        className="bg-transparent flex-1 font-black text-xs outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Store / Brand Name</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <Globe size={14} className="text-slate-300 dark:text-zinc-700" />
                                    <input 
                                        type="text" 
                                        value={state.bizName || ""} 
                                        onChange={(e) => updateState("bizName", e.target.value)}
                                        placeholder="e.g. CyderStore"
                                        className="bg-transparent flex-1 font-black text-xs outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Store Slug (Custom Link)</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-slate-300 dark:text-zinc-700">swiftlink.so/</span>
                                    <input 
                                        type="text" 
                                        value={state.storeUsername || ""} 
                                        onChange={(e) => updateState("storeUsername", e.target.value)}
                                        placeholder="your-brand"
                                        className="bg-transparent flex-1 font-black text-xs outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <Smartphone size={14} className="text-slate-300 dark:text-zinc-700" />
                                    <input 
                                        type="tel" 
                                        value={state.phone || ""} 
                                        onChange={(e) => updateState("phone", e.target.value)}
                                        className="bg-transparent flex-1 font-black text-xs outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-950/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="text-red-500" size={20} />
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-red-900 dark:text-red-200">Danger Zone</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => void authSignOut()}
                            className="flex-1 px-6 py-4 bg-white dark:bg-black border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                        >
                            Log Out
                        </button>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all"
                        >
                            Reset System (Clear Device)
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <div className="text-center pb-10">
            <Link
              href="/pro"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors"
            >
              Back to Command Center
            </Link>
        </div>
      </div>
    </main>
  );
}

