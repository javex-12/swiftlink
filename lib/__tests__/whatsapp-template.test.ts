import { describe, it, expect } from "vitest";
import {
  validateWhatsAppTemplate,
  renderWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  stripControlCharacters,
  DEFAULT_WA_TEMPLATE,
  MAX_WA_TEMPLATE_LENGTH,
} from "../whatsapp-template";

describe("WhatsApp Order Message Template", () => {
  it("validates allowed variables correctly", () => {
    const valid = "Hello {store}, I want to buy {product} for {price}. Options: {option}";
    const res = validateWhatsAppTemplate(valid);
    expect(res.isValid).toBe(true);
    expect(res.unknownVariables).toHaveLength(0);
  });

  it("rejects unknown variables with an informative error", () => {
    const invalid = "Hello {store}, gives me {product} with discount {discount} and code {voucher}!";
    const res = validateWhatsAppTemplate(invalid);
    expect(res.isValid).toBe(false);
    expect(res.unknownVariables).toContain("{discount}");
    expect(res.unknownVariables).toContain("{voucher}");
    expect(res.error).toContain("Unknown variable");
  });

  it("enforces the 500-character maximum length", () => {
    const long = "A".repeat(MAX_WA_TEMPLATE_LENGTH + 1);
    const res = validateWhatsAppTemplate(long);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("too long");
  });

  it("renders with default template when empty", () => {
    const rendered = renderWhatsAppOrderMessage("", {
      product: "Raw Linen Shirt",
      price: "₦28,000",
      store: "Aura Essentials",
    });
    expect(rendered).toBe("Hi, I am interested in Raw Linen Shirt (₦28,000).");
  });

  it("appends option if {option} is not in template and an option was selected", () => {
    const rendered = renderWhatsAppOrderMessage(DEFAULT_WA_TEMPLATE, {
      product: "Raw Linen Shirt",
      price: "₦28,000",
      option: "Size: XL, Color: Forest Green",
      store: "Aura Essentials",
    });
    expect(rendered).toContain("Option: Size: XL, Color: Forest Green");
  });

  it("substitutes {option} inline when present in template", () => {
    const tpl = "Order for {product} ({price}). Selection: [{option}]. Thanks!";
    const rendered = renderWhatsAppOrderMessage(tpl, {
      product: "Leather Slides",
      price: "₦26,000",
      option: "Size 43",
      store: "Lagos Footwear",
    });
    expect(rendered).toBe("Order for Leather Slides (₦26,000). Selection: [Size 43]. Thanks!");
  });

  it("correctly encodes Nigerian names, diacritics and special characters for wa.me", () => {
    const rendered = renderWhatsAppOrderMessage(
      "Ẹ n lẹ {store}! I would like to order {product} ({price}) for Babátúndé Olúṣẹ́gun.",
      {
        product: "Agbádá 3-Piece Set",
        price: "₦75,000",
        store: "Ọbalóla Fabrics & Tailoring",
      },
    );

    const url = buildWhatsAppOrderUrl("+2348081234567", rendered);
    expect(url).toContain("https://wa.me/2348081234567?text=");
    // Decode back and verify exact character parity
    const queryPart = url.split("?text=")[1];
    const decoded = decodeURIComponent(queryPart);
    expect(decoded).toContain("Ẹ n lẹ Ọbalóla Fabrics & Tailoring!");
    expect(decoded).toContain("Babátúndé Olúṣẹ́gun");
    expect(decoded).toContain("₦75,000");
  });

  it("correctly encodes emoji and line breaks in WhatsApp order link", () => {
    const rendered = renderWhatsAppOrderMessage(
      "Hi {store}, I want {product} ({price})! ✨📦\nSpecial note: handle with care 🙏",
      {
        product: "Silk Kimono",
        price: "₦42,000",
        store: "Mide Luxe",
      },
    );

    const url = buildWhatsAppOrderUrl("+2348081234567", rendered);
    expect(url).toContain("https://wa.me/2348081234567?text=");
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    expect(decoded).toContain("✨📦");
    expect(decoded).toContain("🙏");
    expect(decoded).toContain("\nSpecial note:");
  });

  it("correctly encodes line breaks and whitespace", () => {
    const msg = "Line 1: Product\nLine 2: ₦10,000\n\nLine 3: Delivery in Abuja";
    const url = buildWhatsAppOrderUrl("+2348081234567", msg);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    expect(decoded).toBe(msg);
  });

  it("strips harmful ASCII control characters", () => {
    const bad = "Hello\x00\x07\x1F World\nLine 2";
    const cleaned = stripControlCharacters(bad);
    expect(cleaned).toBe("Hello World\nLine 2");
  });
});
