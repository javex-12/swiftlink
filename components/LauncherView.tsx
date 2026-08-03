"use client";

import { useState } from "react";
import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ChevronDown, ArrowRight, Sun, Moon, ExternalLink, Link as LinkIcon, Settings, Shield } from "lucide-react";
import { cn, getSmartFirstName } from "@/lib/utils";

export function LauncherView() {
  const { copyShopLink, state, theme, toggleTheme, user } = useSwiftLink();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Real Data Calculations
  const activeSKUs = state.products.length;
  const inTransit = state.deliveries.filter(d => d.status === "dispatched").length;

  // Smart first name extraction (e.g. "michaeldosunmu22@gmail.com" -> "Michael")
  const firstName = getSmartFirstName(state.ownerName, user?.email, state.bizName);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 min-h-screen transition-colors duration-300">
      {/* ─── Top Header Row ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          {/* Logo on Mobile */}
          <img src="/logo.png" className="w-8 h-8 object-contain lg:hidden shrink-0" alt="SwiftLink" />
          <div>
            <h2 className="font-serif-luxury italic text-base sm:text-lg text-slate-400 dark:text-slate-300 leading-none">
              Welcome
            </h2>
            <h1 className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-[#00c885] tracking-tight leading-tight">
              {firstName}
            </h1>
          </div>
        </div>

        {/* Right Top Controls */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Toggle Pill */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[#d9b138] text-[#07110d] flex items-center justify-center font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-transform"
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={18} className="fill-[#07110d]" /> : <Sun size={18} />}
          </button>

          {/* Avatar Pill Button */}
          <Link
            href="/account"
            className="w-10 h-10 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-lg overflow-hidden hover:scale-105 active:scale-95 transition-transform"
            title="Account Settings"
          >
            {state.bizImage ? (
              <img src={state.bizImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>👨‍🚀</span>
            )}
          </Link>
        </div>
      </header>

      {/* ─── Main Grid Layout (Figma Desktop & Mobile Match) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        
        {/* Left Side: Store Name & Editor Action Pill Pair */}
        <div className="lg:col-span-6 space-y-2.5 sm:space-y-3">
          <div className="inline-block bg-amber-500/10 text-amber-600 dark:bg-[#2a240c] dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-[0.2em] uppercase">
            {state.plan ? `${state.plan.toUpperCase()} PLAN` : "FREE PLAN"}
          </div>

          <h1 className="font-brand-header text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-[1.05] break-words">
            {state.bizName || "MY STORE"}
          </h1>

          {/* Button Group: EDITOR + Caret Dropdown Pair */}
          <div className="relative inline-flex items-center gap-2 pt-1">
            <Link
              href="/business"
              className="bg-emerald-500 dark:bg-[#00c885] hover:bg-emerald-600 dark:hover:bg-[#00b377] text-white dark:text-[#07110d] font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              EDITOR
            </Link>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-emerald-500 dark:bg-[#00c885] hover:bg-emerald-600 dark:hover:bg-[#00b377] text-white dark:text-[#07110d] p-4 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95"
              aria-label="Store options"
            >
              <ChevronDown size={18} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
            </button>

            {/* Quick Actions Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-3 w-56 bg-white dark:bg-[#0e251b] border border-slate-200 dark:border-emerald-500/20 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { copyShopLink(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <LinkIcon size={14} className="text-emerald-500" /> Copy Store Link
                </button>
                <Link
                  href="/dispatch"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ArrowRight size={14} className="text-amber-500" /> Logistics Hub
                </Link>
                <Link
                  href="/account"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Settings size={14} className="text-blue-500" /> Store Settings
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 2 Big Curved Green Cards (STOREFRONT & LOGISTICS) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: STOREFRONT */}
          <Link
            href="/business"
            className="block bg-white dark:bg-[#0e251b] border border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500/40 rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative overflow-hidden group transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-brand-header text-2xl sm:text-3xl font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                  STOREFRONT
                </h3>
                <p className="text-amber-600 dark:text-amber-400 font-bold italic tracking-widest text-xs uppercase mt-1">
                  LIVE PRODUCT
                </p>
              </div>
            </div>

            <div className="border-b border-slate-100 dark:border-white/10 my-6" />

            <div className="flex items-end justify-between">
              <span className="text-6xl sm:text-7xl font-black text-emerald-600 dark:text-[#00c885] tracking-tight">
                {activeSKUs}
              </span>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-white group-hover:bg-emerald-500/10 group-hover:translate-x-1 transition-all">
                <ArrowRight size={24} />
              </div>
            </div>
          </Link>

          {/* Card 2: LOGISTICS */}
          <Link
            href="/dispatch"
            className="block bg-white dark:bg-[#0e251b] border border-slate-200 dark:border-emerald-500/20 hover:border-amber-500/40 rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative overflow-hidden group transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-brand-header text-2xl sm:text-3xl font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                  LOGISTICS
                </h3>
                <p className="text-amber-600 dark:text-amber-400 font-bold italic tracking-widest text-xs uppercase mt-1">
                  ACTIVE ORDERS
                </p>
              </div>
            </div>

            <div className="border-b border-slate-100 dark:border-white/10 my-6" />

            <div className="flex items-end justify-between">
              <span className="text-6xl sm:text-7xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                {inTransit}
              </span>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-amber-500 dark:group-hover:text-white group-hover:bg-amber-500/10 group-hover:translate-x-1 transition-all">
                <ArrowRight size={24} />
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
