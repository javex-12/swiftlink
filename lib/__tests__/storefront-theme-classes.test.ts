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
const EDITOR = read("components/editor/StoreEditorV2.tsx");

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

describe("the shopper chrome follows the template", () => {
  it("paints the bottom nav from the template's background token", () => {
    // Live proof this was wrong: a store on a dark template (#1c1f2e) rendered a
    // white nav, because the bar was painted with the legacy `bgColor` field.
    expect(CUSTOMER_STOREFRONT).toContain(
      '"color-mix(in srgb, var(--t-bg, var(--bg-color, #f2f2f7)) 94%, transparent)"',
    );
    expect(CUSTOMER_STOREFRONT).not.toContain("backgroundColor: `${bgColor}f2`");
  });

  it("keeps the legacy palette from overpainting the shopper screens", () => {
    // `style={{ backgroundColor: bgColor }}` beat the `sf-surface` class, so the
    // search and reviews screens were the merchant's old colour, not the
    // template's (measured: #ffffff instead of #272737).
    expect(overlayRegion(CUSTOMER_STOREFRONT)).not.toContain("backgroundColor: bgColor");
  });

  it("leaves room for the bottom nav instead of floating a second bar over it", () => {
    // Two problems, one cause. Bloom rendered its own `fixed bottom-4` pill on
    // top of the storefront nav (two navigation strips for the same four
    // destinations, the floating one covering the footer), and the full-height
    // overlay screens reserved no space for the bar at all, so the cart's
    // checkout block and the product sheet's buttons sat underneath it.
    expect(TEMPLATE_SITES).not.toContain('aria-label="Store navigation dock"');
    /*
     * The reserved space has to be a *valid* `calc()`: whitespace around `+` is
     * mandatory in CSS, so `pb-[calc(75px+env(...))]` is dropped by the browser
     * and reserves nothing — which is why the reviews and cart screens still ran
     * under the bar after the padding was added. Tailwind wants underscores here,
     * which it turns into spaces.
     */
    const reserved = Array.from(
      CUSTOMER_STOREFRONT.matchAll(/pb-\[calc\(([^\]]*)\)\]/g),
      (match) => match[1],
    );
    expect(reserved.length).toBeGreaterThan(0);
    reserved.forEach((value) => {
      expect(value, `pb-[calc(${value})] is missing its spaces`).not.toMatch(/\d\+env|px\)\+/);
      expect(value).toContain("_+_");
    });
    expect(CUSTOMER_STOREFRONT).toContain("pb-[calc(75px_+_env(safe-area-inset-bottom,0px))]");
    expect(CUSTOMER_STOREFRONT).toContain(
      'height: "calc(75px + env(safe-area-inset-bottom, 0px))"',
    );
    // The reviews screen has the floating cart pill above the nav as well, so it
    // reserves more than the bare bar height — its last review row was hidden.
    expect(CUSTOMER_STOREFRONT).toContain(
      "pb-[calc(180px_+_env(safe-area-inset-bottom,0px))]",
    );
  });

  it("opens the product description at the top of its desktop column", () => {
    // `md:justify-center` clipped the top of the column when its content was
    // taller than the viewport, which hid the description and the title.
    expect(CUSTOMER_STOREFRONT).toContain("flex flex-col p-6 md:w-1/2 md:py-16 md:px-12");
    expect(CUSTOMER_STOREFRONT).not.toContain("md:justify-center");
    expect(CUSTOMER_STOREFRONT).toContain("{selectedProduct.description ||");
  });

  it("puts the hero photo and the logo on separate fields", () => {
    // The banner used to be whichever image the merchant had, so changing the
    // logo changed the hero too. Templates read `heroImage` first now, and the
    // editor uploads it to its own storage path.
    expect(TEMPLATE_SITES).toContain("state.heroImage ||");
    expect(EDITOR).toContain('updateField("heroImage", data.publicUrl)');
    expect(EDITOR).toContain("branding/hero_");
    expect(EDITOR).toContain("handleHeroUpload");
  });

  it("gives every template a phone menu instead of a squeezed header", () => {
    const menus = TEMPLATE_SITES.match(/<StorefrontMenu\s/g) || [];
    expect(menus.length).toBe(10);
    // The panel is portalled, so a template that wraps its header in
    // `overflow-hidden` (Coast's hero) cannot clip it.
    expect(TEMPLATE_SITES).toContain("createPortal(menu, document.body)");
  });

  it("gives each template family its own bottom-nav layout", () => {
    // The same bar on all ten templates undid the template's character at the
    // last thing a visitor looks at. Four chrome variants, one per family.
    expect(CUSTOMER_STOREFRONT).toContain(
      'type StorefrontNavVariant = "classic" | "pill" | "bold" | "minimal"',
    );
    expect(CUSTOMER_STOREFRONT).toContain("variant={navVariant}");
    ["pill", "bold", "minimal"].forEach((variant) => {
      expect(CUSTOMER_STOREFRONT).toContain(`is${variant[0].toUpperCase()}${variant.slice(1)}`);
    });
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

  it("leaves no bridge remnants in the website templates", () => {
    // The templates still use raw Tailwind palette classes for their own fixed
    // palettes (Forge is emerald by design, for example). With no <style> block
    // repainting them, those render exactly as written — so the thing to guard
    // is the bridge itself, not the colours.
    expect(TEMPLATE_SITES).not.toContain("!important");
    expect(TEMPLATE_SITES).not.toContain("<style>");
  });

  it("keeps un-bridged palette variants exactly as they were", () => {
    // These were never repainted by the bridge (different class names), so they
    // must still be present and raw — changing them would be a silent restyle.
    expect(TEMPLATE_SITES).toContain("bg-emerald-500/10");
    expect(TEMPLATE_SITES).toContain("border-emerald-500/20");
    expect(TEMPLATE_SITES).toContain("text-emerald-400");
  });
});
