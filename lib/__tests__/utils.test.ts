import { describe, expect, it } from "vitest";
import {
  cn,
  getPublicStoreSlug,
  getSmartFirstName,
  getShopPath,
  hashPin,
  isDarkColor,
  normalizeStoreUsername,
  parseShopFromPathname,
  slugifyStoreName,
} from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting tailwind classes, last one wins", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("ignores falsey inputs", () => {
    expect(cn("p-2", false, null, undefined, "text-sm")).toBe("p-2 text-sm");
  });
});

describe("isDarkColor", () => {
  it("detects dark and light hex colors", () => {
    expect(isDarkColor("#000000")).toBe(true);
    expect(isDarkColor("#0a0a0c")).toBe(true);
    expect(isDarkColor("#ffffff")).toBe(false);
    expect(isDarkColor("#f8fafc")).toBe(false);
  });

  it("expands 3-digit hex and rejects malformed input", () => {
    expect(isDarkColor("#000")).toBe(true);
    expect(isDarkColor("#fff")).toBe(false);
    expect(isDarkColor("emerald")).toBe(false);
    expect(isDarkColor(undefined)).toBe(false);
  });
});

describe("normalizeStoreUsername", () => {
  it("lowercases and strips everything but a-z, 0-9 and hyphen", () => {
    expect(normalizeStoreUsername("  Cyder Store!! ")).toBe("cyderstore");
    expect(normalizeStoreUsername("Ada's_Boutique")).toBe("adasboutique");
    expect(normalizeStoreUsername("my--shop")).toBe("my-shop");
    expect(normalizeStoreUsername("-leading-and-trailing-")).toBe(
      "leading-and-trailing",
    );
  });
});

describe("slugifyStoreName", () => {
  it("falls back to 'store' for empty or symbol-only names", () => {
    expect(slugifyStoreName("")).toBe("store");
    expect(slugifyStoreName("!!!")).toBe("store");
  });

  it("produces a url-safe slug", () => {
    expect(slugifyStoreName("Ada's Kitchen & Bar")).toBe("adas-kitchen-bar");
  });
});

describe("getPublicStoreSlug", () => {
  it("prefers the explicit handle over the business name", () => {
    expect(
      getPublicStoreSlug({ storeUsername: "ada", bizName: "Ada's Kitchen" }),
    ).toBe("ada");
  });

  it("derives a handle from the business name when none is set", () => {
    expect(getPublicStoreSlug({ storeUsername: "", bizName: "Ada's Kitchen" })).toBe(
      "adas-kitchen",
    );
  });
});

describe("getShopPath", () => {
  it("returns a slug + shop id path for a live store", () => {
    expect(
      getShopPath({ id: "abc", storeUsername: "ada", bizName: "Ada's Kitchen" }),
    ).toBe("/store/ada?shop=abc");
  });

  it("routes through the home page when no store id exists yet", () => {
    expect(getShopPath({ id: null, storeUsername: "ada", bizName: "Ada" })).toBe("/");
  });

  it("never sends a handle-less store to a generic slug", () => {
    const path = getShopPath({ id: "abc", storeUsername: "", bizName: "Ada" });
    // A derived slug here would put every handle-less store on /store/store.
    expect(path).toBe("/?shop=abc");
    expect(path).not.toContain("/store/visit");
  });
});

describe("parseShopFromPathname", () => {
  it("parses a slug route", () => {
    expect(parseShopFromPathname("/store/ada")).toEqual({
      kind: "slug",
      slug: "ada",
    });
  });

  it("parses a uid route", () => {
    const shopId = "8f14e45fceea167a5a36dedd4bea2543";
    expect(parseShopFromPathname(`/ada/${shopId}`)).toEqual({
      kind: "uid",
      shopId,
      storeSlug: "ada",
    });
  });

  it("ignores reserved and root paths", () => {
    expect(parseShopFromPathname("/")).toBeNull();
    expect(parseShopFromPathname("/pro")).toBeNull();
    expect(parseShopFromPathname("/business")).toBeNull();
    expect(parseShopFromPathname("/index.html")).toBeNull();
  });
});

describe("getSmartFirstName", () => {
  it("prefers the owner name", () => {
    expect(getSmartFirstName("michael dosunmu", "x@y.com", "CyderStore")).toBe(
      "Michael",
    );
  });

  it("cleans digits and separators out of the email handle", () => {
    // Separators give word breaks; run-together handles cannot be split.
    expect(getSmartFirstName("", "ada.eze_9@mail.com", "")).toBe("Ada");
    expect(getSmartFirstName("", "michaeldosunmu22@gmail.com", "")).toBe(
      "Michaeldosunmu",
    );
  });

  it("falls back to the business name then to 'Merchant'", () => {
    expect(getSmartFirstName("", undefined, "CyderStore")).toBe("CyderStore");
    expect(getSmartFirstName("", "", "")).toBe("Merchant");
  });
});

describe("hashPin", () => {
  it("produces a stable 64-char sha-256 hex digest", async () => {
    const hash = await hashPin("1234");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPin("1234")).toBe(hash);
  });

  it("trims whitespace so ' 1234 ' matches '1234'", async () => {
    expect(await hashPin(" 1234 ")).toBe(await hashPin("1234"));
  });

  it("does not collide across different pins", async () => {
    expect(await hashPin("1234")).not.toBe(await hashPin("4321"));
  });
});
