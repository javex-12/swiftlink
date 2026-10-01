import { describe, expect, it } from "vitest";
import { defaultShopState } from "@/lib/types";
import {
  buildSetupGuide,
  hasCustomizedDesign,
  hasRealStoreName,
  hasWhatsAppNumber,
} from "@/lib/setup-guide";

/** A store that has completed every step, so each test can break one thing. */
function completeStore() {
  return {
    ...defaultShopState(),
    bizName: "Elite Luxe",
    storeUsername: "eliteluxe",
    phone: "+2348080000000",
    products: [
      { id: 1, name: "Cap", price: 5000, description: "", image: "", outOfStock: false },
    ],
    accentColor: "#4f46e5",
  };
}

describe("hasRealStoreName", () => {
  it("rejects the empty default and placeholder names", () => {
    expect(hasRealStoreName("")).toBe(false);
    expect(hasRealStoreName("   ")).toBe(false);
    expect(hasRealStoreName("My Store")).toBe(false);
    expect(hasRealStoreName("store")).toBe(false);
  });

  it("accepts a real name that merely contains the word 'store'", () => {
    // The old heuristic was `bizName.includes("store")`, which locked
    // "Storehouse Foods" out of onboarding forever (docs/00-AUDIT.md F-21).
    expect(hasRealStoreName("Storehouse Foods")).toBe(true);
    expect(hasRealStoreName("Elite Luxe")).toBe(true);
  });
});

describe("hasWhatsAppNumber", () => {
  it("needs at least seven digits", () => {
    expect(hasWhatsAppNumber("")).toBe(false);
    expect(hasWhatsAppNumber("12345")).toBe(false);
    expect(hasWhatsAppNumber("+234 808 000 0000")).toBe(true);
  });
});

describe("hasCustomizedDesign", () => {
  it("is false for a fresh store on defaults", () => {
    expect(hasCustomizedDesign(defaultShopState())).toBe(false);
  });

  it("is true once an accent color or template changes", () => {
    expect(hasCustomizedDesign({ ...defaultShopState(), accentColor: "#111111" })).toBe(true);
    expect(hasCustomizedDesign({ ...defaultShopState(), heroTemplateId: "hero-2" })).toBe(true);
    expect(hasCustomizedDesign({ ...defaultShopState(), storefrontTheme: { background: "dark" } })).toBe(
      true,
    );
  });
});

describe("buildSetupGuide", () => {
  it("reports zero progress for a brand-new store and names the first step", () => {
    const guide = buildSetupGuide(defaultShopState());
    expect(guide.completed).toBe(0);
    expect(guide.total).toBe(5);
    expect(guide.percent).toBe(0);
    expect(guide.isComplete).toBe(false);
    expect(guide.nextStep?.id).toBe("details");
  });

  it("is complete with no next step for a fully set-up store", () => {
    const guide = buildSetupGuide(completeStore());
    expect(guide.completed).toBe(guide.total);
    expect(guide.percent).toBe(100);
    expect(guide.isComplete).toBe(true);
    expect(guide.nextStep).toBeNull();
  });

  it("returns the first incomplete step in order", () => {
    const guide = buildSetupGuide({ ...completeStore(), products: [] });
    expect(guide.nextStep?.id).toBe("products");
    expect(guide.completed).toBe(4);
    expect(guide.percent).toBe(80);
  });

  it("keeps step hrefs pointing at real routes", () => {
    const hrefs = buildSetupGuide(defaultShopState()).steps.map((step) => step.href);
    expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
  });
});
