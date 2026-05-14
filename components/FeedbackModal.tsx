"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { SocialHub } from "./SocialHub";

export function FeedbackModal() {
  const { feedbackOpen, setFeedbackOpen, state } = useSwiftLink();

  return (
    <AnimatePresence>
      {feedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFeedbackOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Sheet / Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full md:max-w-lg bg-white dark:bg-zinc-950 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100 dark:border-white/10"
          >
            {/* Handle bar (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                  SwiftLink Social
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Reviews · Feedback · Community
                </p>
              </div>
              <button
                onClick={() => setFeedbackOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <SocialHub
                storeId={state.id || "swiftlink"}
                accentColor={state.accentColor}
                defaultTab="report"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
