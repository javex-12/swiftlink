/**
 * Custom-domain reads, server side.
 *
 * `store_domains` is owner-scoped under RLS and a storefront is served to
 * anonymous visitors, so metadata can only learn a shop's hostname with the
 * service-role key. What it reads is public by nature — a verified hostname is
 * how the merchant's own customers already reach the store — and it exposes a
 * hostname only for rows that have passed DNS verification.
 *
 * The single-store lookup is deliberately not cached: it runs once per
 * storefront render, next to a Supabase read that already happens.
 */

import { serviceClient } from "./billing-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type VerifiedDomain = { storeId: string; domain: string };

/** Every verified hostname, newest first per store, as a `storeId → domain` map. */
export async function getVerifiedDomainsByStore(): Promise<Map<string, string>> {
  const supabase: SupabaseClient | null = serviceClient();
  if (!supabase) return new Map();

  try {
    const { data, error } = await supabase
      .from("store_domains")
      .select("store_id, domain, created_at")
      .not("verified_at", "is", null)
      .order("created_at", { ascending: true });

    if (error || !data) return new Map();

    const map = new Map<string, string>();
    for (const row of data as Array<{ store_id: string; domain: string }>) {
      // Ascending order means the first (oldest) domain for a store wins, which
      // is the one the merchant set up first and keeps in their marketing.
      if (row.store_id && row.domain && !map.has(row.store_id)) {
        map.set(row.store_id, String(row.domain).toLowerCase());
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * The verified hostname for one store, or null.
 *
 * Returns null rather than throwing for every failure — a storefront must render
 * even when the domain table is unreachable or the key is missing; it simply
 * canonicalises to `/<handle>`.
 */
export async function getVerifiedDomainForStore(storeId: string): Promise<string | null> {
  if (!storeId) return null;
  const supabase = serviceClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("store_domains")
      .select("domain")
      .eq("store_id", storeId)
      .not("verified_at", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data?.domain) return null;
    return String(data.domain).toLowerCase();
  } catch {
    return null;
  }
}
