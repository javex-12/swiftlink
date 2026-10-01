/**
 * Font pairings — the merchant picks a pairing, not a font file.
 *
 * This lives in its own module, away from `theme-schema.ts`, for one concrete
 * reason: `theme-schema.ts` imports zod, and the storefront renders through
 * `derive.ts`, which needs these constants. Keeping them here means the customer
 * storefront never bundles a schema validator (measured ~29 kB First Load JS when
 * it did). The schema re-exports these so there is still one definition.
 */

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
