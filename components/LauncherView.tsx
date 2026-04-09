"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";

export function LauncherView() {
  const pathname = usePathname();
  const { copyShopLink, copyTrackingPortalLink, handleSignOut } = useSwiftLink();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  const nav = [
    { href: "/pro", label: "Command Center", icon: "fa-gauge-high" },
    { href: "/business", label: "Edit store", icon: "fa-store" },
    { href: "/dispatch", label: "Dispatch", icon: "fa-truck-fast" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <header className="lg:hidden sticky top-0 z-[60] flex items-center justify-between gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
          aria-expanded={mobileNavOpen}
          aria-controls="pro-command-sidebar"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
        >
          {mobileNavOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
        <div className="min-w-0 flex-1 text-center">
          <span className="text-sm font-black tracking-tight text-slate-900 block truncate">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Command Center
          </span>
        </div>
        <div className="w-11 shrink-0" aria-hidden />
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          className="lg:hidden fixed inset-0 top-14 z-40 bg-slate-900/45 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="pro-command-sidebar"
        className={`flex flex-col overflow-y-auto border-slate-200 bg-white/98 backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-14 max-lg:z-50 max-lg:w-[min(20rem,88vw)] max-lg:max-h-[calc(100dvh-3.5rem)] max-lg:shadow-xl max-lg:border-r-0 lg:sticky lg:top-0 lg:z-30 lg:min-h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 lg:border-r lg:shadow-none ${
          mobileNavOpen
            ? "max-lg:translate-x-0"
            : "max-lg:-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-slate-100 relative pr-12 lg:pr-5">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
          <Link
            href="/pro"
            className="flex items-center gap-3 group"
            onClick={() => setMobileNavOpen(false)}
          >
            <img
              src="/logo.png"
              className="w-11 h-11 rounded-xl shadow-md ring-1 ring-slate-100 group-hover:ring-emerald-200 transition-all"
              alt="SwiftLink Pro"
              width={44}
              height={44}
            />
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 leading-tight block">
                SwiftLink<span className="text-emerald-500">Pro</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Command Center
              </span>
            </div>
          </Link>
        </div>

        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigate
          </p>
          {nav.map((item) => {
            const active =
              item.href === "/pro"
                ? pathname === "/pro"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? "bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <i
                  className={`fas ${item.icon} w-5 text-center ${active ? "text-emerald-600" : "text-slate-400"}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Quick actions
          </p>
          <button
            type="button"
            onClick={copyShopLink}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-link w-5 text-center text-slate-400" />
            Copy shop link
          </button>
          <button
            type="button"
            onClick={copyTrackingPortalLink}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-link w-5 text-center text-slate-400" />
            Copy tracking portal
          </button>
          <a
            href="https://wa.me/2348085741430?text=Hi, I have a feedback about SwiftLink..."
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-comment-dots w-5 text-center text-slate-400" />
            Send feedback
          </a>
        </div>

        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <i className="fas fa-arrow-right-from-bracket" />
            Sign out / Reset
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative min-h-0 w-full min-w-0">
        <div className="hidden lg:block mb-10 text-center animate-fade-in-up">
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
      </main>
    </div>
  );
}
