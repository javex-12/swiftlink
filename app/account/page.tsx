"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Shield, LogOut, Trash2, ArrowRight, User } from "lucide-react";

export default function AccountPage() {
  const { user, isSupabaseActive, authSignOut, handleSignOut, state } =
    useSwiftLink();

  const authLabel = useMemo(() => {
    if (!isSupabaseActive) return "Offline mode (Supabase not configured)";
    if (!user) return "Connecting…";
    return user.email ? `Signed in as ${user.email}` : "Signed in";
  }, [isSupabaseActive, user]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-10 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {!isSupabaseActive && (
           <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                 <Shield size={24} />
              </div>
              <div className="text-center md:text-left">
                 <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Offline Mode / Supabase Not Setup</h4>
                 <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">To enable Google Sign-in, Asset Uploads, and Public Store Links, please configure your Supabase environment variables in .env.</p>
              </div>
           </div>
        )}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Account
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">{authLabel}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center overflow-hidden shadow border border-slate-100 dark:border-slate-800">
            {state.bizImage ? (
              <img src={state.bizImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <Shield size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Sign in
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Use your SwiftLink account to sync and upload store assets.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup?mode=login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-widest"
              >
                Go to login <ArrowRight size={16} />
              </Link>
              <Link
                href="/signup?mode=signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest"
              >
                Create account <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Session controls
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Sign out keeps local data. Exit session clears local data on this
              device.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => void authSignOut()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest"
              >
                <LogOut size={16} /> Sign out
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 font-black text-[11px] uppercase tracking-widest"
              >
                <Trash2 size={16} /> Exit session (clear device)
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/pro"
              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

