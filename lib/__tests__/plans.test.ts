import { describe, expect, it } from "vitest";
import {
  FREE_PRODUCT_LIMIT,
  GRACE_PERIOD_DAYS,
  MAX_PRODUCTS_PER_STORE,
  MAX_STORES_PER_USER,
  PLANS,
  PLAN_DETAILS,
  accountPlanFor,
  applyProductVisibility,
  canCreateStore,
  canSwitchStore,
  clampProductVisibility,
  effectiveProductLimitFor,
  effectiveStoreLimitFor,
  entitledPlanFor,
  formatLimit,
  formatUsage,
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
  reconcileAccountPlan,
  selectPublishedStoreIds,
  storeActionBlockedMessage,
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

  /*
   * Paid plans are capped, and the cap is the number the pricing page quotes.
   * These used to be infinite entitlements with a hidden 1,000 ceiling, so the
   * product could refuse a save against a limit no screen had mentioned.
   */
  it("caps pro and business at the published per-store limit, not at infinity", () => {
    for (const plan of ["pro", "business"] as const) {
      expect(productLimitFor(plan)).toBe(MAX_PRODUCTS_PER_STORE);
      expect(isUnlimited(productLimitFor(plan))).toBe(false);
      expect(productLimitMessage(plan)).toContain(String(MAX_PRODUCTS_PER_STORE));
      expect(productLimitMessage(plan)).not.toContain("unlimited");
    }
  });

  it("allows multiple stores only on business", () => {
    expect(storeLimitFor("free")).toBe(1);
    expect(storeLimitFor("pro")).toBe(1); // pro is the catalogue tier: ONE store
    expect(storeLimitFor("business")).toBe(MAX_STORES_PER_USER);
    expect(isUnlimited(storeLimitFor("business"))).toBe(false);
    expect(storeLimitMessage("pro", 1)).not.toBe("");
    expect(storeLimitMessage("business", 5)).toBe("");
  });

  /*
   * Entitlements are per account, not per store row. This pins the fix for a
   * live bug: `createNewStore` inserted `plan: 'free'`, and `fetchStores`
   * treated the DB column as authoritative, so a paying Business merchant who
   * added a second store silently demoted their whole account to the free
   * tier's 6 products with multi-store switching hidden.
   */
  describe("accountPlanFor — the account's plan is the best plan it owns", () => {
    it("keeps a paying account paid when one store row says free", () => {
      const plan = accountPlanFor([{ plan: "business" }, { plan: "free" }]);
      expect(plan).toBe("business");
      expect(effectiveProductLimitFor(plan)).toBe(MAX_PRODUCTS_PER_STORE);
      expect(effectiveStoreLimitFor(plan)).toBe(MAX_STORES_PER_USER);
    });

    it("does not promote an all-free account", () => {
      expect(accountPlanFor([{ plan: "free" }, { plan: "free" }])).toBe("free");
    });

    it("takes pro over free but business over pro", () => {
      expect(accountPlanFor([{ plan: "free" }, { plan: "pro" }])).toBe("pro");
      expect(accountPlanFor([{ plan: "pro" }, { plan: "business" }])).toBe("business");
    });

    it("is free for an empty account and ignores unrecognised values", () => {
      expect(accountPlanFor([])).toBe("free");
      expect(accountPlanFor([{ plan: undefined }, { plan: "enterprise" }])).toBe("free");
    });

    it("a lapsed (downgraded to free) account no longer reads as business", () => {
      // A downgrade writes every row, so no stale paid row survives it.
      expect(accountPlanFor([{ plan: "free" }, { plan: "free" }])).toBe("free");
    });
  });

  /*
   * The entitlement is not the row value. An administrator of the deployment
   * holds Business without any `stores.plan` saying so — and that override used
   * to live in local state, where `fetchStores` overwrote it, so the badge
   * flicked to the real tier and admins were capped at six products.
   */
  describe("entitledPlanFor — administrators hold Business without a row saying so", () => {
    it("gives an admin Business even when every row is free", () => {
      const plan = entitledPlanFor([{ plan: "free" }, { plan: "free" }], { isAdmin: true });
      expect(plan).toBe("business");
      expect(effectiveProductLimitFor(plan)).toBe(MAX_PRODUCTS_PER_STORE);
      expect(effectiveStoreLimitFor(plan)).toBe(MAX_STORES_PER_USER);
    });

    it("does not promote a non-admin, however many stores they own", () => {
      expect(entitledPlanFor([{ plan: "free" }, { plan: "free" }], { isAdmin: false })).toBe("free");
      expect(entitledPlanFor([{ plan: "free" }])).toBe("free");
    });

    it("still reports a paid plan for a non-admin subscriber", () => {
      expect(entitledPlanFor([{ plan: "pro" }], { isAdmin: false })).toBe("pro");
    });
  });

  /*
   * The store rules had no enforcement outside one screen, and the live
   * database showed the cost: an owner on the free tier holding three stores.
   * These pin the predicates the context now refuses on.
   */
  describe("store actions the plan gates", () => {
    it("free and pro may not create a second store; business can, up to the account cap", () => {
      expect(canCreateStore("free", 0)).toBe(true);
      expect(canCreateStore("free", 1)).toBe(false);
      expect(canCreateStore("pro", 1)).toBe(false);
      expect(canCreateStore("business", 1)).toBe(true);
      expect(canCreateStore("business", MAX_STORES_PER_USER - 1)).toBe(true);
      expect(canCreateStore("business", MAX_STORES_PER_USER)).toBe(false);
    });

    it("only business may move between stores it owns", () => {
      expect(canSwitchStore("free")).toBe(false);
      expect(canSwitchStore("pro")).toBe(false);
      expect(canSwitchStore("business")).toBe(true);
    });

    it("explains the refusal in terms of the upgrade, and says nothing when allowed", () => {
      expect(storeActionBlockedMessage("free", 1)).toContain("Business");
      expect(storeActionBlockedMessage("free", 3)).toContain("Business");
      expect(storeActionBlockedMessage("business", 9)).toBe("");
    });
  });

  describe("plan presentation — one description per tier", () => {
    it("covers every plan exactly once", () => {
      for (const id of PLANS) {
        expect(PLAN_DETAILS[id].id).toBe(id);
        expect(PLAN_DETAILS[id].name).not.toBe("");
        expect(PLAN_DETAILS[id].price).not.toBe("");
        expect(PLAN_DETAILS[id].features.length).toBeGreaterThan(0);
      }
    });

    it("describes the real entitlements, not aspirational ones", () => {
      expect(PLAN_DETAILS.free.features.join(" ")).toContain(String(FREE_PRODUCT_LIMIT));
      // Neither paid tier may promise an unbounded catalogue.
      for (const id of ["pro", "business"] as const) {
        const copy = PLAN_DETAILS[id].features.join(" ");
        expect(copy).toContain(MAX_PRODUCTS_PER_STORE.toLocaleString());
        expect(copy.toLowerCase()).not.toContain("unlimited");
      }
      expect(PLAN_DETAILS.business.features.join(" ")).toContain(String(MAX_STORES_PER_USER));
    });

    it("describes the tiers cumulatively, in words a merchant can act on", () => {
      // A higher tier contains the one below it, and says so instead of
      // repeating features a merchant already has.
      expect(PLAN_DETAILS.pro.features).toContain("Everything in Free");
      expect(PLAN_DETAILS.business.features).toContain("Everything in Pro");

      // "Custom domain" reads as though the company will register one for them.
      const businessCopy = PLAN_DETAILS.business.features.join(" ");
      expect(businessCopy).toContain("Connect your own domain");
      expect(businessCopy).not.toContain("Custom domain");
      expect(businessCopy).toContain("No SwiftLink branding");
    });

    it("formats usage against the enforced cap", () => {
      expect(formatUsage(4, productLimitFor("free"))).toBe("4 of 6");
      expect(formatUsage(4, productLimitFor("business"))).toBe(`4 of ${MAX_PRODUCTS_PER_STORE}`);
    });
  });

  describe("reconcileAccountPlan — what the console loads on boot", () => {
    it("keeps a business account business and names the row to repair", () => {
      const { accountPlan, staleIds } = reconcileAccountPlan([
        { id: "paid", plan: "business" },
        { id: "second", plan: "free" },
      ]);
      expect(accountPlan).toBe("business");
      expect(staleIds).toEqual(["second"]);
    });

    it("reads the state mirror when the column is absent", () => {
      const { accountPlan, staleIds } = reconcileAccountPlan([
        { id: "a", state_json: { plan: "business" } },
        { id: "b", plan: "free" },
      ]);
      expect(accountPlan).toBe("business");
      expect(staleIds).toEqual(["b"]);
    });

    it("reports nothing to repair when every row agrees", () => {
      const { accountPlan, staleIds } = reconcileAccountPlan([
        { id: "a", plan: "free" },
        { id: "b", state_json: { plan: "free" } },
      ]);
      expect(accountPlan).toBe("free");
      expect(staleIds).toEqual([]);
    });

    it("ignores an id-less row when listing repairs (nothing to update)", () => {
      const { staleIds } = reconcileAccountPlan([{ plan: "business" }, { plan: "free" }]);
      expect(staleIds).toEqual([]);
    });
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
    expect(formatLimit(productLimitFor("pro"))).toBe(String(MAX_PRODUCTS_PER_STORE));
  });
});

describe("per-store ceilings — no single account can take all the space", () => {
  it("enforces the same finite ceiling the plan copy states", () => {
    expect(effectiveProductLimitFor("free")).toBe(6);
    expect(effectiveProductLimitFor("pro")).toBe(MAX_PRODUCTS_PER_STORE);
    expect(effectiveProductLimitFor("business")).toBe(MAX_PRODUCTS_PER_STORE);
    expect(effectiveStoreLimitFor("free")).toBe(1);
    expect(effectiveStoreLimitFor("pro")).toBe(1);
    expect(effectiveStoreLimitFor("business")).toBe(MAX_STORES_PER_USER);
  });

  it("names the ceiling in both the entitlement and the blocked copy", () => {
    // The entitlement copy names the cap the merchant bought …
    expect(productLimitMessage("business")).toContain(String(MAX_PRODUCTS_PER_STORE));
    expect(productLimitMessage("business")).not.toContain("unlimited");
    // … and the *blocked* copy names the same number, not a second one.
    expect(productLimitBlockedMessage("business")).toContain(
      `${MAX_PRODUCTS_PER_STORE.toLocaleString()}-product limit`,
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
