import { describe, expect, it } from "vitest";
import {
  buildSiteJsonLd,
  buildStoreDirectoryJsonLd,
  buildStoreJsonLd,
  SEO_SITE,
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
