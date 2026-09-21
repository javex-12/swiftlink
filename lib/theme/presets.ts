/**
 * The theme preset library.
 *
 * Replaces `PRESET_PALETTES` — 24 hard-coded hex palettes in `BusinessView.tsx:19-45`
 * whose only "system" was a list, and several of which (Cyberpunk, Matrix Green)
 * could not pass contrast at all (docs/00-AUDIT.md F-18).
 *
 * A preset is just a `TenantTheme` with a name and a family, so:
 *   - every preset is validated by the same schema a merchant's custom theme uses;
 *   - every preset can be contrast-audited in a test (`theme.test.ts` does);
 *   - adding a preset is a recipe, not a rewrite — and later, a marketplace item.
 *
 * The library targets ~20 presets across 8 families
 * (`docs/01-DESIGN-SYSTEM.md` §3.3 / `02-BUILDER-ARCHITECTURE.md` §3). Because
 * color, type, radius, density, motion, image ratio and navigation all move
 * together, that is roughly a 100× increase in perceived choice over the single
 * emerald gradient the product shipped with.
 *
 * Every `brandColor` below is a *starting point*, not a promise: the contrast
 * engine may adjust it, and the theme picker shows the result honestly.
 */

import { themeSchema, type TenantTheme } from "./theme-schema";

export const THEME_FAMILIES = [
  "Editorial",
  "Modern",
  "Minimal",
  "Boutique",
  "Streetwear",
  "Luxury",
  "Technical",
  "Playful",
] as const;

export type ThemeFamily = (typeof THEME_FAMILIES)[number];

export type ThemePreset = TenantTheme & {
  family: ThemeFamily;
  description: string;
  /** Free-text tags for the theme picker's search. */
  tags: string[];
};

type PresetSeed = {
  id: string;
  name: string;
  family: ThemeFamily;
  description: string;
  tags: string[];
} & Partial<
  Pick<
    TenantTheme,
    "brandColor" | "background" | "fontPair" | "radius" | "density" | "motion" | "imageRatio" | "nav"
  >
>;

