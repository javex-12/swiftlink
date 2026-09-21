"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[swiftlink] unhandled route error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#07110d] px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          This screen failed to load. Your saved store data is unaffected.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            ref {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
