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
 * 4. **The order arrives whole.** `order_ref` is written on every line so the
 *    lines of one cart can be read back as one order, while the message text and
 *    the discount total — which describe the *order*, not any single product —
 *    are written once, on the first line.
 */

import { supabase, isSupabaseConfigured } from "./supabase-client";
import { getDeviceHash, resolveInquirySource, type InquirySource } from "./inquiries";

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
  /**
   * The channel the buyer actually chose at checkout. Beats both `srcParam` and
   * the referrer: the buyer's tap is a fact, the referrer is an inference.
   */
  channel?: InquirySource | null;
  /** Reference shown to the buyer (`SL-XXXX`), shared by every line of the order. */
  orderRef?: string | null;
  /** The prefilled order text, stored once on the first line of the order. */
  message?: string | null;
  /**
   * Buyer details from a price request. Cart checkout collects nothing, so these
   * stay null there; the quote form asks for them because the merchant has to be
   * able to reply even if the WhatsApp hand-off is declined.
   */
  buyerName?: string | null;
  buyerPhone?: string | null;
  /** Discount applied to the order — `amountMinor` is the order total, stored once. */
  discount?: { code: string; amountMinor: number } | null;
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
  const { storeId, currency, srcParam, channel, orderRef, message, buyerName, buyerPhone, discount, items } =
    params;

  // The storefront also runs in demo/offline mode where there is no Supabase
  // project; touching the client there throws by design.
  if (!storeId || !isSupabaseConfigured() || items.length === 0) return 0;

  const source =
    channel ??
    resolveInquirySource(
      srcParam,
      typeof document !== "undefined" ? document.referrer : null,
    );
  const deviceHash = getDeviceHash();

  let recorded = 0;
  for (const [index, item] of items.entries()) {
    // The text and the discount are properties of the order, and every product in
    // the cart gets its own inquiry row — so they are written on the first row
    // only, rather than repeated once per product.
    const isFirstLine = index === 0;
    try {
      const { error } = await supabase.rpc("create_or_update_inquiry", {
        p_store_id: storeId,
        p_product_id: item.productId,
        p_product_name: item.productName,
        p_currency: (currency || "NGN").slice(0, 3).toUpperCase(),
        p_product_price_minor: item.unitPriceMinor,
        p_selected_option: item.selectedOption ?? null,
        p_buyer_name: isFirstLine ? buyerName ?? null : null,
        p_buyer_phone: isFirstLine ? buyerPhone ?? null : null,
        p_device_hash: deviceHash,
        p_source: source,
        p_message: isFirstLine ? message ?? null : null,
        p_order_ref: orderRef ?? null,
        p_discount_code: discount?.code ?? null,
        p_discount_minor: isFirstLine ? discount?.amountMinor ?? null : null,
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
