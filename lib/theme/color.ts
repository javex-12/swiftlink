/**
 * Color engine — the only place raw color math lives.
 *
 * Why OKLCH: ramps built by lightening/darkening hex values in sRGB look
 * perceptually uneven (the classic "my 700 is grey and my 800 is black" ramp).
 * OKLCH is perceptually uniform, so `withLightness()` produces even steps and
 * `mix()` blends without passing through muddy greys. We always convert back to
 * sRGB hex at the edge so the output is a plain CSS value.
 *
 * Why the contrast gates: `docs/00-AUDIT.md` F-18 recorded that the old palette
 * table shipped presets (Cyberpunk, Matrix Green) that cannot be read, and the
 * entire contrast strategy was `isDarkColor()` in `lib/utils.ts`. Accessibility
 * is not something we ask a merchant to get right — see
 * `docs/01-DESIGN-SYSTEM.md` §4. Every derived color here is checked against
 * WCAG 2.2 and corrected, and the corrections are reported so the editor can
 * say "we adjusted your color for readability".
 *
 * Pure module: no React, no DOM, no dependencies. Unit-tested in
 * `lib/__tests__/color.test.ts`.
 */

export type RGB = { r: number; g: number; b: number }; // 0–255, sRGB
export type OKLCH = { l: number; c: number; h: number }; // l 0–1, c ≥ 0, h degrees

/** WCAG contrast minimums, named so call sites read as intent. */
export const CONTRAST = {
  /** Normal body text. */
  body: 4.5,
  /** ≥18.66px bold or ≥24px text. */
  large: 3,
  /** Boundaries and icons that carry meaning (inputs, focus rings). */
  ui: 3,
  /** Comfort target for primary body copy — we aim past the legal minimum. */
  comfortable: 7,
} as const;

const HEX_6 = /^#([0-9a-fA-F]{6})$/;
const HEX_3 = /^#([0-9a-fA-F]{3})$/;
const LOOSE_HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/* ------------------------------------------------------------------ *
 * Parsing / formatting
 * ------------------------------------------------------------------ */

/** Parse `#rgb`, `#rrggbb` or a bare hex string. Returns null when unparseable. */
export function parseHex(input: unknown): RGB | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  const six = HEX_6.exec(s);
  if (six) {
    const n = parseInt(six[1]!, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const three = HEX_3.exec(s);
  if (three) {
    const [r, g, b] = three[1]!.split("") as [string, string, string];
    return { r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16) };
  }
  return null;
}

/** Coerce anything into a `#rrggbb` string, falling back when unparseable. */
export function normalizeHex(input: unknown, fallback = "#000000"): string {
  const rgb = parseHex(input);
  if (rgb) return toHex(rgb);
  const loose = typeof input === "string" ? LOOSE_HEX.exec(input.trim()) : null;
  if (loose) return normalizeHex(`#${loose[1]}`, fallback);
  return normalizeHex(parseHex(fallback) ? fallback : "#000000", "#000000");
}

