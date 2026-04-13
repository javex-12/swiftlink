"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { TourOverlay } from "@/components/TourOverlay";
import { CartDrawer } from "@/components/CartDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { X, Check, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<{ title: string, message: string, onConfirm: (val?: string) => void, onCancel: () => void, isPrompt?: boolean } | null>(null);
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    (window as any).customConfirm = (title: string, message: string) => {
        return new Promise((resolve) => {
            setModal({
                title,
                message,
                onConfirm: () => { setModal(null); resolve(true); },
                onCancel: () => { setModal(null); resolve(false); }
            });
        });
    };

    (window as any).customPrompt = (title: string, message: string, defaultValue = "") => {
        setPromptValue(defaultValue);
        return new Promise((resolve) => {
            setModal({
                title,
                message,
                isPrompt: true,
                onConfirm: (val) => { setModal(null); resolve(val); },
                onCancel: () => { setModal(null); resolve(null); }
            });
        });
    };
  }, []);
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
  const showCustomerCart = !isOwner && !loadingOverlay && !tourOpen;

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

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-8 pb-0 text-center">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight mb-2">{modal.title}</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">{modal.message}</p>
                 
                 {modal.isPrompt && (
                    <div className="mb-6">
                       <input 
                         autoFocus
                         type="text" 
                         value={promptValue} 
                         onChange={(e) => setPromptValue(e.target.value)}
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                         onKeyDown={(e) => { if (e.key === 'Enter') modal.onConfirm(promptValue); }}
                       />
                    </div>
                 )}
              </div>
              <div className="p-8 flex gap-3">
                 <button 
                   onClick={modal.onCancel}
                   className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => modal.onConfirm(modal.isPrompt ? promptValue : undefined)}
                   className="flex-1 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                 >
                   {modal.isPrompt ? "Save" : "Confirm"}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showCustomerCart && (
        <CartDrawer open={cartOpen} onToggle={toggleCartDrawer} />
      )}
    </>
  );
}
