"use client";

import { useMemo } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] w-[90%] max-w-sm">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] border border-emerald-100 reveal">
        <div>
          <div className="flex items-center space-x-4 text-left">
            <div className="w-12 h-12 flex-shrink-0 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <i className="fas fa-magic" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{meta.title}</h3>
              <p className="text-slate-500 font-bold text-[10px] leading-relaxed">
                {meta.desc}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={closeTour}
              className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-400"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={prevTourStep}
              disabled={currentTourStep === 0 || isSimulating}
              className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 disabled:opacity-20"
            >
              Prev
            </button>
          </div>
          <button
            type="button"
            onClick={nextTourStep}
            disabled={isSimulating}
            className={`bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all ${isSimulating ? "opacity-50" : ""}`}
          >
            {isLast ? "Finish" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
}
