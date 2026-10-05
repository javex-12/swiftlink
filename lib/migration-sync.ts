/**
 * Safe one-time migration of localStorage draft data into Supabase.
 *
 * Rules:
 * - Import ONLY when the DB store exists and has zero products.
 * - Keyed per user ID: `swiftlink_migrated_${userId}`.
 * - Never overwrite non-empty DB products.
 * - Do not delete localStorage copy until the DB write succeeds.
 * - Requires explicit vendor confirmation or automatic safe backfill when clean.
 */

import { supabase, isSupabaseConfigured } from "./supabase-client";
import { normalizeShopState, type ShopState } from "./types";

export interface MigrationCheckResult {
  hasLocalDraft: boolean;
  localProductCount: number;
  dbProductCount: number;
  canMigrate: boolean;
}

export function checkLocalStorageMigrationNeeded(userId: string, dbStoreState?: ShopState | null): MigrationCheckResult {
  if (typeof window === "undefined" || !userId) {
    return { hasLocalDraft: false, localProductCount: 0, dbProductCount: 0, canMigrate: false };
  }

  const migrationKey = `swiftlink_migrated_${userId}`;
  if (localStorage.getItem(migrationKey) === "true") {
    return { hasLocalDraft: false, localProductCount: 0, dbProductCount: 0, canMigrate: false };
  }

  try {
    const raw = localStorage.getItem("swiftlink_state");
    if (!raw) {
      return { hasLocalDraft: false, localProductCount: 0, dbProductCount: 0, canMigrate: false };
    }

    const localState = normalizeShopState(JSON.parse(raw));
    const localProductCount = localState.products?.length || 0;
    const dbProductCount = dbStoreState?.products?.length || 0;

    // We only migrate if local storage has products and DB store has 0 products
    const canMigrate = localProductCount > 0 && dbProductCount === 0;

    return {
      hasLocalDraft: localProductCount > 0,
      localProductCount,
      dbProductCount,
      canMigrate,
    };
  } catch {
    return { hasLocalDraft: false, localProductCount: 0, dbProductCount: 0, canMigrate: false };
  }
}

export async function executeLocalStorageMigration(userId: string, storeId: string): Promise<boolean> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return false;

  const migrationKey = `swiftlink_migrated_${userId}`;
  if (localStorage.getItem(migrationKey) === "true") return false;

  try {
    const raw = localStorage.getItem("swiftlink_state");
    if (!raw) return false;

    const localState = normalizeShopState(JSON.parse(raw));
    if (!localState.products || localState.products.length === 0) return false;

    // Verify DB store currently has zero products before writing
    const { data: dbStore, error: fetchErr } = await supabase
      .from("stores")
      .select("id, state_json")
      .eq("id", storeId)
      .eq("owner_id", userId)
      .single();

    if (fetchErr || !dbStore) return false;

    const currentDbState = (dbStore.state_json || {}) as Record<string, unknown>;
    const currentProducts = Array.isArray(currentDbState.products) ? currentDbState.products : [];

    if (currentProducts.length > 0) {
      // DB already has products. Never overwrite non-empty DB data.
      localStorage.setItem(migrationKey, "true");
      return false;
    }

    // Merge non-destructively: keep DB identifiers and assign local products and details
    const mergedState: ShopState = {
      ...localState,
      id: storeId,
      ownerId: userId,
    };

    const { error: updateErr } = await supabase
      .from("stores")
      .update({
        state_json: mergedState,
        biz_name: localState.bizName || undefined,
        store_username: localState.storeUsername || undefined,
        phone: localState.phone || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId)
      .eq("owner_id", userId);

    if (updateErr) {
      console.error("Migration write failed:", updateErr);
      return false;
    }

    // Only after the DB write succeeds do we mark the migration key and preserve local copy
    localStorage.setItem(migrationKey, "true");
    return true;
  } catch (err) {
    console.error("Migration error:", err);
    return false;
  }
}
