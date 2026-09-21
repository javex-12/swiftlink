import { describe, expect, it } from "vitest";
import {
  DEFAULT_STOREFRONT_THEME,
  defaultShopState,
  loadStateLocal,
  normalizeHexColor,
  normalizeShopState,
  resolveStorefrontTheme,
} from "@/lib/types";

describe("defaultShopState", () => {
  it("starts as a free, live store with an empty catalog", () => {
    const state = defaultShopState();
    expect(state.id).toBeNull();
    expect(state.plan).toBe("free");
    expect(state.products).toEqual([]);
    expect(state.isLive).toBe(true);
    expect(state.currency).toBe("₦");
  });

  it("seeds a hero and catalog section so a new store is never blank", () => {
    const state = defaultShopState();
    expect(state.sections.map((s) => s.type)).toEqual(["hero", "catalog"]);
  });
});

describe("normalizeShopState", () => {
  it("returns usable defaults for null or undefined input", () => {
    expect(normalizeShopState(null).products).toEqual([]);
    expect(normalizeShopState(undefined).sections.length).toBeGreaterThan(0);
  });

  it("backfills a product's primary image from its gallery", () => {
    const state = normalizeShopState({
      products: [
        {
          id: 1,
          name: "Cap",
          price: 5000,
          description: "",
          image: "",
          images: ["https://cdn.example/cap.png"],
          outOfStock: false,
        },
      ],
    });
    expect(state.products[0].image).toBe("https://cdn.example/cap.png");
  });

  it("coerces array-shaped fields that arrive as the wrong type", () => {
    const state = normalizeShopState({
      products: null as never,
      categories: "shoes" as never,
      notifications: {} as never,
      testimonials: undefined,
    });
    expect(state.products).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.notifications).toEqual([]);
    expect(state.testimonials).toEqual([]);
  });

  it("repairs malformed sections instead of dropping them", () => {
    const state = normalizeShopState({
      sections: [
        // missing id / type / order / content
        {} as never,
        { type: "about", title: "Story", content: { text: "hi" } } as never,
      ],
    });
    expect(state.sections).toHaveLength(2);
    expect(state.sections[0].id).toBe("section-0");
    expect(state.sections[0].type).toBe("catalog");
    expect(state.sections[0].order).toBe(0);
    expect(state.sections[1].type).toBe("about");
    expect(state.sections[1].order).toBe(1);
    expect(state.sections[1].content).toEqual({ text: "hi" });
  });

  it("keeps a hidden section hidden", () => {
    const state = normalizeShopState({
      sections: [{ type: "hero", isVisible: false } as never],
    });
    expect(state.sections[0].isVisible).toBe(false);
  });
});

describe("normalizeHexColor", () => {
  it("accepts 6-digit hex and normalizes case", () => {
    expect(normalizeHexColor("#AABBCC")).toBe("#aabbcc");
  });

  it("expands 3-digit hex", () => {
    expect(normalizeHexColor("#abc")).toBe("#aabbcc");
  });

  it("falls back for invalid input", () => {
    expect(normalizeHexColor("emerald")).toBe("#10b981");
    expect(normalizeHexColor("")).toBe("#10b981");
    expect(normalizeHexColor("#12345")).toBe("#10b981");
    expect(normalizeHexColor("nope", "#000000")).toBe("#000000");
  });
});

describe("resolveStorefrontTheme", () => {
  it("returns the default theme for an empty store", () => {
    expect(resolveStorefrontTheme({})).toEqual(DEFAULT_STOREFRONT_THEME);
  });

  it("lets the store accent color drive the theme's primary color", () => {
    const theme = resolveStorefrontTheme({ accentColor: "#FF0055" });
    expect(theme.primaryColor).toBe("#ff0055");
  });

  it("sanitizes an invalid accent color back to the default", () => {
    expect(resolveStorefrontTheme({ accentColor: "not-a-color" }).primaryColor).toBe(
      DEFAULT_STOREFRONT_THEME.primaryColor,
    );
  });

  it("maps legacy heroStyle onto the theme layout", () => {
    expect(resolveStorefrontTheme({ heroStyle: "banner" }).heroLayout).toBe("banner");
    expect(resolveStorefrontTheme({ heroStyle: "split" }).heroLayout).toBe("split");
  });
});

describe("loadStateLocal", () => {
  it("returns defaults when there is no browser storage", () => {
    expect(loadStateLocal().id).toBeNull();
  });
});
