/**
 * Theme derivation — merchant intent in, a complete accessible palette out.
 *
 * The merchant supplies one brand color and a handful of shape decisions. This
 * module produces every surface, border, tint and foreground, and **fixes anything
 * unreadable**, reporting what it changed. That last part is the real work: the
 * old build let a merchant pick Cyberpunk or Matrix Green and shipped it
 * (docs/00-AUDIT.md F-18), and its entire contrast strategy was `isDarkColor()` in
 * `lib/utils.ts`.
 *
 * Order matters and is deliberate:
 *   background → text → surfaces/borders → accent fills → accent-as-text
 * because each step measures against a color that already exists.
 *
 * Pure module. Same input always produces the same output, which is what lets a
 * server render and a client render agree — and what makes `lib/__tests__/theme.test.ts`
 * able to assert every shipped preset passes WCAG 2.2 AA.
 */

import {
  CONTRAST,
  alpha,
  asRgb,
  bestTextOn,
  contrastRatio,
  correctForContrast,
  mix,
  normalizeHex,
  shiftLightness,
  toHex,
  type RGB,
} from "./color";
import {
  primitives,
  densityPresets,
  radiusPresets,
  type DensityPreset,
  type RadiusPreset,
} from "./tokens";
import { FONT_PAIRS, type TenantTheme, type FontPairing } from "./theme-schema";

export type ColorScheme = "light" | "dark";

/** The storefront's complete color set for one scheme. */
export type ThemeColorTokens = {
  bg: RGB;
  surface: RGB;
  surfaceAlt: RGB;
  text: RGB;
  textMuted: RGB;
  border: RGB;
  borderStrong: RGB;
  accent: RGB;
  accentHover: RGB;
  accentFg: RGB;
  accentText: RGB;
  accentSubtle: RGB;
};

export type ThemeContrast = {
  textOnBg: number;
  textMutedOnBg: number;
  accentOnBg: number;
  accentFgOnAccent: number;
  accentTextOnSubtle: number;
  borderStrongOnBg: number;
};

export type DerivedTheme = {
  theme: TenantTheme;
  scheme: ColorScheme;
  color: ThemeColorTokens;
  /**
   * The other scheme's palette, always derived.
   *
   * `themeToCssVars` reads it for the `prefers-color-scheme` swap when the theme is
   * `auto`; the theme picker reads it to show an honest dark preview of every
   * preset rather than only the ones the merchant set to dark.
   */
  alternateColor: ThemeColorTokens;
  radius: (typeof radiusPresets)[RadiusPreset];
  space: (typeof densityPresets)[DensityPreset];
  fonts: FontPairing;
  shadowCard: string;
  duration: string;
  ease: string;
  imageRatio: string;
  nav: TenantTheme["nav"];
  contrast: ThemeContrast;
  /** Every declared minimum is met. */
  passes: boolean;
  /** Human-readable notes for the editor — "we adjusted your color" lives here. */
  adjustments: string[];
};

/* ------------------------------------------------------------------ *
 * One scheme
 * ------------------------------------------------------------------ */

/**
 * Corrections are tagged by who caused them. The engine expectedly adjusts
 * secondary text and hairline borders on every theme — that is derivation, not a
 * merchant mistake, and reporting it would make the editor permanently noisy.
 * Only `brand` and `accentFg` come from the merchant's own input, so only those
 * surface as `DerivedTheme.adjustments`.
 */
type NoteKind = "brand" | "accentFg" | "text" | "muted" | "info";
type Note = { kind: NoteKind; message: string };

export const MERCHANT_FACING_NOTES: NoteKind[] = ["brand", "accentFg"];

