import type { TenantTheme } from "./theme-schema";

/**
 * The three website templates.
 *
 * The product direction (`docs/03-DECISIONS.md` D11) is three *complete* website
 * templates — not the twenty colour presets in `presets.ts`, and not section
 * templates. Each template is a whole storefront design: its own palette, type
 * pairing, radius, density and page composition, shipped as a correct **light** and
 * **dark** version of the same brand.
 *
 * This module deliberately does **not** import zod. It is imported by the customer
 * storefront, and validating a static literal at runtime would put a schema
 * validator on every store visit (`lib/__tests__/templates.test.ts` does the
 * validating, with the real `themeSchema`, so a malformed template still fails CI).
 */

export const WEBSITE_TEMPLATE_IDS = ["editorial", "boutique", "bold"] as const;
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
      "A rounded card layout suited for gifts, beauty products, and everyday items.",
    tagline: "",
    swatch: "#be123c",
    brandColor: "#be123c",
    darkBrandColor: "#fb7185",
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
    darkBrandColor: "#a3e635",
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
