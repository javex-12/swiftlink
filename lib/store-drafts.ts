/**
 * Server-side copy of a merchant's unsaved work (autosave).
 *
 * The contract, in one line: **a draft is never live.** Nothing here writes to
 * `stores.state_json`; that only happens when the merchant presses Save, which
 * goes through `saveFullState` in the context. Drafts live in their own table
 * (`supabase/migrations/20261008140000_store_drafts.sql`) with owner-only RLS,
 * so unpublished work — including products hidden by plan limits — is never
 * readable from the public storefront.
 *
 * Every function degrades to "no server copy" instead of throwing: the local
 * `localStorage` draft in `lib/draft-store.ts` is the safety net, so an
 * unreachable or un-migrated backend must not turn autosave into an error.
 */

import { supabase, isSupabaseConfigured } from "./supabase-client";
import { normalizeShopState, type ShopState } from "./types";
import { type EditorDraft, stableStringify } from "./draft-store";

/** The store a piece of work belongs to, or null when it has no identity yet. */
export function storeDraftKey(state: Pick<ShopState, "id" | "ownerId"> | null | undefined): string | null {
  const id = typeof state?.id === "string" ? state.id.trim() : "";
  if (id) return id;
  const ownerId = typeof state?.ownerId === "string" ? state.ownerId.trim() : "";
  return ownerId || null;
}

export interface DraftSummary {
  /** Top-level fields that differ from the live store, alphabetical, capped. */
  changedFields: string[];
  /** Products present in the draft but not in the live store. */
  addedProducts: number;
  /** Products in the live store that the draft no longer contains. */
  removedProducts: number;
  /** True when the draft carries no edits at all. */
  isEmpty: boolean;
}

const MAX_REPORTED_FIELDS = 8;

/**
 * Describe what a draft would change. Used for the "you have unsaved changes"
 * prompt so the merchant sees the shape of the work before restoring it.
 */
export function summarizeDraft(
  draft: Pick<EditorDraft, "state"> | null | undefined,
  live: ShopState | null | undefined,
): DraftSummary {
  const empty: DraftSummary = { changedFields: [], addedProducts: 0, removedProducts: 0, isEmpty: true };
  if (!draft?.state || !live) return empty;

  const draftState = draft.state as unknown as Record<string, unknown>;
  const liveState = live as unknown as Record<string, unknown>;

  const keys = Array.from(new Set([...Object.keys(draftState), ...Object.keys(liveState)]));
  const changed = keys
    .filter((key) => stableStringify(draftState[key]) !== stableStringify(liveState[key]))
    .sort();

  const draftIds = new Set((draft.state.products || []).map((p) => p?.id));
  const liveIds = new Set((live.products || []).map((p) => p?.id));
  let added = 0;
  let removed = 0;
  draftIds.forEach((id) => {
    if (!liveIds.has(id)) added += 1;
  });
  liveIds.forEach((id) => {
    if (!draftIds.has(id)) removed += 1;
  });

  return {
    changedFields: changed.slice(0, MAX_REPORTED_FIELDS),
    addedProducts: added,
    removedProducts: removed,
    isEmpty: changed.length === 0,
  };
}

/**
 * Choose the draft the merchant should be offered. Local and server copies can
 * disagree (edited offline, or on another device), so the newest one wins.
 */
export function pickNewestDraft(
  ...candidates: Array<EditorDraft | null | undefined>
): EditorDraft | null {
  let best: EditorDraft | null = null;
  let bestTime = Number.NEGATIVE_INFINITY;
  candidates.forEach((candidate) => {
    if (!candidate?.state) return;
    const parsed = new Date(candidate.savedAt).getTime();
    // An unreadable timestamp sorts oldest but is still recoverable — losing a
    // draft over a malformed date would be the worst possible failure mode.
    const time = Number.isFinite(parsed) ? parsed : 0;
    if (time <= bestTime) return;
    best = candidate;
    bestTime = time;
  });
  return best;
}

/** Read the merchant's server draft for one store. */
export async function fetchStoreDraft(storeId: string): Promise<EditorDraft | null> {
  if (!storeId || !isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("store_drafts")
      .select("draft_json, updated_at")
      .eq("store_id", storeId)
      .maybeSingle();
    if (error || !data?.draft_json) return null;
    return {
      savedAt: (data.updated_at as string) || new Date().toISOString(),
      state: normalizeShopState(data.draft_json as Partial<ShopState>),
    };
  } catch {
    return null;
  }
}

/**
 * Write the merchant's server draft. Returns the stored timestamp when the
 * backend accepted it, or null when the draft could only be kept locally.
 */
export async function writeStoreDraft(
  storeId: string,
  ownerId: string,
  state: ShopState,
): Promise<string | null> {
  if (!storeId || !ownerId || !isSupabaseConfigured()) return null;
  try {
    const savedAt = new Date().toISOString();
    const { error } = await supabase.from("store_drafts").upsert(
      {
        store_id: storeId,
        owner_id: ownerId,
        draft_json: state,
        updated_at: savedAt,
      },
      { onConflict: "store_id" },
    );
    if (error) return null;
    return savedAt;
  } catch {
    return null;
  }
}

/** Drop the server draft — called when the draft becomes the live store. */
export async function deleteStoreDraft(storeId: string): Promise<boolean> {
  if (!storeId || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("store_drafts").delete().eq("store_id", storeId);
    return !error;
  } catch {
    return false;
  }
}
