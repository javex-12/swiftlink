"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { RefreshCw, ArrowRight, ArrowLeft, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STEP_META = [
  {
    title: "Welcome to SwiftLink",
    desc: "Your command center for WhatsApp commerce. Let's get you set up in seconds.",
    selector: null,
  },
  {
    title: "Brand Identity",
    desc: "Define your store name and connect your WhatsApp number.",
    selector: "#biz-name",
  },
  {
    title: "Inventory",
    desc: "Add your first product to start taking orders.",
    selector: "[data-tour-add-product]",
  },
  {
    title: "Share & Earn",
    desc: "Copy your unique store link and share it on your WhatsApp Status.",
    selector: "[data-tour-copy-shop]",
  },
  {
    title: "Logistics",
    desc: "Manage your deliveries and track dispatches in real-time.",
    selector: "#disp-name", // Placeholder for dispatch view
  },
];

export function TourOverlay() {
  const {
    tourOpen,
    currentTourStep,
    isSimulating,
    nextTourStep,
    prevTourStep,
    closeTour,
  } = useSwiftLink();

  const [spotlight, setSpotlight] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const meta = useMemo(
    () => TOUR_STEP_META[currentTourStep],
    [currentTourStep],
  );

  useEffect(() => {
    if (!tourOpen || !meta?.selector) {
      setSpotlight(null);
      return;
    }

    const updateSpotlight = () => {
      const el = document.querySelector(meta.selector!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setSpotlight({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    };

    const timer = setTimeout(updateSpotlight, 600);
    window.addEventListener('resize', updateSpotlight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [tourOpen, currentTourStep, meta]);

  if (!tourOpen || !meta) return null;

  const isLast = currentTourStep >= TOUR_STEP_META.length - 1;

  return (
    <>
      {/* Dimmed Backdrop with Spotlight Hole */}
      <div className="fixed inset-0 z-[110] pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-all duration-500"
          style={{
            clipPath: spotlight 
              ? `polygon(0% 0%, 0% 100%, ${spotlight.left}px 100%, ${spotlight.left}px ${spotlight.top}px, ${spotlight.left + spotlight.width}px ${spotlight.top}px, ${spotlight.left + spotlight.width}px ${spotlight.top + spotlight.height}px, ${spotlight.left}px ${spotlight.top + spotlight.height}px, ${spotlight.left}px 100%, 100% 100%, 100% 0%)`
              : 'none'
          }}
        />
      </div>

      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={cn(
            "bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-white/10 w-full max-w-sm pointer-events-auto relative overflow-hidden",
            spotlight ? "mt-[30vh]" : "" // Shift down if spotlighting
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="text-white" size={20} />
               </div>
               <button onClick={closeTour} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight mb-2">
              {meta.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs leading-relaxed">
              {meta.desc}
            </p>

            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
               <div className="flex gap-4">
                  <button
                    disabled={currentTourStep === 0}
                    onClick={prevTourStep}
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all disabled:opacity-30"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1.5 px-2">
                     {TOUR_STEP_META.map((_, i) => (
                       <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === currentTourStep ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-200 dark:bg-slate-800")} />
                     ))}
                  </div>
               </div>
               
               <button
                 onClick={nextTourStep}
                 className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3"
               >
                 {isLast ? "Ready to Launch" : "Continue"}
                 <ArrowRight size={14} />
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
