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
  viewerIsOwner = false,
  whiteLabel = false,
}: {
  shopId: string;
  initialState?: ShopState | null;
  /**
   * Set by the server route when the signed-in account owns this store. It is a
   * boolean on purpose: the owner id it was derived from stays on the server.
   */
  viewerIsOwner?: boolean;
  /**
   * Business stores hide the platform credit on their storefront. Decided on the
   * server from `stores.plan`, so it cannot be switched on by editing store
   * content.
   */
  whiteLabel?: boolean;
}) {
  return (
    <CustomerStorefront
      shopId={shopId}
      initialState={initialState}
      viewerIsOwner={viewerIsOwner}
      whiteLabel={whiteLabel}
    />
  );
}
