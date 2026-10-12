"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function HelpFeedbackForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ message: message.trim(), email: email.trim() || undefined }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[HelpFeedbackForm]", err);
      setError("Unable to submit feedback at this time. Please try again or reach out to support@swiftlink.pro.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-8 text-center">
        <h3 className="text-base font-semibold text-[#E8F1EC]">Thank you for your feedback</h3>
        <p className="mt-2 text-sm text-[#9DB3A8]">
          Our product team reviews every submission to help improve SwiftLink Pro.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setMessage("");
            setEmail("");
          }}
          className="mt-6 rounded-xl border border-[#1E2D27] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] hover:text-[#19C37D]"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="feedback-message" className="block text-xs font-medium uppercase tracking-wider text-[#E8F1EC]">
            Message <span className="text-[#19C37D]">*</span>
          </label>
          <textarea
            id="feedback-message"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or suggestion in detail..."
            className="mt-2 w-full rounded-xl border border-[#1E2D27] bg-[#0A1210] p-3 text-sm text-[#E8F1EC] placeholder-[#5C7C6D] transition focus:border-[#19C37D] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="feedback-email" className="block text-xs font-medium uppercase tracking-wider text-[#E8F1EC]">
            Email address <span className="text-[11px] font-normal normal-case text-[#9DB3A8]">(Optional, if you would like a reply)</span>
          </label>
          <input
            id="feedback-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="mt-2 w-full rounded-xl border border-[#1E2D27] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] placeholder-[#5C7C6D] transition focus:border-[#19C37D] focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-[#FF8A8A]">{error}</p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#19C37D] px-6 py-2.5 text-xs font-semibold text-[#04140D] transition hover:bg-[#22E595] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Submit Feedback</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
