import type { TenantTheme } from "./theme-schema";

/**
 * The website template family.
 *
 * The product direction (`docs/03-DECISIONS.md` D11) is *complete* website
 * templates — not the twenty colour presets in `presets.ts`, and not section
 * templates. Each template is a whole storefront design: its own palette, type
 * pairing, radius, density and page composition, shipped as a correct **light**
 * and **dark** version of the same brand.
 *
 * The owner asked for a family rather than three options, so this ships ten
 * distinct looks — airy editorial, warm artisanal, high-contrast tech, minimal
 * studio, vibrant market, luxe noir, soft bloom, industrial forge, coastal and
 * desert-warm — with the composition pairs (hero + catalog section variants)
 * deliberately kept unique so no two templates open the same way.
 *
 * This module deliberately does **not** import zod. It is imported by the customer
 * storefront, and validating a static literal at runtime would put a schema
 * validator on every store visit (`lib/__tests__/templates.test.ts` does the
 * validating, with the real `themeSchema`, so a malformed template still fails CI).
 *
 * Contrast is not a per-template concern: every brand colour is passed through the
 * engine in `lib/theme/derive.ts`, which corrects anything unreadable and reports
 * it. That is why a template may ship a saturated dark-side accent without any
 * hand-checked pairing.
 */

export const WEBSITE_TEMPLATE_IDS = [
  "editorial",
  "boutique",
  "bold",
  "studio",
  "market",
  "noir",
  "bloom",
  "forge",
  "coast",
  "oasis",
] as const;
export type WebsiteTemplateId = (typeof WEBSITE_TEMPLATE_IDS)[number];

/** Which existing section renderers a template composes, by their legacy ids. */
export type TemplateComposition = {
  heroTemplateId: string;
  catalogTemplateId: string;
  aboutTemplateId: string;
  footerTemplateId: string;
};

export interface WebsiteTemplate {
  id: WebsiteTemplateId;
  name: string;
  description: string;
  /** Default storefront tagline shown when the merchant has not written one. */
  tagline: string;
  /** A representative accent, for the picker swatch. */
  swatch: string;
  composition: TemplateComposition;
  light: TenantTheme;
  dark: TenantTheme;
}

/** The shape decisions every variant of a template shares. */
type TemplateShape = Pick<
  TenantTheme,
  "fontPair" | "radius" | "density" | "motion" | "imageRatio" | "nav"
>;

type TemplateSeed = {
  id: WebsiteTemplateId;
  name: string;
  description: string;
  tagline: string;
  swatch: string;
  /** Brand colour per appearance, so dark is a real second look, not an overlay. */
  brandColor: string;
  darkBrandColor: string;
  shape: TemplateShape;
  composition: TemplateComposition;
};