const seeds: PresetSeed[] = [
  /* --- Editorial — serif display, airy, magazine grid ------------------ */
  {
    id: "editorial-classic",
    name: "Editorial Classic",
    family: "Editorial",
    description: "Serif headlines, generous whitespace, portrait imagery.",
    tags: ["fashion", "magazine", "writing", "gallery"],
    brandColor: "#111111",
    fontPair: "editorial",
    radius: "sharp",
    density: "airy",
    imageRatio: "4/5",
  },
  {
    id: "editorial-night",
    name: "Editorial Night",
    family: "Editorial",
    description: "The magazine look on ink. Good for photography and events.",
    tags: ["fashion", "photography", "night", "dark"],
    brandColor: "#e7e5e4",
    background: "dark",
    fontPair: "editorial",
    radius: "sharp",
    density: "airy",
    imageRatio: "4/5",
  },

  /* --- Modern — one clean sans, the safe default ---------------------- */
  {
    id: "modern-emerald",
    name: "Modern Emerald",
    family: "Modern",
    description: "Balanced and familiar. A safe first store for most businesses.",
    tags: ["general", "retail", "safe", "green"],
    brandColor: "#047857",
    fontPair: "modern",
    radius: "rounded",
    density: "comfortable",
  },
  {
    id: "modern-indigo",
    name: "Modern Indigo",
    family: "Modern",
    description: "Calm blue with a bottom navigation bar. Suits services and B2B.",
    tags: ["services", "technology", "blue", "mobile"],
    brandColor: "#4f46e5",
    fontPair: "modern",
    radius: "rounded",
    density: "comfortable",
    nav: "bottom",
  },
  {
    id: "modern-plum",
    name: "Modern Plum",
    family: "Modern",
    description: "Confident purple for beauty, wellness and home goods.",
    tags: ["beauty", "wellness", "home", "purple"],
    brandColor: "#7e22ce",
    fontPair: "modern",
    radius: "rounded",
    density: "comfortable",
  },
  {
    id: "modern-forest",
    name: "Modern Forest",
    family: "Modern",
    description: "Deep green on ink. Feels established without feeling corporate.",
    tags: ["food", "organic", "green", "dark"],
    brandColor: "#22c55e",
    background: "dark",
    fontPair: "modern",
    radius: "rounded",
    density: "comfortable",
    imageRatio: "4/5",
  },

  /* --- Minimal — as little design as possible ------------------------- */
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    family: "Minimal",
    description: "Almost no decoration. Lets the product photography lead.",
    tags: ["minimal", "monochrome", "photography", "quiet"],
    brandColor: "#111827",
    fontPair: "modern",
    radius: "soft",
    density: "airy",
    motion: "none",
  },
  {
    id: "minimal-sand",
    name: "Minimal Sand",
    family: "Minimal",
    description: "Warm neutral with a sand accent. Understated and premium.",
    tags: ["minimal", "warm", "neutral", "handmade"],
    brandColor: "#a16207",
    fontPair: "modern",
    radius: "soft",
    density: "airy",
    motion: "none",
    imageRatio: "4/5",
  },
  {
    id: "minimal-slate",
    name: "Minimal Slate",
    family: "Minimal",
    description: "Cool grey and square. Quietly corporate, never cold.",
    tags: ["minimal", "grey", "professional", "b2b"],
    brandColor: "#475569",
    fontPair: "modern",
    radius: "soft",
    density: "airy",
    motion: "none",
    imageRatio: "4/5",
  },

  /* --- Boutique — soft, warm, rounded ---------------------------------- */
  {
    id: "boutique-rose",
    name: "Boutique Rose",
    family: "Boutique",
    description: "Warm rose with a drawer menu. Gifts, flowers, small-batch goods.",
    tags: ["boutique", "gifts", "rose", "warm"],
    brandColor: "#be123c",
    fontPair: "friendly",
    radius: "rounded",
    density: "comfortable",
    motion: "expressive",
    imageRatio: "4/5",
    nav: "drawer",
  },
  {
    id: "boutique-clay",
    name: "Boutique Clay",
    family: "Boutique",
    description: "Earthy terracotta. Feels handmade and locally made.",
    tags: ["handmade", "craft", "earth", "warm"],
    brandColor: "#c2410c",
    fontPair: "friendly",
    radius: "rounded",
    density: "comfortable",
    motion: "expressive",
    imageRatio: "3/4",
  },

  /* --- Streetwear — loud, dense, high contrast ------------------------- */
  {
    id: "streetwear-blackout",
    name: "Streetwear Blackout",
    family: "Streetwear",
    description: "Blackout hero, tightly packed grid, no apologies.",
    tags: ["streetwear", "fashion", "bold", "black"],
    brandColor: "#000000",
    fontPair: "technical",
    radius: "sharp",
    density: "compact",
    motion: "expressive",
  },
  {
    id: "streetwear-volt",
    name: "Streetwear Volt",
    family: "Streetwear",
    description: "High-contrast accent on ink, built for drops and limited runs.",
    tags: ["streetwear", "drops", "neon", "dark"],
    brandColor: "#a3e635",
    background: "dark",
    fontPair: "technical",
    radius: "sharp",
    density: "compact",
    motion: "expressive",
  },

  /* --- Luxury — restrained display type, generous frames --------------- */
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    family: "Luxury",
    description: "Serif display and a muted gold accent on ink.",
    tags: ["luxury", "jewellery", "gold", "dark"],
    brandColor: "#d4a24c",
    background: "dark",
    fontPair: "luxury",
    radius: "sharp",
    density: "airy",
    imageRatio: "4/5",
  },
  {
    id: "luxury-midnight",
    name: "Luxury Midnight",
    family: "Luxury",
    description: "Deep navy, wide frames, cinematic banners.",
    tags: ["luxury", "watches", "travel", "dark"],
    brandColor: "#93c5fd",
    background: "dark",
    fontPair: "luxury",
    radius: "sharp",
    density: "airy",
    imageRatio: "16/9",
  },

  /* --- Technical — engineered, dense, information first ---------------- */
  {
    id: "technical-blueprint",
    name: "Technical Blueprint",
    family: "Technical",
    description: "Dense catalogue layout with wide banners. Electronics and tools.",
    tags: ["electronics", "tools", "dense", "blue"],
    brandColor: "#1d4ed8",
    fontPair: "technical",
    radius: "soft",
    density: "compact",
    motion: "none",
    imageRatio: "16/9",
  },
  {
    id: "technical-graphite",
    name: "Technical Graphite",
    family: "Technical",
    description: "Dark console-like storefront for hardware and spares.",
    tags: ["hardware", "spares", "dark", "dense"],
    brandColor: "#94a3b8",
    background: "dark",
    fontPair: "technical",
    radius: "soft",
    density: "compact",
    motion: "none",
    imageRatio: "16/9",
  },

  /* --- Playful — round, bright, movement ------------------------------ */
  {
    id: "playful-tangerine",
    name: "Playful Tangerine",
    family: "Playful",
    description: "Fully rounded everything with a bright orange accent.",
    tags: ["playful", "kids", "food", "orange"],
    brandColor: "#ea580c",
    fontPair: "friendly",
    radius: "pill",
    density: "comfortable",
    motion: "expressive",
    nav: "bottom",
  },
  {
    id: "playful-sky",
    name: "Playful Sky",
    family: "Playful",
    description: "Bright and rounded. Friendly for services booked on a phone.",
    tags: ["playful", "services", "blue", "mobile"],
    brandColor: "#0284c7",
    fontPair: "friendly",
    radius: "pill",
    density: "comfortable",
    motion: "expressive",
    nav: "bottom",
  },
  {
    id: "playful-bubblegum",
    name: "Playful Bubblegum",
    family: "Playful",
    description: "Pink, rounded and social-first. Sweets, gifts, accessories.",
    tags: ["playful", "pink", "gifts", "social"],
    brandColor: "#db2777",
    fontPair: "friendly",
    radius: "pill",
    density: "comfortable",
    motion: "expressive",
    imageRatio: "4/5",
    nav: "drawer",
  },
];

/**
 * The library. Parsed through the real schema so a malformed preset fails here —
 * in a test — rather than in a customer's storefront.
 */
export const themePresets: ThemePreset[] = seeds.map((seed) => ({
  ...seed,
  ...themeSchema.parse(seed),
  presetId: seed.id,
})) as ThemePreset[];

export const DEFAULT_PRESET_ID = "modern-emerald";

export function themePresetById(id: string | null | undefined): ThemePreset | null {
  if (!id) return null;
  return themePresets.find((preset) => preset.id === id) ?? null;
}

export function themePresetsByFamily(family: ThemeFamily): ThemePreset[] {
  return themePresets.filter((preset) => preset.family === family);
}

/** Family → presets, in library order, for the grouped theme picker. */
export function themePresetsGrouped(): { family: ThemeFamily; presets: ThemePreset[] }[] {
  return THEME_FAMILIES.map((family) => ({
    family,
    presets: themePresetsByFamily(family),
  })).filter((group) => group.presets.length > 0);
}
