"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readLastConsolePath } from "@/lib/console-history";

/**
 * The installed app's entry point (`start_url` in `app/manifest.ts`).
 *
 * A manifest cannot ask whether the visitor is signed in or which screen they
 * left off on, so the PWA used to open on the marketing landing page on every
 * launch — the wrong room for someone who installed a console. This route makes
 * that decision in the browser, where both answers are available:
 *
 *   - the last console screen they used, when there is one recorded, so the app
 *     reopens where they were;
 *   - the console home otherwise.
 *
 * It deliberately routes to a *protected* path: middleware then sends a visitor
 * without a session to sign-in, so an unauthenticated launch is handled by the
 * existing auth gate rather than by a second copy of that rule here.
 */
export default function LaunchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(readLastConsolePath() ?? "/pro");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a1210]">
      {/* Plain, branded splash: it exists only for the moment the redirect takes. */}
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#19C37D]">
        Opening SwiftLink…
      </p>
    </main>
  );
}
