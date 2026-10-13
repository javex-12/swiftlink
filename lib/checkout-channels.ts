/**
 * Where a storefront order can be sent.
 *
 * The storefront used to have exactly one checkout: a WhatsApp button. A
 * merchant whose customers live on Instagram had no way to take that order, and
 * the platform had no way to tell the two apart afterwards.
 *
 * This module answers one question purely: *given what a store has configured,
 * which channels can a buyer choose, and where does each one open?* It stays
 * free of React and of the Supabase client so it can be unit tested and reused
 * by the cart drawer, the cart page and the storefront.
 *
 * ## The prefilled-message problem
 *
 * WhatsApp is the only one of the four with a documented click-to-chat URL that
 * carries text (`wa.me/<phone>?text=`). There is **no** Instagram DM deep link at
 * all, and `m.me` cannot prefill a message. So a channel is either:
 *
 * - `prefilled: true` — the order text travels in the URL (WhatsApp), or
 * - `prefilled: false` — we copy the order text to the clipboard and open the
 *   conversation, so the buyer pastes it in. `checkoutHref` never invents a
 *   `text=` parameter for a channel that would silently drop it, because that
 *   would hand the buyer an empty chat and lose the order.
 */

import type { StoreSocials } from "./schema";
import { getCleanWhatsAppDigits } from "./phone";
import { stripControlCharacters } from "./whatsapp-template";

export type CheckoutChannelId = "whatsapp" | "instagram" | "facebook" | "tiktok";

export interface CheckoutChannel {
  id: CheckoutChannelId;
  /** Shown on the button: "WhatsApp", "Instagram", … */
  label: string;
  /** Where the buyer lands when they pick this channel. */
  destination: string;
  /** Whether the order text can ride along in `destination` (see module note). */
  prefilled: boolean;
  /**
   * `dm` — opens a conversation the buyer can send the order into.
   * `profile` — opens the merchant's profile; the buyer has to start the chat.
   * The storefront tells the buyer which one they are getting.
   */
  opens: "dm" | "profile";
}

/** Display order. WhatsApp first: it is the only one that can prefill. */
export const CHECKOUT_CHANNEL_ORDER: CheckoutChannelId[] = [
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
];

const LABELS: Record<CheckoutChannelId, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function channelLabel(id: CheckoutChannelId): string {
  return LABELS[id];
}

export function isCheckoutChannelId(value: unknown): value is CheckoutChannelId {
  return typeof value === "string" && value in LABELS;
}

/**
 * Display name for an `inquiries.source` value.
 *
 * `direct` and `other` are sources rather than channels, and a future migration
 * could add another value before this code knows about it — so an unknown source
 * is shown capitalised rather than dropped, and a number is never silently
 * missing from the dashboard.
 */