function deriveScheme(theme: TenantTheme, scheme: ColorScheme): {
  color: ThemeColorTokens;
  contrast: ThemeContrast;
  passes: boolean;
  notes: Note[];
} {
  const isDark = scheme === "dark";
  const brand = asRgb(theme.brandColor);
  const notes: Note[] = [];

  const base = isDark ? primitives["night-950"] : primitives["neutral-0"];
  const inkRef = isDark ? primitives["neutral-100"] : primitives["neutral-900"];

  // A whisper of the brand in the page background stops every storefront looking
  // like the same white template.
  const bg = mix(base, brand, isDark ? 0.08 : 0.025);
  const surface = isDark ? mix(bg, primitives["neutral-0"], 0.05) : asRgb(primitives["neutral-0"]);

  const textFixed = correctForContrast(inkRef, bg, CONTRAST.comfortable);
  const text = textFixed.color;
  if (!textFixed.unchanged) {
    notes.push({ kind: "text", message: "Body text was adjusted to stay readable on the page background." });
  }

  const surfaceAlt = mix(bg, text, isDark ? 0.08 : 0.05);

  const mutedFixed = correctForContrast(mix(text, bg, 0.45), bg, CONTRAST.body);
  const textMuted = mutedFixed.color;
  if (!mutedFixed.unchanged) {
    notes.push({ kind: "muted", message: "Secondary text was adjusted for readability." });
  }

  // Faint divider for decoration; `borderStrong` is the 3:1 boundary that carries
  // meaning (input outlines, focus rings) per WCAG 2.2 §1.4.11.
  const border = mix(text, bg, 0.88);
  const borderStrong = correctForContrast(mix(text, bg, 0.5), bg, CONTRAST.ui).color;

  // --- accent ---------------------------------------------------------
  const accentFixed = correctForContrast(brand, bg, CONTRAST.ui);
  const accent = accentFixed.color;
  if (!accentFixed.unchanged) {
    notes.push({
      kind: "brand",
      message: "Your brand color was adjusted so buttons and links are visible on the page background.",
    });
  }

  const accentHover = shiftLightness(accent, isDark ? 0.06 : -0.06);
  const accentFgFixed = correctForContrast(bestTextOn(accent), accent, CONTRAST.body);
  const accentFg = accentFgFixed.color;
  if (!accentFgFixed.unchanged) {
    notes.push({ kind: "accentFg", message: "The label color on your buttons was changed to stay readable." });
  }

  const accentSubtle = mix(bg, accent, isDark ? 0.18 : 0.1);
  // Corrected against the tint rather than the page, so text on a tinted chip and
  // text on the page are both readable (the tint is the harder case).
  const accentText = correctForContrast(brand, accentSubtle, CONTRAST.body).color;

  const color: ThemeColorTokens = {
    bg,
    surface,
    surfaceAlt,
    text,
    textMuted,
    border,
    borderStrong,
    accent,
    accentHover,
    accentFg,
    accentText,
    accentSubtle,
  };

  const contrast: ThemeContrast = {
    textOnBg: contrastRatio(text, bg),
    textMutedOnBg: contrastRatio(textMuted, bg),
    accentOnBg: contrastRatio(accent, bg),
    accentFgOnAccent: contrastRatio(accentFg, accent),
    accentTextOnSubtle: contrastRatio(accentText, accentSubtle),
    borderStrongOnBg: contrastRatio(borderStrong, bg),
  };

  const passes =
    contrast.textOnBg >= CONTRAST.comfortable &&
    contrast.textMutedOnBg >= CONTRAST.body &&
    contrast.accentOnBg >= CONTRAST.ui &&
    contrast.accentFgOnAccent >= CONTRAST.body &&
    contrast.accentTextOnSubtle >= CONTRAST.body &&
    contrast.borderStrongOnBg >= CONTRAST.ui;

  return { color, contrast, passes, notes };
}

/* ------------------------------------------------------------------ *
 * Full theme
 * ------------------------------------------------------------------ */

