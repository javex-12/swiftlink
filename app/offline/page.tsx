"use client";

import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Offline fallback, precached by `public/sw.js` and served when a navigation
 * fails with no cached copy of the requested page.
 *
 * Kept deliberately dependency-free and client-only so it hydrates from the
 * cached HTML without any data fetch.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A1210] px-6 text-[#E8F1EC]">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#24382F] bg-[#0e1a15] text-[#19C37D]">
          <WifiOff size={30} />
        </div>
        <h1 className="text-2xl font-black tracking-tight">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#9DB3A8]">
          SwiftLink Pro needs a connection to load this page. Pages you have
          already visited stay available while you&apos;re offline.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#19C37D] px-4 py-2.5 text-sm font-bold text-[#04120c] transition hover:bg-[#22d98c]"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </main>
  );
}
