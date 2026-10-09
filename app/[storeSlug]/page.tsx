import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerStorefrontPage } from "@/components/CustomerStorefrontPage";
import { getPublicStoreByHandle } from "@/lib/store-lookup";

/**
 * Canonical storefront: `/<handle>`.
 *
 * This is the URL a merchant shares and the one crawlers index, which is why
 * the SEO work is possible at all: the store identity is in the *path*, so
 * `generateMetadata` (and an OG image) can read it. The previous shared URL put
 * the store id in `?shop=`, which metadata routes cannot see
 * (docs/05-IMPROVEMENT-PLAN.md R-07).
 *
 * The route lives at `[storeSlug]` rather than `[handle]` because Next.js
 * forbids two different dynamic segment names at the same level — the legacy
 * two-segment `/<handle>/<shopId>` page already owns `[storeSlug]`.
 *
 * Rendered per request: a storefront changes whenever the merchant saves.
 * (Unknown handles are rejected earlier, in `middleware.ts`, so they get a real
 * 404 status instead of a streamed soft-404.)
 */
export const dynamic = "force-dynamic";

const site = "https://swiftlinkpro.vercel.app";

/** Crawlers cannot load base64 data URLs, so they must never be the OG image. */
function resolveOgImage(url?: string): string | null {
  if (!url || url.startsWith("data:")) return null;
  return url.startsWith("http://") || url.startsWith("https://") ? url : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await getPublicStoreByHandle(storeSlug);

  if (!store) {
    return { title: "Store not found", robots: { index: false, follow: false } };
  }

  const state = store.state;
  const bizName = store.bizName;
  const title = state.seoTitle || `${bizName} — Shop Now`;
  const description =
    state.ogDescription ||
    state.tagline ||
    `Shop ${bizName} on SwiftLink Pro. Fast WhatsApp ordering, live product catalog.`;

  // Prefer explicit ogImage → brand image → hero → first product → site logo.
  const ogImage =
    resolveOgImage(state.ogImage) ||
    resolveOgImage(state.bizImage) ||
    resolveOgImage(state.heroImage) ||
    resolveOgImage(state.products?.[0]?.image) ||
    `${site}/logo.png`;

  const url = `${site}/${store.handle}`;

  return {
    title,
    description,
    alternates: { canonical: `/${store.handle}` },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "SwiftLink Pro",
      images: [{ url: ogImage, width: 1200, height: 630, alt: bizName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function StoreByHandlePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await getPublicStoreByHandle(storeSlug);

  if (!store) notFound();

  return <CustomerStorefrontPage shopId={store.id} />;
}
