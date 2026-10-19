import { describe, expect, it } from "vitest";
import {
  NO_REQUEST_QUESTIONS,
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
  it("asks nothing the merchant did not write", () => {
    // The platform used to ship three of its own questions ("What do you need?",
    // "Budget", "When do you need it?") and ask for name and number on top.
    expect(resolveRequestQuestions(undefined)).toEqual([]);
    expect(resolveRequestQuestions(null)).toEqual([]);
    expect(NO_REQUEST_QUESTIONS).toEqual([]);
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

  it("keeps an empty list empty rather than filling it in", () => {
    expect(resolveRequestQuestions([])).toEqual([]);
  });
});

describe("buildQuoteRequestMessage", () => {
  const base = {
    storeName: "Adaeze Tailors",
    productName: "Custom Aso-Ebi Set",
  };

  it("names the store and the service first", () => {
    const message = buildQuoteRequestMessage(base);
    expect(message).toContain("Adaeze Tailors");
    expect(message).toContain("Custom Aso-Ebi Set");
  });

  it("carries exactly the merchant's answers, and nothing invented", () => {
    const message = buildQuoteRequestMessage({
      ...base,
      answers: [{ label: "Fabric", value: "Teal lace" }],
    });
    expect(message).toContain("Teal lace");
    // No built-in name/phone/budget/deadline fields are added on the merchant's
    // behalf, and the shopper is never asked for a WhatsApp number.
    expect(message).not.toContain("Name:");
    expect(message).not.toContain("WhatsApp:");
    expect(message).not.toContain("Budget");
    expect(message).not.toContain("Needed by");
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
    expect(message).toContain("*Details:*");
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

  it("is still a usable request when the merchant wrote no questions", () => {
    const message = buildQuoteRequestMessage(base);
    expect(message).toContain("Adaeze Tailors");
    expect(message).toContain("Custom Aso-Ebi Set");
    expect(message).toContain("send me a price");
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
      answers: [
        { label: "What do you need?", value: `   six   sets\n\nplease  ` },
        { label: "Notes", value: "A".repeat(3000) },
      ],
    });
    expect(message).toContain("six sets please");
    expect(message).not.toContain("A".repeat(1201));
  });
});
