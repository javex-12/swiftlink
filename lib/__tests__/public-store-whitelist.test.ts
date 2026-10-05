import { describe, expect, it } from "vitest";

/**
 * Public Store Whitelist Guard
 *
 * Enforces that public storefront projections NEVER expose internal or private keys
 * (e.g. ownerId, notifications, plan, credentials, private email).
 */

export const PUBLIC_STORE_STATE_WHITELIST = new Set([
  "bizName",
  "bizImage",
  "storeUsername",
  "phone",
  "currency",
  "products",
  "tagline",
  "aboutUs",
  "isLive",
  "websiteTemplateId",
  "storeHours",
  "sections",
  "accentColor",
  "bgColor",
  "textColor",
  "surfaceColor",
  "buttonColor",
  "fontStyle",
  "buttonRadius",
  "orderMethod",
  "waTemplate",
  "minOrder",
  "outOfStockDisplay",
  "socials",
  "location",
  "deliveryAreas",
  "deliveryFee",
  "returnPolicy",
  "categories",
  "testimonials",
  "storefrontTheme",
  "heroImage",
  "heroTitle",
  "heroSubtitle",
  "heroButtonText",
  "seoTitle",
  "ogDescription",
  "ogImage",
]);

export function sanitizePublicStoreState(rawState: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawState)) {
    if (PUBLIC_STORE_STATE_WHITELIST.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

describe("Public Storefront Whitelist Protection", () => {
  it("strips private keys (ownerId, notifications, plan) from public state", () => {
    const rawMerchantState = {
      bizName: "Tunde Footwear",
      ownerId: "00000000-0000-0000-0000-000000000001",
      plan: "pro",
      notifications: [{ id: 1, text: "Your subscription renewal failed" }],
      products: [{ id: 1, name: "Sneaker" }],
      currency: "NGN",
      storeUsername: "tunde-footwear",
    };

    const sanitized = sanitizePublicStoreState(rawMerchantState);

    expect(sanitized).toHaveProperty("bizName", "Tunde Footwear");
    expect(sanitized).toHaveProperty("products");
    expect(sanitized).toHaveProperty("currency", "NGN");
    expect(sanitized).not.toHaveProperty("ownerId");
    expect(sanitized).not.toHaveProperty("plan");
    expect(sanitized).not.toHaveProperty("notifications");
  });

  it("fails if any key in sanitized object is not in the approved whitelist", () => {
    const sanitized = sanitizePublicStoreState({
      bizName: "Ada Fashion",
      secretInternalNote: "do not expose",
      ownerId: "user-123",
    });

    for (const key of Object.keys(sanitized)) {
      expect(PUBLIC_STORE_STATE_WHITELIST.has(key)).toBe(true);
    }
  });
});
