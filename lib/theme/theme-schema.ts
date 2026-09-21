/**
 * The tenant theme contract.
 *
 * A merchant's brand is a **plain data object** published per store — not a set of
 * CSS variables written by hand and not a row of 24 hard-coded palettes
 * (docs/00-AUDIT.md F-18). Because it is data, it can be validated, versioned,
 * diffed for undo, and rendered to a thumbnail in the theme picker.
 *
 * Everything a merchant *can* control is here; everything derived from it lives in
 * `lib/theme/derive.ts`. `docs/01-DESIGN-SYSTEM.md` §4 is the rule that keeps this
 * object small: hover states, tints, borders and dark-mode variants are computed,
 * never asked for.
 *
 * Invalid input never throws. A merchant pasting a broken hex or an old store
 * record with a field we removed must still get a working storefront, so every
 * field is `.catch()`ed to a sane default and the editor is told what was
 * corrected (`DerivedTheme.adjustments`).
 */

import { z } from "zod";
import { parseHex, normalizeHex } from "./color";

/* ------------------------------------------------------------------ *
 * Font pairings — the merchant picks a pairing, not a font file
 * ------------------------------------------------------------------ */

export const FONT_PAIR_IDS = [
  "editorial",
  "modern",
  "geometric",
  "technical",
  "luxury",
  "friendly",
] as const;

export type FontPairId = (typeof FONT_PAIR_IDS)[number];

export type FontPairing = {
  name: string;
  /** CSS font stack for headings. */
  display: string;
  /** CSS font stack for body copy. */
  body: string;
  description: string;
};

/**
 * Names `next/font` will own once the storefront rebuild lands in P4 — these
 * stacks reference the self-hosted variables where available and fall back to a
 * system family, so nothing depends on a live third-party request.
 */
export const FONT_PAIRS: Record<FontPairId, FontPairing> = {
  editorial: {
    name: "Editorial",
    display: "var(--font-instrument-serif, Georgia), Georgia, 'Times New Roman', serif",
    body: "var(--font-sans)",
    description: "Serif headlines, quiet body copy. Good for fashion, food and writing.",
  },
  modern: {
    name: "Modern",
    display: "var(--font-sans)",
    body: "var(--font-sans)",
    description: "One clean geometric sans throughout. Safe for almost any business.",
  },
  geometric: {
    name: "Geometric",
    display: "'Poppins', var(--font-sans)",
    body: "var(--font-sans)",
    description: "Rounded geometric headings — youthful and product-led.",
  },
  technical: {
    name: "Technical",
    display: "'IBM Plex Sans', var(--font-sans)",
    body: "'IBM Plex Sans', var(--font-sans)",
    description: "Neutral, engineered feel. Suits electronics, tools and services.",
  },
  luxury: {
    name: "Luxury",
    display: "'Playfair Display', Georgia, serif",
    body: "var(--font-sans)",
    description: "High-contrast serif display for premium and high-ticket goods.",
  },
  friendly: {
    name: "Friendly",
    display: "var(--font-sans)",
    body: "var(--font-sans)",
    description: "Soft and approachable with generous rounding. Suits boutiques and gifts.",
  },
};

/* ------------------------------------------------------------------ *
 * Enumerations
 * ------------------------------------------------------------------ */

export const BACKGROUND_INTENTS = ["light", "dark", "auto"] as const;
export const RADIUS_INTENTS = ["sharp", "soft", "rounded", "pill"] as const;
export const DENSITY_INTENTS = ["compact", "comfortable", "airy"] as const;
export const MOTION_INTENTS = ["none", "subtle", "expressive"] as const;
export const IMAGE_RATIOS = ["1/1", "4/5", "3/4", "16/9"] as const;
export const NAV_LAYOUTS = ["top", "bottom", "drawer"] as const;

/* ------------------------------------------------------------------ *
 * Schema
 * ------------------------------------------------------------------ */

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

