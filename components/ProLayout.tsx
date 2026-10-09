"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProSidebar } from "./ProSidebar";
import { OnboardingModal } from "./OnboardingModal";
import { Logo } from "./Logo";
import { LayoutGrid, MessageSquare, Store, LineChart, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { StoreSwitcher } from "./StoreSwitcher";
import { effectiveStoreLimitFor } from "@/lib/plans";

export function ProLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isAdmin, state } = useSwiftLink();
  const canHaveMultipleStores = effectiveStoreLimitFor(state.plan) > 1;

  // Close sidebar drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Admins get a sixth tab so the console is reachable from a phone too; every
  // other account sees the original five (docs/05-IMPROVEMENT-PLAN.md R-01).
  const mobileNavItems = [
    { href: "/pro", label: "Home", icon: LayoutGrid, matchExact: true },
    { href: "/pro/inquiries", label: "Inquiries", icon: MessageSquare, matchExact: false },
    { href: "/business", label: "Store", icon: Store, matchExact: false },
    { href: "/pro/analytics", label: "Stats", icon: LineChart, matchExact: false },
    ...(isAdmin
      ? [{ href: "/pro/admin", label: "Admin", icon: ShieldCheck, matchExact: false }]
      : []),
    { href: "/account", label: "Settings", icon: Settings, matchExact: false },
  ];

  const isTabActive = (item: typeof mobileNavItems[0]) => {
    if (item.href === "/pro") {
      return pathname === "/pro" || pathname === "/";
    }
    if (item.matchExact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-[#0A1210] text-[#E8F1EC] flex flex-col md:flex-row font-sans selection:bg-[#19C37D]/30">
      {/* Onboarding Wizard Modal */}
      <OnboardingModal />

      {/* Desktop Sidebar & Mobile Drawer */}
      <ProSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area: Padding bottom accounts for bottom bar height + safe area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* Mobile Header (<768px) with shared Logo */}
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#1E2D27] bg-[#111C18]/95 px-4 backdrop-blur-md">
          <Link href="/pro" className="flex shrink-0 items-center gap-2">
            <Logo size="sm" showWordmark={true} />
          </Link>
          {/* Multi-store switching was unreachable from a phone. */}
          {canHaveMultipleStores && (
            <div className="min-w-0">
              <StoreSwitcher />
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (<768px) with 44px Minimum Touch Targets & Non-Shifting Indicator */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around bg-[#111C18]/95 backdrop-blur-xl border-t border-[#1E2D27] px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] shadow-2xl"
      >
        {mobileNavItems.map((item) => {
          const active = isTabActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] flex-1 py-1.5 transition-colors",
                active ? "text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              )}
            >
              {/* Absolute top indicator bar: does NOT shift label or icon layout */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-[#19C37D]" />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              <span className="mt-1 text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
