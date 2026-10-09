import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ShopState } from "./schema";
import { normalizeStoreUsername } from "./utils";

/**
 * Server-side public store lookup.
 *
 * The storefront reads with the anonymous key, exactly like the visitor it
 * serves — the `stores` table has a public SELECT policy and no privileged data
 * is exposed. Used by the canonical `/<handle>` route (metadata + render) and by
 * `app/sitemap.ts`.
 *
 * Only import this from Server Components, Route Handlers or the sitemap — it
 * creates a fresh Supabase client and must never be bundled for the browser.
 */

function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    !url ||
    !key ||
    !url.startsWith("http") ||
    url.includes("dummy-project") ||
    url.includes("your-project")
  ) {
    return null;
  }
  try {
    new URL(url);
    return createClient(url, key);
  } catch {
    return null;
  }
}

export type PublicStore = {
  id: string;
  handle: string;
  bizName: string;
  /** Decoded `state_json`, for metadata and for the storefront to render. */
  state: Partial<ShopState>;
};

/**
 * Resolve a handle to its store. Returns null for an unknown handle, for a
 * store with no handle, and for a banned store — a banned storefront must not be
 * publicly reachable (the canonical route turns null into a 404).
 */
export async function getPublicStoreByHandle(
  handleInput: string,
): Promise<PublicStore | null> {
  const handle = normalizeStoreUsername(handleInput);
  if (!handle) return null;

  const supabase = publicClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("id, biz_name, store_username, account_status, state_json")
      .eq("store_username", handle)
      .maybeSingle();

    if (error || !data) return null;
    if (data.account_status === "banned") return null;

    const state = (data.state_json ?? {}) as Partial<ShopState>;
    return {
      id: data.id as string,
      handle,
      bizName: (state.bizName || data.biz_name || "SwiftLink Store") as string,
      state,
    };
  } catch {
    return null;
  }
}

/**
 * Current handle for a store id, or null if the store has none. Used by the
 * legacy `/store/<handle>?shop=<id>` redirect so a renamed handle still lands
 * on the right storefront.
 */
export async function getStoreHandleById(id: string): Promise<string | null> {
  const supabase = publicClient();
  if (!supabase || !id) return null;

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("store_username")
      .eq("id", id)
      .maybeSingle();

    if (error || !data?.store_username) return null;
    return normalizeStoreUsername(String(data.store_username)) || null;
  } catch {
    return null;
  }
}

export type SitemapStore = { handle: string; updatedAt: string | null };

/**
 * Every store that should appear in the sitemap: has a handle, is not banned,
 * and is not paused (`isLive === false`). Unpublished stores (extra stores left
 * over from a downgrade) are deliberately excluded.
 */
export async function getLiveStoresForSitemap(): Promise<SitemapStore[]> {
  const supabase = publicClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("store_username, updated_at, state_json, account_status")
      .not("store_username", "is", null);

    if (error || !data) return [];

    return data
      .filter((row: any) => row.account_status !== "banned")
      .filter((row: any) => (row.state_json?.isLive ?? true) !== false)
      .map((row: any) => ({
        handle: normalizeStoreUsername(String(row.store_username)),
        updatedAt: (row.updated_at as string) ?? null,
      }))
      .filter((row) => Boolean(row.handle));
  } catch {
    return [];
  }
}
