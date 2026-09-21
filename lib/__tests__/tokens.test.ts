import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/theme/color";
import {
  consoleContrastPairs,
  consoleDarkTokens,
  consoleLightTokens,
  motion,
  primitives,
  radius,
  spacing,
  zIndex,
} from "@/lib/theme/tokens";

/**
 * Token parity and contrast, enforced against the real stylesheet.
 *
 * `styles/tokens.css` and `lib/theme/tokens.ts` declare the same values, which is
 * unavoidable (CSS needs a stylesheet, JS needs typed data for the contrast engine
 * and the theme editor). This file is what makes that duplication safe: it parses
 * the CSS and fails on any drift, in either direction.
 *
 * It is also the executable form of the accessibility promise. Without it, the
 * contrast work is a one-off cleanup that decays — precisely how the old codebase
 * ended up shipping unreadable presets (docs/00-AUDIT.md F-18).
 */

const css = fs.readFileSync(path.join(process.cwd(), "styles/tokens.css"), "utf8");

function section(name: string): string {
  const start = css.indexOf(`@tokens:${name}`);
  const end = css.indexOf("@tokens:end", start);
  if (start === -1 || end === -1) throw new Error(`Missing @tokens:${name} section in tokens.css`);
  return css.slice(start, end);
}

function declarations(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) out[match[1]!] = match[2]!.trim();
  return out;
}

/** Strip a `--prefix-` namespace from parsed declarations. */
function namespaced(raw: Record<string, string>, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = value;
  }
  return out;
}

describe("primitives", () => {
  const declared = namespaced(declarations(section("primitives")), "--sl-");

  it("matches lib/theme/tokens.ts exactly", () => {
    expect(declared).toEqual({ ...primitives });
  });

  it("declares nothing that the module does not know about", () => {
    expect(Object.keys(declared).sort()).toEqual(Object.keys(primitives).sort());
  });
});

describe("console semantics", () => {
  const light = namespaced(declarations(section("console-light")), "--app-");
  const dark = namespaced(declarations(section("console-dark")), "--app-");

  it("light mode matches the module", () => {
    expect(light).toEqual({ ...consoleLightTokens });
  });

  it("dark mode matches the module", () => {
    expect(dark).toEqual({ ...consoleDarkTokens });
  });

  it("both modes expose the same token names", () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
    expect(Object.keys(light).sort()).toEqual(Object.keys(consoleLightTokens).sort());
  });

  describe("meets its declared WCAG minimum", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = mode === "light" ? light : dark;
      for (const pair of consoleContrastPairs) {
        it(`${mode}: ${pair.fg} on ${pair.bg} ≥ ${pair.min} (${pair.why})`, () => {
          const fg = tokens[pair.fg]!;
          const bg = tokens[pair.bg]!;
          // Overlay tokens are translucent by design and are not text pairs.
          expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(pair.min);
        });
      }
    }
  });
});

describe("scales", () => {
  it("radius, spacing and z-index match the module", () => {
    const all = declarations(css);
    for (const [key, value] of Object.entries(radius)) {
      expect(all[`--radius-${key}`]).toBe(value);
    }
    for (const [key, value] of Object.entries(spacing)) {
      expect(all[`--space-${key}`]).toBe(value);
    }
    for (const [key, value] of Object.entries(zIndex)) {
      expect(all[`--z-${key}`]).toBe(value);
    }
  });

  it("motion matches the module", () => {
    const all = declarations(css);
    expect(all["--duration-fast"]).toBe(motion.fast);
    expect(all["--duration-base"]).toBe(motion.base);
    expect(all["--duration-slow"]).toBe(motion.slow);
    expect(all["--ease-out"]).toBe(motion["ease-out"]);
    expect(all["--ease-spring"]).toBe(motion["ease-spring"]);
  });

  it("defines a fallback for every font variable it consumes", () => {
    // The bug this guards against: `var(--font-inter)` with no inline fallback and
    // no definition anywhere silently invalidated the whole font-family list.
    const fontDecls = /--font-(sans|display|mono)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    let checked = 0;
    while ((match = fontDecls.exec(css))) {
      checked++;
      const value = match[2]!;
      for (const varName of value.matchAll(/var\((--[a-z0-9-]+)(,)?/g)) {
        expect(varName[2], `${varName[1]} in --font-${match[1]} needs an inline fallback`).toBe(",");
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
