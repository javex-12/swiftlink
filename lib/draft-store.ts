/**
 * Draft storage for merchant work.
 *
 * Two distinct mechanisms live here, and they are deliberately separate:
 *
 * 1. **Preview drafts** (`sessionStorage` + `postMessage`) — short-lived, scoped
 *    to one browser tab, used to feed the editor's live preview iframe.
 * 2. **Editor drafts** (`localStorage`) — the merchant's *unsaved work*, kept
 *    across reloads and accidental navigation. Written by the autosave loop in
 *    the store editor (see `lib/store-drafts.ts` for the server-side copy).
 *
 * Preview drafts may be thrown away at any time; editor drafts must survive, so
 * they have their own key space and are never cleared by preview code.
 */

import { ShopState } from "./schema";

// ---------------------------------------------------------------------------
// Preview drafts (sessionStorage, per tab)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Editor drafts (localStorage, survives reloads) — the offline half of autosave
// ---------------------------------------------------------------------------

const EDITOR_DRAFT_PREFIX = "swiftlink_editor_draft_v1_";

/**
 * Refuse to cache anything absurd. A draft is a convenience copy, not the
 * source of truth, so dropping an oversized one is strictly better than
 * blowing the ~5 MB localStorage budget and taking other keys down with it.
 */
export const MAX_EDITOR_DRAFT_BYTES = 512 * 1024;

export interface EditorDraft {
  /** ISO timestamp of the last local write. */
  savedAt: string;
  state: ShopState;
}

/**
 * Key for a merchant's unsaved work. Prefers the store id so each store keeps
 * its own draft (a multi-store owner can have two stores open in two tabs).
 */
export function editorDraftKey(storeKey: string | null | undefined): string | null {
  const key = (storeKey || "").trim().toLowerCase();
  if (!key) return null;
  return `${EDITOR_DRAFT_PREFIX}${key}`;
}

/**
 * Order-independent serialisation, so "dirty" comparisons don't flip just
 * because two objects were built in a different property order. Used for
 * change detection only — never stored or sent.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  // `undefined` values are dropped, matching JSON.stringify: an unset field and
  // a missing field are the same thing to every consumer of this state.
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** True when `draft` holds edits that `live` does not. */
export function hasDraftChanges(
  draft: Pick<EditorDraft, "state"> | null | undefined,
  live: ShopState | null | undefined,
): boolean {
  if (!draft || !live) return false;
  return stableStringify(draft.state) !== stableStringify(live);
}

export function readEditorDraft(storeKey: string | null | undefined): EditorDraft | null {
  if (typeof window === "undefined") return null;
  const storageKey = editorDraftKey(storeKey);
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EditorDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.state) return null;
    return { savedAt: parsed.savedAt || new Date(0).toISOString(), state: parsed.state };
  } catch {
    return null;
  }
}

/** Returns the saved-at ISO string, or null when nothing could be stored. */
export function writeEditorDraft(
  storeKey: string | null | undefined,
  state: ShopState,
  now: Date = new Date(),
): string | null {
  if (typeof window === "undefined") return null;
  const storageKey = editorDraftKey(storeKey);
  if (!storageKey) return null;
  const savedAt = now.toISOString();
  try {
    const payload = JSON.stringify({ savedAt, state });
    if (payload.length > MAX_EDITOR_DRAFT_BYTES) {
      // Too big to cache; drop any stale copy so we never restore an older draft
      // as if it were the merchant's latest work.
      localStorage.removeItem(storageKey);
      return null;
    }
    localStorage.setItem(storageKey, payload);
    return savedAt;
  } catch {
    return null;
  }
}

export function clearEditorDraft(storeKey: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const storageKey = editorDraftKey(storeKey);
  if (!storageKey) return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore
  }
}

/** Human-readable age, e.g. "just now", "4 min ago", "2 days ago". */
export function describeDraftAge(savedAt: string | null | undefined, now: number = Date.now()): string {
  if (!savedAt) return "";
  const then = new Date(savedAt).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}
