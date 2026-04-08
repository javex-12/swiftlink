"use client";

import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";

export function LauncherView() {
  const { copyShopLink, copyTrackingPortalLink, handleSignOut } = useSwiftLink();

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl animate-fade-in-up">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                className="h-14 w-14 rounded-2xl drop-shadow-lg"
                alt="Logo"
                width={56}
                height={56}
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  SwiftLink<span className="text-emerald-500">Pro</span>
                </h1>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Business Command Center
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Store
                </p>
                <p className="text-sm font-extrabold text-emerald-600">Live</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Portal
                </p>
                <p className="text-sm font-extrabold text-slate-900">Ready</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Mode
                </p>
                <p className="text-sm font-extrabold text-slate-900">Pro</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
            <div className="relative">
              <Link
                href="/business"
                id="tour-business"
                className="group relative flex h-60 flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-emerald-100/70"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-125" />
                <div className="relative z-10">
                  <i className="fas fa-store text-3xl text-emerald-500" />
                </div>
                <div className="relative z-10">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Configuration
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                    Set up Business
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Update your storefront profile, products, and settings.
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  copyShopLink();
                }}
                className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-500"
                aria-label="Copy shop link"
              >
                <i className="fas fa-link text-xs" />
              </button>
            </div>

            <div className="relative">
              <Link
                href="/dispatch"
                id="tour-dispatch"
                className="group relative flex h-60 flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-300/50 transition-all hover:-translate-y-0.5"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
                <div className="relative z-10">
                  <i className="fas fa-truck-fast text-3xl text-white/90" />
                </div>
                <div className="relative z-10">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Operations
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white leading-none">
                    Dispatch Item
                  </h2>
                  <p className="mt-2 text-sm text-white/70">
                    Process orders and update tracking for your customers.
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  copyTrackingPortalLink();
                }}
                className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Copy portal link"
              >
                <i className="fas fa-link text-xs" />
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
              Quick Actions
            </h3>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={copyShopLink}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span>Copy Shop Link</span>
                <i className="fas fa-up-right-from-square text-xs" />
              </button>
              <button
                type="button"
                onClick={copyTrackingPortalLink}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <span>Copy Tracking Portal</span>
                <i className="fas fa-up-right-from-square text-xs" />
              </button>
              <a
                href="https://wa.me/2348085741430?text=Hi, I have a feedback about SwiftLink..."
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <span>Send Feedback</span>
                <i className="fas fa-comment-dots text-xs" />
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Session
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500 transition-colors hover:text-red-500"
              >
                Sign Out / Reset
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
