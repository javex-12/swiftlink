import { describe, expect, it } from "vitest";
import type { ShopState, Product } from "../schema";
import { FREE_PRODUCT_LIMIT } from "../plans";
import { repairAccountToPlan, repairNotice, repairWrites, runningStoreIdFor } from "../plan-enforcement";

/**
 * The states here are the ones the live database actually contained: free-tier
 * rows holding far more than the plan allows, left behind because the caps only
 * ever blocked *new* products and *new* stores.
 */
function product(id: number, visible?: boolean): Product {
  return {
    id,
    name: `Product ${id}`,
    price: 1000,
    description: "",
    image: "",
    outOfStock: false,
    ...(visible === undefined ? {} : { visible }),
  };
}

function store(overrides: Partial<ShopState> & { id: string }): ShopState {
  return {
    bizName: overrides.id,
    bizImage: "",
    phone: "",
    currency: "NGN",
    products: [],
    tagline: "",
    aboutUs: "",
    sections: [],
    categories: [],
    notifications: [],
    orderMethod: "whatsapp",
    ...overrides,
  } as ShopState;
}

const freeWithNineProducts = () =>
  store({
    id: "store-1",
    plan: "free",
    isLive: true,
    products: Array.from({ length: 9 }, (_, index) => product(index + 1)),
  });

describe("repairAccountToPlan — products", () => {
  it("hides the overflow beyond the cap and deletes nothing", () => {
    const before = freeWithNineProducts();
    const { stores, repair } = repairAccountToPlan([before]);

    const repaired = stores[0];
    expect(repaired.products).toHaveLength(9);
    expect(repaired.products.filter((p) => p.visible !== false)).toHaveLength(FREE_PRODUCT_LIMIT);
    expect(repair.hiddenProducts).toBe(3);
  });

  it("keeps the merchant's existing order and existing hidden products", () => {
    const products = Array.from({ length: 8 }, (_, index) => product(index + 1));
    products[1] = product(2, false);
    const { stores } = repairAccountToPlan([store({ id: "s", plan: "free", products })]);

    // The already-hidden product stays hidden and does not consume an allowance.
    expect(stores[0].products[1].visible).toBe(false);
    expect(stores[0].products.filter((p) => p.visible !== false).map((p) => p.id)).toEqual([1, 3, 4, 5, 6, 7]);
  });

  it("leaves a catalogue that already fits exactly as it was", () => {
    const before = store({ id: "s", plan: "free", products: [product(1), product(2)] });
    const { stores, repair } = repairAccountToPlan([before]);
    expect(stores[0]).toBe(before);
    expect(repair.hiddenProducts).toBe(0);
  });

  it("does not cap a paid plan", () => {
    const before = store({
      id: "s",
      plan: "business",
      products: Array.from({ length: 40 }, (_, index) => product(index + 1)),
    });
    const { stores, repair } = repairAccountToPlan([before]);
    expect(stores[0]).toBe(before);
    expect(repair.hiddenProducts).toBe(0);
  });
});

describe("repairAccountToPlan — stores", () => {
  it("pauses the extra stores of a single-store plan, keeping every row", () => {
    const rows = [
      store({ id: "s1", plan: "free", isLive: true }),
      store({ id: "s2", plan: "free", isLive: true }),
      store({ id: "s3", plan: "free", isLive: true }),
    ];
    const { stores, repair } = repairAccountToPlan(rows);

    expect(stores).toHaveLength(3);
    expect(stores.map((s) => s.isLive)).toEqual([true, false, false]);
    expect(repair.unpublishedStoreIds).toEqual(["s2", "s3"]);
  });

  it("keeps the named running store published instead of the first row", () => {
    const rows = [
      store({ id: "s1", plan: "free", isLive: true }),
      store({ id: "s2", plan: "free", isLive: true }),
    ];
    const { stores } = repairAccountToPlan(rows, "s2");
    expect(stores.map((s) => s.isLive)).toEqual([false, true]);
  });

  it("is idempotent — a second pass changes nothing", () => {
    const rows = [
      store({ id: "s1", plan: "free", isLive: true }),
      store({ id: "s2", plan: "free", isLive: true, products: Array.from({ length: 8 }, (_, i) => product(i + 1)) }),
    ];
    const first = repairAccountToPlan(rows);
    const second = repairAccountToPlan(first.stores);

    expect(second.stores[0]).toBe(first.stores[0]);
    expect(second.stores[1]).toBe(first.stores[1]);
    expect(second.repair.hiddenProducts).toBe(0);
    expect(second.repair.unpublishedStoreIds).toEqual([]);
  });

  it("lets a Business account keep every store published", () => {
    const rows = [
      store({ id: "s1", plan: "business", isLive: true }),
      store({ id: "s2", plan: "business", isLive: true }),
    ];
    const { stores, repair } = repairAccountToPlan(rows);
    expect(stores[0]).toBe(rows[0]);
    expect(stores[1]).toBe(rows[1]);
    expect(repair.unpublishedStoreIds).toEqual([]);
  });

  it("resolves the plan across rows, so one paid row lifts the account", () => {
    const rows = [
      store({ id: "s1", plan: "free", isLive: true }),
      store({ id: "s2", plan: "business", isLive: true }),
    ];
    const { repair } = repairAccountToPlan(rows);
    expect(repair.unpublishedStoreIds).toEqual([]);
  });
});

describe("repairWrites and repairNotice", () => {
  it("returns only the rows that actually changed, with a real id", () => {
    const rows = [
      store({ id: "s1", plan: "free", isLive: true }),
      store({ id: "s2", plan: "free", isLive: true }),
    ];
    const result = repairAccountToPlan(rows);
    expect(repairWrites(rows, result).map((write) => write.id)).toEqual(["s2"]);
  });

  it("names what happened without claiming anything was deleted", () => {
    const result = repairAccountToPlan([
      store({
        id: "s1",
        plan: "free",
        isLive: true,
        products: Array.from({ length: 9 }, (_, i) => product(i + 1)),
      }),
      store({ id: "s2", plan: "free", isLive: true }),
    ]);

    expect(result.repair.hiddenProducts).toBe(3);
    const notice = repairNotice("free", result.repair, "Free");
    expect(notice).toContain("3 products hidden");
    expect(notice).toContain("1 store paused");
    expect(notice).toContain("nothing was deleted");
  });

  it("says nothing when there is nothing to repair", () => {
    expect(repairNotice("free", { storeId: null, hiddenProducts: 0, unpublishedStoreIds: [] }, "Free")).toBe("");
  });
});

describe("runningStoreIdFor", () => {
  it("names the first published store a single-store plan keeps", () => {
    const rows = [
      store({ id: "s1", plan: "free", isLive: false }),
      store({ id: "s2", plan: "free", isLive: true }),
    ];
    expect(runningStoreIdFor(rows, "free")).toBe("s2");
  });
});
