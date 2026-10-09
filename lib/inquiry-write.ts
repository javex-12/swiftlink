/**
 * Recording buyer order intent as real `inquiries` rows.
 *
 * Until now the storefront told the merchant nothing: tapping "Order on
 * WhatsApp" opened a pre-filled chat and left no trace anywhere in the product,
 * which is why customer inquiries, the inquiries screen and every analytics
 * metric were structurally stuck at zero
 * (docs/05-IMPROVEMENT-PLAN.md R-05/R-06).
 *
 * Rules this module follows:
 *
 * 1. **Tracking never blocks the order.** `window.open` must run synchronously
 *    inside the click handler or popup blockers kill it, so callers invoke this
 *    *after* opening the chat, and every failure is swallowed to a console
 *    warning. A metrics problem must never cost a merchant a sale.
 * 2. **Deduplication lives in the database.** `create_or_update_inquiry`
 *    (SECURITY DEFINER, migration `20261001170000`) takes a transaction-level
 *    advisory lock and folds a repeat tap by the same device into the open
 *    inquiry, so concurrent taps cannot double-count. Doing this client-side —
 *    as `computeDedupeKey` alone would — is a race.
 * 3. **Money is integer minor units**, matching the schema
 *    (`product_price_minor`), never floats.
 */

import { supabase, isSupabaseConfigured } from "./supabase-client";
import { getDeviceHash, resolveInquirySource } from "./inquiries";

export interface OrderIntentItem {
  productId: number;
  productName: string;
  /** Unit price already converted to integer minor units (kobo/cents). */
  unitPriceMinor: number;
  quantity: number;
  selectedOption?: string | null;
}

export interface RecordOrderIntentParams {
  storeId: string | null | undefined;
  currency: string | undefined;
  /** `?src=` from the storefront URL — beats the referrer when present. */
  srcParam?: string | null;
  items: OrderIntentItem[];
}

/** Naira-style major price to integer minor units, without float drift. */
export function toMinorUnits(major: number): number {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * 100);
}

/**
 * Records one inquiry per distinct product in the order. Resolves to the number
 * of rows the database accepted (0 when unconfigured, offline, or on error) and
 * never rejects.
 */
export async function recordOrderIntent(
  params: RecordOrderIntentParams,
): Promise<number> {
  const { storeId, currency, srcParam, items } = params;

  // The storefront also runs in demo/offline mode where there is no Supabase
  // project; touching the client there throws by design.
  if (!storeId || !isSupabaseConfigured() || items.length === 0) return 0;

  const source = resolveInquirySource(
    srcParam,
    typeof document !== "undefined" ? document.referrer : null,
  );
  const deviceHash = getDeviceHash();

  let recorded = 0;
  for (const item of items) {
    try {
      const { error } = await supabase.rpc("create_or_update_inquiry", {
        p_store_id: storeId,
        p_product_id: item.productId,
        p_product_name: item.productName,
        p_currency: (currency || "NGN").slice(0, 3).toUpperCase(),
        p_product_price_minor: item.unitPriceMinor,
        p_selected_option: item.selectedOption ?? null,
        p_buyer_name: null,
        p_buyer_phone: null,
        p_device_hash: deviceHash,
        p_source: source,
      });

      if (error) {
        console.warn("[inquiry-write] could not record inquiry:", error.message);
      } else {
        recorded += 1;
      }
    } catch (error) {
      // A tracking failure must never surface to the buyer.
      console.warn("[inquiry-write] inquiry write threw:", error);
    }
  }

  return recorded;
}
