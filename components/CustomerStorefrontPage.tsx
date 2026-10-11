"use client";

import { CustomerStorefront } from "@/components/CustomerStorefront";
import type { ShopState } from "@/lib/schema";

/**
 * Client shell around the storefront.
 *
 * `initialState` is the store row the server route already read. Passing it in
 * (rather than letting the browser fetch it) is what makes the storefront's
 * content part of the server-rendered HTML, which is the precondition for a
 * store being indexable at all.
 */
export function CustomerStorefrontPage({
  shopId,
  initialState = null,
}: {
  shopId: string;
  initialState?: ShopState | null;
}) {
  return <CustomerStorefront shopId={shopId} initialState={initialState} />;
}
