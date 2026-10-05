"use client";

import { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { MessageSquare, Bug, Plus, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FeedbackModal() {
  const { feedbackOpen, setFeedbackOpen, submitFeedback } = useSwiftLink();
  const [type, setType] = useState<"bug" | "feature" | "other">("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    await submitFeedback(type, message);
    setSubmitting(false);
    setMessage("");
  };

  const categories = [
    { id: "bug", label: "Report Bug", icon: Bug },
    { id: "feature", label: "Request Feature", icon: Plus },
    { id: "other", label: "General", icon: MessageSquare },
  ] as const;

  return (
    <AnimatePresence>
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFeedbackOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-[#111C18] rounded-[18px] w-full max-w-lg border border-[#1E2D27] shadow-2xl p-6 sm:p-8 overflow-hidden text-[#E8F1EC]"
          >
            <button
              type="button"
              onClick={() => setFeedbackOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-[8px] text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-[#E8F1EC]">Send Feedback</h2>
              <p className="text-xs text-[#9DB3A8] mt-1">Help us make SwiftLink better.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Picker */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#E8F1EC] block">Feedback Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((c) => {
                    const Icon = c.icon;
                    const isSelected = type === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setType(c.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-[12px] border text-center transition-all ${
                          isSelected 
                            ? "bg-[#14231D] text-[#19C37D] border-[#19C37D]"
                            : "border-[#1E2D27] bg-[#0A1210] text-[#9DB3A8] hover:border-[#5C7C6D]"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[11px] font-semibold">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Box */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#E8F1EC] block">Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue, feature request, or feedback..."
                  className="w-full min-h-[120px] p-3.5 rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] text-[#E8F1EC] outline-none text-xs focus:border-[#19C37D] transition-all placeholder:text-[#9DB3A8] resize-none"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full min-h-[44px] bg-[#19C37D] hover:bg-[#16B070] disabled:opacity-50 text-[#04140D] rounded-[12px] font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Send size={14} /> Submit Feedback
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
