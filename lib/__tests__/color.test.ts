import { describe, expect, it } from "vitest";
import {
  alpha,
  bestTextOn,
  contrastRatio,
  correctForContrast,
  lightnessOf,
  mix,
  normalizeHex,
  oklchToRgb,
  parseHex,
  passes,
  relativeLuminance,
  shiftLightness,
  toOklch,
  toHex,
  withLightness,
  type RGB,
} from "@/lib/theme/color";

/** Channel-wise comparison so rounding drift in the OKLCH round trip is fine. */
function expectHexClose(actual: string, expected: string, tolerance = 2) {
  const a = parseHex(actual)!;
  const b = parseHex(expected)!;
  expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(tolerance);
}

describe("hex parsing", () => {
  it("parses 6-digit, 3-digit and bare forms", () => {
    expect(parseHex("#10b981")).toEqual({ r: 16, g: 185, b: 129 });
    expect(parseHex("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHex("10b981")).toBeNull(); // strict form needs the hash
  });

  it("returns null for anything else rather than guessing", () => {
    expect(parseHex("rgb(1,2,3)")).toBeNull();
    expect(parseHex("")).toBeNull();
    expect(parseHex(undefined)).toBeNull();
    expect(parseHex(123)).toBeNull();
  });

  it("normalizes loose input and falls back safely", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("10b981")).toBe("#10b981");
    expect(normalizeHex("not-a-color")).toBe("#000000");
    expect(normalizeHex("not-a-color", "#047857")).toBe("#047857");
    // A bad fallback must not recurse forever.
    expect(normalizeHex("nope", "also-nope")).toBe("#000000");
  });

  it("round-trips through toHex", () => {
    const rgb: RGB = { r: 4, g: 120, b: 87 };
    expect(parseHex(toHex(rgb))).toEqual(rgb);
  });

  it("alpha() emits a usable rgba string", () => {
    expect(alpha("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });
});

describe("WCAG contrast", () => {
  it("matches the known extremes", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 2);
  });

  it("matches published mid-grey values", () => {
    // The classic AA boundary colour and a known 3:1-ish grey.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
    expect(contrastRatio("#808080", "#ffffff")).toBeCloseTo(3.95, 1);
  });

  it("exposes luminance and a `passes` predicate used by the preset audit", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(passes("#767676", "#ffffff", 4.5)).toBe(true);
    expect(passes("#808080", "#ffffff", 4.5)).toBe(false);
  });
});

describe("OKLCH conversion", () => {
  const samples = ["#10b981", "#0f172a", "#fbbf24", "#dc2626", "#4f46e5", "#000000", "#ffffff"];

  it("round-trips sRGB colours within rounding tolerance", () => {
    for (const hex of samples) {
      expectHexClose(toHex(oklchToRgb(toOklch(parseHex(hex)!))), hex);
    }
  });

  it("keeps out-of-gamut chroma requests inside sRGB by giving up chroma", () => {
    // A chroma no sRGB display can represent: must clamp, never emit NaN.
    const clamped = oklchToRgb({ l: 0.6, c: 0.6, h: 140 });
    expect(Number.isFinite(clamped.r)).toBe(true);
    expect(toHex(clamped)).toMatch(/^#[0-9a-f]{6}$/);
    expect(clamped.r).toBeGreaterThanOrEqual(0);
    expect(clamped.r).toBeLessThanOrEqual(255);
  });

  it("reports perceptual lightness", () => {
    expect(lightnessOf("#000000")).toBeCloseTo(0, 2);
    expect(lightnessOf("#ffffff")).toBeCloseTo(1, 2);
    expect(lightnessOf("#808080")).toBeGreaterThan(0.4);
    expect(lightnessOf("#808080")).toBeLessThan(0.7);
  });
});

describe("manipulation", () => {
  it("withLightness preserves hue family and moves lightness", () => {
    const darker = withLightness("#10b981", 0.3);
    expect(lightnessOf(darker)).toBeCloseTo(0.3, 2);
    expect(contrastRatio(darker, "#ffffff")).toBeGreaterThan(
      contrastRatio("#10b981", "#ffffff"),
    );
  });

  it("shiftLightness moves in the requested direction", () => {
    expect(lightnessOf(shiftLightness("#10b981", -0.1))).toBeLessThan(lightnessOf("#10b981"));
    expect(lightnessOf(shiftLightness("#10b981", 0.1))).toBeGreaterThan(lightnessOf("#10b981"));
  });

  it("mix interpolates between two colours", () => {
    expect(toHex(mix("#ffffff", "#000000", 0))).toBe("#ffffff");
    expect(toHex(mix("#ffffff", "#000000", 1))).toBe("#000000");

    const half = lightnessOf(mix("#ffffff", "#000000", 0.5));
    expect(half).toBeGreaterThan(0.35);
    expect(half).toBeLessThan(0.65);
  });

  it("picks readable foregrounds by measurement, not a guess", () => {
    expect(toHex(bestTextOn("#ffffff"))).toBe("#0b1220");
    expect(toHex(bestTextOn("#000000"))).toBe("#ffffff");
    // Emerald 500 is where the old `isDarkColor()` heuristic went wrong: white on
    // it measures 2.54:1, so the correct answer is ink.
    expect(toHex(bestTextOn("#10b981"))).toBe("#0b1220");
  });
});

describe("contrast-gated correction", () => {
  it("leaves a compliant colour untouched", () => {
    const result = correctForContrast("#111111", "#ffffff", 4.5);
    expect(result.unchanged).toBe(true);
    expect(toHex(result.color)).toBe("#111111");
  });

  it("repairs an unreadable colour and reports the achieved ratio", () => {
    const result = correctForContrast("#ffee00", "#ffffff", 4.5);
    expect(result.unchanged).toBe(false);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    expect(result.unreachable).toBe(false);
    // It must actually pass, not just claim to.
    expect(contrastRatio(result.color, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("moves as little as possible rather than jumping to black", () => {
    const result = correctForContrast("#fde047", "#ffffff", 4.5);
    expect(lightnessOf(result.color)).toBeGreaterThan(0.3);
  });

  it("admits when a minimum is unreachable instead of shipping a lie", () => {
    // Against mid-grey neither white nor black can reach 7:1.
    const result = correctForContrast("#ffffff", "#767676", 7);
    expect(result.unreachable).toBe(true);
    expect(result.ratio).toBeLessThan(7);
  });

  it("is deterministic — identical input, identical output", () => {
    const a = correctForContrast("#f59e0b", "#ffffff", 4.5);
    const b = correctForContrast("#f59e0b", "#ffffff", 4.5);
    expect(toHex(a.color)).toBe(toHex(b.color));
    expect(a.ratio).toBe(b.ratio);
  });
});
