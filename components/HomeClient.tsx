"use client";

import { useSearchParams } from "next/navigation";
import { CustomerStorefront } from "@/components/CustomerStorefront";
import LandingPage from "@/components/landing/LandingPage";

/**
 * Root view router.
 *
 * `/` is the marketing landing page **for everyone**, signed in or not.
 *
 * It used to branch on session state: a signed-in owner was served the merchant
 * dashboard and then bounced to `/pro` by an effect, so the landing page had no
 * reachable URL — the only way back was the undocumented `?v=landing` hatch.
 * That is also what made the PWA launch confusing: `start_url` is `/`, so
 * launching the installed app dropped straight into the console.
 *
 * The landing page now carries the session-aware call to action itself (a
 * "Dashboard" button replaces "Log in / Get started" in the navbar), which is
 * the same pattern as every other product with a marketing root.
 *
 * The one exception is `?shop=<id>`, the entry point for a store that has no
 * handle yet (`getShopPath` in `lib/utils.ts`) — that still has to render the
 * storefront.
 */
export function HomeClient() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");

  if (shop) return <CustomerStorefront shopId={shop} />;
  return <LandingPage />;
}
