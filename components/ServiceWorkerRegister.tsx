"use client";

import { useEffect } from "react";

/**
 * Registers `public/sw.js`.
 *
 * Production only: in `next dev` the service worker would serve cached
 * responses over Fast Refresh, which produces confusing stale UI while
 * editing. `updateViaCache: "none"` makes the browser bypass the HTTP cache
 * when checking `sw.js` itself, so a deploy is picked up on the next load
 * instead of after the max-age expires.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* registration is a progressive enhancement — never surface an error */
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
