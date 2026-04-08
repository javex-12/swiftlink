"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { TourOverlay } from "@/components/TourOverlay";
import { CartDrawer } from "@/components/CartDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingRoute = pathname === "/" || pathname === "/signup";
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

  const showOverlay = loadingOverlay && !isLandingRoute;
  const showCustomerCart =
    !isOwner && !loadingOverlay && !tourOpen && cartItemCount > 0;

  return (
    <>
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 bg-slate-900 z-[150] flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
              <img
                src="/logo.png"
                alt="SwiftLink"
                className="w-32 h-32 relative z-10 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                width={128}
                height={128}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <h2 className="text-white text-xl font-black tracking-[0.2em] uppercase italic">SwiftLink<span className="text-emerald-500">Pro</span></h2>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 animate-pulse">
                Initializing Command Center
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