const MOTION = {
  none: { duration: "0ms", ease: "linear" },
  subtle: { duration: "200ms", ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
  expressive: { duration: "320ms", ease: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
} as const;

export function buildTheme(theme: TenantTheme): DerivedTheme {
  const scheme: ColorScheme = theme.background === "dark" ? "dark" : "light";
  const primary = deriveScheme(theme, scheme);
  // Always derive both. It costs microseconds, `auto` needs both, and the theme
  // picker's thumbnail needs the honest dark preview regardless of the setting.
  const other = deriveScheme(theme, scheme === "dark" ? "light" : "dark");

  const isDark = scheme === "dark";

  // Only merchant-caused corrections are surfaced — see MERCHANT_FACING_NOTES.
  const adjustments = primary.notes
    .filter((note) => MERCHANT_FACING_NOTES.includes(note.kind))
    .map((note) => note.message);

  if (normalizeHex(theme.brandColor) !== toHex(primary.color.accent) && adjustments.length === 0) {
    adjustments.push("Your brand color was adjusted for readability.");
  }

  if (theme.background === "auto") {
    adjustments.push("Light and dark versions are generated; visitors follow their device setting.");
  }

  const motion = MOTION[theme.motion];

  return {
    theme,
    scheme,
    color: primary.color,
    alternateColor: other.color,
    radius: radiusPresets[theme.radius],
    space: densityPresets[theme.density],
    fonts: FONT_PAIRS[theme.fontPair],
    // Dark storefronts separate cards with borders and a hairline glow instead of
    // dropping a black shadow onto a near-black page.
    shadowCard: isDark
      ? "none"
      : `0 1px 3px 0 ${alpha(primary.color.text, 0.08)}, 0 1px 2px -1px ${alpha(primary.color.text, 0.06)}`,
    duration: motion.duration,
    ease: motion.ease,
    imageRatio: theme.imageRatio,
    nav: theme.nav,
    contrast: primary.contrast,
    passes: primary.passes,
    adjustments,
  };
}

/* ------------------------------------------------------------------ *
 * CSS variables
 * ------------------------------------------------------------------ */

export const THEME_COLOR_VARS: Record<keyof ThemeColorTokens, string> = {
  bg: "--t-bg",
  surface: "--t-surface",
  surfaceAlt: "--t-surface-alt",
  text: "--t-text",
  textMuted: "--t-text-muted",
  border: "--t-border",
  borderStrong: "--t-border-strong",
  accent: "--t-accent",
  accentHover: "--t-accent-hover",
  accentFg: "--t-accent-fg",
  accentText: "--t-accent-text",
  accentSubtle: "--t-accent-subtle",
};

/**
 * Compile a theme to the `--t-*` custom properties.
 *
 * Applied inline on the storefront scope element, so a tenant theme cannot reach
 * the console (docs/01-DESIGN-SYSTEM.md §3.1). Returned as a plain record because
 * these are custom properties, which `React.CSSProperties` does not model —
 * spread it onto `style` at the call site.
 */
export function themeToCssVars(theme: TenantTheme): Record<string, string> {
  const derived = buildTheme(theme);
  const vars: Record<string, string> = {};

  for (const [key, varName] of Object.entries(THEME_COLOR_VARS)) {
    vars[varName] = toHex(derived.color[key as keyof ThemeColorTokens]);
  }

  // The `-dark` set is only consumed when the visitor's device decides, so it is
  // emitted for `auto` themes only. `alternateColor` is the dark palette in that
  // case, because `auto` resolves to light as its base scheme.
  if (theme.background === "auto") {
    for (const [key, varName] of Object.entries(THEME_COLOR_VARS)) {
      vars[`${varName}-dark`] = toHex(derived.alternateColor[key as keyof ThemeColorTokens]);
    }
  }

  vars["--t-radius-sm"] = derived.radius.sm;
  vars["--t-radius"] = derived.radius.md;
  vars["--t-radius-lg"] = derived.radius.lg;
  vars["--t-radius-pill"] = derived.radius.pill;

  vars["--t-space-section"] = derived.space.section;
  vars["--t-space-stack"] = derived.space.stack;
  vars["--t-gutter"] = derived.space.gutter;

  vars["--t-font-display"] = derived.fonts.display;
  vars["--t-font-body"] = derived.fonts.body;

  vars["--t-shadow-card"] = derived.shadowCard;
  vars["--t-duration"] = derived.duration;
  vars["--t-ease"] = derived.ease;

  vars["--t-color-scheme"] = derived.scheme;

  return vars;
}

/** Report a derived theme in a form that is easy to read in a test failure. */
export function describeContrast(theme: TenantTheme): string {
  const { contrast, scheme } = buildTheme(theme);
  return [
    `${theme.id} (${scheme})`,
    `text/bg ${contrast.textOnBg.toFixed(2)}`,
    `muted/bg ${contrast.textMutedOnBg.toFixed(2)}`,
    `accent/bg ${contrast.accentOnBg.toFixed(2)}`,
    `accentFg/accent ${contrast.accentFgOnAccent.toFixed(2)}`,
    `accentText/tint ${contrast.accentTextOnSubtle.toFixed(2)}`,
    `border/bg ${contrast.borderStrongOnBg.toFixed(2)}`,
  ].join(" · ");
}
