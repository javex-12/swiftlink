/**
 * Deterministic avatar generation — tier 3 and tier 4 of the identity ladder in
 * `docs/01-DESIGN-SYSTEM.md` §8.
 *
 * Replaces the old approach, which was a hard-coded `👨‍🚀` for the merchant, ten
 * hashed emoji for commenters, and `charCodeAt(0) % AVATARS.length` on the
 * storefront (docs/00-AUDIT.md F-20). For a paid business tool those read as a
 * toy, and emoji render differently on every platform.
 *
 * Two rules this module keeps:
 *  1. **Deterministic.** Same seed always produces the same avatar, so a server
 *     render and the client render agree and nothing flickers on hydration.
 *  2. **Local.** No DiceBear/Boring-Avatars HTTP request on a customer's
 *     storefront, and no extra dependency — the geometry is generated here and
 *     rendered as plain SVG.
 *
 * Colors are produced in OKLCH through `lib/theme/color`, so this file contains
 * no hex literals (docs/02-BUILDER-ARCHITECTURE.md §8, rule 1).
 */

import { oklchToRgb, round, toHex } from "./theme/color";

/** Each blob is one translucent mesh stop. */
export type AvatarStop = {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
};

export type AvatarGeometry = {
  /** Hash of the seed; also used to build stable SVG element ids. */
  seed: number;
  from: string;
  to: string;
  stops: AvatarStop[];
  /** Rotation of the base gradient, in degrees. */
  angle: number;
};

const VIEWBOX = 80;
/** Golden angle — successive hues stay far apart, so seeds look distinct. */
const GOLDEN = 137.508;

/** FNV-1a, 32-bit. Small, fast, and stable across engines (unlike `Math.random`). */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  const s = String(input ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Up to two initials from a display name.
 *
 * Falls back rather than returning an empty string, because an empty avatar is
 * the state that made the old UI show a blank box.
 */
export function initialsFrom(name: string | null | undefined, fallback = "?"): string {
  const cleaned = String(name ?? "")
    .replace(/[^\p{L}\p{N}\s'’-]/gu, " ")
    .trim();
  if (!cleaned) return fallback;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  const first = words[0]!;
  const last = words[words.length - 1]!;
  const initials = `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  return initials || fallback;
}

export type AvatarGeometryOptions = {
  /** Overrides the seed round-robin; used to tint avatars with a tenant accent. */
  baseHue?: number;
  /** Hue spread in degrees — a tenant theme narrows this to stay on-brand. */
  hueSpread?: number;
};

/**
 * Build the geometry for a seed. Pure: no clock, no randomness, no DOM.
 */
export function avatarGeometry(seedInput: string, options: AvatarGeometryOptions = {}): AvatarGeometry {
  const seed = hashSeed(seedInput);
  const digits = seed.toString(16).padStart(8, "0");
  const nib = (i: number) => parseInt(digits[i % digits.length]!, 16); // 0–15, always defined

  const baseHue = options.baseHue ?? ((seed % 360) + 360) % 360;
  const spread = options.hueSpread ?? GOLDEN;

  const from = toHex(
    oklchToRgb({ l: 0.72 + nib(1) * 0.008, c: 0.11 + nib(2) * 0.006, h: baseHue }),
  );
  const to = toHex(
    oklchToRgb({ l: 0.46 + nib(3) * 0.012, c: 0.09 + nib(4) * 0.008, h: (baseHue + spread) % 360 }),
  );

  // Rounded to 2dp: this markup is emitted per avatar, and 17-digit floats are
  // pure payload once it is serialised.
  const stops: AvatarStop[] = Array.from({ length: 4 }, (_, i) => ({
    cx: round(6 + nib(i * 2) * 4.6, 2),
    cy: round(6 + nib(i * 2 + 1) * 4.6, 2),
    r: round(17 + nib(i * 3 + 3) * 3, 2),
    color: toHex(
      oklchToRgb({
        l: 0.5 + nib(i + 1) * 0.024,
        c: 0.1 + nib(i + 2) * 0.014,
        h: (baseHue + i * spread) % 360,
      }),
    ),
    opacity: round(0.4 + nib(i + 3) * 0.03, 2),
  }));

  return { seed, from, to, stops, angle: (seed % 360) + 1 };
}

/** Stable element ids — derived from the seed, never from `useId`, so SSR matches. */
export function avatarIds(seed: number) {
  return {
    gradient: `sl-av-g-${seed}`,
    blur: `sl-av-b-${seed}`,
  };
}

/**
 * SVG markup for a seed.
 *
 * Not used by the React component (which renders the geometry as JSX so it can be
 * styled and themed), but kept for server-side contexts — OG images, emails, and
 * the theme editor's preset thumbnails.
 */
export function avatarSvg(seedInput: string, options: AvatarGeometryOptions & { size?: number } = {}) {
  const { size = VIEWBOX } = options;
  const geo = avatarGeometry(seedInput, options);
  const { gradient, blur } = avatarIds(geo.seed);
  const stops = geo.stops
    .map(
      (s) =>
        `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.color}" opacity="${s.opacity}"/>`,
    )
    .join("");

  // Note: `orientation` is optional SVG 2 and unsupported in older Safari, so the
  // gradient is rotated with a transform instead.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" width="${size}" height="${size}">
<defs>
<linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${geo.from}"/>
<stop offset="100%" stop-color="${geo.to}"/>
</linearGradient>
<filter id="${blur}" x="-25%" y="-25%" width="150%" height="150%">
<feGaussianBlur stdDeviation="9"/>
</filter>
</defs>
<rect width="${VIEWBOX}" height="${VIEWBOX}" fill="url(#${gradient})"/>
<g filter="url(#${blur})" transform="rotate(${geo.angle} ${VIEWBOX / 2} ${VIEWBOX / 2})">${stops}</g>
</svg>`;
}

export const AVATAR_VIEWBOX = VIEWBOX;
