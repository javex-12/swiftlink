import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildCartOrderMessage,
  cartOrderTotal,
  lineTotal,
  shareableImageUrl,
  type CartOrderLine,
} from "../order-message";

const PHOTO = "https://ytoejmdujqtbgjdtzwwl.supabase.co/storage/v1/object/public/products/aura/tee.jpg";

function line(overrides: Partial<CartOrderLine> = {}): CartOrderLine {
  return { productId: 1, name: "Cotton Tee", quantity: 2, unitPrice: 2000, ...overrides };
}

const message = (lines: CartOrderLine[]) =>
  buildCartOrderMessage({ reference: "SL-4F2A", currency: "₦", storeName: "Aura Essentials", lines });

describe("shareableImageUrl", () => {
  it("keeps an http(s) photo", () => {
    expect(shareableImageUrl(PHOTO)).toBe(PHOTO);
  });

  it("trims surrounding whitespace", () => {
    expect(shareableImageUrl(`  ${PHOTO}  `)).toBe(PHOTO);
  });

  it("drops URLs WhatsApp cannot open for the merchant", () => {
    expect(shareableImageUrl("data:image/png;base64,iVBORw0KGgo=")).toBeNull();
    expect(shareableImageUrl("blob:http://localhost:3000/9f2c")).toBeNull();
    expect(shareableImageUrl("file:///C:/Users/me/photo.jpg")).toBeNull();
  });

  it("drops empty and missing values", () => {
    expect(shareableImageUrl("")).toBeNull();
    expect(shareableImageUrl("   ")).toBeNull();
    expect(shareableImageUrl(null)).toBeNull();
    expect(shareableImageUrl(undefined)).toBeNull();
  });
});

describe("totals", () => {
  it("multiplies unit price by quantity", () => {
    expect(lineTotal(line({ unitPrice: 1500, quantity: 3 }))).toBe(4500);
  });

  it("sums every line", () => {
    expect(cartOrderTotal([line({ unitPrice: 1000, quantity: 2 }), line({ unitPrice: 500, quantity: 1 })])).toBe(2500);
  });

  it("survives junk instead of emitting NaN into the message", () => {
    expect(cartOrderTotal([line({ quantity: NaN, unitPrice: NaN })])).toBe(0);
  });
});

describe("buildCartOrderMessage", () => {
  it("keeps the order shape the merchant already knows", () => {
    const text = message([line()]);
    expect(text).toContain("*NEW ORDER SL-4F2A*");
    expect(text).toContain("📦 *Cotton Tee* (2)");
    expect(text).toContain(`₦${(4000).toLocaleString()}`);
    expect(text).toContain(`💰 *Total: ₦${(4000).toLocaleString()}*`);
    expect(text).toContain("_Store: Aura Essentials_");
  });

  it("includes the product photo as a line the customer can see previewed", () => {
    const text = message([line({ imageUrl: PHOTO })]);
    expect(text).toContain(PHOTO);
    // The photo belongs to its product, not to the footer.
    expect(text.indexOf(PHOTO)).toBeGreaterThan(text.indexOf("Cotton Tee"));
    expect(text.indexOf(PHOTO)).toBeLessThan(text.indexOf("Total"));
  });

  it("omits the line entirely when a product has no photo", () => {
    const text = message([line({ imageUrl: "" }), line({ productId: 2, name: "Cap", imageUrl: null })]);
    expect(text).not.toContain("http");
    expect(text).not.toContain("null");
    expect(text).not.toContain("undefined");
    // Both products are still listed, just without a photo line.
    expect(text).toContain("📦 *Cotton Tee* (2)");
    expect(text).toContain("📦 *Cap* (2)");
  });

  it("gives every product its own photo", () => {
    const text = message([
      line({ imageUrl: PHOTO }),
      line({ productId: 2, name: "Cap", unitPrice: 100, quantity: 1, imageUrl: "https://cdn.example.com/cap.png" }),
    ]);
    expect(text).toContain(PHOTO);
    expect(text).toContain("https://cdn.example.com/cap.png");
    expect(text.indexOf(PHOTO)).toBeLessThan(text.indexOf("https://cdn.example.com/cap.png"));
  });

  it("never emits a data: URL, which would bloat the chat message", () => {
    const text = message([line({ imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" })]);
    expect(text).not.toContain("base64");
  });

  it("handles an empty cart without crashing", () => {
    expect(message([])).toContain("*NEW ORDER SL-4F2A*");
  });
});

/**
 * The message is only useful if checkout actually calls this builder *and* hands
 * it the product photo. Both were previously true by accident (a hand-built
 * string in a click handler, with no image at all), so they are pinned here —
 * no browser is available to click the order button.
 */
describe("checkout wiring", () => {
  const context = readFileSync(new URL("../../context/SwiftLinkContext.tsx", import.meta.url), "utf8");

  it("builds the order message with the shared builder", () => {
    expect(context).toContain("buildCartOrderMessage(");
  });

  it("passes each product's photo to the builder", () => {
    expect(context).toContain("imageUrl: p.image || p.images?.[0] || null");
  });

  it("no longer hand-builds the order text inline", () => {
    expect(context).not.toContain("`*NEW ORDER ${ref}*");
  });
});
