import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import type { ShopState } from "@/lib/schema";
import { CustomerStorefrontPage } from "@/components/CustomerStorefrontPage";
import { normalizeStoreUsername } from "@/lib/utils";

// Server-side Supabase — read-only, uses public anon key
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith("http") || url.includes("dummy-project") || url.includes("your-project")) return null;
  try {
    new URL(url);
    return createClient(url, key);
  } catch {
    return null;
  }
}

async function getStoreData(shopId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase
      .from("stores")
      .select("state_json, biz_name, plan")
      .eq("id", shopId)
      .single();
    return data;
  } catch {
    return null;
  }
}

/** Returns a usable public URL, or null if it's a base64 data URL (unusable by crawlers) */
function resolveOgImage(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("data:")) return null; // base64 — crawlers can't load these
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; shopId: string }>;
}): Promise<Metadata> {
  const { storeSlug, shopId } = await params;
  const data = await getStoreData(shopId);
  const site = "https://swiftlinkpro.vercel.app";

  const state = data?.state_json as any;
  const bizName = state?.bizName || data?.biz_name || "SwiftLink Store";
  const seoTitle = state?.seoTitle || `${bizName} — Shop Now`;
  /*
   * This legacy `/<handle>/<id>` address is still reachable from old shared
   * links, so it must hold the same promise as the canonical `/<handle>` page:
   * a Business store never carries the platform's name. Without the `absolute`
   * title the root layout appends "| SwiftLink", and without the brand siteName
   * the social card advertises us instead of the merchant.
   */
  const whiteLabel = data?.plan === "business";
  const ogDescription =
    state?.ogDescription ||
    state?.tagline ||
    (whiteLabel
      ? `Shop ${bizName}. Fast WhatsApp ordering, live product catalog.`
      : `Shop ${bizName} on SwiftLink Pro. Fast WhatsApp ordering, live product catalog.`);

  // Prefer explicit ogImage → bizImage → heroImage → product image → site logo
  // Skip any base64 data URLs — crawlers cannot render them
  const ogImage =
    resolveOgImage(state?.ogImage) ||
    resolveOgImage(state?.bizImage) ||
    resolveOgImage(state?.heroImage) ||
    resolveOgImage(state?.products?.[0]?.image) ||
    `${site}/logo.png`;

  // Canonical address is the bare handle; `/s/<id>` never existed as a route,
  // so the old metadata advertised a 404 (docs/05-IMPROVEMENT-PLAN.md R-07).
  const handle = normalizeStoreUsername(String(state?.storeUsername || ""));
  const canonicalPath = handle ? `/${handle}` : `/${storeSlug}/${shopId}`;
  const url = `${site}${canonicalPath}`;

  return {
    title: whiteLabel ? { absolute: seoTitle } : seoTitle,
    description: ogDescription,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      title: seoTitle,
      description: ogDescription,
      url,
      siteName: whiteLabel ? bizName : "SwiftLink Pro",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: bizName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ storeSlug: string; shopId: string }>;
}) {
  const { shopId } = await params;
  const data = await getStoreData(shopId);
  const state = (data?.state_json ?? null) as Partial<ShopState> | null;

  // Same server-seeding as the canonical `/<handle>` route, so this legacy URL
  // renders crawlable content too instead of the client loading spinner.
  const initialState = state ? ({ ...state, id: shopId } as ShopState) : null;

  return (
    <CustomerStorefrontPage
      shopId={shopId}
      initialState={initialState}
      whiteLabel={data?.plan === "business"}
    />
  );
}
