import { describe, expect, it } from "vitest";
import {
  buildSiteJsonLd,
  buildStoreDirectoryJsonLd,
  buildStoreJsonLd,
  SEO_SITE,
  storeKeywords,
  storeOrigin,
  storeTitle,
} from "../seo";
import type { ShopState } from "../schema";

function storeState(overrides: Partial<ShopState> = {}): Partial<ShopState> {
  return {
    bizName: "Cyd Store",
    tagline: "Sneakers and streetwear",
    location: "Lagos",
    currency: "NGN",
    bizImage: "https://cdn.example.com/cyd.png",
    products: [
      { id: 1, name: "Jordan 4 Retro", price: 140000, description: "Black Cat", image: "https://cdn.example.com/j4.png", outOfStock: false },
      { id: 2, name: "Hidden item", price: 10, description: "", image: "", outOfStock: true, visible: false },
      { id: 3, name: "Base64 item", price: 20, description: "", image: "data:image/png;base64,AAAA", outOfStock: false },
    ],
    ...overrides,
  } as Partial<ShopState>;
}

describe("buildStoreJsonLd", () => {
  it("names the store and points at its canonical URL", () => {
    const json = buildStoreJsonLd({ handle: "cyd-store", state: storeState(), description: "Shop Cyd" });
    const graph = json["@graph"] as Record<string, unknown>[];
    const store = graph[0] as Record<string, unknown>;
    expect(store["@type"]).toBe("Store");
    expect(store.name).toBe("Cyd Store");
    expect(store.url).toBe(`${SEO_SITE}/cyd-store`);
    expect(store.address).toMatchObject({ addressLocality: "Lagos" });
  });

  it("never advertises hidden products", () => {
    const json = buildStoreJsonLd({ handle: "cyd-store", state: storeState(), description: "Shop Cyd" });
    const serialized = JSON.stringify(json);
    expect(serialized).toContain("Jordan 4 Retro");
    expect(serialized).not.toContain("Hidden item");
    // Base64 images are unusable to a crawler and must not leak into markup.
    expect(serialized).not.toContain("base64");
  });

  it("marks out-of-stock availability", () => {
    const json = buildStoreJsonLd({
      handle: "cyd-store",
      state: storeState({
        products: [{ id: 9, name: "Sold out", price: 5, description: "", image: "", outOfStock: true }],
      }),
      description: "",
    });
    expect(JSON.stringify(json)).toContain("OutOfStock");
  });
});

describe("findability — the store page has to own its own name", () => {
  it("titles the page '<name> — … Online Store', not 'Shop Online'", () => {
    // A shopper looking for Cyd types "cyd store". "Cyd — Shop Online" has no
    // "store" token for a search engine to match on the page that owns the name.
    expect(storeTitle("Cyd")).toContain("Cyd");
    expect(storeTitle("Cyd")).toContain("Store");
    expect(storeTitle("Cyd", "Sneakers and streetwear")).toContain("Sneakers and streetwear");
    // A long tagline is dropped rather than truncated mid-word in a result.
    expect(storeTitle("Cyd", "x".repeat(60))).toBe("Cyd — Online Store");
  });

  it("keywords cover the name plus the words people add to it", () => {
    const keywords = storeKeywords(
      { bizName: "Cyd", location: "Lagos", categories: ["Sneakers"] },
      "cyd-store",
    );
    expect(keywords).toContain("Cyd store");
    expect(keywords).toContain("Cyd shop");
    expect(keywords).toContain("Cyd store Lagos");
    expect(keywords).toContain("@cyd-store");
    expect(keywords).toContain("Sneakers Lagos");
  });

  it("canonicalises to a verified custom domain, else the platform path", () => {
    expect(storeOrigin("cyd-store")).toBe(`${SEO_SITE}/cyd-store`);
    expect(storeOrigin("cyd-store", "shop.cyd.com")).toBe("https://shop.cyd.com");
    // Junk in the domain column must not produce a broken canonical.
    expect(storeOrigin("cyd-store", "not a domain")).toBe(`${SEO_SITE}/cyd-store`);
    expect(storeOrigin("cyd-store", "")).toBe(`${SEO_SITE}/cyd-store`);
  });

  it("publishes the names the shop answers to and how to order", () => {
    const json = buildStoreJsonLd({
      handle: "cyd-store",
      state: storeState({ bizName: "Cyd", phone: "+2348012345678", orderMethod: "whatsapp" }),
      description: "Shop Cyd",
    });
    const store = (json["@graph"] as Record<string, unknown>[])[0] as any;
    expect(store.alternateName).toContain("Cyd store");
    expect(store.alternateName).toContain("Cyd shop");
    expect(store.alternateName).toContain("@cyd-store");
    // A name that already says "store" is not doubled up.
    const named = buildStoreJsonLd({ handle: "ada", state: storeState({ bizName: "Ada Store" }), description: "" });
    expect((named["@graph"] as any[])[0].alternateName).not.toContain("Ada Store store");
    expect(store.areaServed).toMatchObject({ name: "Lagos" });
    // The catalogue's real span, so a crawler sees a genuinely priced shop.
    expect(String(store.priceRange)).toContain("140,000");
    expect(store.potentialAction.target.urlTemplate).toBe("https://wa.me/2348012345678");
  });

  it("never publishes a zero price for a quote-priced service", () => {
    const json = buildStoreJsonLd({
      handle: "ada-tailors",
      state: storeState({
        products: [
          { id: 4, name: "Aso-Ebi set", price: 0, description: "", image: "", outOfStock: false, priceType: "quote" },
        ],
      }),
      description: "",
    });
    const catalog = JSON.stringify(json);
    expect(catalog).toContain("Aso-Ebi set");
    expect(catalog).not.toContain('"price":0');
  });

  it("follows the custom origin when one is given", () => {
    const json = buildStoreJsonLd({
      handle: "cyd-store",
      state: storeState(),
      description: "Shop Cyd",
      origin: "https://shop.cyd.com",
    });
    const graph = json["@graph"] as Record<string, unknown>[];
    expect((graph[0] as any).url).toBe("https://shop.cyd.com");
    expect((graph.find((node) => (node as any)["@type"] === "BreadcrumbList") as any).itemListElement[1].item).toBe(
      "https://shop.cyd.com",
    );
  });
});

describe("buildSiteJsonLd", () => {
  it("exposes a sitelinks search box pointed at the store directory", () => {
    const json = buildSiteJsonLd("SwiftLink Pro", "desc");
    const website = (json["@graph"] as Record<string, unknown>[])[0] as any;
    expect(website.potentialAction.target.urlTemplate).toBe(`${SEO_SITE}/stores?q={search_term_string}`);
  });
});

describe("buildStoreDirectoryJsonLd", () => {
  it("lists each store with a position and URL", () => {
    const json = buildStoreDirectoryJsonLd([
      { handle: "cyd-store", bizName: "Cyd Store" },
      { handle: "ada-threads", bizName: "Ada Threads" },
    ]);
    const list = json.mainEntity as any;
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement[0]).toMatchObject({ position: 1, url: `${SEO_SITE}/cyd-store` });
  });
});
