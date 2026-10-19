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
  /**
   * The store's paid tier, used for the one presentation rule that depends on
   * it: a Business storefront does not print "Powered by SwiftLink". It is the
   * `stores.plan` column, not the editable `state_json` mirror, so a merchant
   * cannot white-label themselves by editing the blob.
   */
  plan: string;
  bizName: string;
  /**
   * The account that owns this store, for the server-side "is the viewer the
   * owner?" check. Server-only: the public storefront projection never carries
   * an owner id (`lib/__tests__/public-store-whitelist.test.ts`), so this field
   * must stay on the server and only ever leave it as a boolean.
   */
  ownerId: string | null;
  /** Unix epoch ms of last write — used as a cache-busting token for OG image URLs. */
  updatedAt: number;
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
      .select("id, owner_id, biz_name, store_username, account_status, state_json, updated_at, plan")
      .ilike("store_username", handle)
      .maybeSingle();

    if (error || !data) return null;
    if (data.account_status === "banned") return null;

    const state = (data.state_json ?? {}) as Partial<ShopState>;
    return {
      id: data.id as string,
      handle,
      plan: (data.plan as string) ?? "free",
      ownerId: (data.owner_id as string) ?? null,
      bizName: (state.bizName || data.biz_name || "SwiftLink Store") as string,
      updatedAt: data.updated_at ? new Date(data.updated_at as string).getTime() : Date.now(),
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
 * Words people add to a store name when searching, and which no store name
 * contains: nobody can find "Cyd" by typing "cyd store" if the query has to
 * appear verbatim in the name.
 */
const SEARCH_FILLER = new Set(["store", "stores", "shop", "shopping", "online", "official", "the"]);

/**
 * Whether a directory row matches a search.
 *
 * Every meaningful word must appear somewhere in the row (name, handle,
 * tagline, city, categories), so "cyd store" matches Cyd while "ada lagos"
 * does not match a Lagos store that is not Ada's. The filler words above are
 * ignored rather than required.
 */
export function storeMatchesQuery(
  store: Pick<DirectoryStore, "bizName" | "handle" | "tagline" | "location" | "categories">,
  query: string,
): boolean {
  const terms = String(query || "")
    .toLowerCase()
    .split(/[^a-z0-9@]+/)
    .filter((term) => term && !SEARCH_FILLER.has(term));

  if (terms.length === 0) return true;

  const haystack = [store.bizName, store.handle, store.tagline, store.location, ...(store.categories || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

/**
 * Public storefront rows for the `/stores` directory.
 *
 * This is the one page that lets a visitor (and a crawler) find a store by the
 * name they know: store pages themselves are reachable only if you already have
 * the handle or the link. The same visibility rules as the sitemap apply — no
 * banned stores, no stores left unpublished by a downgrade.
 *
 * `query` filters on business name, handle, tagline, location and categories,
 * and ignores the filler words a shopper types ("store", "shop", "online"), so
 * `/stores?q=cyd+store` is a real, shareable, crawlable URL that finds Cyd —
 * rather than a client-only filter that matches nothing.
 */
export async function getPublicStoresForDirectory(query = ""): Promise<DirectoryStore[]> {
  const supabase = publicClient();
  if (!supabase) return [];

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
      .filter((store) => storeMatchesQuery(store, query))
      .sort((a, b) => a.bizName.localeCompare(b.bizName));
  } catch {
    return [];
  }
}

export type SitemapStore = {
  handle: string;
  updatedAt: string | null;
  /** Used only to decide whether a verified custom domain is looked up. */
  id?: string;
  plan?: string;
};

/**
 * Every store that should appear in the sitemap: has a handle, is not banned,
 * and is not paused (`isLive === false`). Unpublished stores (extra stores left
 * over from a downgrade) are deliberately excluded.
 *
 * `plan` is included so the sitemap can add a Business merchant's verified
 * custom domain next to the platform URL — both resolve to the same storefront,
 * and a crawler that only ever sees the platform path would keep the ranking
 * away from the address the merchant actually advertises.
 */
export async function getLiveStoresForSitemap(): Promise<SitemapStore[]> {
  const supabase = publicClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("id, store_username, updated_at, state_json, account_status, plan")
      .not("store_username", "is", null);

    if (error || !data) return [];

    return data
      .filter((row: any) => row.account_status !== "banned")
      .filter((row: any) => (row.state_json?.isLive ?? true) !== false)
      .map((row: any) => ({
        id: String(row.id ?? ""),
        handle: normalizeStoreUsername(String(row.store_username)),
        plan: String(row.plan ?? "free"),
        updatedAt: (row.updated_at as string) ?? null,
      }))
      .filter((row) => Boolean(row.handle));
  } catch {
    return [];
  }
}
