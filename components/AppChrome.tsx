"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { TourOverlay } from "@/components/TourOverlay";
import { CartDrawer } from "@/components/CartDrawer";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const {
    loadingOverlay,
    handHidden,
    handStyle,
    handClick,
    tourOpen,
    isOwner,
    cartItemCount,
    cartOpen,
    toggleCartDrawer,
  } = useSwiftLink();

  const showCustomerCart =
    !isOwner && !loadingOverlay && !tourOpen && cartItemCount > 0;

  return (
    <>
      {loadingOverlay && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col items-center justify-center transition-opacity duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-logo-pulse" />
            <img
              src="/logo.svg"
              alt="Loading..."
              className="w-24 h-24 relative z-10 animate-logo-pulse"
              width={96}
              height={96}
            />
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
            Syncing Command Center
          </p>
        </div>
      )}

      <div
        id="hand-cursor"
        className={`fixed ${handHidden ? "hidden" : ""} top-0 left-0 ${handClick ? "hand-click" : ""}`}
        style={handStyle}
      >
        <i className="fas fa-hand-pointer text-3xl text-yellow-400" />
      </div>

      <TourOverlay />

      {children}

      {showCustomerCart && (
        <CartDrawer open={cartOpen} onToggle={toggleCartDrawer} />
      )}
    </>
  );
}
