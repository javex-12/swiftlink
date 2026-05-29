import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { CustomerStorefrontPage } from "@/components/CustomerStorefrontPage";

// Server-side Supabase — read-only, uses public anon key
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getStoreData(shopId: string) {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("stores")
      .select("state_json, biz_name")
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
  const { shopId } = await params;
  const data = await getStoreData(shopId);
  const site = "https://swiftlinkpro.vercel.app";

  const state = data?.state_json as any;
  const bizName = state?.bizName || data?.biz_name || "SwiftLink Store";
  const seoTitle = state?.seoTitle || `${bizName} — Shop Now`;
  const ogDescription =
    state?.ogDescription ||
    state?.tagline ||
    `Shop ${bizName} on SwiftLink Pro. Fast WhatsApp ordering, live product catalog.`;

  // Prefer explicit ogImage → bizImage → heroImage → product image → site logo
  // Skip any base64 data URLs — crawlers cannot render them
  const ogImage =
    resolveOgImage(state?.ogImage) ||
    resolveOgImage(state?.bizImage) ||
    resolveOgImage(state?.heroImage) ||
    resolveOgImage(state?.products?.[0]?.image) ||
    `${site}/logo.png`;

  const url = `${site}/s/${shopId}`;

  return {
    title: seoTitle,
    description: ogDescription,
    openGraph: {
      type: "website",
      title: seoTitle,
      description: ogDescription,
      url,
      siteName: "SwiftLink Pro",
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
  return <CustomerStorefrontPage shopId={shopId} />;
}
