"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { TourOverlay } from "@/components/TourOverlay";
import { CartDrawer } from "@/components/CartDrawer";
import { FeedbackModal } from "@/components/FeedbackModal";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { X, Check, AlertTriangle, Globe } from "lucide-react";
import { useState, useEffect } from "react";


export function AppChrome({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<{ 
    title: string, 
    message: string, 
    onConfirm: (val?: string) => void, 
    onCancel: () => void, 
    isPrompt?: boolean,
    confirmLabel?: string,
    cancelLabel?: string
  } | null>(null);
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    (window as any).customConfirm = (title: string, message: string, confirmLabel = "Confirm", cancelLabel = "Cancel") => {
        return new Promise((resolve) => {
            setModal({
                title,
                message,
                confirmLabel,
                cancelLabel,
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
    setFeedbackOpen,
    socialHubOpen,
    setSocialHubOpen
  } = useSwiftLink();

  const showOverlay = loadingOverlay && pathname !== "/";
  const showCustomerCart = !isOwner && !loadingOverlay && !tourOpen;

  return (
    <>
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 bg-[#020617] z-[150] flex flex-col items-center justify-center"
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
                Getting your workspace ready...
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

      <FeedbackModal />

      {children}

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#020617]/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0f172a] rounded-[2rem] w-full max-w-sm overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5"
            >
              <div className="p-10 pb-0 text-center">
                 <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                    <AlertTriangle size={28} />
                 </div>
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3">{modal.title}</h3>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed mb-8">{modal.message}</p>
                 
                 {modal.isPrompt && (
                    <div className="mb-8">
                       <input 
                         autoFocus
                         type="text" 
                         value={promptValue} 
                         onChange={(e) => setPromptValue(e.target.value)}
                         className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-800"
                         onKeyDown={(e) => { if (e.key === 'Enter') modal.onConfirm(promptValue); }}
                       />
                    </div>
                 )}
              </div>
              <div className="p-8 flex gap-4">
                 <button 
                   onClick={modal.onCancel}
                   className="flex-1 py-4 rounded-xl bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                 >
                   {modal.cancelLabel || "Cancel"}
                 </button>
                 <button 
                   onClick={() => modal.onConfirm(modal.isPrompt ? promptValue : undefined)}
                   className="flex-1 py-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                 >
                   {modal.isPrompt ? "Save" : (modal.confirmLabel || "Confirm")}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showCustomerCart && (
        <CartDrawer open={cartOpen} onToggle={toggleCartDrawer} />
      )}

      {/* SOCIAL HUB COMING SOON MODAL */}
      <AnimatePresence>
        {socialHubOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#020617]/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-gradient-to-br from-slate-900 to-[#0b1329] p-10 rounded-[2.5rem] w-full max-w-md text-center border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Decorative backgrounds */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

              <button 
                onClick={() => setSocialHubOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10 animate-bounce">
                <Globe size={36} />
              </div>

              <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">Social Hub</h2>
              <div className="inline-block mt-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full">
                🚧 Building in Public
              </div>

              <p className="mt-6 text-xs text-slate-400 dark:text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto">
                Connect with merchants, share timelines, customize profiles, and build premium merchant communities directly on SwiftLink. Launching in the next major build!
              </p>

              <div className="mt-10 pt-8 border-t border-white/5">
                <button
                  onClick={() => setSocialHubOpen(false)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 active:scale-95 transition-all"
                >
                  Get Notify on Launch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
