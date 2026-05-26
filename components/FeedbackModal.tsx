"use client";

import { useRouter } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, LogOut } from "lucide-react";
import { SocialHub } from "./SocialHub";

export function FeedbackModal() {
  const { feedbackOpen, setFeedbackOpen, state } = useSwiftLink();
  const router = useRouter();

  const handleLogout = () => {
    setFeedbackOpen(false);
    router.push("/pro");
  };

  return (
    <AnimatePresence>
      {feedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleLogout}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Sheet / Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className="relative w-full h-full bg-white dark:bg-black shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Close Button — Floating over the SocialHub header */}
            <button
              onClick={handleLogout}
              className="fixed top-4 right-6 z-[60] px-4 py-2 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 border border-white/10"
            >
              <span className="text-xs font-black uppercase tracking-widest hidden md:block">Logout</span>
              <LogOut size={16} />
            </button>

            {/* Body — No internal padding, full screen */}
            <div className="flex-1 overflow-hidden">
               <SocialHub
                  storeId={state.id || "swiftlink"}
                  accentColor={state.accentColor}
                  defaultTab="feed"
                  onBack={handleLogout}
                />
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
