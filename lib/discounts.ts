/**
 * Discount codes.
 *
 * The only lever a merchant had for a repeat purchase was to type a lower price
 * into the WhatsApp chat — invisible to the storefront, unpriced in the cart and
 * impossible to count afterwards. A code fixes all three: it is validated in the
 * cart, it rides along in the order message the buyer sends, and it is stored on
 * the inquiry, so "did WELCOME10 bring anyone back?" becomes a query.
 *
 * Money is integer minor units throughout (kobo/cents), matching the rest of the
 * codebase, and all arithmetic is integer so a percentage never drifts by a kobo.
 */

export type DiscountKind = "percent" | "amount";

export interface DiscountCode {
  /** Stable id, so editing a code does not lose its identity in the list. */
  id: string;
  /** Always stored normalized (upper-case). */
  code: string;
  kind: DiscountKind;
  /** `percent` → whole percent (1–90). `amount` → minor units off the subtotal. */
  value: number;
  /** Optional minimum cart subtotal, in minor units. */
  minSubtotalMinor?: number | null;
  /** Optional cap on how many orders may use it (informational today). */
  maxRedemptions?: number | null;
  /** Optional `YYYY-MM-DD`; the code is dead once that day ends. */
  expiresAt?: string | null;
  /** Defaults to true. Lets a merchant retire a code without deleting it. */
  active?: boolean;
  /** Merchant's own note, shown only in the editor. */
  note?: string;
}

/** Why a code was refused. The UI turns these into copy; the tests assert on them. */
export type DiscountRejection =
  | "no_code"
  | "unknown"
  | "inactive"
  | "expired"
  | "min_subtotal"
  | "empty_cart";

export interface DiscountEvaluation {
  ok: boolean;
  /** Normalized code that was evaluated ("" when nothing was entered). */
  code: string;
  /** Money off the subtotal, in minor units. */
  discountMinor: number;
  /** What the buyer pays, in minor units. */
  finalTotalMinor: number;
  reason?: DiscountRejection;
  /** For `min_subtotal`: how much more is needed, in minor units. */
  shortfallMinor?: number;
  /** Buyer-facing explanation when refused. */
  error?: string;
}

/**
 * The money a cart is worth right now. Integer minor units, like everywhere else
 * money is handled here — the UI only formats it for display.
 */
export interface CartTotals {
  subtotalMinor: number;
  discountMinor: number;
  totalMinor: number;
  /** Normalized code actually in force, or null. */
  appliedCode: string | null;
}

/** Collapse a (possibly refused) evaluation into totals that always add up. */
export function cartTotalsFrom(
  subtotalMinor: number,
  evaluation?: DiscountEvaluation | null,
): CartTotals {
  const subtotal = Math.max(0, Math.round(subtotalMinor || 0));
  if (!evaluation?.ok) {
    return { subtotalMinor: subtotal, discountMinor: 0, totalMinor: subtotal, appliedCode: null };
  }
  return {
    subtotalMinor: subtotal,
    discountMinor: evaluation.discountMinor,
    totalMinor: evaluation.finalTotalMinor,
    appliedCode: evaluation.code,
  };
}

export const MIN_DISCOUNT_CODE_LENGTH = 3;
export const MAX_DISCOUNT_CODE_LENGTH = 24;
export const MAX_PERCENT = 90;
/** ₦10,000,000 in minor units — a ceiling that catches a mistyped amount. */
export const MAX_AMOUNT_MINOR = 1_000_000_000;

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

/**
 * Canonical form of a code: upper-case, no spaces, no leading `#`/`@`.
 * Applied to merchant input *and* to what the buyer types, so `welcome 10` and
 * `WELCOME10` are the same code.
 */
