import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ShopState } from "@/lib/schema";
import { CustomerStorefrontPage } from "@/components/CustomerStorefrontPage";
import { getPublicStoreByHandle } from "@/lib/store-lookup";
import { buildStoreJsonLd, SEO_SITE } from "@/lib/seo";

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

/**
 * One origin for every absolute URL this route emits: `og:url`, `og:image`,
 * the canonical link, and the JSON-LD graph. It must be the same value the OG
 * image route prints on the card, so both read `SEO_SITE`.
 */
const site = SEO_SITE;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await getPublicStoreByHandle(storeSlug);

  if (!store) {
    return {
      metadataBase: new URL(site),
      title: "Store not found",
      robots: { index: false, follow: false },
    };
  }

  const state = store.state || {};
  const bizName = store.bizName || state.bizName || "SwiftLink Store";
  const productCount = (state.products || []).filter((p) => p?.visible !== false).length;
  const title = state.seoTitle || `${bizName} — Shop Online`;
  const description =
    state.ogDescription ||
    state.tagline ||
    `Shop ${bizName} online on SwiftLink Pro${
      productCount ? ` — ${productCount} products` : ""
    }${state.location ? ` in ${state.location}` : ""}. Browse the catalog and place your order on WhatsApp.`;

  /*
   * A store page has always been indexable in principle, but the HTML it shipped
   * was a loading spinner: the storefront fetched its own row in the browser.
   * The title/description here described a page whose body a crawler could not
   * read. `StoreByHandlePage` now seeds the storefront with the server row, so
   * this metadata and the body finally describe the same thing.
   */
  const keywords = [
    bizName,
    `${bizName} store`,
    `buy from ${bizName}`,
    `${bizName} ${state.location || ""}`.trim(),
    ...(state.categories || []).slice(0, 10),
  ].filter(Boolean) as string[];

  // Dynamic 1200x630 social card rendered natively by Next.js — no Supabase headers, no robot blocking.
  // The `v` param is the store's last-write epoch: each save invalidates the cached preview automatically.
  const dynamicOgImage = `${site}/${store.handle}/opengraph-image?v=${store.updatedAt}`;

  // Always use the native dynamic OG image so WhatsApp/Facebook/Twitter crawlers can fetch it.
  // Supabase Storage sends `x-robots-tag: none` which causes those crawlers to discard the image.
  // We ignore any candidate from supabase.co entirely and always use our own hosted image.
  const ogImage = dynamicOgImage;

  const url = `${site}/${store.handle}`;

  return {
    metadataBase: new URL(site),
    title,
    description,
    keywords,
    alternates: { canonical: `/${store.handle}` },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "SwiftLink Pro",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: bizName,
        },
      ],
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

  // Seed the (client) storefront with the row we just read, so its content is in
  // the server HTML rather than arriving after a browser-side fetch.
  const initialState = { ...store.state, id: store.id } as ShopState;
  const jsonLd = buildStoreJsonLd({
    handle: store.handle,
    state: store.state,
    description:
      store.state.ogDescription ||
      store.state.tagline ||
      `Shop ${store.bizName} online on SwiftLink Pro. WhatsApp ordering and live catalog.`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        // The graph is built from store state, never from user HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Visible breadcrumb: also what the JSON-LD BreadcrumbList mirrors. */}
      <nav aria-label="Breadcrumb" className="sr-only">
        <a href={SEO_SITE}>SwiftLink Pro</a>
        <span aria-hidden="true">{" / "}</span>
        <a href={`/${store.handle}`}>{store.bizName}</a>
      </nav>
      <CustomerStorefrontPage shopId={store.id} initialState={initialState} />
    </>
  );
}