export const websiteTemplateSeeds: TemplateSeed[] = [
  {
    id: "editorial",
    name: "Editorial",
    description:
      "A spacious editorial layout suited for clothing, accessories, and home goods.",
    tagline: "",
    swatch: "#111111",
    brandColor: "#111111",
    darkBrandColor: "#e7e5e4",
    shape: {
      fontPair: "editorial",
      radius: "sharp",
      density: "airy",
      motion: "subtle",
      imageRatio: "4/5",
      nav: "top",
    },
    composition: {
      heroTemplateId: "hero-2",
      catalogTemplateId: "catalog-1",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "boutique",
    name: "Boutique",
    description:
      "A warm, artisanal boutique layout suited for gifts, beauty, and curated goods.",
    tagline: "",
    swatch: "#9a3412",
    brandColor: "#9a3412",
    darkBrandColor: "#ea580c",
    shape: {
      fontPair: "friendly",
      radius: "rounded",
      density: "comfortable",
      motion: "expressive",
      imageRatio: "4/5",
      nav: "drawer",
    },
    composition: {
      heroTemplateId: "hero-5",
      catalogTemplateId: "catalog-2",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "bold",
    name: "Bold",
    description:
      "A compact, high-contrast grid suited for electronics and retail catalogs.",
    tagline: "",
    swatch: "#111827",
    brandColor: "#111827",
    // Was a neon lime (#a3e635) that clashed with every surface it sat on; a
    // vivid cyan keeps the "loud tech" character and actually reads on dark.
    darkBrandColor: "#22d3ee",
    shape: {
      fontPair: "technical",
      radius: "sharp",
      density: "compact",
      motion: "expressive",
      imageRatio: "1/1",
      nav: "bottom",
    },
    composition: {
      heroTemplateId: "hero-1",
      catalogTemplateId: "catalog-10",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "studio",
    name: "Studio",
    description:
      "A minimal gallery with generous whitespace, for design objects and print.",
    tagline: "",
    swatch: "#4338ca",
    brandColor: "#4338ca",
    darkBrandColor: "#818cf8",
    shape: {
      fontPair: "modern",
      radius: "sharp",
      density: "airy",
      motion: "subtle",
      imageRatio: "3/4",
      nav: "top",
    },
    composition: {
      heroTemplateId: "hero-3",
      catalogTemplateId: "catalog-8",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "market",
    name: "Market",
    description:
      "A bright, dense marketplace grid built for groceries and everyday essentials.",
    tagline: "",
    swatch: "#047857",
    brandColor: "#047857",
    darkBrandColor: "#34d399",
    shape: {
      fontPair: "geometric",
      radius: "rounded",
      density: "compact",
      motion: "expressive",
      imageRatio: "1/1",
      nav: "bottom",
    },
    composition: {
      heroTemplateId: "hero-4",
      catalogTemplateId: "catalog-9",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "noir",
    name: "Noir",
    description:
      "A dark, high-contrast look with gold accents, for premium and high-ticket goods.",
    tagline: "",
    swatch: "#1c1917",
    brandColor: "#1c1917",
    darkBrandColor: "#d4af37",
    shape: {
      fontPair: "luxury",
      radius: "sharp",
      density: "airy",
      motion: "subtle",
      imageRatio: "4/5",
      nav: "top",
    },
    composition: {
      heroTemplateId: "hero-6",
      catalogTemplateId: "catalog-1",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "bloom",
    name: "Bloom",
    description:
      "A soft pastel aesthetic for beauty, florists, and handmade goods.",
    tagline: "",
    swatch: "#be185d",
    brandColor: "#be185d",
    darkBrandColor: "#f472b6",
    shape: {
      fontPair: "friendly",
      radius: "pill",
      density: "comfortable",
      motion: "expressive",
      imageRatio: "4/5",
      nav: "drawer",
    },
    composition: {
      heroTemplateId: "hero-7",
      catalogTemplateId: "catalog-2",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "forge",
    name: "Forge",
    description:
      "An industrial, engineered layout for tools, parts, and hard goods.",
    tagline: "",
    swatch: "#334155",
    brandColor: "#334155",
    darkBrandColor: "#f97316",
    shape: {
      fontPair: "technical",
      radius: "sharp",
      density: "compact",
      motion: "none",
      imageRatio: "1/1",
      nav: "top",
    },
    composition: {
      heroTemplateId: "hero-8",
      catalogTemplateId: "catalog-10",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "coast",
    name: "Coast",
    description:
      "An airy coastal palette for travel, wellness, and lifestyle brands.",
    tagline: "",
    swatch: "#0e7490",
    brandColor: "#0e7490",
    darkBrandColor: "#5eead4",
    shape: {
      fontPair: "modern",
      radius: "soft",
      density: "airy",
      motion: "subtle",
      imageRatio: "16/9",
      nav: "top",
    },
    composition: {
      heroTemplateId: "hero-9",
      catalogTemplateId: "catalog-8",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
  {
    id: "oasis",
    name: "Oasis",
    description:
      "A warm desert-sand palette with terracotta accents, for home and interiors.",
    tagline: "",
    swatch: "#b45309",
    brandColor: "#b45309",
    darkBrandColor: "#fbbf24",
    shape: {
      fontPair: "editorial",
      radius: "rounded",
      density: "comfortable",
      motion: "subtle",
      imageRatio: "4/5",
      nav: "drawer",
    },
    composition: {
      heroTemplateId: "hero-10",
      catalogTemplateId: "catalog-9",
      aboutTemplateId: "about-1",
      footerTemplateId: "footer-1",
    },
  },
];

function buildTheme(
  seed: TemplateSeed,
  background: "light" | "dark",
): TenantTheme {
  return {
    id: `${seed.id}-${background}`,
    name: `${seed.name} ${background === "dark" ? "Dark" : "Light"}`,
    brandColor: background === "dark" ? seed.darkBrandColor : seed.brandColor,
    background,
    ...seed.shape,
    enforceContrast: true,
    presetId: seed.id,
  };
}

export const websiteTemplates: WebsiteTemplate[] = websiteTemplateSeeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  description: seed.description,
  tagline: seed.tagline,
  swatch: seed.swatch,
  composition: seed.composition,
  light: buildTheme(seed, "light"),
  dark: buildTheme(seed, "dark"),
}));

/**
 * The three templates the marketing page shows as examples.
 *
 * Deliberately **not** all ten: a gallery of ten reads as a wall, and the point
 * of the sample is to show the *range* of the family. So it is one per
 * navigation engine — editorial (top nav), boutique (drawer), bold (bottom bar)
 * — which are also the three looks merchants already recognise. The landing copy
 * still says how many exist in total, because the number is real.
 */
export const FEATURED_TEMPLATE_IDS: readonly WebsiteTemplateId[] = ["editorial", "boutique", "bold"];

export const featuredWebsiteTemplates: WebsiteTemplate[] = FEATURED_TEMPLATE_IDS.map(
  (id) => websiteTemplates.find((template) => template.id === id)!,
);

export const DEFAULT_WEBSITE_TEMPLATE_ID: WebsiteTemplateId = "editorial";

export function websiteTemplateById(id: string | null | undefined): WebsiteTemplate | null {
  if (!id) return null;
  return websiteTemplates.find((template) => template.id === id) ?? null;
}

/**
 * The tenant theme for a template and a preferred appearance. `auto` follows the
 * light theme as its base and ships the dark set for `prefers-color-scheme`
 * (handled in `styles/tokens.css`).
 */
export function themeForTemplate(
  template: WebsiteTemplate,
  background: TenantTheme["background"],
): TenantTheme {
  if (background === "dark") return template.dark;
  return template.light;
}

export function isWebsiteTemplateId(value: unknown): value is WebsiteTemplateId {
  return typeof value === "string" && (WEBSITE_TEMPLATE_IDS as readonly string[]).includes(value);
}
