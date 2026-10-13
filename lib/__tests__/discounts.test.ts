import { describe, expect, it } from "vitest";
import {
  describeDiscount,
  evaluateDiscount,
  findDiscountCode,
  isExpired,
  normalizeDiscountCode,
  sanitizeDiscountCodes,
  validateDiscountCodeInput,
  type DiscountCode,
} from "../discounts";

const percent = (overrides: Partial<DiscountCode> = {}): DiscountCode => ({
  id: "d1",
  code: "WELCOME10",
  kind: "percent",
  value: 10,
  ...overrides,
});

const amount = (overrides: Partial<DiscountCode> = {}): DiscountCode => ({
  id: "d2",
  code: "CHRISTMAS",
  kind: "amount",
  value: 50_000, // ₦500 in minor units
  ...overrides,
});

describe("normalizeDiscountCode", () => {
  it("makes what the buyer types match what the merchant saved", () => {
    expect(normalizeDiscountCode("  welcome 10 ")).toBe("WELCOME10");
    expect(normalizeDiscountCode("#sale20")).toBe("SALE20");
    expect(normalizeDiscountCode("welcome10")).toBe("WELCOME10");
  });

  it("is empty for nothing", () => {
    expect(normalizeDiscountCode("")).toBe("");
    expect(normalizeDiscountCode(null)).toBe("");
    expect(normalizeDiscountCode(undefined)).toBe("");
  });
});

describe("isExpired", () => {
  const now = new Date("2026-10-13T12:00:00Z");

  it("keeps a code alive until the end of its expiry day", () => {
    expect(isExpired("2026-10-13", now)).toBe(false);
  });

  it("kills it the day after", () => {
    expect(isExpired("2026-10-12", now)).toBe(true);
  });

  it("treats a missing or unreadable date as no expiry at all", () => {
    expect(isExpired(null, now)).toBe(false);
    expect(isExpired("", now)).toBe(false);
    expect(isExpired("not a date", now)).toBe(false);
  });
});

