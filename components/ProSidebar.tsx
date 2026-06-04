"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Menu, X, LayoutDashboard, Store, Truck, BarChart3, Settings, LogOut, Link as LinkIcon, MessageSquare, HelpCircle, Sun, Moon, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProSidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { copyShopLink, copyTrackingPortalLink, handleSignOut, state, startTour, theme, toggleTheme, setFeedbackOpen } = useSwiftLink();
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { href: "/pro", label: "Dashboard", icon: LayoutDashboard },
    { href: "/business", label: "Store Editor", icon: Store },
    { href: "/dispatch", label: "Logistics", icon: Truck },
    { href: "/pro/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/account", label: "Account", icon: Settings },
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
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "flex flex-col border-slate-100 dark:border-white/[0.03] bg-white dark:bg-black transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-0 max-lg:z-50 max-lg:w-72 max-lg:shadow-2xl lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:border-r overflow-hidden",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          isHovered ? "lg:w-64" : "lg:w-20"
        )}
      >
        <div className="p-6 flex items-center gap-4 h-24 shrink-0">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black shadow-2xl overflow-hidden shrink-0 transition-transform group-hover:scale-105">
             {state.bizImage ? <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> : <img src="/logo.png" className="w-6 h-6 object-contain" alt="SL" />}
          </div>
          <div className={cn("min-w-0 transition-all duration-500", isHovered ? "opacity-100 translate-x-0" : "lg:opacity-0 lg:-translate-x-4")}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.1em] text-black dark:text-white truncate uppercase">
                {state.bizName || "SwiftLink Pro"}
              </span>
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-emerald-500 mt-0.5 block">
              Secure Node
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <p className={cn("px-4 pb-4 text-[7px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-800 whitespace-nowrap transition-opacity", isHovered ? "opacity-100" : "lg:opacity-0")}>
            Workspace
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all group relative cursor-pointer",
                  active
                    ? "bg-slate-50 dark:bg-white/[0.05] text-black dark:text-white"
                    : "text-slate-400 hover:text-black dark:hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-emerald-500" : "text-slate-300 dark:text-slate-800 group-hover:text-black dark:group-hover:text-white")} strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500", isHovered ? "opacity-100 translate-x-0" : "lg:opacity-0 lg:-translate-x-8")}>
                  {item.label}
                </span>
                {active && !isHovered && (
                   <div className="absolute right-0 w-1 h-5 bg-emerald-500 rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/[0.03] space-y-2 overflow-hidden bg-slate-50/30 dark:bg-white/[0.01]">
          <button
            onClick={copyShopLink}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all hover:bg-white dark:hover:bg-white/[0.05] group cursor-pointer"
          >
            <LinkIcon className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-800 group-hover:text-emerald-500" />
            <span className={cn("text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 transition-opacity duration-500", isHovered ? "opacity-100" : "lg:opacity-0")}>Link Node</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all hover:bg-white dark:hover:bg-white/[0.05] group cursor-pointer"
          >
            {theme === "light" ? <Moon className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-blue-500" /> : <Sun className="w-4 h-4 shrink-0 text-yellow-500" />}
            <span className={cn("text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 transition-opacity duration-500", isHovered ? "opacity-100" : "lg:opacity-0")}>
               Appearance
            </span>
          </button>
        </div>

        <div className="p-4 h-24 shrink-0 flex items-center overflow-hidden border-t border-slate-100 dark:border-white/[0.03]">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-all active:scale-95 overflow-hidden cursor-pointer",
              isHovered ? "bg-red-500/5 text-red-500 hover:bg-red-500/10" : "text-slate-300 dark:text-slate-800 hover:text-red-500"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] transition-opacity duration-500", isHovered ? "opacity-100" : "lg:opacity-0")}>Terminate</span>
          </button>
        </div>
      </aside>
    </>
  );
}