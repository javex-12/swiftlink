/**
 * Design tokens — the single source of truth for every color, radius, shadow and
 * motion value in the product.
 *
 * Layering (see `docs/01-DESIGN-SYSTEM.md` §3):
 *   primitives  →  semantic  →  component
 *   `--sl-*`       `--app-*` / `--t-*`   only when a component truly needs its own
 *
 * `styles/tokens.css` declares the same values as CSS custom properties. The two
 * are kept honest by `lib/__tests__/tokens.test.ts`, which parses the CSS and
 * fails if it drifts from this file. That test is the reason this module can be
 * trusted as *the* source of truth rather than a second copy of it.
 *
 * Rule from `docs/02-BUILDER-ARCHITECTURE.md` §8: no hex literal appears outside
 * `lib/theme`. If a component needs a color, it comes from a token here.
 */

import { contrastRatio, parseHex, toHex, type RGB } from "./color";

/* ------------------------------------------------------------------ *
 * Primitives — never referenced by components directly
 * ------------------------------------------------------------------ */

export const primitives = {
  "neutral-0": "#ffffff",
  "neutral-25": "#fcfcfd",
  "neutral-50": "#f8fafc",
  "neutral-100": "#f1f5f9",
  "neutral-200": "#e2e8f0",
  "neutral-300": "#cbd5e1",
  "neutral-400": "#94a3b8",
  "neutral-500": "#64748b",
  "neutral-600": "#475569",
  "neutral-700": "#334155",
  "neutral-800": "#1e293b",
  "neutral-900": "#0f172a",
  "neutral-950": "#020617",

  // Brand ramp. `accent-500` is the recognised SwiftLink emerald and is kept for
  // decorative use; anything carrying text uses 700, because white on 500
  // measures 2.54:1 — a real accessibility defect in the old `btn-primary`
  // gradient (see docs/00-AUDIT.md F-19).
  "accent-50": "#ecfdf5",
  "accent-100": "#d1fae5",
  "accent-200": "#a7f3d0",
  "accent-300": "#6ee7b7",
  "accent-400": "#34d399",
  "accent-500": "#10b981",
  "accent-600": "#059669",
  "accent-700": "#047857",
  "accent-800": "#065f46",
  "accent-900": "#064e3b",

  "success-500": "#15803d",
  "warning-500": "#b45309",
  "danger-500": "#dc2626",
  "info-500": "#2563eb",
  "success-300": "#4ade80",
  "warning-300": "#fbbf24",
  "danger-300": "#f87171",
  "info-300": "#60a5fa",

  // Console dark surfaces. Deliberately not pure black — the old `.dark .bg-black
  // { background-color: #0c0e12 !important }` override was right about the intent
  // and wrong about the method (docs/00-AUDIT.md F-17).
  "night-950": "#0b1220",
  "night-900": "#131c2e",
  "night-800": "#1a2337",
  "night-700": "#232d42",
  "night-subtle": "#7c8da6",
} as const;

export type PrimitiveName = keyof typeof primitives;

/* ------------------------------------------------------------------ *
 * Console semantics — the merchant-facing product's own brand
 * ------------------------------------------------------------------ */

export const consoleLightTokens = {
  bg: "#f8fafc",
  surface: "#ffffff",
  "surface-2": "#f1f5f9",
  border: "#e2e8f0",
  "border-strong": "#64748b",
  text: "#0f172a",
  "text-muted": "#475569",
  "text-subtle": "#64748b",
  accent: "#047857",
  "accent-hover": "#065f46",
  "accent-fg": "#ffffff",
  "accent-subtle": "#ecfdf5",
  "accent-text": "#047857",
  ring: "#047857",
  success: "#15803d",
  "success-subtle": "#f0fdf4",
  warning: "#b45309",
  "warning-subtle": "#fffbeb",
  danger: "#dc2626",
  "danger-fg": "#ffffff",
  "danger-subtle": "#fef2f2",
  info: "#2563eb",
  "info-subtle": "#eff6ff",
  overlay: "rgba(2, 6, 23, 0.5)",
} as const;

export const consoleDarkTokens: Record<keyof typeof consoleLightTokens, string> = {
  bg: "#0b1220",
  surface: "#131c2e",
  "surface-2": "#1a2337",
  border: "#232d42",
  "border-strong": "#64748b",
  text: "#f1f5f9",
  "text-muted": "#94a3b8",
  "text-subtle": "#7c8da6",
  accent: "#34d399",
  "accent-hover": "#6ee7b7",
  "accent-fg": "#04231a",
  "accent-subtle": "#0c2a22",
  "accent-text": "#6ee7b7",
  ring: "#6ee7b7",
  success: "#4ade80",
  "success-subtle": "#0d2416",
  warning: "#fbbf24",
  "warning-subtle": "#291d06",
  danger: "#f87171",
  "danger-fg": "#2a1214",
  "danger-subtle": "#2a1214",
  info: "#60a5fa",
  "info-subtle": "#0f1f3d",
  overlay: "rgba(2, 6, 23, 0.7)",
};

