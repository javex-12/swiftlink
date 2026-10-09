/**
 * The WhatsApp checkout message for a cart order.
 *
 * Pulled out of `SwiftLinkContext` so the exact text a *merchant* receives when
 * a customer checks out is testable — it used to be a sequence of string
 * concatenations inside a click handler, which nothing could assert against.
 *
 * ## Why product photos are links
 *
 * `wa.me?text=` can only carry text: there is no way to attach a file through a
 * click-to-chat URL (that is a WhatsApp Business API capability, and this app is
 * deliberately API-free). What WhatsApp *does* do is render a preview card for
 * the first URL in the message, so a product photo sent as its public URL shows
 * up as an image in the chat — the merchant sees the item, not just its name.
 *
 * Only `http(s)` URLs are emitted. A `data:` URL would be a base64 blob in the
 * message body (megabytes, unopenable), and `blob:`/`file:` URLs point at the
 * sender's own browser and mean nothing to the merchant on the other end.
 */

export interface CartOrderLine {
  productId: number;
  name: string;
  quantity: number;
  /** Price for one unit, in major currency units (not minor). */
  unitPrice: number;
  /** Product photo. Dropped unless it is a shareable http(s) URL. */
  imageUrl?: string | null;
}

export interface CartOrderMessageInput {
  /** Human-readable order reference, e.g. `SL-4F2A`. */
  reference: string;
  /** Currency symbol as the merchant set it, e.g. `₦`. */
  currency: string;
  storeName: string;
  lines: CartOrderLine[];
}

/** A URL WhatsApp can actually preview, or null. Never throws. */
export function shareableImageUrl(url: string | null | undefined): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function lineTotal(line: CartOrderLine): number {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  return unitPrice * quantity;
}

export function cartOrderTotal(lines: CartOrderLine[]): number {
  return (lines || []).reduce((sum, line) => sum + lineTotal(line), 0);
}

/** Localised like the rest of the storefront: the merchant reads their own prices. */
function money(currency: string, amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency}${safe.toLocaleString()}`;
}

export function buildCartOrderMessage({
  reference,
  currency,
  storeName,
  lines,
}: CartOrderMessageInput): string {
  const orderLines = lines || [];
  const parts: string[] = [`*NEW ORDER ${reference}*`, "━━━━━━━━━━", ""];

  orderLines.forEach((line) => {
    parts.push(`📦 *${line.name}* (${line.quantity})`);
    parts.push(`   ${money(currency, lineTotal(line))}`);

    const imageUrl = shareableImageUrl(line.imageUrl);
    if (imageUrl) parts.push(`   ${imageUrl}`);

    parts.push("");
  });

  parts.push("━━━━━━━━━━");
  parts.push(`💰 *Total: ${money(currency, cartOrderTotal(orderLines))}*`);
  parts.push("");
  parts.push(`_Store: ${storeName}_`);

  return parts.join("\n");
}