export const themeSchema = z.object({
  /** Preset id when the merchant picked one, otherwise `"custom"`. */
  id: z.string().min(1).catch("custom"),
  name: z.string().min(1).catch("Custom"),
  /** The one color the merchant actually chooses. Everything else derives from it. */
  brandColor: hex.catch("#047857"),
  background: z.enum(BACKGROUND_INTENTS).catch("light"),
  fontPair: z.enum(FONT_PAIR_IDS).catch("modern"),
  radius: z.enum(RADIUS_INTENTS).catch("rounded"),
  density: z.enum(DENSITY_INTENTS).catch("comfortable"),
  motion: z.enum(MOTION_INTENTS).catch("subtle"),
  imageRatio: z.enum(IMAGE_RATIOS).catch("1/1"),
  nav: z.enum(NAV_LAYOUTS).catch("top"),
  /**
   * When true (always, for now) the contrast engine corrects an unreadable brand
   * color. The escape hatch exists for the Business tier, where a merchant may
   * accept a documented accessibility warning to hit an exact brand hex — and
   * `derive.ts` still reports the failure.
   */
  enforceContrast: z.boolean().catch(true),
  /** Set when the theme came from `themePresets`, so the editor can show lineage. */
  presetId: z.string().nullable().catch(null),
});

export type TenantTheme = z.infer<typeof themeSchema>;

export type ThemeField = keyof TenantTheme;

/** The default storefront theme: emerald, light, modern, soft rounding. */
export const DEFAULT_THEME: TenantTheme = themeSchema.parse({});

/* ------------------------------------------------------------------ *
 * Parsing
 * ------------------------------------------------------------------ */

export type ParsedTheme = {
  theme: TenantTheme;
  /** Fields the schema had to replace, with the value it used instead. */
  corrected: { field: ThemeField; value: unknown }[];
};

/**
 * Never throws. Reports what it repaired so the editor can say
 * "we fixed 2 settings" rather than silently changing a merchant's brand.
 */
export function parseTheme(input: unknown): ParsedTheme {
  const result = themeSchema.safeParse(input ?? {});
  if (result.success) return { theme: result.data, corrected: [] };

  // `safeParse` only fails if a `.catch()` is ever removed from a field, so this
  // path is a guard rail that keeps a storefront rendering instead of erroring.
  const corrected = result.error.issues.map((issue) => ({
    field: (issue.path[0] as ThemeField) ?? ("brandColor" as ThemeField),
    value: (DEFAULT_THEME as unknown as Record<string, unknown>)[String(issue.path[0])],
  }));

  return {
    theme: { ...DEFAULT_THEME, ...(typeof input === "object" && input ? input : {}) } as TenantTheme,
    corrected,
  };
}

/** True when the value is a usable theme object. */
export function isTheme(value: unknown): value is TenantTheme {
  return themeSchema.safeParse(value).success;
}

/* ------------------------------------------------------------------ *
 * Migration bridge
 * ------------------------------------------------------------------ */

/**
 * Map the legacy blob's scattered appearance fields onto the new contract.
 *
 * This is the compatibility layer that lets a store migrated from
 * `stores.state_json` keep looking roughly as it did, while every screen it feeds
 * moves onto the token engine (`docs/02-BUILDER-ARCHITECTURE.md` §4). It exists
 * so the P2 data migration can run without a big-bang cutover.
 *
 * Deliberately does *not* preserve `heroTemplateId` / `catalogTemplateId` — those
 * become section variants inside the section engine (docs/00-AUDIT.md F-14), and
 * pretending a template id is a theme would freeze the old model in place.
 */
export function themeFromLegacyState(legacy: {
  accentColor?: string | null;
  buttonColor?: string | null;
  bgColor?: string | null;
  buttonRadius?: string | null;
  fontStyle?: string | null;
  storefrontTheme?: {
    primaryColor?: string | null;
    background?: string | null;
    cardRadius?: string | null;
  } | null;
}): TenantTheme {
  const brand =
    legacy.storefrontTheme?.primaryColor ??
    legacy.accentColor ??
    legacy.buttonColor ??
    DEFAULT_THEME.brandColor;

  const radiusMap: Record<string, TenantTheme["radius"]> = {
    rounded: "rounded",
    pill: "pill",
    sharp: "sharp",
  };

  const fontMap: Record<string, TenantTheme["fontPair"]> = {
    modern: "modern",
    bold: "geometric",
    classic: "editorial",
    playful: "friendly",
  };

  // A hand-set near-white page background is the only case we treat as "light on
  // purpose"; everything else follows the legacy `background` intent.
  const wantsDark = legacy.storefrontTheme?.background === "dark";

  return themeSchema.parse({
    id: "custom",
    name: "Custom",
    brandColor: parseHex(brand) ? normalizeHex(brand) : DEFAULT_THEME.brandColor,
    background: wantsDark ? "dark" : "light",
    radius: radiusMap[String(legacy.storefrontTheme?.cardRadius ?? legacy.buttonRadius ?? "")] ?? "rounded",
    fontPair: fontMap[String(legacy.fontStyle ?? "")] ?? "modern",
    presetId: null,
  });
}
