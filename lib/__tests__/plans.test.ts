import { describe, expect, it } from "vitest";
import {
  FREE_PRODUCT_LIMIT,
  GRACE_PERIOD_DAYS,
  MAX_PRODUCTS_PER_STORE,
  MAX_STORES_PER_USER,
  applyProductVisibility,
  clampProductVisibility,
  effectiveProductLimitFor,
  effectiveStoreLimitFor,
  formatLimit,
  graceDeadline,
  hiddenProductCount,
  isCleanupEligible,
  isInGrace,
  isLapsed,
  isProductVisible,
  isStorePublished,
  isUnlimited,
  normalizePlan,
  productLimitBlockedMessage,
  productLimitFor,
  productLimitMessage,
  selectPublishedStoreIds,
  storeLimitFor,
  storeLimitMessage,
  visibleProductCount,
} from "../plans";

/**
 * Plan entitlement contracts.
 *
 * The free product cap previously lived in two files with two different values
 * (5 in `BusinessView`, 6 in `SwiftLinkContext`), so a merchant's limit depended
 * on which button they pressed (docs/05-IMPROVEMENT-PLAN.md R-02). These tests
 * pin the tiers so that drift cannot come back silently.
 */
describe("plan limits — single source of truth", () => {
  it("caps the free tier at exactly 6 products", () => {
    expect(FREE_PRODUCT_LIMIT).toBe(6);
    expect(productLimitFor("free")).toBe(6);
    expect(productLimitMessage("free")).toContain("6 products");
  });

  it("treats pro and business as unlimited products", () => {
    for (const plan of ["pro", "business"] as const) {
      expect(isUnlimited(productLimitFor(plan))).toBe(true);
      expect(productLimitMessage(plan)).toBe("This plan allows unlimited products.");
    }
  });

  it("allows multiple stores only on business", () => {
    expect(storeLimitFor("free")).toBe(1);
    expect(storeLimitFor("pro")).toBe(1); // pro is unlimited products, ONE store
    expect(isUnlimited(storeLimitFor("business"))).toBe(true);
    expect(storeLimitMessage("pro", 1)).not.toBe("");
    expect(storeLimitMessage("business", 5)).toBe("");
  });

  it("never grants a paid tier for unknown or missing input", () => {
    for (const value of [undefined, null, "", "PRO", "Business", "enterprise", 0, {}]) {
      expect(normalizePlan(value)).toBe("free");
      expect(productLimitFor(value)).toBe(FREE_PRODUCT_LIMIT);
      expect(storeLimitFor(value)).toBe(1);
    }
  });

  it("formats limits for UI copy", () => {
    expect(formatLimit(productLimitFor("free"))).toBe("6");
    expect(formatLimit(productLimitFor("pro"))).toBe("unlimited");
  });
});

describe("fair-use caps — no single account can take all the space", () => {
  it("keeps the entitlement unlimited but enforces a hard ceiling", () => {
    expect(effectiveProductLimitFor("free")).toBe(6);
    expect(effectiveProductLimitFor("pro")).toBe(MAX_PRODUCTS_PER_STORE);
    expect(effectiveProductLimitFor("business")).toBe(MAX_PRODUCTS_PER_STORE);
    expect(effectiveStoreLimitFor("free")).toBe(1);
    expect(effectiveStoreLimitFor("pro")).toBe(1);
    expect(effectiveStoreLimitFor("business")).toBe(MAX_STORES_PER_USER);
  });

  it("explains the ceiling instead of claiming unlimited when it is hit", () => {
    // The entitlement copy stays honest about the plan …
    expect(productLimitMessage("business")).toContain("unlimited");
    // … while the *blocked* copy names the real ceiling.
    expect(productLimitBlockedMessage("business")).toContain(
      `${MAX_PRODUCTS_PER_STORE}-product fair-use limit`,
    );
    expect(productLimitBlockedMessage("free")).toContain("6 products");
    expect(storeLimitMessage("business", MAX_STORES_PER_USER)).toContain(
      `${MAX_STORES_PER_USER}-store limit`,
    );
    expect(storeLimitMessage("business", MAX_STORES_PER_USER - 1)).toBe("");
  });
});

