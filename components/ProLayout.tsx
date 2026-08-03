"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProSidebar } from "./ProSidebar";
import { OnboardingModal } from "./OnboardingModal";
import { LayoutGrid, Edit3, Sliders, MoreHorizontal } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";

export function ProLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07110d] text-slate-900 dark:text-white flex flex-col lg:flex-row font-sans transition-colors duration-300 relative selection:bg-emerald-500/30">
      {/* Onboarding Wizard Modal */}
      <OnboardingModal />

      {/* Sidebar Navigation */}
      <ProSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-0">
        {/* Content Section */}
        <main className="flex-1 flex flex-col p-4 md:p-8 animate-fade-in">
           {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation Bar (Figma Design Match - Adaptive Theme) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around bg-white/95 dark:bg-[#0b1c15]/90 backdrop-blur-xl border border-slate-200/80 dark:border-emerald-500/20 py-3 px-6 rounded-full shadow-2xl shadow-slate-300/40 dark:shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <Link
          href="/pro"
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            pathname === "/pro" ? "text-emerald-600 dark:text-[#00c885] scale-110" : "text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <LayoutGrid size={20} />
          {pathname === "/pro" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00c885]" />}
        </Link>

        <Link
          href="/business"
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            pathname === "/business" ? "text-emerald-600 dark:text-[#00c885] scale-110" : "text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Edit3 size={20} />
          {pathname === "/business" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00c885]" />}
        </Link>

        <Link
          href="/account"
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            pathname === "/account" ? "text-emerald-600 dark:text-[#00c885] scale-110" : "text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Sliders size={20} />
          {pathname === "/account" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00c885]" />}
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}


