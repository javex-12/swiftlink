"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Logo } from "@/components/Logo";
import {
  LayoutGrid,
  MessageSquare,
  Store,
  LineChart,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreSwitcher } from "@/components/StoreSwitcher";
import { effectiveStoreLimitFor } from "@/lib/plans";

// Plan and billing remains hidden behind feature flag
const FEATURE_FLAG_BILLING = false;

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isHelp?: boolean;
}

export function ProSidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { handleSignOut, state, startTour, isAdmin } = useSwiftLink();

  /*
   * The admin console was previously unreachable by design oversight: the route
   * existed and `/pro/admin` was gated server-side, but nothing in the console
   * ever linked to it, so an admin had to guess the URL
   * (docs/05-IMPROVEMENT-PLAN.md R-01). The entry is rendered only for a
   * server-verified admin, and the route stays gated independently — hiding a
   * link is not a security control, it is a usability fix.
   */
  const navItems: NavItem[] = [
    { href: "/pro", label: "Overview", icon: LayoutGrid },
    { href: "/pro/inquiries", label: "Inquiries", icon: MessageSquare },
    { href: "/business", label: "Store editor", icon: Store },
    { href: "/pro/analytics", label: "Analytics", icon: LineChart },
    ...(isAdmin
      ? [{ href: "/pro/admin", label: "Admin", icon: ShieldCheck } satisfies NavItem]
      : []),
    { href: "/account", label: "Settings", icon: Settings },
    { href: "#help", label: "Help", icon: HelpCircle, isHelp: true },
  ];

  const isActive = (href: string) => {
    if (href === "/pro") return pathname === "/pro";
    return pathname.startsWith(href);
  };

  const storeInitials = (state.bizName || "S").slice(0, 1).toUpperCase();

  /*
   * Multi-store was a plan feature with no way in: `StoreSwitcher` existed but
   * was only mounted inside the older BusinessView editor, so a Pro/Business
   * owner sitting in the console had no control to create or switch a store
   * (docs/05-IMPROVEMENT-PLAN.md 3.2). It belongs in the shell, not the editor.
   */
  const canHaveMultipleStores = effectiveStoreLimitFor(state.plan) > 1;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "flex flex-col bg-[#111C18] border-r border-[#1E2D27] text-[#E8F1EC] transition-all duration-300 z-40",
          // Mobile drawer style
          "max-md:fixed max-md:bottom-0 max-md:left-0 max-md:top-0 max-md:w-72 max-md:shadow-2xl",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          // Desktop sidebar style
          "hidden md:flex md:w-64 md:shrink-0 md:min-h-screen md:sticky md:top-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1E2D27] px-6">
          <Link href="/pro" className="flex items-center gap-3">
            <Logo size="md" showWordmark={true} />
          </Link>
        </div>

        {/* Store switcher — quiet, above the nav, only when the plan allows it */}
        {canHaveMultipleStores && (
          <div className="shrink-0 border-b border-[#1E2D27] px-3 py-3">
            <StoreSwitcher />
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            if (item.isHelp) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    startTour();
                  }}
                  className="flex w-full min-h-[44px] items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-sm font-medium text-[#9DB3A8] transition hover:bg-[#14231D] hover:text-[#E8F1EC]"
                >
                  <Icon className="h-5 w-5 shrink-0 text-[#9DB3A8]" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex min-h-[44px] items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[#14231D] text-[#19C37D] font-semibold"
                    : "text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#19C37D]" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    active ? "text-[#19C37D]" : "text-[#9DB3A8]"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Chip & Sign Out */}
        <div className="shrink-0 border-t border-[#1E2D27] p-4">
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#0A1210] p-2.5 border border-[#1E2D27]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14231D] text-xs font-bold text-[#19C37D] border border-[#24382F]">
                {storeInitials}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-medium text-[#E8F1EC]">
                  {state.bizName || "Merchant"}
                </span>
                <span className="block truncate text-[10px] text-[#9DB3A8]">
                  {state.currency || "NGN"} Store
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-8 w-8 min-h-[32px] shrink-0 items-center justify-center rounded-[8px] text-[#9DB3A8] transition hover:bg-[#14231D] hover:text-[#FF8A8A]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
