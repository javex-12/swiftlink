import { describe, expect, it } from "vitest";
import { pickNewestDraft, storeDraftKey, summarizeDraft } from "../store-drafts";
import { defaultShopState } from "../types";
import type { Product } from "../schema";

function product(id: number, name = `Product ${id}`): Product {
  return {
    id,
    name,
    price: 1000,
    description: "",
    category: "General",
    image: "",
    images: [],
    outOfStock: false,
  } as Product;
}

describe("storeDraftKey", () => {
  it("prefers the store id", () => {
    expect(storeDraftKey({ id: "store-9", ownerId: "user-1" })).toBe("store-9");
  });

  it("falls back to the owner for a store with no id yet", () => {
    expect(storeDraftKey({ id: null, ownerId: "user-1" })).toBe("user-1");
  });

  it("returns null when there is no identity", () => {
    expect(storeDraftKey({ id: null, ownerId: undefined })).toBeNull();
    expect(storeDraftKey(null)).toBeNull();
  });
});

describe("summarizeDraft", () => {
  it("reports an unchanged draft as empty", () => {
    const live = defaultShopState();
    const summary = summarizeDraft({ state: defaultShopState() }, live);
    expect(summary.isEmpty).toBe(true);
    expect(summary.changedFields).toEqual([]);
    expect(summary.addedProducts).toBe(0);
  });

  it("lists changed top-level fields alphabetically", () => {
    const live = defaultShopState();
    const draft = { ...defaultShopState(), tagline: "New tagline", accentColor: "#000000" };
    const summary = summarizeDraft({ state: draft }, live);
    expect(summary.isEmpty).toBe(false);
    expect(summary.changedFields).toEqual(["accentColor", "tagline"]);
  });

  it("counts added and removed products", () => {
    const live = { ...defaultShopState(), products: [product(1), product(2)] };
    const draft = { ...defaultShopState(), products: [product(2), product(3), product(4)] };
    const summary = summarizeDraft({ state: draft }, live);
    expect(summary.addedProducts).toBe(2);
    expect(summary.removedProducts).toBe(1);
  });

  it("caps the reported field list", () => {
    const live = defaultShopState();
    const draft: typeof live = {
      ...defaultShopState(),
      tagline: "a",
      accentColor: "#111111",
      bgColor: "#222222",
      textColor: "#333333",
      surfaceColor: "#444444",
      buttonColor: "#555555",
      aboutUs: "about",
      bizName: "Name",
      phone: "+2348000000000",
      currency: "$",
    };
    expect(summarizeDraft({ state: draft }, live).changedFields.length).toBeLessThanOrEqual(8);
  });

  it("is empty when either side is missing", () => {
    expect(summarizeDraft(null, defaultShopState()).isEmpty).toBe(true);
    expect(summarizeDraft({ state: defaultShopState() }, null).isEmpty).toBe(true);
  });
});

describe("pickNewestDraft", () => {
  const older = { savedAt: "2026-10-08T10:00:00.000Z", state: defaultShopState() };
  const newer = { savedAt: "2026-10-08T11:00:00.000Z", state: defaultShopState() };

  it("prefers the most recently saved copy", () => {
    expect(pickNewestDraft(older, newer)).toBe(newer);
    expect(pickNewestDraft(newer, older)).toBe(newer);
  });

  it("ignores missing and malformed drafts", () => {
    expect(pickNewestDraft(null, undefined)).toBeNull();
    expect(pickNewestDraft({ savedAt: "nonsense", state: defaultShopState() }, older)).toBe(older);
  });

  it("keeps a draft without a usable timestamp rather than losing it", () => {
    const undated = { savedAt: "not-a-date", state: defaultShopState() };
    expect(pickNewestDraft(undated)).toBe(undated);
  });
});