export function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** `rgba()` string — used for borders and overlays that must stay translucent. */
export function alpha(color: RGB | string, a: number): string {
  const rgb = typeof color === "string" ? (parseHex(color) ?? { r: 0, g: 0, b: 0 }) : color;
  const t = clamp(a, 0, 1);
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${round(t, 3)})`;
}

/* ------------------------------------------------------------------ *
 * sRGB ↔ linear ↔ OKLab ↔ OKLCH
 * ------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number, dp: number) => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const linear = (c: number) => srgbToLinear(clamp(c, 0, 255) / 255);

type Linear = { r: number; g: number; b: number };
type Lab = { L: number; a: number; b: number };

function linearToOklab({ r, g, b }: Linear): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinear({ L, a, b }: Lab): Linear {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

export function toOklch(rgb: RGB): OKLCH {
  const { L, a, b } = linearToOklab({ r: linear(rgb.r), g: linear(rgb.g), b: linear(rgb.b) });
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

/** Is this OKLCH triple representable in sRGB? (all channels inside 0–1) */
function inGamut({ L, a, b }: Lab): boolean {
  const lin = oklabToLinear({ L, a, b });
  const ok = (v: number) => v >= -1e-4 && v <= 1 + 1e-4;
  return ok(lin.r) && ok(lin.g) && ok(lin.b);
}

/**
 * OKLCH → sRGB. Out-of-gamut colors keep their lightness and hue and give up
 * chroma (binary search) rather than clipping channels, because channel clipping
 * is what makes over-saturated brand colors look dirty.
 */
export function oklchToRgb({ l, c, h }: OKLCH): RGB {
  const rad = (h * Math.PI) / 180;
  const L = clamp(l, 0, 1);
  let lo = 0;
  let hi = Math.max(0, c);

  if (!inGamut({ L, a: hi * Math.cos(rad), b: hi * Math.sin(rad) })) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut({ L, a: mid * Math.cos(rad), b: mid * Math.sin(rad) })) lo = mid;
      else hi = mid;
    }
  } else {
    lo = hi;
  }

  const lin = oklabToLinear({ L, a: lo * Math.cos(rad), b: lo * Math.sin(rad) });
  const enc = (v: number) => Math.round(clamp(linearToSrgb(v), 0, 1) * 255);
  return { r: enc(lin.r), g: enc(lin.g), b: enc(lin.b) };
}

/* ------------------------------------------------------------------ *
 * Lightness / blending operations
 * ------------------------------------------------------------------ */

/** Perceptual lightness, 0 (black) → 1 (white). */
export function lightnessOf(color: RGB | string): number {
  return toOklch(asRgb(color)).l;
}

/** Same hue and chroma, new lightness. Gamut-clamped. */
export function withLightness(color: RGB | string, l: number): RGB {
  const { c, h } = toOklch(asRgb(color));
  return oklchToRgb({ l: clamp(l, 0, 1), c, h });
}

/** Shift lightness by `delta`, clamped to [0,1]. */
export function shiftLightness(color: RGB | string, delta: number): RGB {
  return withLightness(color, lightnessOf(color) + delta);
}

/**
 * Blend in OKLab: `t = 0` returns `base`, `t = 1` returns `target`.
 * Used for surfaces, borders and tinted accent backgrounds.
 */
export function mix(base: RGB | string, target: RGB | string, t: number): RGB {
  const a = toOklch(asRgb(base));
  const b = toOklch(asRgb(target));
  const k = clamp(t, 0, 1);
  // Hue interpolation along the shortest arc, so mixes don't swing through grey.
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return oklchToRgb({
    l: a.l + (b.l - a.l) * k,
    c: a.c + (b.c - a.c) * k,
    h: a.h + dh * k,
  });
}

/* ------------------------------------------------------------------ *
 * WCAG
 * ------------------------------------------------------------------ */

export function relativeLuminance(color: RGB | string): number {
  const { r, g, b } = asRgb(color);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG 2.2 contrast ratio, 1 → 21. Order-independent. */
export function contrastRatio(a: RGB | string, b: RGB | string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export const passes = (a: RGB | string, b: RGB | string, min: number) =>
  contrastRatio(a, b) >= min;

/** Near-black that still reads as ink rather than pure black. */
export const INK = "#0b1220";
export const PAPER = "#ffffff";

/**
 * The most readable of white / ink on a given background. This is the whole
 * replacement for the old `isDarkColor()` guess, but decided by measurement.
 */
export function bestTextOn(bg: RGB | string): RGB {
  const ink = parseHex(INK)!;
  const paper = parseHex(PAPER)!;
  return contrastRatio(ink, bg) >= contrastRatio(paper, bg) ? ink : paper;
}

/* ------------------------------------------------------------------ *
 * Contrast-gated correction
 * ------------------------------------------------------------------ */

export type Correction = {
  /** The corrected color. */
  color: RGB;
  /** Contrast actually achieved against the reference color. */
  ratio: number;
  /** True when the input already satisfied `min`. */
  unchanged: boolean;
  /** True when `min` is unreachable against this reference (mid-grey backgrounds). */
  unreachable: boolean;
};

/**
 * Nudge a foreground color along the lightness axis until it meets `min`
 * contrast against `bg`, moving as little as possible.
 *
 * Sample-based rather than analytic because the OKLCH transform is not linear in
 * contrast, and 201 samples is both imperceptible in cost and trivially
 * deterministic (which matters: the same theme must always derive the same
 * palette, or avatars and colors would flicker between server and client).
 */
export function correctForContrast(
  fg: RGB | string,
  bg: RGB | string,
  min: number = CONTRAST.body,
): Correction {
  const fgRgb = asRgb(fg);
  const bgRgb = asRgb(bg);
  const initial = contrastRatio(fgRgb, bgRgb);

  if (initial >= min) {
    return { color: fgRgb, ratio: initial, unchanged: true, unreachable: false };
  }

  const { c, h } = toOklch(fgRgb);
  const startL = lightnessOf(fgRgb);

  let best: { color: RGB; ratio: number; distance: number } | null = null;
  let bestAchievable: { color: RGB; ratio: number } | null = null;

  for (let i = 0; i <= 200; i++) {
    const l = i / 200;
    const candidate = oklchToRgb({ l, c, h });
    const ratio = contrastRatio(candidate, bgRgb);

    if (!bestAchievable || ratio > bestAchievable.ratio) {
      bestAchievable = { color: candidate, ratio };
    }
    if (ratio >= min) {
      const distance = Math.abs(l - startL);
      if (!best || distance < best.distance) best = { color: candidate, ratio, distance };
    }
  }

  if (best) {
    return { color: best.color, ratio: best.ratio, unchanged: false, unreachable: false };
  }

  // Nothing on this hue/lightness line reaches `min` (happens against mid-grey
  // backgrounds). Return the best available rather than pretending.
  const fallback = bestAchievable!;
  return { color: fallback.color, ratio: fallback.ratio, unchanged: false, unreachable: true };
}

/** Same as `correctForContrast` but returns a hex string, for terse call sites. */
export function ensureContrastHex(
  fg: RGB | string,
  bg: RGB | string,
  min: number = CONTRAST.body,
): string {
  return toHex(correctForContrast(fg, bg, min).color);
}

/** Convenience: everything internal works on RGB, so coerce strings once here. */
export function asRgb(color: RGB | string): RGB {
  if (typeof color === "string") {
    const parsed = parseHex(normalizeHex(color));
    return parsed ?? { r: 0, g: 0, b: 0 };
  }
  return { r: clamp(color.r, 0, 255), g: clamp(color.g, 0, 255), b: clamp(color.b, 0, 255) };
}

/** Round-trip helper for tests and debugging: hex in, hex out, no correction. */
export const identity = (hex: string) => toHex(asRgb(hex));

export { clamp, round };
