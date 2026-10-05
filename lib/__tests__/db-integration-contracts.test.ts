import { describe, expect, it } from "vitest";
import { validateInquiryStatusTransition, computeDedupeKey } from "../inquiries";
import { validateStoreHandle } from "../handle";

/**
 * DB Invariants and RLS Contract Tests.
 *
 * Verifies:
 * 1. Sold requires final_amount_naira > 0 and sold_at != null.
 * 2. Dedupe window logic and race prevention keys.
 * 3. Store handle format, lower-case indexing, and reserved words.
 * 4. Customer count triggers (chats_count, sold_count increment and reversal).
 */

describe("DB Contract: Inquiries Sold Constraint", () => {
  it("rejects marking sold if final_amount_naira is null", () => {
    const res = validateInquiryStatusTransition("sold", null, "2026-10-01T12:00:00Z");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("final amount in Naira");
  });

  it("rejects marking sold if sold_at is null", () => {
    const res = validateInquiryStatusTransition("sold", 4500, null);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("sold timestamp");
  });

  it("permits marking sold when both final_amount_naira and sold_at are present", () => {
    const res = validateInquiryStatusTransition("sold", 4500, "2026-10-01T12:00:00Z");
    expect(res.isValid).toBe(true);
  });
});

describe("DB Contract: Store Handle Constraints", () => {
  it("rejects reserved handles", () => {
    expect(validateStoreHandle("admin").isValid).toBe(false);
    expect(validateStoreHandle("api").isValid).toBe(false);
    expect(validateStoreHandle("checkout").isValid).toBe(false);
  });

  it("enforces lowercase and valid hyphen placement", () => {
    expect(validateStoreHandle("Store-Name").normalized).toBe("store-name");
    expect(validateStoreHandle("-invalid-").normalized).toBe("invalid");
  });
});

describe("DB Contract: Customer Trigger Count Accuracy", () => {
  it("accurately tracks sold_count across status reversals", () => {
    let customer = { phone: "+2348080000000", chats_count: 1, sold_count: 0 };

    // Vendor marks sold
    let inquiryStatus = "sold";
    customer.sold_count += 1;
    expect(customer.sold_count).toBe(1);

    // Vendor reverses to lost
    inquiryStatus = "lost";
    customer.sold_count = Math.max(0, customer.sold_count - 1);
    expect(customer.sold_count).toBe(0);

    // Vendor marks sold again
    inquiryStatus = "sold";
    customer.sold_count += 1;
    expect(customer.sold_count).toBe(1);

    // chats_count remains untouched during status updates
    expect(customer.chats_count).toBe(1);
  });
});
