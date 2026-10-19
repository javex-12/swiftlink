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
 * The request-form questions used until a merchant writes their own. A plumber
 * and a tailor need different details from a buyer, which is why these are
 * editable per product rather than baked into the form.
 */
export const DEFAULT_QUOTE_QUESTIONS: readonly ProductRequestQuestion[] = [
  { id: "details", label: "What do you need?", required: true },
  { id: "budget", label: "Budget" },
  { id: "deadline", label: "When do you need it?" },
];

type Priceable = Pick<Product, "price"> & { priceType?: ProductPriceType | null };

/**
 * The questions a buyer will actually see for a product.
 *
 * The merchant writes these in the product editor; blank rows are dropped (the
 * editor keeps an empty one while they type), and a product with no questions
 * at all falls back to the defaults. An explicitly empty list means "ask only
 * for name and WhatsApp", so it is respected rather than replaced.
 */
export function resolveRequestQuestions(
  questions?: readonly ProductRequestQuestion[] | null,
): ProductRequestQuestion[] {
  if (!questions) return [...DEFAULT_QUOTE_QUESTIONS];

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
  buyerName?: string;
  buyerPhone?: string;
  /**
   * The merchant's own questions and the buyer's answers, in form order. This
   * is the current shape; the named fields below are the original fixed set and
   * are kept for callers/tests that predate editable questions.
   */
  answers?: { label: string; value: string }[];
  /** The buyer's description of the job. */
  details?: string;
  budget?: string;
  deadline?: string;
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
 * app installed. Empty optional answers are omitted rather than printed as
 * "Budget: -", which would look like the buyer refused to answer.
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

  lines.push("");

  const name = clean(input.buyerName, 80);
  const phone = clean(input.buyerPhone, 40);
  if (name) lines.push(`👤 Name: ${name}`);
  if (phone) lines.push(`📱 WhatsApp: ${phone}`);

  const answers = (input.answers ?? [])
    .map((entry) => ({ label: clean(entry.label, 120), value: clean(entry.value, 1200) }))
    .filter((entry) => entry.label && entry.value);

  if (answers.length > 0) {
    lines.push("", "*Buyer's answers:*");
    for (const entry of answers) lines.push(`• *${entry.label}*: ${entry.value}`);
  } else {
    lines.push("");
    lines.push("*What they need:*");
    lines.push(clean(input.details, 1200) || "(not described)");

    const budget = clean(input.budget, 80);
    const deadline = clean(input.deadline, 80);
    if (budget) lines.push("", `💰 Budget: ${budget}`);
    if (deadline) lines.push(`🗓️ Needed by: ${deadline}`);
  }

  lines.push("", "━━━━━━━━━━", "_Sent from the store's price request form._");

  return lines.join("\n");
}