export function inquirySourceLabel(source: string | null | undefined): string {
  const value = String(source ?? "").trim().toLowerCase();
  if (!value) return "Unknown";
  if (isCheckoutChannelId(value)) return channelLabel(value);
  if (value === "direct") return "Direct link";
  if (value === "other") return "Other referrer";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface CheckoutStoreContact {
  phone?: string | null;
  socials?: StoreSocials | null;
}

/**
 * Pull a username out of whatever the merchant typed.
 *
 * The editor stores bare handles, onboarding may store a full profile URL, and
 * some Facebook pages only exist as `facebook.com/profile.php?id=123`. Handles
 * are what the DM deep links need, so:
 *
 * - `https://instagram.com/shop?igsh=abc` → `shop`
 * - `@shop` → `shop`
 * - `instagram.com/shop/` → `shop`
 * - `profile.php?id=123` → null (no username exists; caller falls back to the URL)
 */
export function socialHandle(value?: string | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // A bare handle: no slashes, no scheme.
  if (!raw.includes("/") && !raw.includes(".")) {
    const handle = raw.replace(/^@+/, "").trim();
    return handle || null;
  }

  const withoutQuery = raw.split(/[?#]/)[0].replace(/\/+$/, "");
  const last = withoutQuery.split("/").filter(Boolean).pop() ?? "";
  const handle = last.replace(/^@+/, "").trim();
  if (!handle) return null;
  // `profile.php`, `pages.html` … are files, not usernames.
  if (/\.[a-z]{2,5}$/i.test(handle)) return null;
  return handle;
}

/**
 * Normalises a merchant-entered social value into an https URL, or null.
 *
 * `base` is the profile root, and a trailing `@` in it means "this platform
 * puts the handle in the path with an @" (TikTok) — so the separator is applied
 * once, never doubled into `tiktok.com/@/handle`.
 */
export function socialProfileUrl(
  value: string | null | undefined,
  base: string,
): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@+/, "").trim();
  if (!handle) return null;

  const root = base.replace(/\/+$/, "");
  return root.endsWith("@") ? `${root}${handle}` : `${root}/${handle}`;
}

/**
 * Every channel this store can take an order on, in display order.
 *
 * A channel is offered only when the store has somewhere to send the buyer, so
 * the chooser can never show a dead button. Absent contact details are simply
 * absent channels — there is no "enabled" flag to keep in sync, and no way for
 * a merchant to switch on a channel they have not filled in.
 */
export function availableCheckoutChannels(
  store: CheckoutStoreContact | null | undefined,
): CheckoutChannel[] {
  const phone = getCleanWhatsAppDigits(String(store?.phone ?? ""));
  const socials = (store?.socials ?? {}) as StoreSocials;

  const channels: CheckoutChannel[] = [];

  if (phone) {
    channels.push({
      id: "whatsapp",
      label: LABELS.whatsapp,
      destination: `https://wa.me/${phone}`,
      prefilled: true,
      opens: "dm",
    });
  }

  // Instagram: `ig.me/m/<handle>` opens the DM composer. Without a handle there
  // is no DM link, so the profile is all we can honestly offer.
  const instagram = socials.instagram;
  const igHandle = socialHandle(instagram);
  const igUrl = igHandle
    ? `https://ig.me/m/${igHandle}`
    : socialProfileUrl(instagram, "https://instagram.com");
  if (igUrl) {
    channels.push({
      id: "instagram",
      label: LABELS.instagram,
      destination: igUrl,
      prefilled: false,
      opens: igHandle ? "dm" : "profile",
    });
  }

  // Facebook: `m.me/<username>` opens the Messenger thread.
  const facebook = socials.facebook;
  const fbHandle = socialHandle(facebook);
  const fbUrl = fbHandle
    ? `https://m.me/${fbHandle}`
    : socialProfileUrl(facebook, "https://facebook.com");
  if (fbUrl) {
    channels.push({
      id: "facebook",
      label: LABELS.facebook,
      destination: fbUrl,
      prefilled: false,
      opens: fbHandle ? "dm" : "profile",
    });
  }

  // TikTok has no DM deep link for businesses, so the profile is the target.
  const tiktok = socials.tiktok;
  const ttUrl = socialProfileUrl(tiktok, "https://www.tiktok.com/@");
  if (ttUrl) {
    channels.push({
      id: "tiktok",
      label: LABELS.tiktok,
      destination: ttUrl,
      prefilled: false,
      opens: "profile",
    });
  }

  return channels;
}

/**
 * The exact URL to open for a channel and an order message.
 *
 * The text is control-character-stripped (the same treatment the WhatsApp
 * template pipeline applies) so a stray control byte in a product name cannot
 * corrupt either the link or the clipboard payload.
 */
export function checkoutHref(channel: CheckoutChannel, message: string): string {
  if (!channel.prefilled) return channel.destination;
  const text = encodeURIComponent(stripControlCharacters(message ?? ""));
  const separator = channel.destination.includes("?") ? "&" : "?";
  return `${channel.destination}${separator}text=${text}`;
}

/** What checkout hands back so the UI can tell the buyer what just happened. */
export interface PlacedOrder {
  channel: CheckoutChannel;
  /** The order text, exactly as the buyer would have sent it. */
  message: string;
  /**
   * Whether the text reached the clipboard. Meaningful for channels that cannot
   * prefill a message, where it is the difference between "paste this" and
   * "here is your order text, copy it".
   */
  copied: boolean;
}

/**
 * Put the order text on the clipboard, synchronously.
 *
 * Deliberately not the async Clipboard API alone: this runs inside a click
 * handler and the caller needs an answer *now*, because it decides what the buyer
 * is told next. The temporary-textarea path is synchronous and needs no
 * permission prompt; the async API is attempted as a best-effort second try for
 * browsers that have dropped `execCommand`.
 */
export function copyOrderText(text: string): boolean {
  if (typeof document === "undefined") return false;
  const payload = stripControlCharacters(String(text ?? ""));
  if (!payload) return false;

  let copied = false;
  try {
    const area = document.createElement("textarea");
    area.value = payload;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    copied = document.execCommand("copy");
    document.body.removeChild(area);
  } catch {
    copied = false;
  }

  if (!copied && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(payload).catch(() => undefined);
    copied = true;
  }

  return copied;
}

/**
 * What the buyer is told after we open the channel, given how it opened.
 * Kept here so every checkout surface says the same thing.
 */
export function checkoutFollowUp(channel: CheckoutChannel): string {
  if (channel.prefilled) {
    return `We've forwarded your order to the store on ${channel.label}.`;
  }
  if (channel.opens === "dm") {
    return `Your order is copied to your clipboard — paste it into the ${channel.label} chat we just opened.`;
  }
  return `Your order is copied to your clipboard — open the ${channel.label} profile we just opened and paste it into a message.`;
}
