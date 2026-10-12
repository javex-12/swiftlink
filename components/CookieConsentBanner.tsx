"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ShieldCheck } from "lucide-react";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem("swiftlink_cookie_consent");
      if (consent !== "accepted" && consent !== "rejected") {
        setVisible(true);
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  const handleAccept = () => {
    try {
      localStorage.setItem("swiftlink_cookie_consent", "accepted");
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem("swiftlink_cookie_consent", "rejected");
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-20 sm:bottom-4 left-0 right-0 z-[99999] p-3 sm:p-4 pointer-events-none"
    >
      <div className="mx-auto max-w-xl rounded-2xl border border-[#1E2D27] bg-[#111C18]/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto text-[#E8F1EC]">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#19C37D]/10 text-[#19C37D] mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-[#D2E2D8]">
                We use cookies and local storage to preserve your cart and session. We never sell your personal data.{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 hover:text-[#22E595] inline-block"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReject}
            aria-label="Dismiss cookie notice"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#1E2D27] text-[#9DB3A8] hover:text-[#E8F1EC] hover:bg-[#14231D] transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-[#1E2D27]/60">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 sm:flex-initial h-8 rounded-xl border border-[#1E2D27] bg-[#0A1210] px-3.5 text-xs font-medium text-[#9DB3A8] transition hover:border-[#5C7C6D] hover:text-[#E8F1EC] text-center justify-center flex items-center"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 sm:flex-initial h-8 rounded-xl bg-[#19C37D] px-4 text-xs font-bold text-[#04140D] transition hover:bg-[#22E595] text-center justify-center flex items-center shadow-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  );
}
