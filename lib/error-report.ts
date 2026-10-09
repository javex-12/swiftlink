/**
 * Client error reporting.
 *
 * Until now every client-side failure was `console.error`, which in production
 * nobody reads: a broken storefront or a crashed console screen produced an
 * empty render and silence. This module is the capture half; `app/api/errors`
 * is the sink, and `components/ErrorMonitor.tsx` wires it to the browser.
 *
 * Deliberately dependency-free and small. A hosted provider (Sentry and friends)
 * is a better long-term sink, but it is a large dependency and a product
 * decision — the project is on a tight disk budget and declined Serwist for the
 * same reason. So the sink is a single POST to `/api/errors`, and swapping in a
 * provider later means changing `send()` below, not the call sites.
 *
 * Rules this file holds to:
 *   - never throws, never returns a rejected promise
 *   - never blocks or delays the UI
 *   - bounded: a crash loop cannot flood the sink
 *   - no cookies, no user id, no store data — only the error and the URL
 */

export type ErrorReportContext = Record<string, string | number | boolean | null | undefined>;

/** A crash loop must not become a request loop. */
const MAX_REPORTS_PER_SESSION = 10;
const MAX_MESSAGE_LENGTH = 800;
const MAX_STACK_LENGTH = 4000;
const MAX_CONTEXT_KEYS = 12;
const MAX_CONTEXT_VALUE_LENGTH = 200;

let reportsSent = 0;

function asError(value: unknown): { message: string; name: string; stack?: string } {
  if (value instanceof Error) {
    return {
      message: (value.message || "Error").slice(0, MAX_MESSAGE_LENGTH),
      name: value.name || "Error",
      stack: value.stack?.slice(0, MAX_STACK_LENGTH),
    };
  }
  if (typeof value === "string") {
    return { message: value.slice(0, MAX_MESSAGE_LENGTH), name: "Error" };
  }
  try {
    return { message: JSON.stringify(value).slice(0, MAX_MESSAGE_LENGTH), name: "Error" };
  } catch {
    return { message: "Unserializable error value", name: "Error" };
  }
}

function sanitizeContext(context?: ErrorReportContext): Record<string, string> | undefined {
  if (!context) return undefined;
  const entries = Object.entries(context).slice(0, MAX_CONTEXT_KEYS);
  const clean: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!key || value === undefined || value === null) continue;
    clean[key.slice(0, 64)] = String(value).slice(0, MAX_CONTEXT_VALUE_LENGTH);
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

function send(body: string): void {
  // `sendBeacon` survives a page unload, which matters because a crash often
  // ends with the tab closing. It also fires without waiting for a response.
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/errors", blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  try {
    void fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* the sink being down must never surface */
    });
  } catch {
    /* fetch unavailable — nothing to do */
  }
}

/**
 * Report one error. Safe to call from anywhere on the client; a no-op on the
 * server and after the per-session cap.
 */
export function reportError(error: unknown, context?: ErrorReportContext): void {
  if (typeof window === "undefined") return;
  if (reportsSent >= MAX_REPORTS_PER_SESSION) return;
  reportsSent += 1;

  try {
    const { message, name, stack } = asError(error);
    const payload = {
      message,
      name,
      stack,
      url: window.location.href.slice(0, 500),
      // Enough to identify the browser family; no other client data.
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : undefined,
      timestamp: new Date().toISOString(),
      context: sanitizeContext(context),
    };
    send(JSON.stringify(payload));
  } catch {
    /* reporting must never be the thing that breaks the page */
  }
}

/** Test/observability helper — how many reports this session has sent. */
export function reportsSentThisSession(): number {
  return reportsSent;
}
