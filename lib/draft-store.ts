/**
 * In-memory draft state store for live storefront preview iframe.
 * Supports cross-frame live synchronisation via postMessage.
 */

import { ShopState } from "./schema";

const DRAFT_STORAGE_KEY_PREFIX = "swiftlink_draft_store_";

export function getDraftStateFromStorage(storeUsername: string): ShopState | null {
  if (typeof window === "undefined" || !storeUsername) return null;
  try {
    const raw = sessionStorage.getItem(`${DRAFT_STORAGE_KEY_PREFIX}${storeUsername.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraftStateToStorage(storeUsername: string, state: ShopState): void {
  if (typeof window === "undefined" || !storeUsername) return;
  try {
    sessionStorage.setItem(
      `${DRAFT_STORAGE_KEY_PREFIX}${storeUsername.toLowerCase()}`,
      JSON.stringify(state)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export const DRAFT_MESSAGE_TYPE = "SWIFTLINK_DRAFT_UPDATE";

export interface DraftUpdateMessage {
  type: typeof DRAFT_MESSAGE_TYPE;
  state: ShopState;
}
