import { describe, expect, it } from "vitest";
import { CONTRAST, contrastRatio, parseHex } from "@/lib/theme/color";
import { THEME_COLOR_VARS, buildTheme, describeContrast, themeToCssVars } from "@/lib/theme/derive";
import { THEME_FAMILIES, themePresets, themePresetsGrouped } from "@/lib/theme/presets";
import {
  DEFAULT_THEME,
  FONT_PAIRS,
  parseTheme,
  themeFromLegacyState,
  themeSchema,
} from "@/lib/theme/theme-schema";

/**
 * The preset audit.
 *
 * `docs/01-DESIGN-SYSTEM.md` §4 promises that we never ship an unreadable
 * storefront. This is that promise as a test: every preset in the library is
 * derived and checked, and the failure message prints the measured ratios so a
 * regression is diagnosable without a debugger.
 */

const hexish = (value: string) => parseHex(value) !== null;

describe("theme preset library", () => {
  it("has unique ids", () => {
    const ids = themePresets.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every advertised family", () => {
    const families = new Set(themePresets.map((preset) => preset.family));
    expect([...families].sort()).toEqual([...THEME_FAMILIES].sort());
  });

  it("groups without losing presets", () => {
    const grouped = themePresetsGrouped().flatMap((group) => group.presets);
    expect(grouped).toHaveLength(themePresets.length);
  });

  it.each(themePresets.map((preset) => [preset.id, preset] as const))(
    "%s passes WCAG AA",
    (_id, preset) => {
      const derived = buildTheme(preset);
      expect(derived.passes, describeContrast(preset)).toBe(true);
      expect(derived.contrast.textOnBg).toBeGreaterThanOrEqual(CONTRAST.comfortable);
      expect(derived.contrast.textMutedOnBg).toBeGreaterThanOrEqual(CONTRAST.body);
      expect(derived.contrast.accentFgOnAccent).toBeGreaterThanOrEqual(CONTRAST.body);
      expect(derived.contrast.accentTextOnSubtle).toBeGreaterThanOrEqual(CONTRAST.body);
      expect(derived.contrast.borderStrongOnBg).toBeGreaterThanOrEqual(CONTRAST.ui);
    },
  );

  it("embeds the contrast report in its own failure output", () => {
    const text = describeContrast(themePresets[0]!);
    expect(text).toContain(themePresets[0]!.id);
    expect(text).toMatch(/text\/bg \d+\.\d{2}/);
  });
});

describe("a merchant's own brand colour", () => {
  it("is repaired rather than rejected when unreadable", () => {
    // Pure yellow as body text on white is 1.07:1 — the old build shipped this.
    const theme = themeSchema.parse({ id: "custom", name: "Custom", brandColor: "#ffee00" });
    const derived = buildTheme(theme);

    expect(derived.passes).toBe(true);
    expect(derived.adjustments.length).toBeGreaterThan(0);
    expect(contrastRatio(derived.color.accentText, derived.color.accentSubtle)).toBeGreaterThanOrEqual(
      CONTRAST.body,
    );
  });

  it("explains the adjustment in plain language", () => {
    const derived = buildTheme(
      themeSchema.parse({ id: "custom", name: "Custom", brandColor: "#ffee00" }),
    );
    expect(derived.adjustments.join(" ")).toMatch(/readab|adjusted/i);
  });

  it("keeps a compliant brand colour unchanged", () => {
    const derived = buildTheme(
      themeSchema.parse({ id: "custom", name: "Custom", brandColor: "#047857" }),
    );
    expect(derived.color.accent).toEqual(parseHex("#047857"));
    expect(derived.adjustments).toHaveLength(0);
  });
});

