/**
 * Inquiries and deduplication helpers.
 */

export type InquiryStatus = "new" | "chatting" | "sold" | "lost";
export type InquirySource = "whatsapp" | "instagram" | "tiktok" | "direct" | "other";

export interface InquiryRecord {
  id: string;
  store_id: string;
  product_id: number;
  product_name: string;
  product_price_naira: number;
  selected_option?: string | null;
  final_amount_naira?: number | null;
  sold_at?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  device_hash?: string | null;
  dedupe_key?: string | null;
  status: InquiryStatus;
  source: InquirySource;
  created_at: string;
  updated_at: string;
}

export interface CustomerRecord {
  id: string;
  store_id: string;
  phone: string;
  name?: string | null;
  notes?: string | null;
  chats_count: number;
  sold_count: number;
  last_chat_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Computes a 15-minute slot dedupe key to prevent race conditions and duplicate
 * inquiries from the same device tapping the same product repeatedly.
 */
export function computeDedupeKey(
  storeId: string,
  productId: number | string,
  deviceHash: string,
  date: Date = new Date(),
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const slot15m = Math.floor(date.getUTCMinutes() / 15);

  return `${storeId}:${productId}:${deviceHash}:${year}-${month}-${day}T${hour}:s${slot15m}`;
}

/**
 * Validates the database invariant:
 * status === 'sold' REQUIRES final_amount_naira > 0 and sold_at != null.
 */
export function validateInquiryStatusTransition(
  status: InquiryStatus,
  finalAmountNaira?: number | null,
  soldAt?: string | null,
): { isValid: boolean; error?: string } {
  if (status === "sold") {
    if (finalAmountNaira === undefined || finalAmountNaira === null || Number.isNaN(finalAmountNaira) || finalAmountNaira < 0) {
      return { isValid: false, error: "Marking an inquiry as sold requires a valid final amount in Naira." };
    }
    if (!soldAt) {
      return { isValid: false, error: "Marking an inquiry as sold requires a sold timestamp." };
    }
  }
  return { isValid: true };
}

/**
 * Client and server source detector:
 * 1. Checks query param (?src=) which always beats referrer
 * 2. Checks document referrer hostname (instagram, tiktok, whatsapp)
 * 3. Falls back to 'direct' or 'other'
 */
export function resolveInquirySource(srcParam?: string | null, referrer?: string | null): InquirySource {
  if (srcParam) {
    const s = srcParam.toLowerCase().trim();
    if (s === "whatsapp" || s === "wa") return "whatsapp";
    if (s === "instagram" || s === "ig") return "instagram";
    if (s === "tiktok" || s === "tt") return "tiktok";
    if (s === "direct") return "direct";
    return "other";
  }

  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.includes("whatsapp") || host.includes("wa.me")) return "whatsapp";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("tiktok")) return "tiktok";
    return "other";
  } catch {
    return "direct";
  }
}
