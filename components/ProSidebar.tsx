"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Menu, X, LayoutDashboard, Store, Truck, BarChart3, Settings, LogOut, Link as LinkIcon, MessageSquare, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProSidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { copyShopLink, copyTrackingPortalLink, handleSignOut, state, startTour } = useSwiftLink();

  const navItems = [
    { href: "/pro", label: "Dashboard", icon: LayoutDashboard },
    { href: "/business", label: "Store Editor", icon: Store },
    { href: "/dispatch", label: "Logistics", icon: Truck },
    { href: "/pro/analytics", label: "Analytics", icon: BarChart3 },
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
        className={cn(
          "flex flex-col border-slate-200 bg-white/98 backdrop-blur-md transition-transform duration-300 ease-out max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-14 max-lg:z-50 max-lg:w-[min(20rem,88vw)] max-lg:shadow-xl lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 lg:border-r",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
             {state.bizImage ? <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> : <span className="font-black text-xs">SL</span>}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-black tracking-tight text-slate-900 leading-tight block truncate">
              {state.bizName || "SwiftLink Pro"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Command Center
            </span>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-3 pt-2 pb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all group",
                  active
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-900")} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Connections
          </p>
          <button
            onClick={copyShopLink}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors group"
          >
            <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
            Copy Shop Link
          </button>
          <button
            onClick={copyTrackingPortalLink}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors group"
          >
            <Truck className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
            Tracking Portal
          </button>
          <a
            href={`https://wa.me/${state.phone || "2348085741430"}?text=Hi, I have a feedback about SwiftLink...`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors group"
          >
            <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
            Support Hub
          </a>
          <button
            onClick={() => { setMobileOpen(false); startTour(); }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-colors group border border-emerald-100/50"
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            Restart Tutorial
          </button>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </aside>
    </>
  );
}