export type ConsoleTokenName = keyof typeof consoleLightTokens;

/**
 * Which console token pairs must satisfy which WCAG minimum, in which mode.
 *
 * This is executable documentation: `tokens.test.ts` walks it and fails the build
 * when a token edit makes the product unreadable. Without it, the contrast work
 * is a one-off cleanup that decays — the exact failure mode of the old codebase.
 */
export const consoleContrastPairs: {
  fg: ConsoleTokenName;
  bg: ConsoleTokenName;
  min: number;
  why: string;
}[] = [
  { fg: "text", bg: "bg", min: 7, why: "primary body copy on the page" },
  { fg: "text", bg: "surface", min: 7, why: "primary body copy on a card" },
  { fg: "text-muted", bg: "surface", min: 4.5, why: "secondary copy on a card" },
  { fg: "text-subtle", bg: "surface", min: 4.5, why: "metadata (order ids, timestamps)" },
  { fg: "accent-fg", bg: "accent", min: 4.5, why: "button label on the primary action" },
  { fg: "accent-text", bg: "bg", min: 4.5, why: "accent used as a link on the page" },
  { fg: "accent-text", bg: "surface", min: 4.5, why: "accent used as a link on a card" },
  { fg: "success", bg: "surface", min: 4.5, why: "success message" },
  { fg: "danger", bg: "surface", min: 4.5, why: "error message" },
  { fg: "warning", bg: "surface", min: 4.5, why: "warning message" },
  { fg: "info", bg: "surface", min: 4.5, why: "informational message" },
  { fg: "border-strong", bg: "surface", min: 3, why: "meaningful UI boundary / focus ring" },
];

/* ------------------------------------------------------------------ *
 * Scale tokens — spacing, radius, elevation, motion, type, z-index
 * ------------------------------------------------------------------ */

export const radius = {
  none: "0px",
  xs: "6px",
  sm: "8px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  "2xl": "24px",
  full: "9999px",
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
} as const;

export const motion = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const zIndex = {
  base: "0",
  dropdown: "1000",
  sticky: "1100",
  overlay: "1200",
  modal: "1300",
  toast: "1400",
  tooltip: "1500",
} as const;

/* ------------------------------------------------------------------ *
 * Theme shape tokens
 * ------------------------------------------------------------------ */

/** Radius presets a merchant picks between (replaces the partial `buttonRadius`). */
export const radiusPresets = {
  sharp: { sm: "2px", md: "4px", lg: "6px", xl: "8px", pill: "9999px" },
  soft: { sm: "8px", md: "10px", lg: "14px", xl: "18px", pill: "9999px" },
  rounded: { sm: "12px", md: "16px", lg: "22px", xl: "28px", pill: "9999px" },
  pill: { sm: "9999px", md: "9999px", lg: "9999px", xl: "9999px", pill: "9999px" },
} as const;

export type RadiusPreset = keyof typeof radiusPresets;

/** Storefront vertical rhythm, so "brutalist tight" and "editorial airy" are data. */
export const densityPresets = {
  compact: { section: "48px", stack: "12px", gutter: "16px" },
  comfortable: { section: "80px", stack: "20px", gutter: "24px" },
  airy: { section: "clamp(72px, 9vw, 128px)", stack: "28px", gutter: "32px" },
} as const;

export type DensityPreset = keyof typeof densityPresets;

/**
 * Type scale. Display sizes are fluid so a storefront headline works on a 360px
 * phone and a 1440px desktop without per-breakpoint overrides.
 */
export const typeScale = {
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.25rem"],
  base: ["1rem", "1.6rem"],
  lg: ["1.125rem", "1.7rem"],
  xl: ["1.25rem", "1.8rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["1.875rem", "2.3rem"],
  "4xl": ["2.25rem", "2.6rem"],
  "display-3": ["clamp(1.75rem, 4vw, 2.5rem)", "1.15"],
  "display-2": ["clamp(2.25rem, 6vw, 3.5rem)", "1.08"],
  "display-1": ["clamp(2.75rem, 8vw, 5rem)", "1.02"],
} as const;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Resolve a primitive name to its hex value, for JS that needs the literal. */
export function primitive(name: PrimitiveName): string {
  return primitives[name];
}

export function primitiveRgb(name: PrimitiveName): RGB {
  return parseHex(primitives[name])!;
}

/** `#10b981` → `#10b981`. Unknown strings are reported rather than thrown, so a
 *  bad token surfaces as a failing test instead of a blank screen. */
export function resolvePrimitiveNames(value: string): string | null {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? toHex(parseHex(value)!) : null;
}

/** Contrast between two primitives — used by the preset audit in tests. */
export function primitiveContrast(a: PrimitiveName, b: PrimitiveName): number {
  return contrastRatio(primitives[a], primitives[b]);
}
