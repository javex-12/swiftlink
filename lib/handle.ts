/**
 * Store handle validation, reserved words list, and alternative handle generator.
 */

export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "dashboard",
  "pro",
  "business",
  "account",
  "cart",
  "dev",
  "terms",
  "privacy",
  "banned",
  "reset-password",
  "store",
  "help",
  "support",
  "settings",
  "analytics",
  "inquiries",
  "customers",
  "checkout",
  "pay",
  "app",
  "auth",
  "root",
  "billing",
  "order",
]);

export interface HandleValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

export function validateStoreHandle(raw: string): HandleValidationResult {
  const normalized = (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    return { isValid: false, normalized: "", error: "Store link is required" };
  }

  if (normalized.length < 3) {
    return { isValid: false, normalized, error: "Store link must be at least 3 characters" };
  }

  if (normalized.length > 32) {
    return { isValid: false, normalized, error: "Store link must be at most 32 characters" };
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized)) {
    return { isValid: false, normalized, error: "Letters, numbers and dashes only (no leading or trailing dash)" };
  }

  if (RESERVED_HANDLES.has(normalized)) {
    return { isValid: false, normalized, error: "That link is reserved. Please choose a different link." };
  }

  return { isValid: true, normalized };
}

export function generateHandleSuggestions(base: string): string[] {
  const clean = (base || "store")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const prefix = clean || "store";

  return [
    `${prefix}-ng`,
    `${prefix}-store`,
    `${prefix}-shop`,
  ];
}
