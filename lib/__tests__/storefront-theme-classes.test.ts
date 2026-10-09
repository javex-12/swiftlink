import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_WEBSITE_TEMPLATE_ID, websiteTemplateById } from "../theme/templates";

/**
 * Guards the Phase 2 change: the storefront used to be themed by a `<style>`
 * block inside `CustomerStorefront` that repainted Tailwind palette classes
 * (`bg-emerald-500`, `text-gray-900`, `bg-white`, …) with `!important`. That
 * bridge is gone; the storefront now carries explicit `sf-*` classes defined in
 * `app/globals.css`.
 *
 * Two failure modes matter more than a wrong pixel, and neither needs a browser:
 *   1. a typo'd `sf-*` class that silently renders nothing, and
 *   2. a bridged palette class creeping back into storefront markup, which would
 *      look correct to me and wrong to the merchant (it renders raw emerald).
 */

const projectRoot = new URL("../../", import.meta.url);
const read = (relativePath: string): string =>
  readFileSync(new URL(relativePath, projectRoot), "utf8");

const GLOBALS_CSS = read("app/globals.css");
const CUSTOMER_STOREFRONT = read("components/CustomerStorefront.tsx");
const TEMPLATE_SITES = read("components/storefront/template-sites.tsx");

/** Every class the old bridge repainted, and the classes that replaced them. */
const REPLACEMENTS: Record<string, string> = {
  "bg-emerald-500": "sf-accent-bg",
  "text-emerald-500": "sf-accent-text",
  "text-emerald-600": "sf-accent-text",
  "border-emerald-500": "sf-accent-border",
  "bg-gray-100": "sf-surface-alt",
  "bg-gray-50": "sf-surface-alt",
  "text-gray-900": "sf-ink",
  "text-gray-500": "sf-muted",
  "text-gray-400": "sf-muted",
  "bg-gray-900": "sf-inverse",
  "bg-white": "sf-surface",
};

const SF_CLASSES = Array.from(new Set([...Object.values(REPLACEMENTS), "sf-header"]));

/**
 * Count occurrences of a class token used as a *whole* class: preceded by a
 * space/quote and not followed by an opacity modifier (`/10`) or a variant
 * prefix (`hover:`, `focus:`). Those variants were never bridged, so they must
 * keep rendering the raw palette colour.
 */
function bareTokenCount(source: string, token: string): number {
  const pattern = new RegExp(`(?<=[ "'\`])${token}(?![/\\w-])`, "g");
  return (source.match(pattern) || []).length;
}

/** The customer-facing screen markup: everything from the overlays onward. */
function overlayRegion(source: string): string {
  const marker = "{/* OVERLAYS */}";
  const index = source.indexOf(marker);
  expect(index, "CustomerStorefront must still mark its OVERLAYS region").toBeGreaterThan(-1);
  return source.slice(index);
}

describe("template fallback (Phase 2 exit criterion)", () => {
  // `CustomerStorefront` resolves the template with a non-null assertion:
  //   websiteTemplateById(rawState.websiteTemplateId) ?? websiteTemplateById(DEFAULT_…)
  // If the fallback could be null that line would crash the storefront for every
  // store without a template id — 14 of the 16 live stores at the time of the change.
  it("cannot be null for a store with no template id", () => {
    expect(websiteTemplateById(null) ?? websiteTemplateById(DEFAULT_WEBSITE_TEMPLATE_ID)).not.toBeNull();
  });

  it("cannot be null for a retired/unknown template id", () => {
    expect(
      websiteTemplateById("retired-template") ?? websiteTemplateById(DEFAULT_WEBSITE_TEMPLATE_ID),
    ).not.toBeNull();
  });

  it("is actually used as the fallback in the storefront", () => {
    expect(CUSTOMER_STOREFRONT).toContain("websiteTemplateById(DEFAULT_WEBSITE_TEMPLATE_ID)!");
  });
});

describe("sf-* theme classes", () => {
  it("defines every sf-* class the storefront components use", () => {
    const usedInMarkup = Array.from(
      `${CUSTOMER_STOREFRONT}\n${TEMPLATE_SITES}`.matchAll(/\bsf-[a-z-]+/g),
      (match) => match[0],
    );

    const undefinedClasses = Array.from(new Set(usedInMarkup)).filter(
      (className) => !GLOBALS_CSS.includes(`.${className} {`) && !GLOBALS_CSS.includes(`.${className}:`),
    );

    expect(undefinedClasses).toEqual([]);
  });

  it("scopes every sf-* rule to the storefront subtree", () => {
    SF_CLASSES.forEach((className) => {
      expect(GLOBALS_CSS).toContain(`[data-theme-scope="storefront"] .${className}`);
    });
  });

  it("keeps the sf-* rules free of !important", () => {
    const rules = Array.from(
      GLOBALS_CSS.matchAll(/\[data-theme-scope="storefront"\] \.sf-[a-z-]+[^}]*}/g),
      (match) => match[0],
    );
    expect(rules.length).toBe(SF_CLASSES.length);
    rules.forEach((rule) => expect(rule).not.toContain("!important"));
  });
});

describe("the retired override bridge", () => {
  it("is gone from the customer storefront", () => {
    expect(CUSTOMER_STOREFRONT).not.toContain("!important");
    expect(CUSTOMER_STOREFRONT).not.toContain("<style>");
  });

  it("leaves no bridged palette class in the overlay screens", () => {
    const source = overlayRegion(CUSTOMER_STOREFRONT);
    Object.keys(REPLACEMENTS).forEach((token) => {
      expect(bareTokenCount(source, token), `${token} is back in the overlays`).toBe(0);
    });
  });

  it("leaves no bridged palette class in the website templates", () => {
    Object.keys(REPLACEMENTS).forEach((token) => {
      expect(bareTokenCount(TEMPLATE_SITES, token), `${token} is back in template-sites`).toBe(0);
    });
  });

  it("keeps un-bridged palette variants exactly as they were", () => {
    // These were never repainted by the bridge (different class names), so they
    // must still be present and raw — changing them would be a silent restyle.
    expect(TEMPLATE_SITES).toContain("bg-emerald-500/10");
    expect(TEMPLATE_SITES).toContain("border-emerald-500/20");
    expect(overlayRegion(CUSTOMER_STOREFRONT)).toContain("text-emerald-400");
  });
});
