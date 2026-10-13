import { describe, expect, it } from "vitest";
import { viewerOwnsStore } from "../store-ownership";

/**
 * These pin the rule that decides whether the storefront offers the customer
 * review form. Getting it wrong in either direction is visible: too strict and
 * the merchant can post a review on their own shop, too loose and a real
 * customer loses the form.
 */
describe("viewerOwnsStore", () => {
  it("recognises the owner from the account's own store list", () => {
    expect(viewerOwnsStore("store-1", "user-1", ["store-1", "store-2"])).toBe(true);
  });

  it("is false for a signed-out visitor", () => {
    expect(viewerOwnsStore("store-1", null, ["store-1"])).toBe(false);
    expect(viewerOwnsStore("store-1", undefined, ["store-1"])).toBe(false);
  });

  it("is false for a signed-in visitor on someone else's store", () => {
    expect(viewerOwnsStore("store-1", "user-1", ["store-2", "store-3"])).toBe(false);
  });

  it("is false when the store list has not loaded or the store has no id", () => {
    expect(viewerOwnsStore("store-1", "user-1", [])).toBe(false);
    expect(viewerOwnsStore(null, "user-1", ["store-1"])).toBe(false);
  });

  it("ignores blank ids in either list", () => {
    expect(viewerOwnsStore("", "user-1", ["store-1"])).toBe(false);
    expect(viewerOwnsStore("store-1", "user-1", [null, undefined, ""])).toBe(false);
  });
});
