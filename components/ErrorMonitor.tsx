"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-report";

/**
 * Catches the errors React's error boundary cannot see: uncaught exceptions in
 * event handlers and timers (`window.onerror`) and unhandled promise rejections.
 *
 * The React boundary (`app/error.tsx`) only reports errors thrown during render,
 * which in this app is the smaller half — most failures happen in the async data
 * paths inside effects, and those surfaced as nothing at all.
 */
export function ErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportError(event.error ?? event.message, {
        source: "window.onerror",
        filename: event.filename,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, { source: "unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
