"use client";

import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";

export function LauncherView() {
  const { copyShopLink, copyTrackingPortalLink, handleSignOut } = useSwiftLink();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="mb-10 text-center animate-fade-in-up">
        <img
          src="/logo.svg"
          className="w-20 h-20 mx-auto mb-4 drop-shadow-xl"
          alt="Logo"
          width={80}
          height={80}
        />
        <span className="text-3xl font-black tracking-tight text-slate-900 block leading-none">
          SwiftLink<span className="text-emerald-500">Pro</span>
        </span>
        <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">
          Business Command Center
        </p>
      </div>

      <div className="w-full max-w-md grid gap-6 animate-fade-in-up">
        <div className="relative">
          <Link
            href="/business"
            id="tour-business"
            className="bg-white text-slate-900 border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-sm active:scale-95 transition-all relative overflow-hidden group cursor-pointer h-48 flex flex-col justify-end hover:border-emerald-500 hover:shadow-emerald-100/50 block"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <i className="fas fa-store text-4xl mb-3 block text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-40 block mb-1">
                Configuration
              </span>
              <h2 className="text-2xl font-black tracking-tight leading-none uppercase">
                Set up Business
              </h2>
            </div>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              copyShopLink();
            }}
            className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-full flex items-center justify-center transition-colors z-20"
            aria-label="Copy shop link"
          >
            <i className="fas fa-link text-xs" />
          </button>
        </div>

        <div className="relative">
          <Link
            href="/dispatch"
            id="tour-dispatch"
            className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 active:scale-95 transition-all relative overflow-hidden group cursor-pointer h-48 flex flex-col justify-end block"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <i className="fas fa-truck-fast text-4xl mb-3 block text-white/90" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-1">
                Operations
              </span>
              <h2 className="text-2xl font-black tracking-tight leading-none uppercase">
                Dispatch Item
              </h2>
            </div>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              copyTrackingPortalLink();
            }}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center z-20"
            aria-label="Copy portal link"
          >
            <i className="fas fa-link text-white text-xs" />
          </button>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center space-y-4">
        <a
          href="https://wa.me/2348085741430?text=Hi, I have a feedback about SwiftLink..."
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-emerald-500 font-bold text-[9px] uppercase tracking-widest transition-colors"
        >
          <i className="fas fa-comment-dots mr-1" /> Send Feedback
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:text-red-400 transition-colors"
        >
          Sign Out / Reset
        </button>
      </div>
    </div>
  );
}
