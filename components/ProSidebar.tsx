"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Menu, X, LayoutDashboard, Store, Truck, BarChart3, Settings, LogOut, Link as LinkIcon, MessageSquare, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProSidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { copyShopLink, copyTrackingPortalLink, handleSignOut, state, startTour } = useSwiftLink();
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
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "flex flex-col border-slate-200 bg-white transition-all duration-300 ease-in-out max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-0 max-lg:z-50 max-lg:w-72 max-lg:shadow-2xl lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:border-r overflow-hidden",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          isHovered ? "lg:w-64" : "lg:w-20"
        )}
      >
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 h-20 shrink-0 overflow-hidden bg-slate-50/50">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
             {state.bizImage ? <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> : <img src="/logo.png" className="w-6 h-6 object-contain" alt="SL" />}
          </div>
          <div className={cn("min-w-0 transition-opacity duration-300", isHovered ? "opacity-100" : "lg:opacity-0")}>
            <span className="text-sm font-black tracking-tight text-slate-900 leading-tight block truncate uppercase italic">
              {state.bizName || "SwiftLink Pro"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-500">
              Control Panel
            </span>
          </div>
        </div>

        <nav className="p-3 flex-1 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <p className={cn("px-3 pt-4 pb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap transition-opacity", isHovered ? "opacity-100" : "lg:opacity-0")}>
            Management
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3.5 py-3 transition-all group relative",
                  active
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-900")} strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300", isHovered ? "opacity-100 translate-x-0" : "lg:opacity-0 lg:-translate-x-4")}>
                  {item.label}
                </span>
                {!isHovered && !active && (
                   <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest z-50">
                      {item.label}
                   </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-1.5 overflow-hidden">
          <p className={cn("px-3 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap transition-opacity", isHovered ? "opacity-100" : "lg:opacity-0")}>
            System
          </p>
          <button
            onClick={copyShopLink}
            data-tour-copy-shop
            className="flex w-full items-center gap-4 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors group"
          >
            <LinkIcon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-500" />
            <span className={cn("whitespace-nowrap transition-opacity duration-300", isHovered ? "opacity-100" : "lg:opacity-0")}>Copy Store Link</span>
          </button>
          
          <button
            onClick={() => { setMobileOpen(false); startTour(); }}
            className="flex w-full items-center gap-4 rounded-xl px-3.5 py-2.5 text-left text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors group"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
               <HelpCircle className="w-3 h-3 text-white" />
            </div>
            <span className={cn("whitespace-nowrap transition-opacity duration-300 font-black uppercase tracking-widest text-[10px]", isHovered ? "opacity-100" : "lg:opacity-0")}>Support Guide</span>
          </button>
        </div>

        <div className="p-3 border-t border-slate-100 h-20 shrink-0 flex items-center overflow-hidden">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl px-3.5 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 overflow-hidden",
              isHovered ? "bg-red-50 text-red-600 hover:bg-red-100" : "text-slate-400 hover:text-red-600"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={cn("whitespace-nowrap transition-opacity duration-300", isHovered ? "opacity-100" : "lg:opacity-0")}>Exit Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
