import { describe, expect, it } from "vitest";
import {
  AVATAR_VIEWBOX,
  avatarGeometry,
  avatarIds,
  avatarSvg,
  hashSeed,
  initialsFrom,
} from "@/lib/avatar";

/**
 * Avatar generation replaced a hard-coded `👨‍🚀`, ten hashed commenter emoji and
 * `charCodeAt(0) % AVATARS.length` (docs/00-AUDIT.md F-20). The properties worth
 * locking down are determinism (or avatars flicker on hydration), distinctness
 * (or every store looks like the same person) and knowing what a name is worth
 * when it has no letters at all.
 */

describe("hashSeed", () => {
  it("is stable and order-sensitive", () => {
    expect(hashSeed("store-1")).toBe(hashSeed("store-1"));
    expect(hashSeed("store-1")).not.toBe(hashSeed("store-2"));
    expect(hashSeed("ab")).not.toBe(hashSeed("ba"));
  });

  it("always returns an unsigned 32-bit integer", () => {
    for (const input of ["", "a", "Ada Lovelace", "🇳🇬 lagos", "x".repeat(500)]) {
      const seed = hashSeed(input);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("initialsFrom", () => {
  it("takes the first and last word", () => {
    expect(initialsFrom("Ada Lovelace")).toBe("AL");
    expect(initialsFrom("Ada Ngozi Lovelace")).toBe("AL");
  });

  it("handles single words", () => {
    expect(initialsFrom("Storehouse")).toBe("ST");
    expect(initialsFrom("Jo")).toBe("JO");
  });

  it("falls back rather than returning nothing", () => {
    expect(initialsFrom("")).toBe("?");
    expect(initialsFrom("   ")).toBe("?");
    expect(initialsFrom(null)).toBe("?");
    expect(initialsFrom(undefined)).toBe("?");
    expect(initialsFrom("!!!")).toBe("?");
    expect(initialsFrom("🚀🚀")).toBe("?");
    expect(initialsFrom("", "SL")).toBe("SL");
  });

  it("ignores punctuation and keeps letters from other scripts", () => {
    expect(initialsFrom("Chidi O'brien")).toBe("CO");
    expect(initialsFrom("Ọ̀pẹ́ Store")).toBe("ỌS");
  });
});

describe("avatarGeometry", () => {
  it("is deterministic", () => {
    expect(avatarGeometry("user-42")).toEqual(avatarGeometry("user-42"));
  });

  it("differentiates seeds", () => {
    const a = avatarGeometry("store-1");
    const b = avatarGeometry("store-2");
    expect(a.seed).not.toBe(b.seed);
    // Not merely a different id: the rendered output must differ.
    expect(JSON.stringify(a.stops)).not.toBe(JSON.stringify(b.stops));
  });

  it("produces in-gamut hex colors and finite geometry", () => {
    for (const seed of ["a", "store-9f2", "ada@example.com", "🇳🇬"]) {
      const geometry = avatarGeometry(seed);
      expect(geometry.from).toMatch(/^#[0-9a-f]{6}$/);
      expect(geometry.to).toMatch(/^#[0-9a-f]{6}$/);
      expect(geometry.stops).toHaveLength(4);

      for (const stop of geometry.stops) {
        expect(stop.color).toMatch(/^#[0-9a-f]{6}$/);
        expect(Number.isFinite(stop.cx)).toBe(true);
        expect(Number.isFinite(stop.cy)).toBe(true);
        expect(stop.r).toBeGreaterThan(0);
        expect(stop.opacity).toBeGreaterThan(0);
        expect(stop.opacity).toBeLessThanOrEqual(1);
        expect(stop.cx).toBeGreaterThanOrEqual(0);
        expect(stop.cx).toBeLessThanOrEqual(AVATAR_VIEWBOX);
        expect(stop.cy).toBeLessThanOrEqual(AVATAR_VIEWBOX);
      }
      expect(geometry.angle).toBeGreaterThan(0);
      expect(geometry.angle).toBeLessThanOrEqual(360);
    }
  });

  it("accepts a tenant hue so storefront avatars match the brand", () => {
    const branded = avatarGeometry("commenter-1", { baseHue: 200, hueSpread: 40 });
    const free = avatarGeometry("commenter-1");
    expect(branded.from).not.toBe(free.from);
    expect(branded.seed).toBe(free.seed); // hue override must not change identity
  });

  it("derives stable element ids from the seed, not from render order", () => {
    const one = avatarIds(avatarGeometry("user-1").seed);
    const two = avatarIds(avatarGeometry("user-1").seed);
    expect(one).toEqual(two);
    expect(avatarIds(avatarGeometry("user-2").seed)).not.toEqual(one);
  });
});

describe("avatarSvg", () => {
  it("emits a well-formed, self-contained document", () => {
    const svg = avatarSvg("store-1");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("undefined");

    // No third-party request: everything is inline. The only permitted URL is the
    // SVG XML namespace, which is a name and not a fetch.
    const urls = [...svg.matchAll(/https?:\/\/[^"'\s>]+/g)].map((match) => match[0]);
    expect(urls).toEqual(["http://www.w3.org/2000/svg"]);
    expect(svg).not.toContain("<image");
    expect(svg).not.toContain("url(http");
  });

  it("honours the requested size and is deterministic", () => {
    expect(avatarSvg("store-1", { size: 128 })).toContain('width="128"');
    expect(avatarSvg("store-1")).toBe(avatarSvg("store-1"));
  });
});
