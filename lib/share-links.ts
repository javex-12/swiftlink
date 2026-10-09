import { getShopPath } from "./utils";
import { resolveInquirySource, type InquirySource } from "./inquiries";

/**
 * Channel-tagged share links.
 *
 * The storefront has always *read* `?src=` (see `context/SwiftLinkContext.tsx` →
 * `recordOrderIntent` → `resolveInquirySource`), and the analytics channel
 * breakdown is built from the column it writes. But nothing ever *produced* a
 * tagged link, so every inquiry resolved to "direct" via the referrer fallback
 * and the breakdown was decorative.
 *
 * This module is the missing producer. Its only job is to build URLs that the
 * existing reader understands, so the two halves cannot drift: the accepted
 * values are asserted against `resolveInquirySource` in
 * `lib/__tests__/share-links.test.ts`.
 *
 * Note the deliberate shape: `direct` is *not* offered as a channel. "Direct"
 * means someone typed the address or arrived with no attribution, so a link a
 * merchant deliberately tags can never legitimately be "direct".
 */

/** Channels a merchant can tag a link with. Values must round-trip through `resolveInquirySource`. */
export type ShareChannel = "whatsapp" | "instagram" | "tiktok" | "other";

export interface ShareChannelOption {
  id: ShareChannel;
  label: string;
  hint: string;
}

export const SHARE_CHANNELS: readonly ShareChannelOption[] = [
  { id: "whatsapp", label: "WhatsApp", hint: "Status updates, groups and DMs" },
  { id: "instagram", label: "Instagram", hint: "Bio link, stories and DMs" },
  { id: "tiktok", label: "TikTok", hint: "Bio link and video captions" },
  { id: "other", label: "Other", hint: "Email, flyers, QR codes, SMS" },
];

/** The minimum store shape `getShopPath` needs. */
export interface ShareableStore {
  id?: string | null;
  bizName?: string;
  storeUsername?: string | null;
}

function normalizeOrigin(origin: string): string {
  return String(origin || "").replace(/\/+$/, "");
}

/**
 * The store's canonical public URL, untagged — the same path
 * `lib/utils.ts:getShopPath` hands the console, made absolute.
 */
export function buildStoreUrl(origin: string, store: ShareableStore): string {
  // Delegates to `getShopPath` rather than re-deriving the shape, so the console
  // and the storefront route can never disagree about a store's URL. Coalesced
  // because `ShareableStore` is a permissive input type; `getShopPath` treats an
  // absent id as "not published yet" and returns the site root.
  const path = getShopPath({
    id: store.id ?? "",
    bizName: store.bizName ?? "",
    storeUsername: store.storeUsername ?? "",
  });
  return `${normalizeOrigin(origin)}${path}`;
}

/**
 * A channel-tagged link. Pass no channel for the plain canonical URL.
 *
 * Handles both URL shapes `getShopPath` can return: `/<handle>` and the
 * handle-less `/?shop=<id>` fallback, in which case the tag is appended with
 * `&` rather than `?`.
 */
export function buildShareUrl(
  origin: string,
  store: ShareableStore,
  channel?: ShareChannel | null,
): string {
  const url = buildStoreUrl(origin, store);
  if (!channel) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}src=${channel}`;
}

/** The message a merchant sends alongside the link. */
export function buildShareMessage(storeName: string | null | undefined, url: string): string {
  const name = String(storeName || "").trim();
  return name ? `Browse ${name} on WhatsApp: ${url}` : `Browse our store on WhatsApp: ${url}`;
}

/** A `wa.me` share link that opens WhatsApp with the message pre-filled. */
export function buildWhatsAppShareHref(url: string, storeName?: string | null): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareMessage(storeName, url))}`;
}

/**
 * The channel a tagged URL will be recorded as. Exposed so the UI can label a
 * link with what the analytics table will actually show, rather than re-deriving
 * the mapping in a component.
 */
export function channelForSource(channel: ShareChannel): InquirySource {
  return resolveInquirySource(channel, null);
}
