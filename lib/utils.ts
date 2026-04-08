import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ShopState } from "./types";
import { defaultShopState } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RESERVED_FIRST_SEGMENTS = new Set([
  "dispatch",
  "business",
  "tracking",
  "pro",
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

export function getShopPath(state: Pick<ShopState, "id" | "bizName">): string {
  if (!state.id) return "/";
  return `/${slugifyStoreName(state.bizName)}/${state.id}`;
}

export function parseShopFromPathname(pathname: string): {
  shopId: string;
  storeSlug: string | null;
} | null {
  let path = (pathname || "/").replace(/^\/+|\/+$/g, "");
  if (path === "index.html" || path.endsWith("/index.html")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "index.html") parts.shift();
  if (parts.length === 0) return null;
  if (RESERVED_FIRST_SEGMENTS.has(parts[0])) return null;
  if (parts.length >= 2) {
    const shopId = parts[parts.length - 1];
    if (shopId && shopId.length >= 20)
      return { shopId, storeSlug: parts[0] };
  }
  if (parts.length === 1 && parts[0].length >= 20)
    return { shopId: parts[0], storeSlug: null };
  return null;
}

export function loadStateLocal(): ShopState {
  const base = defaultShopState();
  try {
    const s = localStorage.getItem("swiftlink_state");
    if (s) return { ...base, ...JSON.parse(s) };
  } catch {
    /* ignore */
  }
  return base;
}
