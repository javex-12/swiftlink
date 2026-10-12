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
      className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pointer-events-none"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#1E2D27] bg-[#111C18]/95 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto text-[#E8F1EC]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#19C37D]/10 text-[#19C37D] mt-0.5">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#D2E2D8]">
                We use cookies and local storage to preserve your cart and session. We never sell your personal data.{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 hover:text-[#22E595]"
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
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center justify-end gap-2.5 pt-2 border-t border-[#1E2D27]/60">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 sm:flex-initial min-h-[38px] rounded-xl border border-[#1E2D27] bg-[#0A1210] px-4 py-2 text-xs font-semibold text-[#9DB3A8] transition hover:border-[#5C7C6D] hover:text-[#E8F1EC] text-center justify-center flex items-center"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 sm:flex-initial min-h-[38px] rounded-xl bg-[#19C37D] px-5 py-2 text-xs font-bold text-[#04140D] transition hover:bg-[#22E595] text-center justify-center flex items-center shadow-md shadow-[#19C37D]/20"
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  );
}
