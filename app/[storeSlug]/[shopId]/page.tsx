import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { CustomerStorefrontPage } from "@/components/CustomerStorefrontPage";

// Server-side Supabase for metadata (read-only, public data)
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; shopId: string }>;
}): Promise<Metadata> {
  const { shopId } = await params;
  const data = await getStoreData(shopId);

  const state = data?.state_json as any;
  const bizName = state?.bizName || data?.biz_name || "SwiftLink Store";
  const seoTitle = state?.seoTitle || `${bizName} — Shop Now`;
  const ogDescription =
    state?.ogDescription ||
    state?.tagline ||
    `Shop ${bizName} on SwiftLink Pro. Fast WhatsApp ordering, live product catalog.`;
  const ogImage = state?.ogImage || state?.bizImage || "/logo.png";

  const url = `https://swiftlinkpro.vercel.app/s/${shopId}`;

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
