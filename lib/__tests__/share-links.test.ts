import { describe, expect, it } from "vitest";
import {
  SHARE_CHANNELS,
  buildShareMessage,
  buildShareUrl,
  buildStoreUrl,
  buildWhatsAppShareHref,
  channelForSource,
  type ShareChannel,
} from "../share-links";
import { resolveInquirySource } from "../inquiries";

/**
 * These tests exist to keep the producer (`lib/share-links.ts`) and the consumer
 * (`resolveInquirySource`, backed by the `source` CHECK constraint on
 * `inquiries`) from drifting apart. A tag the reader does not understand is
 * silently recorded as "other", which is indistinguishable from a bug.
 */
describe("buildStoreUrl", () => {
  it("builds the canonical bare-handle URL", () => {
    expect(
      buildStoreUrl("https://swiftlink.pro", { id: "abc", storeUsername: "cyder" }),
    ).toBe("https://swiftlink.pro/cyder");
  });

  it("normalizes a messy handle exactly as the route does", () => {
    expect(
      buildStoreUrl("https://swiftlink.pro", { id: "abc", storeUsername: " Ada's Kitchen " }),
    ).toBe("https://swiftlink.pro/adaskitchen");
  });

  it("routes a handle-less store through the ?shop= entry point", () => {
    // Matches `getShopPath`: a derived slug would collide across stores.
    expect(buildStoreUrl("https://swiftlink.pro", { id: "abc", storeUsername: "" })).toBe(
      "https://swiftlink.pro/?shop=abc",
    );
  });

  it("tolerates a trailing slash on the origin", () => {
    expect(
      buildStoreUrl("https://swiftlink.pro/", { id: "abc", storeUsername: "cyder" }),
    ).toBe("https://swiftlink.pro/cyder");
  });
});

describe("buildShareUrl", () => {
  it("appends the tag with ? on a path that has no query", () => {
    expect(
      buildShareUrl("https://swiftlink.pro", { id: "abc", storeUsername: "cyder" }, "instagram"),
    ).toBe("https://swiftlink.pro/cyder?src=instagram");
  });

  it("appends the tag with & when the URL already has a query", () => {
    expect(
      buildShareUrl("https://swiftlink.pro", { id: "abc", storeUsername: "" }, "tiktok"),
    ).toBe("https://swiftlink.pro/?shop=abc&src=tiktok");
  });

  it("returns the untagged canonical URL when no channel is given", () => {
    expect(
      buildShareUrl("https://swiftlink.pro", { id: "abc", storeUsername: "cyder" }, null),
    ).toBe("https://swiftlink.pro/cyder");
  });
});

describe("channel tags round-trip through the inquiry source resolver", () => {
  it("every offered channel is read back as itself", () => {
    for (const channel of SHARE_CHANNELS) {
      const url = buildShareUrl(
        "https://swiftlink.pro",
        { id: "abc", storeUsername: "cyder" },
        channel.id,
      );
      const src = new URL(url).searchParams.get("src");
      expect(src, `channel ${channel.id} must produce a src param`).toBe(channel.id);
      expect(resolveInquirySource(src, null)).toBe(channel.id);
    }
  });

  it("channelForSource reports what the analytics table will store", () => {
    const expected: Record<ShareChannel, ReturnType<typeof resolveInquirySource>> = {
      whatsapp: "whatsapp",
      instagram: "instagram",
      tiktok: "tiktok",
      other: "other",
    };
    for (const [channel, source] of Object.entries(expected)) {
      expect(channelForSource(channel as ShareChannel)).toBe(source);
    }
  });

  it("never offers 'direct' as a channel", () => {
    // "direct" means untagged; a link a merchant deliberately tagged cannot be it.
    expect(SHARE_CHANNELS.map((c) => c.id as string)).not.toContain("direct");
  });

  it("has no duplicate channel ids", () => {
    const ids = SHARE_CHANNELS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("share copy", () => {
  it("names the store in the message", () => {
    expect(buildShareMessage("Cyder", "https://swiftlink.pro/cyder")).toBe(
      "Browse Cyder on WhatsApp: https://swiftlink.pro/cyder",
    );
  });

  it("falls back to a generic name when the store has none", () => {
    expect(buildShareMessage("   ", "https://swiftlink.pro/cyder")).toBe(
      "Browse our store on WhatsApp: https://swiftlink.pro/cyder",
    );
  });

  it("encodes the message and the tagged link into the wa.me href", () => {
    const url = buildShareUrl(
      "https://swiftlink.pro",
      { id: "abc", storeUsername: "cyder" },
      "whatsapp",
    );
    const href = buildWhatsAppShareHref(url, "Cyder");
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    const decoded = decodeURIComponent(href.replace("https://wa.me/?text=", ""));
    expect(decoded).toContain("https://swiftlink.pro/cyder?src=whatsapp");
    expect(decoded).toContain("Cyder");
  });
});
