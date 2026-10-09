/**
 * "Remember my info" — stop re-asking the merchant for details we already know.
 *
 * Device-local (`localStorage`), never sent anywhere on its own: this only
 * prefills onboarding fields the merchant is about to type anyway. Anything the
 * store itself needs still travels through the normal save path.
 *
 * Only values the merchant actually entered are remembered, and only where the
 * live store is still blank — a remembered phone number must never overwrite
 * one the merchant has already set on this store.
 */

import { type ShopState } from "./types";

const REMEMBERED_INPUT_KEY = "swiftlink_remembered_input_v1";

export interface RememberedMerchantInput {
  bizName?: string;
  storeUsername?: string;
  phone?: string;
  countryCode?: string;
  currency?: string;
}

const REMEMBERED_FIELDS_SHOP: Array<keyof RememberedMerchantInput> = [
  "bizName",
  "storeUsername",
  "phone",
  "currency",
];

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Merge new values over the remembered set. A blank value is treated as "no
 * opinion" rather than "forget", so clearing a field mid-onboarding doesn't
 * wipe what we know on the next visit.
 */
export function mergeRememberedInput(
  current: RememberedMerchantInput | null | undefined,
  partial: RememberedMerchantInput,
): RememberedMerchantInput {
  const merged: RememberedMerchantInput = { ...(current || {}) };
  (Object.keys(partial) as Array<keyof RememberedMerchantInput>).forEach((field) => {
    const value = clean(partial[field]);
    if (value) merged[field] = value;
  });
  return merged;
}

export function readRememberedInput(): RememberedMerchantInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REMEMBERED_INPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedMerchantInput;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function rememberMerchantInput(partial: RememberedMerchantInput): void {
  if (typeof window === "undefined") return;
  try {
    const merged = mergeRememberedInput(readRememberedInput(), partial);
    localStorage.setItem(REMEMBERED_INPUT_KEY, JSON.stringify(merged));
  } catch {
    // Storage unavailable (private mode, quota) — remembering is a nicety.
  }
}

export function clearRememberedInput(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REMEMBERED_INPUT_KEY);
  } catch {
    // Ignore
  }
}

export interface MerchantInputPrefill {
  /** ShopState fields safe to prefill (only ones the store leaves blank). */
  state: Partial<Pick<ShopState, "bizName" | "storeUsername" | "phone" | "currency">>;
  /** Country selector value, when remembered. */
  countryCode?: string;
}

/** Values to prefill, filtered down to fields the live store leaves blank. */
export function prefillMerchantInput(
  remembered: RememberedMerchantInput | null | undefined,
  state: Partial<ShopState> | null | undefined,
): MerchantInputPrefill {
  const prefill: MerchantInputPrefill = { state: {} };
  if (!remembered) return prefill;

  REMEMBERED_FIELDS_SHOP.forEach((field) => {
    const rememberedValue = clean(remembered[field]);
    const liveValue = clean((state as Record<string, unknown> | null | undefined)?.[field] as unknown);
    if (rememberedValue && !liveValue) {
      prefill.state[field as keyof MerchantInputPrefill["state"]] = rememberedValue;
    }
  });

  const countryCode = clean(remembered.countryCode);
  if (countryCode) prefill.countryCode = countryCode;

  return prefill;
}
