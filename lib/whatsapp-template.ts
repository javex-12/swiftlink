/**
 * WhatsApp Order Message Template Engine
 * 
 * Rules:
 * - Max length: 500 characters.
 * - Allowed variables: {product}, {price}, {option}, {store}.
 * - Control characters stripped (except \n and \t).
 * - Safe URL encoding for wa.me links.
 */

export const MAX_WA_TEMPLATE_LENGTH = 500;

export const DEFAULT_WA_TEMPLATE = "Hi, I am interested in {product} ({price}).";

export const ALLOWED_TEMPLATE_VARIABLES = [
  "{product}",
  "{price}",
  "{option}",
  "{store}",
  "{total}",
] as const;

export type TemplateVariable = (typeof ALLOWED_TEMPLATE_VARIABLES)[number];

export interface TemplateValidationResult {
  isValid: boolean;
  error?: string;
  unknownVariables: string[];
}

/**
 * Normalizes a variable placeholder string to lowercase without spaces.
 * e.g. "{ Product }" -> "{product}", "{{price}}" -> "{price}"
 */
function normalizeVariable(token: string): string {
  const cleaned = token.replace(/[\{\}]/g, "").trim().toLowerCase();
  if (["product", "item", "product_name", "name"].includes(cleaned)) return "{product}";
  if (["price", "cost", "amount"].includes(cleaned)) return "{price}";
  if (["total", "total_price"].includes(cleaned)) return "{total}";
  if (["option", "options", "variant", "size", "color"].includes(cleaned)) return "{option}";
  if (["store", "shop", "bizname", "business"].includes(cleaned)) return "{store}";
  if (["cart_details", "cart", "order_details", "items"].includes(cleaned)) return "{cart_details}";
  return `{${cleaned}}`;
}

/**
 * Validates a WhatsApp template string.
 */
export function validateWhatsAppTemplate(template: string): TemplateValidationResult {
  const trimmed = template ?? "";

  if (trimmed.length > MAX_WA_TEMPLATE_LENGTH) {
    return {
      isValid: false,
      error: `Order message is too long (maximum ${MAX_WA_TEMPLATE_LENGTH} characters). Current: ${trimmed.length}.`,
      unknownVariables: [],
    };
  }

  // Find all {variable} or {{variable}} patterns
  const matches = trimmed.match(/\{+[^{}]+\}+/g) || [];
  const unknown: string[] = [];

  const allowedNormalized = new Set([
    "{product}",
    "{price}",
    "{option}",
    "{store}",
    "{total}",
    "{cart_details}",
  ]);

  for (const match of matches) {
    const norm = normalizeVariable(match);
    if (!allowedNormalized.has(norm)) {
      unknown.push(match);
    }
  }

  if (unknown.length > 0) {
    return {
      isValid: false,
      error: `Unknown variable: ${unknown.join(", ")}. Allowed variables: {product}, {price}, {option}, {store}, {total}.`,
      unknownVariables: unknown,
    };
  }

  return {
    isValid: true,
    unknownVariables: [],
  };
}

/**
 * Strips ASCII control characters (characters with code < 32) except \n and \t.
 */
export function stripControlCharacters(text: string): string {
  // \x00-\x08\x0B\x0C\x0E-\x1F\x7F
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Renders the WhatsApp order message from a template and context data.
 * Supports case-insensitivity, optional spaces inside braces, double braces, and common aliases.
 */
export function renderWhatsAppOrderMessage(
  template: string = DEFAULT_WA_TEMPLATE,
  data: {
    product: string;
    price: string;
    option?: string;
    store: string;
    total?: string;
  },
): string {
  let text = template || DEFAULT_WA_TEMPLATE;

  const productVal = (data.product || "").trim() || "Sample Product";
  const priceVal = (data.price || "").trim() || "";
  const storeVal = (data.store || "").trim() || "Store";
  const optionVal = (data.option || "").trim();
  const totalVal = (data.total || data.price || "").trim();

  // Robust case-insensitive replace supporting {product}, { Product }, {{product}}, {item}, {name}
  text = text.replace(/\{+\s*(product|item|product_name|name)\s*\}+/gi, productVal);

  // Robust replace for {price}, { Price }, {cost}, {amount}
  text = text.replace(/\{+\s*(price|amount|cost)\s*\}+/gi, priceVal);

  // Robust replace for {total}, { Total }, {total_price}
  text = text.replace(/\{+\s*(total|total_price)\s*\}+/gi, totalVal);

  // Robust replace for {store}, { Store }, {shop}, {business}
  text = text.replace(/\{+\s*(store|shop|bizname|business|store_name)\s*\}+/gi, storeVal);

  // Robust replace for {cart_details}, {cart}, {order_details}
  const cartSummary = optionVal ? `${productVal} (${optionVal})` : productVal;
  text = text.replace(/\{+\s*(cart_details|cart|order_details|items)\s*\}+/gi, cartSummary);

  // Check if option variable was in template
  const hasOptionVariable = /\{+\s*(option|options|variant|size|color)\s*\}+/i.test(text);
  if (hasOptionVariable) {
    text = text.replace(/\{+\s*(option|options|variant|size|color)\s*\}+/gi, optionVal);
  } else if (optionVal) {
    // If template did not specify {option}, append it cleanly
    text = `${text}\nOption: ${optionVal}`;
  }

  // Clean extra empty option lines if no option was provided
  text = text.replace(/\n\s*Option:\s*\n/g, "\n");

  return stripControlCharacters(text.trim());
}

/**
 * Builds the wa.me order URL with proper encoding for all characters (including Nigerian names, emoji, line breaks).
 */
export function buildWhatsAppOrderUrl(phone: string, message: string): string {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const sanitizedMessage = stripControlCharacters(message);
  const encoded = encodeURIComponent(sanitizedMessage);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
