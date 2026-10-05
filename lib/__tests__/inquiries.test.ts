import { describe, expect, it } from "vitest";
import { normalizePhoneNumber } from "../phone";
import { validateStoreHandle, generateHandleSuggestions, RESERVED_HANDLES } from "../handle";
import {
  computeDedupeKey,
  validateInquiryStatusTransition,
  resolveInquirySource,
} from "../inquiries";

describe("Phone Validation and Normalization", () => {
  it("normalizes standard Nigerian local numbers with leading 0", () => {
    const res = normalizePhoneNumber("0808 123 4567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("+2348081234567");
  });

  it("normalizes Nigerian numbers with +234 and spaces/dashes", () => {
    const res = normalizePhoneNumber("+234-808-123-4567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("+2348081234567");
  });

  it("normalizes Nigerian numbers starting with 234 without plus", () => {
    const res = normalizePhoneNumber("2348081234567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("+2348081234567");
  });

  it("normalizes 10-digit Nigerian local numbers without leading 0", () => {
    const res = normalizePhoneNumber("8081234567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("+2348081234567");
  });

  it("rejects numbers with incorrect digit count", () => {
    const resShort = normalizePhoneNumber("0808 000 00");
    expect(resShort.isValid).toBe(false);
    expect(resShort.error).toContain("10 digits");

    const resLong = normalizePhoneNumber("0808 123 456789");
    expect(resLong.isValid).toBe(false);
  });

  it("handles valid international E.164 numbers", () => {
    const resUK = normalizePhoneNumber("+447911123456");
    expect(resUK.isValid).toBe(true);
    expect(resUK.normalized).toBe("+447911123456");
  });
});

describe("Store Handle Validation & Suggestions", () => {
  it("validates correct store handles", () => {
    expect(validateStoreHandle("ada-closet").isValid).toBe(true);
    expect(validateStoreHandle("kicks24").isValid).toBe(true);
  });

  it("rejects handles shorter than 3 characters or longer than 32", () => {
    expect(validateStoreHandle("ab").isValid).toBe(false);
    expect(validateStoreHandle("a".repeat(33)).isValid).toBe(false);
  });

  it("rejects reserved handles", () => {
    expect(validateStoreHandle("admin").isValid).toBe(false);
    expect(validateStoreHandle("api").isValid).toBe(false);
    expect(validateStoreHandle("dashboard").isValid).toBe(false);
    expect(validateStoreHandle("settings").isValid).toBe(false);
  });

  it("generates 3 distinct available suggestions when handle is taken", () => {
    const suggestions = generateHandleSuggestions("adas-closet");
    expect(suggestions).toHaveLength(3);
    expect(suggestions).toEqual([
      "adas-closet-ng",
      "adas-closet-store",
      "adas-closet-shop",
    ]);
  });
});

describe("Inquiries Deduplication & Sold Invariants", () => {
  it("generates matching dedupe key for taps in the same 15-minute slot", () => {
    const t1 = new Date("2026-10-01T14:02:00Z");
    const t2 = new Date("2026-10-01T14:14:00Z");
    const key1 = computeDedupeKey("store-1", 101, "device-abc", t1);
    const key2 = computeDedupeKey("store-1", 101, "device-abc", t2);
    expect(key1).toBe(key2);
  });

  it("generates different dedupe key across 15-minute slots", () => {
    const t1 = new Date("2026-10-01T14:14:00Z");
    const t2 = new Date("2026-10-01T14:16:00Z");
    const key1 = computeDedupeKey("store-1", 101, "device-abc", t1);
    const key2 = computeDedupeKey("store-1", 101, "device-abc", t2);
    expect(key1).not.toBe(key2);
  });

  it("enforces sold invariant: final_amount_naira and sold_at are required", () => {
    // Missing amount
    const noAmount = validateInquiryStatusTransition("sold", null, "2026-10-01T14:00:00Z");
    expect(noAmount.isValid).toBe(false);

    // Missing sold_at
    const noDate = validateInquiryStatusTransition("sold", 5000, null);
    expect(noDate.isValid).toBe(false);

    // Valid sold transition
    const valid = validateInquiryStatusTransition("sold", 5000, "2026-10-01T14:00:00Z");
    expect(valid.isValid).toBe(true);

    // Other statuses do not require amount
    expect(validateInquiryStatusTransition("chatting", null, null).isValid).toBe(true);
    expect(validateInquiryStatusTransition("lost", null, null).isValid).toBe(true);
  });

  it("resolves source with ?src= taking precedence over referrer", () => {
    expect(resolveInquirySource("ig", "https://wa.me")).toBe("instagram");
    expect(resolveInquirySource("whatsapp", "https://google.com")).toBe("whatsapp");
    expect(resolveInquirySource(null, "https://l.instagram.com/")).toBe("instagram");
    expect(resolveInquirySource(null, "https://www.tiktok.com/")).toBe("tiktok");
    expect(resolveInquirySource(null, null)).toBe("direct");
  });

  it("simulates customer trigger logic for status flips: sold -> lost -> sold", () => {
    // Model customer state
    let customer = { chats_count: 1, sold_count: 0 };

    // Flip to sold
    let currentInquiryStatus = "new";
    let nextStatus = "sold";
    if (currentInquiryStatus !== "sold" && nextStatus === "sold") {
      customer.sold_count += 1;
    }
    currentInquiryStatus = nextStatus;
    expect(customer.sold_count).toBe(1);

    // Reversal: flip to lost
    nextStatus = "lost";
    if (currentInquiryStatus === "sold" && nextStatus !== "sold") {
      customer.sold_count = Math.max(0, customer.sold_count - 1);
    }
    currentInquiryStatus = nextStatus;
    expect(customer.sold_count).toBe(0);

    // Flip back to sold
    nextStatus = "sold";
    if (currentInquiryStatus !== "sold" && nextStatus === "sold") {
      customer.sold_count += 1;
    }
    currentInquiryStatus = nextStatus;
    expect(customer.sold_count).toBe(1);
    expect(customer.chats_count).toBe(1); // chats_count only incremented on new inquiry insert
  });
});
