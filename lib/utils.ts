import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ShopState, StorefrontTheme } from "./types";
import { defaultShopState } from "./types";

export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = {
  primaryColor: "#10b981",
  background: "light",
  heroLayout: "split",
  cardRadius: "pill",
  showHeroBadge: true,
};

/** Clamp hex for CSS; invalid values fall back to default emerald. */
export function normalizeHexColor(input: string, fallback = "#10b981"): string {
  const s = String(input || "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[1]!,
      g = s[2]!,
      b = s[3]!;
    return (`#${r}${r}${g}${g}${b}${b}`).toLowerCase();
  }
  return fallback;
}

export function resolveStorefrontTheme(
  state: Partial<ShopState>,
): StorefrontTheme {
  const t = state.storefrontTheme || {};
  return {
    ...DEFAULT_STOREFRONT_THEME,
    ...t,
    primaryColor: normalizeHexColor(
      state.accentColor ?? t.primaryColor ?? DEFAULT_STOREFRONT_THEME.primaryColor,
    ),
    background: t.background ?? DEFAULT_STOREFRONT_THEME.background,
    heroLayout: state.heroStyle === "banner" || state.heroStyle === "split" ? state.heroStyle : (t.heroLayout ?? DEFAULT_STOREFRONT_THEME.heroLayout),
    cardRadius: state.buttonRadius ?? t.cardRadius ?? DEFAULT_STOREFRONT_THEME.cardRadius,
    showHeroBadge:
      t.showHeroBadge ?? DEFAULT_STOREFRONT_THEME.showHeroBadge,
  };
}

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
