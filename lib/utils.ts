import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ShopState } from "./schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  if (!slug) return "/";
  return `/store/${slug}`;
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