export function normalizeDiscountCode(raw?: string | null): string {
  return String(raw ?? "")
    .trim()
    .replace(/^[#@]+/, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function findDiscountCode(
  codes: DiscountCode[] | null | undefined,
  raw: string,
): DiscountCode | null {
  const wanted = normalizeDiscountCode(raw);
  if (!wanted) return null;
  return (
    (codes ?? []).find((entry) => normalizeDiscountCode(entry?.code) === wanted) ?? null
  );
}

export function newDiscountCodeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** True when `expiresAt` names a day that is already over. */
export function isExpired(expiresAt: string | null | undefined, now: Date = new Date()): boolean {
  const raw = String(expiresAt ?? "").trim();
  if (!raw) return false;

  // `YYYY-MM-DD` (what the editor's date input produces) expires at the end of
  // that day, not at midnight at its start.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = new Date(dateOnly ? `${raw}T23:59:59.999Z` : raw);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < now.getTime();
}

/**
 * Merchant-side validation. Returns the first problem found rather than a list,
 * because the editor shows one message per field at a time.
 */
export function validateDiscountCodeInput(
  input: {
    code: string;
    kind: DiscountKind;
    value: number;
    minSubtotalMinor?: number | null;
    expiresAt?: string | null;
  },
  existing: DiscountCode[] = [],
  ignoreId?: string,
): { isValid: boolean; error?: string } {
  const code = normalizeDiscountCode(input.code);

  if (code.length < MIN_DISCOUNT_CODE_LENGTH) {
    return { isValid: false, error: `Use at least ${MIN_DISCOUNT_CODE_LENGTH} characters.` };
  }
  if (code.length > MAX_DISCOUNT_CODE_LENGTH) {
    return { isValid: false, error: `Keep it under ${MAX_DISCOUNT_CODE_LENGTH} characters.` };
  }
  if (!CODE_PATTERN.test(code)) {
    return {
      isValid: false,
      error: "Letters, numbers, dashes and underscores only — no spaces or symbols.",
    };
  }

  const duplicate = existing.find(
    (entry) =>
      entry.id !== ignoreId && normalizeDiscountCode(entry.code) === code,
  );
  if (duplicate) return { isValid: false, error: `You already have a code called ${code}.` };

  if (!Number.isFinite(input.value)) {
    return { isValid: false, error: "Enter a discount value." };
  }

  if (input.kind === "percent") {
    if (!Number.isInteger(input.value) || input.value < 1 || input.value > MAX_PERCENT) {
      return {
        isValid: false,
        error: `A percentage must be a whole number between 1 and ${MAX_PERCENT}.`,
      };
    }
  } else {
    if (!Number.isInteger(input.value) || input.value < 1) {
      return { isValid: false, error: "Enter an amount greater than zero." };
    }
    if (input.value > MAX_AMOUNT_MINOR) {
      return { isValid: false, error: "That amount is too large." };
    }
  }

  if (
    input.minSubtotalMinor !== null &&
    input.minSubtotalMinor !== undefined &&
    (!Number.isInteger(input.minSubtotalMinor) || input.minSubtotalMinor < 0)
  ) {
    return { isValid: false, error: "The minimum order must be zero or more." };
  }

  if (input.expiresAt && Number.isNaN(new Date(input.expiresAt).getTime())) {
    return { isValid: false, error: "That expiry date is not a real date." };
  }

  return { isValid: true };
}

/**
 * Evaluate a code against a cart. Pure: same inputs, same answer, no clock
 * reads beyond the `now` that is passed in — which is what makes the expiry
 * rules testable without waiting for a date to pass.
 */
export function evaluateDiscount(
  codes: DiscountCode[] | null | undefined,
  options: {
    code: string;
    /** Cart subtotal in integer minor units, before any discount. */
    subtotalMinor: number;
    currencySymbol?: string;
    now?: Date;
  },
): DiscountEvaluation {
  const code = normalizeDiscountCode(options.code);
  const subtotalMinor = Math.max(0, Math.round(options.subtotalMinor || 0));
  const empty: DiscountEvaluation = {
    ok: false,
    code,
    discountMinor: 0,
    finalTotalMinor: subtotalMinor,
  };
  const symbol = options.currencySymbol ?? "";

  if (!code) {
    return { ...empty, reason: "no_code", error: "Enter a discount code." };
  }

  const entry = findDiscountCode(codes, code);
  if (!entry) {
    return { ...empty, reason: "unknown", error: `We don't recognise the code ${code}.` };
  }

  if (entry.active === false) {
    return { ...empty, reason: "inactive", error: `${code} is no longer active.` };
  }

  if (isExpired(entry.expiresAt, options.now)) {
    return { ...empty, reason: "expired", error: `${code} has expired.` };
  }

  if (subtotalMinor <= 0) {
    return { ...empty, reason: "empty_cart", error: "Add something to your bag first." };
  }

  const minimum = Math.round(entry.minSubtotalMinor || 0);
  if (minimum > 0 && subtotalMinor < minimum) {
    const shortfallMinor = minimum - subtotalMinor;
    return {
      ...empty,
      reason: "min_subtotal",
      shortfallMinor,
      error: `Spend ${symbol}${(minimum / 100).toLocaleString()} to use ${code} — that's ${symbol}${(
        shortfallMinor / 100
      ).toLocaleString()} more.`,
    };
  }

  const raw =
    entry.kind === "percent"
      ? Math.round((subtotalMinor * Math.min(Math.max(entry.value, 0), 100)) / 100)
      : Math.round(entry.value);

  // A code can never cost the merchant money: the discount stops at the subtotal.
  const discountMinor = Math.max(0, Math.min(raw, subtotalMinor));

  return {
    ok: true,
    code,
    discountMinor,
    finalTotalMinor: subtotalMinor - discountMinor,
  };
}

/** One-line description for the editor list, e.g. "10% off" or "₦500 off". */
export function describeDiscount(entry: DiscountCode, currencySymbol = ""): string {
  if (entry.kind === "percent") return `${entry.value}% off`;
  return `${currencySymbol}${(Number(entry.value) / 100).toLocaleString()} off`;
}

/**
 * Never trust `state.discountCodes` to be well-formed: it lives in a JSON blob
 * that older versions of the app wrote without this field, and merchants share
 * store blobs between sessions. Anything unusable is dropped, not thrown.
 */
export function sanitizeDiscountCodes(value: unknown): DiscountCode[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const cleaned: DiscountCode[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const code = normalizeDiscountCode(String(record.code ?? ""));
    if (!code || seen.has(code)) continue;

    const kind: DiscountKind = record.kind === "amount" ? "amount" : "percent";
    const value_ = Number(record.value);
    if (!Number.isFinite(value_) || value_ <= 0) continue;

    seen.add(code);
    cleaned.push({
      id: String(record.id ?? code),
      code,
      kind,
      value: Math.round(value_),
      minSubtotalMinor:
        record.minSubtotalMinor === undefined || record.minSubtotalMinor === null
          ? null
          : Math.max(0, Math.round(Number(record.minSubtotalMinor) || 0)),
      maxRedemptions:
        record.maxRedemptions === undefined || record.maxRedemptions === null
          ? null
          : Math.max(0, Math.round(Number(record.maxRedemptions) || 0)),
      expiresAt: record.expiresAt ? String(record.expiresAt) : null,
      active: record.active === false ? false : true,
      note: record.note ? String(record.note) : undefined,
    });
  }

  return cleaned;
}
