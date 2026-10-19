/**
 * How a product is priced.
 *
 * Most products have a price the buyer can read and pay. A service — tailoring,
 * photography, repairs, custom furniture — does not: the merchant cannot quote
 * before knowing the job. Those products are `quote`, and the storefront shows
 * "Ask for price" instead of a misleading ₦0 and a working Add to cart.
 *
 * A quote product is deliberately **never added to the cart**. It has no price,
 * so including it would put a zero in the order total and quietly under-charge
 * the buyer. Instead the product page opens a short request form and sends the
 * answers to the store's WhatsApp, which is the same conversation channel every
 * other order uses.
 */

import type { Product, ProductRequestQuestion } from "./schema";

export type ProductPriceType = "fixed" | "quote";

/**
 * The questions a request form starts with: **none**.
 *
 * The form used to arrive with three of our own questions ("What do you
 * need?", "Budget", "When do you need it?") plus the buyer's name and WhatsApp
 * number. A merchant selling made-to-measure suits and one selling generator
 * repairs need completely different answers, so the only questions a buyer is
 * asked are the ones the merchant wrote for that service — nothing else is
 * added on their behalf.
 */
export const NO_REQUEST_QUESTIONS: readonly ProductRequestQuestion[] = [];

type Priceable = Pick<Product, "price"> & { priceType?: ProductPriceType | null };

/**
 * The questions a buyer will actually see for a product.
 *
 * Exactly what the merchant wrote, minus blank rows (the editor keeps an empty
 * one while they type). No question and no field is added by the platform: a
 * service with nothing configured opens the store's WhatsApp chat with the
 * service named, and the shopper writes there.
 */
export function resolveRequestQuestions(
  questions?: readonly ProductRequestQuestion[] | null,
): ProductRequestQuestion[] {
  if (!questions || questions.length === 0) return [];

  return questions
    .map((question, index) => ({
      ...question,
      id: question.id || `q-${index}`,
      label: (question.label ?? "").trim(),
    }))
    .filter((question) => question.label.length > 0);
}

/** True when the product is priced on request rather than sold at a fixed price. */
export function isPriceOnRequest(product: Priceable | null | undefined): boolean {
  return product?.priceType === "quote";
}

/** What a product card prints: a real amount, or the request wording. */
export function formatProductPrice(
  currency: string,
  product: Priceable | null | undefined,
): string {
  if (isPriceOnRequest(product)) return "Ask for price";
  const amount = Number(product?.price);
  return `${currency}${(Number.isFinite(amount) ? amount : 0).toLocaleString()}`;
}

export interface QuoteRequestInput {
  storeName: string;
  productName: string;
  /** Public product page URL, when one can be built. Only http(s) is included. */
  productUrl?: string | null;
  /**
   * The merchant's questions and the buyer's answers, in form order — the only
   * content of the request. There is no built-in name, phone, budget or deadline
   * field: if a merchant wants them, they add them as questions.
   */
  answers?: { label: string; value: string }[];
  currency?: string;
}

function clean(value: string | null | undefined, max = 500): string {
  return (value ?? "").toString().replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * The WhatsApp message a quote request becomes.
 *
 * Kept plain text with `*bold*` markers so it reads as a normal WhatsApp message
 * rather than a machine dump — the merchant may receive this on a phone with no
 * app installed. Only the merchant's questions appear; a blank answer is dropped
 * rather than printed as "Budget: -", which would look like a refusal.
 *
 * With no questions configured the message is still useful: it names the store,
 * the service and the link, and the shopper types their request in the chat.
 */
export function buildQuoteRequestMessage(input: QuoteRequestInput): string {
  const lines: string[] = [
    `*PRICE REQUEST — ${clean(input.storeName, 80) || "Store"}*`,
    "━━━━━━━━━━",
    "",
    `🛍️ *${clean(input.productName, 120) || "Product"}*`,
  ];

  const url = (input.productUrl ?? "").trim();
  if (/^https?:\/\//i.test(url)) lines.push(url);

  const answers = (input.answers ?? [])
    .map((entry) => ({ label: clean(entry.label, 120), value: clean(entry.value, 1200) }))
    .filter((entry) => entry.label && entry.value);

  if (answers.length > 0) {
    lines.push("", "*Details:*");
    for (const entry of answers) lines.push(`• *${entry.label}*: ${entry.value}`);
  } else {
    lines.push("", "Please send me a price for this.");
  }

  lines.push("", "━━━━━━━━━━", "_Sent from the store's price request form._");

  return lines.join("\n");
}
