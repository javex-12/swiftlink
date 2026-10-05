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
] as const;

export type TemplateVariable = (typeof ALLOWED_TEMPLATE_VARIABLES)[number];

export interface TemplateValidationResult {
  isValid: boolean;
  error?: string;
  unknownVariables: string[];
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

  // Find all {variable} patterns
  const matches = trimmed.match(/\{[^{}]+\}/g) || [];
  const unknown: string[] = [];

  for (const match of matches) {
    if (!ALLOWED_TEMPLATE_VARIABLES.includes(match as TemplateVariable)) {
      unknown.push(match);
    }
  }

  if (unknown.length > 0) {
    return {
      isValid: false,
      error: `Unknown variable: ${unknown.join(", ")}. Allowed variables: {product}, {price}, {option}, {store}.`,
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
 */
export function renderWhatsAppOrderMessage(
  template: string = DEFAULT_WA_TEMPLATE,
  data: {
    product: string;
    price: string;
    option?: string;
    store: string;
  },
): string {
  let text = template || DEFAULT_WA_TEMPLATE;

  // Substitute variables
  text = text.replace(/\{product\}/g, data.product || "item");
  text = text.replace(/\{price\}/g, data.price || "");
  text = text.replace(/\{store\}/g, data.store || "");

  const hasOptionVariable = text.includes("{option}");
  if (hasOptionVariable) {
    text = text.replace(/\{option\}/g, data.option || "");
  } else if (data.option && data.option.trim()) {
    // If template did not specify {option}, append it cleanly
    text = `${text}\nOption: ${data.option.trim()}`;
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