describe("evaluateDiscount", () => {
  const codes = [percent(), amount(), percent({ id: "d3", code: "BIG", value: 25, minSubtotalMinor: 1_000_000 })];

  it("takes a percentage off the subtotal", () => {
    const result = evaluateDiscount(codes, { code: "welcome10", subtotalMinor: 200_000, currencySymbol: "₦" });
    expect(result.ok).toBe(true);
    expect(result.discountMinor).toBe(20_000);
    expect(result.finalTotalMinor).toBe(180_000);
  });

  it("takes a fixed amount off the subtotal", () => {
    const result = evaluateDiscount(codes, { code: "CHRISTMAS", subtotalMinor: 200_000 });
    expect(result.ok).toBe(true);
    expect(result.discountMinor).toBe(50_000);
    expect(result.finalTotalMinor).toBe(150_000);
  });

  it("rounds a percentage to whole minor units rather than drifting", () => {
    const result = evaluateDiscount([percent({ value: 15 })], {
      code: "WELCOME10",
      subtotalMinor: 3_333,
    });
    expect(result.discountMinor).toBe(500); // 499.95 → 500, not 499.95
    expect(Number.isInteger(result.finalTotalMinor)).toBe(true);
  });

  it("never discounts more than the cart is worth", () => {
    const result = evaluateDiscount([amount({ value: 5_000_000 })], {
      code: "CHRISTMAS",
      subtotalMinor: 100_000,
    });
    expect(result.discountMinor).toBe(100_000);
    expect(result.finalTotalMinor).toBe(0);
  });

  it("refuses an unknown code", () => {
    const result = evaluateDiscount(codes, { code: "NOPE", subtotalMinor: 100_000 });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unknown");
    expect(result.discountMinor).toBe(0);
  });

  it("refuses an empty code without complaining about the store", () => {
    const result = evaluateDiscount(codes, { code: "   ", subtotalMinor: 100_000 });
    expect(result.reason).toBe("no_code");
  });

  it("refuses a retired code", () => {
    const result = evaluateDiscount([percent({ active: false })], {
      code: "WELCOME10",
      subtotalMinor: 100_000,
    });
    expect(result.reason).toBe("inactive");
  });

  it("refuses an expired code", () => {
    const result = evaluateDiscount([percent({ expiresAt: "2026-01-01" })], {
      code: "WELCOME10",
      subtotalMinor: 100_000,
      now: new Date("2026-10-13T12:00:00Z"),
    });
    expect(result.reason).toBe("expired");
  });

  it("enforces a minimum order and says how much is missing", () => {
    const result = evaluateDiscount(codes, {
      code: "BIG",
      subtotalMinor: 400_000,
      currencySymbol: "₦",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("min_subtotal");
    expect(result.shortfallMinor).toBe(600_000);
    expect(result.error).toContain("6,000");
  });

  it("allows the minimum order exactly", () => {
    const result = evaluateDiscount(codes, { code: "BIG", subtotalMinor: 1_000_000 });
    expect(result.ok).toBe(true);
    expect(result.discountMinor).toBe(250_000);
  });

  it("does not apply a discount to an empty cart", () => {
    const result = evaluateDiscount(codes, { code: "WELCOME10", subtotalMinor: 0 });
    expect(result.reason).toBe("empty_cart");
  });

  it("survives a store with no codes configured", () => {
    expect(evaluateDiscount(undefined, { code: "ANY", subtotalMinor: 1_000 }).ok).toBe(false);
    expect(evaluateDiscount([], { code: "ANY", subtotalMinor: 1_000 }).reason).toBe("unknown");
  });
});

describe("validateDiscountCodeInput", () => {
  const existing = [percent()];

  it("accepts a reasonable code", () => {
    expect(
      validateDiscountCodeInput({ code: "sale-20", kind: "percent", value: 20 }, existing).isValid,
    ).toBe(true);
  });

  it("rejects a code that is too short or too long", () => {
    expect(validateDiscountCodeInput({ code: "ab", kind: "percent", value: 10 }).isValid).toBe(false);
    expect(
      validateDiscountCodeInput({ code: "X".repeat(25), kind: "percent", value: 10 }).isValid,
    ).toBe(false);
  });

  it("forgives spaces, which are stripped the same way a buyer's typing is", () => {
    // `normalizeDiscountCode` is applied to merchant input and buyer input alike,
    // so "sale 20" and "SALE20" are deliberately the same code — the editor shows
    // the normalized value, so nothing is lost silently.
    expect(
      validateDiscountCodeInput({ code: "sale 20", kind: "percent", value: 20 }).isValid,
    ).toBe(true);
    expect(normalizeDiscountCode("sale 20")).toBe(normalizeDiscountCode("SALE20"));
  });

  it("rejects symbols, which would be unreachable from a phone keyboard", () => {
    expect(validateDiscountCodeInput({ code: "20%OFF", kind: "percent", value: 20 }).isValid).toBe(
      false,
    );
    expect(validateDiscountCodeInput({ code: "sale+20", kind: "percent", value: 20 }).isValid).toBe(
      false,
    );
  });

  it("refuses a duplicate code, case-insensitively", () => {
    expect(
      validateDiscountCodeInput({ code: "welcome10", kind: "percent", value: 10 }, existing).error,
    ).toMatch(/already/i);
  });

  it("lets a code be re-saved under its own id", () => {
    expect(
      validateDiscountCodeInput(
        { code: "WELCOME10", kind: "percent", value: 10 },
        existing,
        "d1",
      ).isValid,
    ).toBe(true);
  });

  it("keeps percentages sane — no 0%, no 150%", () => {
    expect(validateDiscountCodeInput({ code: "FREE", kind: "percent", value: 0 }).isValid).toBe(false);
    expect(validateDiscountCodeInput({ code: "FREE", kind: "percent", value: 150 }).isValid).toBe(
      false,
    );
    expect(validateDiscountCodeInput({ code: "FREE", kind: "percent", value: 90 }).isValid).toBe(
      true,
    );
  });

  it("requires a positive amount for a fixed discount", () => {
    expect(validateDiscountCodeInput({ code: "OFF", kind: "amount", value: 0 }).isValid).toBe(false);
    expect(validateDiscountCodeInput({ code: "OFF", kind: "amount", value: 50_000 }).isValid).toBe(
      true,
    );
  });

  it("rejects a nonsense minimum order", () => {
    expect(
      validateDiscountCodeInput({
        code: "OFF",
        kind: "amount",
        value: 500,
        minSubtotalMinor: -1,
      }).isValid,
    ).toBe(false);
  });

  it("rejects an unreadable expiry date", () => {
    expect(
      validateDiscountCodeInput({ code: "OFF", kind: "amount", value: 500, expiresAt: "soon" })
        .isValid,
    ).toBe(false);
  });
});

describe("sanitizeDiscountCodes", () => {
  it("drops anything unusable instead of throwing", () => {
    expect(sanitizeDiscountCodes(null)).toEqual([]);
    expect(sanitizeDiscountCodes("not an array")).toEqual([]);
    expect(sanitizeDiscountCodes([null, 42, { code: "" }, { code: "X", value: 0 }])).toEqual([]);
  });

  it("normalizes what it keeps", () => {
    const [entry] = sanitizeDiscountCodes([{ code: "welcome 10", kind: "percent", value: 10 }]);
    expect(entry.code).toBe("WELCOME10");
    expect(entry.active).toBe(true);
    expect(entry.id).toBe("WELCOME10");
  });

  it("keeps only the first of two codes that normalize to the same thing", () => {
    const entries = sanitizeDiscountCodes([
      { code: "SALE", kind: "percent", value: 10 },
      { code: "sale", kind: "percent", value: 30 },
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].value).toBe(10);
  });

  it("preserves a retired code rather than resurrecting it", () => {
    const [entry] = sanitizeDiscountCodes([{ code: "OLD", kind: "amount", value: 100, active: false }]);
    expect(entry.active).toBe(false);
  });
});

describe("describeDiscount", () => {
  it("describes a percentage", () => {
    expect(describeDiscount(percent({ value: 15 }))).toBe("15% off");
  });

  it("describes a fixed amount in major units", () => {
    expect(describeDiscount(amount({ value: 50_000 }), "₦")).toBe("₦500 off");
  });
});

describe("findDiscountCode", () => {
  it("finds regardless of case and spacing", () => {
    expect(findDiscountCode([percent()], " welcome 10 ")?.id).toBe("d1");
  });

  it("is null when there is nothing to find", () => {
    expect(findDiscountCode([], "ANY")).toBeNull();
    expect(findDiscountCode([percent()], "")).toBeNull();
  });
});