describe("derivation", () => {
  const theme = themePresets[0]!;

  it("is deterministic — identical input, identical tokens", () => {
    expect(buildTheme(theme)).toEqual(buildTheme(theme));
  });

  it("resolves shape settings into tokens", () => {
    const derived = buildTheme({ ...theme, radius: "pill", density: "airy", fontPair: "luxury" });
    expect(derived.radius.md).toBe("9999px");
    expect(derived.space.section).toContain("clamp");
    expect(derived.fonts).toEqual(FONT_PAIRS.luxury);
  });

  it("switches surfaces between light and dark instead of only inverting", () => {
    const light = buildTheme({ ...theme, background: "light" });
    const dark = buildTheme({ ...theme, background: "dark" });
    expect(dark.scheme).toBe("dark");
    expect(dark.color.bg).not.toEqual(light.color.bg);
    expect(dark.shadowCard).toBe("none");
    expect(light.shadowCard).toContain("rgba");
  });

  it("derives the other scheme for every theme, not only auto ones", () => {
    const light = buildTheme({ ...theme, background: "light" });
    expect(light.alternateColor.bg).not.toEqual(light.color.bg);

    const dark = buildTheme({ ...theme, background: "dark" });
    expect(dark.alternateColor.bg).not.toEqual(dark.color.bg);
  });

  it("sets motion from the theme, including none", () => {
    expect(buildTheme({ ...theme, motion: "none" }).duration).toBe("0ms");
    expect(buildTheme({ ...theme, motion: "none" }).ease).toBe("linear");
    expect(buildTheme({ ...theme, motion: "expressive" }).duration).toBe("320ms");
  });
});

describe("themeToCssVars", () => {
  const theme = themePresets.find((preset) => preset.id === "modern-emerald")!;

  it("emits a valid value for every colour token", () => {
    const vars = themeToCssVars(theme);
    const colorVars = Object.keys(vars).filter((key) => key.startsWith("--t-") && !key.endsWith("-dark"));
    expect(colorVars.length).toBeGreaterThanOrEqual(12);

    for (const key of ["--t-bg", "--t-text", "--t-accent", "--t-accent-fg", "--t-border-strong"]) {
      expect(hexish(vars[key]!), `${key}=${vars[key]}`).toBe(true);
    }
  });

  it("emits the shape, type and motion tokens the storefront consumes", () => {
    const vars = themeToCssVars(theme);
    for (const key of [
      "--t-radius",
      "--t-radius-lg",
      "--t-space-section",
      "--t-font-display",
      "--t-font-body",
      "--t-shadow-card",
      "--t-duration",
      "--t-ease",
      "--t-color-scheme",
    ]) {
      expect(vars[key], key).toBeTruthy();
    }
  });

  it("emits a dark set only for `auto` themes", () => {
    const light = themeToCssVars({ ...theme, background: "light" });
    expect(light["--t-bg-dark"]).toBeUndefined();

    const auto = themeToCssVars({ ...theme, background: "auto" });
    expect(hexish(auto["--t-bg-dark"]!)).toBe(true);
    expect(auto["--t-bg-dark"]).not.toBe(auto["--t-bg"]);

    // Every colour var must have a dark counterpart, or the prefers-color-scheme
    // swap in tokens.css would reference an undefined custom property.
    for (const varName of Object.values(THEME_COLOR_VARS)) {
      expect(hexish(auto[`${varName}-dark`]!), `${varName}-dark`).toBe(true);
    }
  });
});

describe("parseTheme", () => {
  it("never throws on garbage", () => {
    for (const input of [null, undefined, 42, "nope", [], { brandColor: 12345 }, { background: "plaid" }]) {
      const { theme } = parseTheme(input);
      expect(theme.brandColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(theme.id).toBeTruthy();
    }
  });

  it("repairs individual bad fields and keeps the good ones", () => {
    const { theme } = parseTheme({ id: "mine", name: "Mine", brandColor: "#123456", radius: "gigantic" });
    expect(theme.brandColor).toBe("#123456");
    expect(theme.radius).toBe(DEFAULT_THEME.radius);
  });
});

describe("themeFromLegacyState", () => {
  it("maps the old scattered appearance fields", () => {
    const theme = themeFromLegacyState({
      accentColor: "#7e22ce",
      buttonRadius: "pill",
      fontStyle: "classic",
      storefrontTheme: { primaryColor: "#be123c", background: "dark", cardRadius: "sharp" },
    });

    expect(theme.brandColor).toBe("#be123c"); // storefront theme wins
    expect(theme.background).toBe("dark");
    expect(theme.radius).toBe("sharp");
    expect(theme.fontPair).toBe("editorial");
    expect(theme.presetId).toBeNull();
  });

  it("falls back to the top-level accent when no storefront theme exists", () => {
    expect(themeFromLegacyState({ accentColor: "#2563eb" }).brandColor).toBe("#2563eb");
  });

  it("survives an empty legacy record", () => {
    expect(themeFromLegacyState({})).toEqual({ ...DEFAULT_THEME, id: "custom", name: "Custom" });
  });
});
