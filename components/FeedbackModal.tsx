"use client";

import React, { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Bug, Lightbulb, X, Send, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedbackModal() {
  const { feedbackOpen, setFeedbackOpen, submitFeedback } = useSwiftLink();
  const [type, setType] = useState("bug");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    await submitFeedback(type, message);
    setIsSubmitting(false);
    setMessage("");
  };

  const types = [
    { id: "bug", label: "Bug", icon: Bug, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
    { id: "feature", label: "Idea", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { id: "general", label: "Vibe", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { id: "report", label: "Report", icon: AlertTriangle, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  ];

  return (
    <AnimatePresence>
      {feedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFeedbackOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/10"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Feedback Hub</h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Help us build the future of SwiftLink</p>
                </div>
                <button 
                  onClick={() => setFeedbackOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  {types.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                        type === t.id 
                          ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-white/5" 
                          : "border-transparent bg-slate-50 dark:bg-zinc-800/50 opacity-60 grayscale"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.bg, t.color)}>
                        <t.icon size={20} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === "bug" ? "What broke? Give us the details..." :
                      type === "feature" ? "What should we add next?" :
                      "Tell us what's on your mind..."
                    }
                    className="w-full min-h-[150px] bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] font-bold text-sm outline-none border-2 border-transparent focus:border-slate-100 dark:focus:border-white/10 transition-all resize-none dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Report
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
