"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1E2D27] bg-[#111C18] p-4 shadow-2xl md:px-6 md:py-4"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-[#9DB3A8] sm:text-sm">
          We use cookies and local storage to keep your session, save your cart, and improve the app. We don&apos;t sell your data.{" "}
          <Link
            href="/privacy"
            className="font-medium text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]"
          >
            Learn more in our Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-xl border border-[#1E2D27] bg-[#0A1210] px-4 py-2 text-xs font-semibold text-[#9DB3A8] transition hover:border-[#5C7C6D] hover:text-[#E8F1EC]"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-xl bg-[#19C37D] px-4 py-2 text-xs font-semibold text-[#04140D] transition hover:bg-[#22E595]"
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  );
}
