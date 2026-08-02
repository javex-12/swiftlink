"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { LayoutGrid, Edit3, Truck, LineChart, Sliders, LogOut, HelpCircle, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProSidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { handleSignOut, state, startTour, isAdmin, addToast } = useSwiftLink();
  const [isHovered, setIsHovered] = useState(false);

  const isPremium = state.plan === "pro" || state.plan === "business";

  const sidebarItems = [
    { href: "/pro", label: "Dashboard", icon: LayoutGrid },
    { href: "/business", label: "Store Editor", icon: Edit3 },
    { href: "/dispatch", label: "Logistics", icon: Truck },
    { href: isPremium ? "/pro/analytics" : "#", label: "Analytics", icon: LineChart, locked: !isPremium },
    { href: "/account", label: "Account", icon: Sliders },
    ...(isAdmin ? [{ href: "/pro/admin", label: "Admin Panel", icon: ShieldCheck }] : [])
  ];

  const isActive = (href: string) => {
    if (href === "/pro") return pathname === "/pro";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating Desktop & Mobile Sidebar Pod */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "flex flex-col bg-white/95 dark:bg-[#07130e] border border-slate-200/80 dark:border-emerald-500/10 text-slate-900 dark:text-white transition-all duration-300 ease-in-out overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 backdrop-blur-xl",
          // Mobile drawer style
          "max-lg:fixed max-lg:bottom-4 max-lg:left-4 max-lg:top-4 max-lg:w-64 max-lg:rounded-[2rem]",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-[120%]",
          // Desktop floating column style
          "lg:sticky lg:top-4 lg:my-4 lg:ml-4 lg:h-[calc(100vh-2rem)] lg:rounded-[2rem] lg:shrink-0 lg:translate-x-0",
          isHovered ? "lg:w-60" : "lg:w-20"
        )}
      >
        {/* Logo / Brand Header */}
        <div className="p-4 flex items-center justify-between shrink-0 h-20 border-b border-slate-100 dark:border-white/5">
          <Link href="/pro" className="flex items-center gap-3">
            <img src="/logo.png" className="w-8 h-8 object-contain shrink-0" alt="SwiftLink" />
            <div className={cn("min-w-0 transition-all duration-300", isHovered ? "opacity-100 translate-x-0" : "lg:opacity-0 lg:-translate-x-2")}>
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white block truncate uppercase italic">
                {state.bizName || "My Store"}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-600 dark:text-[#00c885]">
                {state.plan ? `${state.plan.toUpperCase()} PLAN` : "PRO PLAN"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar px-3">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if ((item as any).locked) {
                    e.preventDefault();
                    addToast("Analytics is a premium Pro feature.", "info");
                    return;
                  }
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-3.5 py-3.5 transition-all relative group font-bold",
                  active
                    ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-[#00c885] font-black"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {/* Active Green Pill Bar */}
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-emerald-500 dark:bg-[#00c885] rounded-r-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                )}
                
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", active ? "text-emerald-600 dark:text-[#00c885]" : "text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />
                
                <span className={cn("text-xs whitespace-nowrap transition-all duration-300 flex items-center gap-1.5", isHovered ? "opacity-100 translate-x-0" : "lg:opacity-0 lg:-translate-x-4")}>
                  {item.label}
                  {(item as any).locked && <Lock size={10} className="text-amber-400 shrink-0" />}
                </span>

                {!isHovered && !active && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 dark:bg-[#07130e] text-white border border-slate-700 dark:border-emerald-500/20 text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest z-50 whitespace-nowrap shadow-xl">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 space-y-1">
          <button
            onClick={() => { setMobileOpen(false); startTour(); }}
            className="flex w-full items-center gap-4 rounded-2xl px-3.5 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <HelpCircle className="w-5 h-5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className={cn("text-xs font-bold whitespace-nowrap transition-opacity duration-300", isHovered ? "opacity-100" : "lg:opacity-0")}>
              Help &amp; Guide
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-4 rounded-2xl px-3.5 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
            <span className={cn("text-xs font-bold whitespace-nowrap transition-opacity duration-300", isHovered ? "opacity-100" : "lg:opacity-0")}>
              Log Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}


