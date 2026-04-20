"use client";

import { useMemo } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_STEP_META = [
  {
    title: "Welcome",
    desc: "SwiftLink Pro is your Command Center. We'll show you how it works.",
  },
  {
    title: "1. Business identity",
    desc: "First, give your store a name and a WhatsApp number.",
  },
  {
    title: "2. Add products",
    desc: "Add items to your inventory so customers can shop.",
  },
  {
    title: "3. Share store link",
    desc: "Tap the link icon to copy your shop link. Click it now!",
  },
  {
    title: "4. Create a dispatch",
    desc: "Sold something? Fill the dispatch form instantly.",
  },
  {
    title: "All set",
    desc: "You're ready to build and share your storefront.",
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

  const meta = useMemo(
    () => TOUR_STEP_META[currentTourStep],
    [currentTourStep],
  );

  if (!tourOpen || !meta) return null;

  const isLast = currentTourStep >= TOUR_STEP_META.length - 1;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] w-[95%] max-w-md">
      <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 reveal relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div>
          <div className="flex items-start space-x-5 text-left relative z-10">
            <div className="w-14 h-14 flex-shrink-0 bg-white/5 rounded-[1.25rem] flex items-center justify-center border border-white/10 shadow-inner">
              <img src="/logo.png" className="w-8 h-8 object-contain" alt="SwiftLink" />
            </div>
            <div className="pt-1">
              <h3 className="text-base font-black text-white italic uppercase tracking-tight">{meta.title}</h3>
              <p className="text-slate-400 font-bold text-xs leading-relaxed mt-1">
                {meta.desc}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/5 relative z-10">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={closeTour}
              className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={prevTourStep}
              disabled={currentTourStep === 0 || isSimulating}
              className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-emerald-400 disabled:opacity-20 transition-colors"
            >
              Back
            </button>
          </div>
          <button
            type="button"
            onClick={nextTourStep}
            disabled={isSimulating}
            className={`bg-emerald-500 text-white px-7 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 ${isSimulating ? "opacity-50 cursor-wait" : "hover:bg-emerald-400"}`}
          >
            {isSimulating && <RefreshCw size={12} className="animate-spin" />}
            {isLast ? "Launch Center" : "Continue"}
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 mt-6">
           {TOUR_STEP_META.map((_, i) => (
             <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === currentTourStep ? "w-6 bg-emerald-500" : "w-1.5 bg-white/10")} />
           ))}
        </div>
      </div>
    </div>
  );
}