describe("never-delete downgrade semantics", () => {
  const products: Array<{ id: number; name: string; visible?: boolean }> = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
    { id: 4, name: "D" },
    { id: 5, name: "E" },
    { id: 6, name: "F" },
    { id: 7, name: "G" },
  ];

  it("treats an absent flag as visible", () => {
    expect(isProductVisible({})).toBe(true);
    expect(isProductVisible({ visible: false })).toBe(false);
    expect(isStorePublished({})).toBe(true);
    expect(isStorePublished({ isLive: false })).toBe(false);
  });

  it("hides, never deletes, the products a downgrade pushes over the limit", () => {
    const clamped = clampProductVisibility(products, 6);
    expect(clamped).toHaveLength(products.length); // nothing removed
    expect(visibleProductCount(clamped)).toBe(6);
    expect(hiddenProductCount(clamped)).toBe(1);
    expect(clamped[6]).toMatchObject({ id: 7, visible: false });
  });

  it("lets the vendor choose which products stay visible", () => {
    const chosen = applyProductVisibility(products, [1, 2, 3, 4, 5, 7]);
    expect(chosen).toHaveLength(7);
    expect(visibleProductCount(chosen)).toBe(6);
    expect(chosen.find((p) => p.id === 6)?.visible).toBe(false);
    expect(chosen.find((p) => p.id === 7)?.visible).toBe(true);
  });

  it("keeps already-hidden products hidden while re-picking", () => {
    const hidden = applyProductVisibility(products, [1, 2, 3, 4, 5, 6]);
    const repicked = applyProductVisibility(hidden, [1, 2, 3]);
    expect(repicked.find((p) => p.id === 6)?.visible).toBe(false);
    expect(visibleProductCount(repicked)).toBe(3);
  });

  it("is a no-op when already within the limit", () => {
    const clamped = clampProductVisibility(products.slice(0, 4), 6);
    expect(clamped).toEqual(products.slice(0, 4));
    expect(clampProductVisibility(products, Infinity)).toHaveLength(products.length);
  });

  it("keeps the first store published for single-store plans", () => {
    const stores = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(selectPublishedStoreIds(stores, 1)).toEqual(["a"]);
    expect(selectPublishedStoreIds(stores, Infinity)).toEqual(["a", "b", "c"]);
  });
});

describe("grace period and cleanup eligibility", () => {
  const now = new Date("2026-10-07T12:00:00.000Z");

  it("gives seven days of grace from the failure", () => {
    expect(GRACE_PERIOD_DAYS).toBe(7);
    const deadline = graceDeadline(now);
    expect(deadline.getTime() - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("recognises a store inside its grace window", () => {
    const state = { planGraceUntil: "2026-10-10T12:00:00.000Z" };
    expect(isInGrace(state, now)).toBe(true);
    expect(isLapsed(state, now)).toBe(false);
  });

  it("treats an expired window as no longer in grace", () => {
    expect(isInGrace({ planGraceUntil: "2026-10-01T00:00:00.000Z" }, now)).toBe(false);
  });

  it("never treats a lapsed store as in grace", () => {
    const state = {
      planGraceUntil: "2026-10-20T00:00:00.000Z",
      planLapsedAt: "2026-10-05T00:00:00.000Z",
    };
    expect(isInGrace(state, now)).toBe(false);
    expect(isLapsed(state, now)).toBe(true);
  });

  it("excludes grace and lapsed stores from inactivity cleanup", () => {
    expect(isCleanupEligible({}, now)).toBe(true);
    expect(isCleanupEligible({ planGraceUntil: "2026-10-10T00:00:00.000Z" }, now)).toBe(false);
    expect(isCleanupEligible({ planLapsedAt: "2026-10-01T00:00:00.000Z" }, now)).toBe(false);
    // A grace window that already closed with no lapse recorded is still eligible.
    expect(isCleanupEligible({ planGraceUntil: "2026-10-01T00:00:00.000Z" }, now)).toBe(true);
  });
});
