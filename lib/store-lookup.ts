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
      .ilike("store_username", handle)
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

export type DirectoryStore = {
  handle: string;
  bizName: string;
  tagline: string;
  description: string;
  image: string | null;
  location: string | null;
  categories: string[];
  productCount: number;
  updatedAt: string | null;
};

/**
 * Public storefront rows for the `/stores` directory.
 *
 * This is the one page that lets a visitor (and a crawler) find a store by the
 * name they know: store pages themselves are reachable only if you already have
 * the handle or the link. The same visibility rules as the sitemap apply — no
 * banned stores, no stores left unpublished by a downgrade.
 *
 * `query` filters on business name, handle, tagline and location, so
 * `/stores?q=cyd` is a real, shareable, crawlable URL rather than a client-only
 * filter.
 */
export async function getPublicStoresForDirectory(query = ""): Promise<DirectoryStore[]> {
  const supabase = publicClient();
  if (!supabase) return [];

  const needle = query.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("store_username, biz_name, state_json, updated_at, account_status")
      .not("store_username", "is", null)
      .limit(500);

    if (error || !data) return [];

    return data
      .filter((row: any) => row.account_status !== "banned")
      .filter((row: any) => (row.state_json?.isLive ?? true) !== false)
      .map((row: any): DirectoryStore => {
        const state = (row.state_json ?? {}) as Partial<ShopState>;
        const bizName = (state.bizName || row.biz_name || "SwiftLink Store") as string;
        return {
          handle: normalizeStoreUsername(String(row.store_username)),
          bizName,
          tagline: String(state.tagline || ""),
          description: String(state.bio || state.aboutUs || "").slice(0, 200),
          // Base64 uploads render fine in a browser but are meaningless to a
          // crawler or an OG card, so they are dropped here.
          image:
            state.bizImage && !String(state.bizImage).startsWith("data:")
              ? String(state.bizImage)
              : null,
          location: state.location ? String(state.location) : null,
          categories: (state.categories || []).slice(0, 6).map(String),
          productCount: (state.products || []).filter((p) => p?.visible !== false).length,
          updatedAt: (row.updated_at as string) ?? null,
        };
      })
      .filter((store) => Boolean(store.handle))
      .filter((store) => {
        if (!needle) return true;
        const haystack = [store.bizName, store.handle, store.tagline, store.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => a.bizName.localeCompare(b.bizName));
  } catch {
    return [];
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
