import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ShopState } from "./schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDarkColor(colorHex: string | undefined): boolean {
  if (!colorHex || !colorHex.startsWith('#')) return false;
  const hex = colorHex.replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return false;
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

const RESERVED_FIRST_SEGMENTS = new Set([
  "dispatch",
  "business",
  "tracking",
  "pro",
  "store",
  "signup",
  "terms",
  "_next",
  "api",
]);

export function slugifyStoreName(name: string): string {
  const s = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "store";
}

/** Normalize handle for URLs: lowercase a-z, digits, hyphen only. */
export function normalizeCategoryLabel(raw: string): string {
  return String(raw || "").trim();
}

export function collectProductCategories(
  products: { category?: string }[],
): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const c = normalizeCategoryLabel(p.category ?? "");
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function normalizeStoreUsername(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPublicStoreSlug(
  state: Pick<ShopState, "storeUsername" | "bizName">,
): string {
  const fromHandle = normalizeStoreUsername(state.storeUsername || "");
  if (fromHandle) return fromHandle;
  return slugifyStoreName(state.bizName);
}

export function getShopPath(
  state: Pick<ShopState, "id" | "bizName" | "storeUsername">,
): string {
  if (!state.id) return "/";
  const slug = getPublicStoreSlug(state);
  if (!slug) return `/store/visit?shop=${state.id}`;
  // Use BOTH for ultimate reliability (SEO friendly slug + exact shop ID fallback)
  return `/store/${slug}?shop=${state.id}`;
}

export type ParsedShopPath =
  | { kind: "slug"; slug: string }
  | { kind: "uid"; shopId: string; storeSlug: string | null };

export function parseShopFromPathname(pathname: string): ParsedShopPath | null {
  let path = (pathname || "/").replace(/^\/+|\/+$/g, "");
  if (path === "index.html" || path.endsWith("/index.html")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "index.html") parts.shift();
  if (parts.length === 0) return null;

  if (parts[0] === "store" && parts.length === 2) {
    const slug = normalizeStoreUsername(parts[1]);
    if (slug) return { kind: "slug", slug };
    return null;
  }

  if (RESERVED_FIRST_SEGMENTS.has(parts[0])) return null;
  if (parts.length >= 2) {
    const shopId = parts[parts.length - 1];
    if (shopId && shopId.length >= 20)
      return { kind: "uid", shopId, storeSlug: parts[0] };
  }
  if (parts.length === 1 && parts[0].length >= 20)
    return { kind: "uid", shopId: parts[0], storeSlug: null };
  return null;
}

export function getSmartFirstName(ownerName?: string, email?: string, bizName?: string): string {
  if (ownerName && ownerName.trim()) {
    const firstWord = ownerName.trim().split(/\s+/)[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    // Clean numbers, dots, and underscores from handle (e.g. "michaeldosunmu22" -> "Michael")
    const cleaned = handle
      .replace(/[0-9]/g, '')
      .replace(/[._-]/g, ' ')
      .trim();
    if (cleaned) {
      const firstWord = cleaned.split(/\s+/)[0];
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
  }
  if (bizName && bizName.trim()) {
    const firstWord = bizName.trim().split(/\s+/)[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }
  return "Merchant";
}

/**
 * Hash a plain-text delivery PIN using SHA-256 (Web Crypto API).
 * The result is a 64-char hex string. This is ONE-WAY — the plain PIN
 * can never be recovered from it, even by SwiftLink or Supabase admins.
 *
 * Usage:
 *   Store hash in DB.        Verify: hash(input) === stored_hash
 *   Never store plain PIN.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin.trim());
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
