import { describe, expect, it } from "vitest";
import { CONTRAST } from "@/lib/theme/color";
import { buildTheme, describeContrast, themeToCssVars } from "@/lib/theme/derive";
import { themeSchema } from "@/lib/theme/theme-schema";
import {
  DEFAULT_WEBSITE_TEMPLATE_ID,
  WEBSITE_TEMPLATE_IDS,
  isWebsiteTemplateId,
  themeForTemplate,
  websiteTemplateById,
  websiteTemplates,
} from "@/lib/theme/templates";

/**
 * The template audit.
 *
 * Three complete websites, each shipped in light and dark. This is the promise from
 * `docs/03-DECISIONS.md` D11 as a test: every one of the six variants is derived and
 * checked for AA, so a template can never ship unreadable in either appearance.
 */

describe("website templates", () => {
  it("ships exactly the three advertised templates", () => {
    expect(websiteTemplates.map((template) => template.id)).toEqual([...WEBSITE_TEMPLATE_IDS]);
  });

  it("has unique ids and non-empty compositions", () => {
    const ids = websiteTemplates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const template of websiteTemplates) {
      for (const value of Object.values(template.composition)) {
        expect(value).toMatch(/^(hero|catalog|about|footer)-\d+$/);
      }
    }
  });

  it("gives every template a distinct page composition", () => {
    const signatures = websiteTemplates.map(
      (template) => `${template.composition.heroTemplateId}/${template.composition.catalogTemplateId}`,
    );
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  const variants = websiteTemplates.flatMap((template) => [
    [`${template.id} light`, themeForTemplate(template, "light")] as const,
    [`${template.id} dark`, themeForTemplate(template, "dark")] as const,
  ]);

  // The templates module is intentionally zod-free at runtime, so the schema check
  // that used to happen on import happens here — a malformed template fails CI.
  it.each(variants)("%s is a valid theme per the real schema", (_label, theme) => {
    expect(themeSchema.parse(theme)).toEqual(theme);
  });

  it.each(variants)("%s passes WCAG AA", (_label, theme) => {
    const derived = buildTheme(theme);
    expect(derived.passes, describeContrast(theme)).toBe(true);
    expect(derived.contrast.textOnBg).toBeGreaterThanOrEqual(CONTRAST.comfortable);
    expect(derived.contrast.textMutedOnBg).toBeGreaterThanOrEqual(CONTRAST.body);
    expect(derived.contrast.accentFgOnAccent).toBeGreaterThanOrEqual(CONTRAST.body);
    expect(derived.contrast.borderStrongOnBg).toBeGreaterThanOrEqual(CONTRAST.ui);
  });

  it.each(variants)("%s compiles to complete --t-* tokens", (_label, theme) => {
    const vars = themeToCssVars(theme);
    expect(vars["--t-bg"]).toMatch(/^#/);
    expect(vars["--t-accent"]).toMatch(/^#/);
    expect(vars["--t-font-display"]).toBeTruthy();
    expect(vars["--t-radius"]).toBeTruthy();
  });

  it("uses the dark palette only for the dark appearance", () => {
    const template = websiteTemplateById("editorial")!;
    expect(themeForTemplate(template, "light").background).toBe("light");
    expect(themeForTemplate(template, "dark").background).toBe("dark");
    expect(themeForTemplate(template, "dark").brandColor).not.toBe(
      themeForTemplate(template, "light").brandColor,
    );
  });

  it("resolves ids safely", () => {
    expect(websiteTemplateById(DEFAULT_WEBSITE_TEMPLATE_ID)).not.toBeNull();
    expect(websiteTemplateById("nope")).toBeNull();
    expect(websiteTemplateById(null)).toBeNull();
    expect(isWebsiteTemplateId("bold")).toBe(true);
    expect(isWebsiteTemplateId("nope")).toBe(false);
  });
});
