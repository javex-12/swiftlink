import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUOTE_QUESTIONS,
  buildQuoteRequestMessage,
  formatProductPrice,
  isPriceOnRequest,
  resolveRequestQuestions,
} from "../product-pricing";

/**
 * Services are quoted, not sold at a fixed price. Two things must stay true or
 * the storefront lies to the buyer: the card never prints ₦0 for a service, and
 * the request the merchant receives contains the answers they need to quote.
 */

describe("isPriceOnRequest", () => {
  it("only treats the explicit quote type as a request", () => {
    expect(isPriceOnRequest({ price: 0, priceType: "quote" })).toBe(true);
    expect(isPriceOnRequest({ price: 15000, priceType: "fixed" })).toBe(false);
    expect(isPriceOnRequest({ price: 15000 })).toBe(false);
    expect(isPriceOnRequest(null)).toBe(false);
    expect(isPriceOnRequest(undefined)).toBe(false);
  });
});

describe("formatProductPrice", () => {
  it("prints the real amount for a fixed price", () => {
    expect(formatProductPrice("₦", { price: 12500 })).toBe("₦12,500");
  });

  it("never prints ₦0 for a service — it asks for a price", () => {
    expect(formatProductPrice("₦", { price: 0, priceType: "quote" })).toBe("Ask for price");
  });

  it("survives a missing price without printing NaN", () => {
    expect(formatProductPrice("₦", { price: Number.NaN })).toBe("₦0");
  });
});

describe("resolveRequestQuestions", () => {
  it("falls back to the default questions when the merchant wrote none", () => {
    expect(resolveRequestQuestions(undefined)).toEqual([...DEFAULT_QUOTE_QUESTIONS]);
    expect(resolveRequestQuestions(null)).toEqual([...DEFAULT_QUOTE_QUESTIONS]);
  });

  it("uses the merchant's own labels, in the order they wrote them", () => {
    const questions = resolveRequestQuestions([
      { id: "a", label: "  How many sets?  ", required: true },
      { id: "b", label: "Fabric" },
    ]);
    expect(questions.map((question) => question.label)).toEqual(["How many sets?", "Fabric"]);
    expect(questions[0].required).toBe(true);
  });

  it("drops a blank row the editor is still typing into", () => {
    const questions = resolveRequestQuestions([
      { id: "a", label: "Quantity", required: true },
      { id: "b", label: "   " },
    ]);
    expect(questions).toHaveLength(1);
  });

  it("respects a deliberately empty list — buyer is asked only for their details", () => {
    expect(resolveRequestQuestions([])).toEqual([]);
  });
});

describe("buildQuoteRequestMessage", () => {
  const base = {
    storeName: "Adaeze Tailors",
    productName: "Custom Aso-Ebi Set",
    details: "Six sets, teal lace, ready in three weeks.",
  };

  it("names the store and the service first", () => {
    const message = buildQuoteRequestMessage(base);
    expect(message).toContain("Adaeze Tailors");
    expect(message).toContain("Custom Aso-Ebi Set");
    expect(message).toContain("Six sets, teal lace");
  });

  it("carries every optional answer the merchant would need", () => {
    const message = buildQuoteRequestMessage({
      ...base,
      buyerName: "Chika",
      buyerPhone: "+234 801 234 5678",
      budget: "₦120,000",
      deadline: "next Friday",
    });
    expect(message).toContain("Chika");
    expect(message).toContain("+234 801 234 5678");
    expect(message).toContain("₦120,000");
    expect(message).toContain("next Friday");
  });

  it("prints the merchant's own questions and answers, in order", () => {
    const message = buildQuoteRequestMessage({
      ...base,
      answers: [
        { label: "How many sets?", value: "Six" },
        { label: "Fabric", value: "Teal lace" },
        { label: "Deadline", value: "Three weeks" },
      ],
    });
    expect(message).toContain("Buyer's answers:");
    const six = message.indexOf("How many sets?");
    const fabric = message.indexOf("Fabric");
    const deadline = message.indexOf("Deadline");
    expect(six).toBeGreaterThan(-1);
    expect(fabric).toBeGreaterThan(six);
    expect(deadline).toBeGreaterThan(fabric);
  });

  it("drops blank answers rather than sending empty headings", () => {
    const message = buildQuoteRequestMessage({
      ...base,
      answers: [
        { label: "Fabric", value: "  " },
        { label: "Quantity", value: "Six" },
      ],
    });
    expect(message).not.toContain("Fabric");
    expect(message).toContain("Quantity");
  });

  it("omits unanswered optional fields instead of printing blanks", () => {
    const message = buildQuoteRequestMessage(base);
    expect(message).not.toContain("Budget:");
    expect(message).not.toContain("Needed by:");
    expect(message).not.toContain("Name:");
  });

  it("only includes a product URL that WhatsApp could preview", () => {
    expect(
      buildQuoteRequestMessage({ ...base, productUrl: "https://shop.example/coat" }),
    ).toContain("https://shop.example/coat");
    expect(buildQuoteRequestMessage({ ...base, productUrl: "data:image/png;base64,AAA" })).not.toContain(
      "data:image",
    );
  });

  it("collapses whitespace and caps runaway input", () => {
    const message = buildQuoteRequestMessage({
      ...base,
      details: `   six   sets\n\nplease  `,
      buyerName: "A".repeat(300),
    });
    expect(message).toContain("six sets please");
    expect(message).not.toContain("A".repeat(100));
  });
});
