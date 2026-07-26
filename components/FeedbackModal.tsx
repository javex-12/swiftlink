"use client";

import React, { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertTriangle, Lightbulb, MessageSquare, Loader2 } from "lucide-react";

export function FeedbackModal() {
  const { feedbackOpen, setFeedbackOpen, submitFeedback, user } = useSwiftLink();
  const [type, setType] = useState<"bug" | "feature" | "general">("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await submitFeedback(type, message);
      setMessage("");
      setFeedbackOpen(false);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: "bug", label: "Bug Report", icon: AlertTriangle, color: "text-rose-500 border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10" },
    { id: "feature", label: "Feature Request", icon: Lightbulb, color: "text-amber-500 border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10" },
    { id: "general", label: "General Feedback", icon: MessageSquare, color: "text-emerald-500 border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10" }
  ] as const;

  return (
    <AnimatePresence>
      {feedbackOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFeedbackOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white dark:bg-zinc-950 rounded-[2.5rem] w-full max-w-lg border border-slate-100 dark:border-white/5 shadow-2xl p-8 md:p-10 overflow-hidden"
          >
            <button
              onClick={() => setFeedbackOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Send Feedback</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Help us make SwiftLink better.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Picker */}
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">Feedback Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((c) => {
                    const Icon = c.icon;
                    const isSelected = type === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setType(c.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                          isSelected 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white scale-102"
                            : `border-slate-100 dark:border-white/5 text-slate-500 hover:scale-102 ${c.color}`
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[9px] font-black uppercase tracking-tight">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Box */}
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 block">Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the bug, feature request, or feedback..."
                  className="w-full min-h-[140px] p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white outline-none text-xs font-semibold focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10 active:scale-98 flex items-center justify-center gap-2.5"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Send size={14} /> Submit Ticket
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
