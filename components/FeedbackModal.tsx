"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users } from "lucide-react";
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
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className="relative w-full h-full bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col border-0 md:border-x border-slate-100 dark:border-white/10"
          >
            {/* Handle bar (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg shadow-black/10">
                   <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                    SwiftLink Social
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Live Community Hub
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Feed</span>
                </div>
                <button
                  onClick={() => setFeedbackOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-hidden bg-[#f2f2f7] dark:bg-black">
              <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
                <SocialHub
                  storeId={state.id || "swiftlink"}
                  accentColor={state.accentColor}
                  defaultTab="feed"
                />
              </div>
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
