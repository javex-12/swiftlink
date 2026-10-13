import { describe, expect, it } from "vitest";
import {
  availableCheckoutChannels,
  channelLabel,
  checkoutFollowUp,
  checkoutHref,
  isCheckoutChannelId,
  socialHandle,
  socialProfileUrl,
} from "../checkout-channels";

/** The store used by most cases: reachable on all four channels. */
const FULL_STORE = {
  phone: "+234 803 123 4567",
  socials: {
    instagram: "https://instagram.com/aura.essentials?igsh=abc",
    facebook: "auraessentials",
    tiktok: "https://www.tiktok.com/@auraessentials",
  },
};

describe("socialHandle", () => {
  it("reads the username out of a profile URL", () => {
    expect(socialHandle("https://instagram.com/aura.essentials?igsh=abc")).toBe("aura.essentials");
    expect(socialHandle("https://www.tiktok.com/@auraessentials")).toBe("auraessentials");
    expect(socialHandle("https://instagram.com/shop/")).toBe("shop");
  });

  it("accepts what merchants actually type", () => {
    expect(socialHandle("@auraessentials")).toBe("auraessentials");
    expect(socialHandle("  auraessentials  ")).toBe("auraessentials");
  });

  it("refuses to invent a username from a numeric profile id", () => {
    // Facebook pages without a username only exist as profile.php?id=…
    expect(socialHandle("https://facebook.com/profile.php?id=615500")).toBeNull();
    expect(socialHandle("")).toBeNull();
    expect(socialHandle(null)).toBeNull();
  });
});

describe("socialProfileUrl", () => {
  it("turns a bare handle into a profile URL", () => {
    expect(socialProfileUrl("auraessentials", "https://www.tiktok.com/@")).toBe(
      "https://www.tiktok.com/@auraessentials",
    );
  });

  it("leaves an existing URL alone", () => {
    expect(socialProfileUrl("https://facebook.com/aura", "https://facebook.com")).toBe(
      "https://facebook.com/aura",
    );
  });

  it("is null for nothing at all", () => {
    expect(socialProfileUrl("", "https://facebook.com")).toBeNull();
    expect(socialProfileUrl(undefined, "https://facebook.com")).toBeNull();
  });
});

describe("availableCheckoutChannels", () => {
  it("offers every channel the store has a destination for, WhatsApp first", () => {
    expect(availableCheckoutChannels(FULL_STORE).map((c) => c.id)).toEqual([
      "whatsapp",
      "instagram",
      "facebook",
      "tiktok",
    ]);
  });

  it("offers nothing when the store has no contact details at all", () => {
    expect(availableCheckoutChannels({})).toEqual([]);
    expect(availableCheckoutChannels(null)).toEqual([]);
    expect(availableCheckoutChannels({ phone: "   ", socials: {} })).toEqual([]);
  });

  it("cannot offer a channel the store has not filled in", () => {
    const ids = availableCheckoutChannels({
      phone: "08031234567",
      socials: { instagram: "aura" },
    }).map((c) => c.id);

    expect(ids).toEqual(["whatsapp", "instagram"]);
  });

  it("sends Instagram to the DM composer and TikTok to the profile", () => {
    const channels = availableCheckoutChannels(FULL_STORE);
    const byId = Object.fromEntries(channels.map((c) => [c.id, c]));

    expect(byId.instagram.destination).toBe("https://ig.me/m/aura.essentials");
    expect(byId.instagram.opens).toBe("dm");
    expect(byId.facebook.destination).toBe("https://m.me/auraessentials");
    expect(byId.tiktok.destination).toBe("https://www.tiktok.com/@auraessentials");
    // TikTok offers no DM deep link, so the profile is all we can promise.
    expect(byId.tiktok.opens).toBe("profile");
    expect(byId.tiktok.prefilled).toBe(false);
  });

  it("falls back to the profile link when only a page id exists", () => {
    const facebook = availableCheckoutChannels({
      socials: { facebook: "https://facebook.com/profile.php?id=615500" },
    })[0];

    expect(facebook.id).toBe("facebook");
    expect(facebook.destination).toBe("https://facebook.com/profile.php?id=615500");
    expect(facebook.opens).toBe("profile");
  });

  it("normalises the phone number the same way the WhatsApp button always has", () => {
    const whatsapp = availableCheckoutChannels({ phone: "+234 803 123 4567" })[0];
    expect(whatsapp.destination).toBe("https://wa.me/2348031234567");
    expect(whatsapp.prefilled).toBe(true);
  });
});

describe("checkoutHref", () => {
  const whatsapp = availableCheckoutChannels(FULL_STORE)[0];
  const instagram = availableCheckoutChannels(FULL_STORE)[1];

  it("carries the order text on WhatsApp, encoded", () => {
    const href = checkoutHref(whatsapp, "*NEW ORDER SL-1*\nCotton Tee & Cap");
    expect(href.startsWith("https://wa.me/2348031234567?text=")).toBe(true);
    expect(href).toContain(encodeURIComponent("*NEW ORDER SL-1*"));
    expect(decodeURIComponent(href.split("?text=")[1])).toContain("Cotton Tee & Cap");
  });

  it("never fabricates a prefilled message for a channel that cannot take one", () => {
    // An invented `?text=` would open an empty chat and silently lose the order.
    expect(checkoutHref(instagram, "order text")).toBe("https://ig.me/m/aura.essentials");
  });

  it("strips control characters that would corrupt the link", () => {
    const href = checkoutHref(whatsapp, "Order\u0000\u0007: Tee");
    expect(href).not.toContain("%00");
    expect(decodeURIComponent(href.split("?text=")[1])).toBe("Order: Tee");
  });
});

describe("checkoutFollowUp", () => {
  const [whatsapp, instagram, , tiktok] = availableCheckoutChannels(FULL_STORE);

  it("says the order was forwarded when the channel carries it", () => {
    expect(checkoutFollowUp(whatsapp)).toContain("forwarded");
  });

  it("tells the buyer to paste the copied order into a DM", () => {
    expect(checkoutFollowUp(instagram)).toMatch(/clipboard/i);
    expect(checkoutFollowUp(instagram)).toMatch(/paste/i);
  });

  it("tells the buyer to start the chat on a profile-only channel", () => {
    expect(checkoutFollowUp(tiktok)).toMatch(/profile/i);
  });

  it("names the channel it used", () => {
    expect(checkoutFollowUp(instagram)).toContain("Instagram");
  });
});

describe("channel labels", () => {
  it("labels every channel the platform supports", () => {
    expect(channelLabel("whatsapp")).toBe("WhatsApp");
    expect(channelLabel("instagram")).toBe("Instagram");
    expect(channelLabel("facebook")).toBe("Facebook");
    expect(channelLabel("tiktok")).toBe("TikTok");
  });

  it("rejects anything else", () => {
    expect(isCheckoutChannelId("whatsapp")).toBe(true);
    expect(isCheckoutChannelId("paystack")).toBe(false);
    expect(isCheckoutChannelId(null)).toBe(false);
  });
});
