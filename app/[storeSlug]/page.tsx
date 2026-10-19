import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { ShopState } from "@/lib/schema";
import { CustomerStorefrontPage } from "@/components/CustomerStorefrontPage";
import { getPublicStoreByHandle } from "@/lib/store-lookup";
import { viewerOwnsStore } from "@/lib/store-ownership";
import {
  buildStoreJsonLd,
  resolveMerchantOgImage,
  SEO_SITE,
  storeKeywords,
  storeOrigin,
  storeTitle,
} from "@/lib/seo";
import { getVerifiedDomainForStore } from "@/lib/domains-server";

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

/**
 * The signed-in viewer's account id, or null for a visitor.
 *
 * The storefront has to know when its owner is browsing (they must not be shown
 * the customer review form), and a store's `owner_id` is never public. Deciding
 * it here means the very first paint is already correct, rather than briefly
 * offering the merchant a form to review their own shop while the browser sorts
 * out which stores it owns. Cookies are read-only in a Server Component, so the
 * session refresh stays in `middleware.ts`.
 */
async function currentViewerId(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

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
  /*
   * A merchant who has written their own SEO title keeps it verbatim. The
   * default names the shop and says it is a store, because "<name> store" is
   * the query a shopper types and the page has to own it.
   */
  const title = state.seoTitle || storeTitle(bizName, state.tagline);

  /*
   * A verified custom domain is the canonical URL for a Business store: it is
   * the address the merchant hands out, so indexing that instead of the
   * platform path name keeps one page and one address per shop.
   */
  const customDomain = store.plan === "business" ? await getVerifiedDomainForStore(store.id) : null;
  const storeUrl = storeOrigin(store.handle, customDomain);

  /*
   * A Business store opts the platform out of every piece of metadata: title
   * suffix, `siteName`, the fallback description, and the breadcrumb. The fallback
   * matters most — it is what a merchant sees when they have not written their
   * own, and it used to advertise "on SwiftLink Pro" on their site.
   */
  const whiteLabel = store.plan === "business";

  const description =
    state.ogDescription ||
    state.tagline ||
    `Browse ${bizName}'s online store${whiteLabel ? "" : " on SwiftLink Pro"}${
      productCount ? ` — ${productCount} products` : ""
    }${state.location ? ` in ${state.location}` : ""}. Order on WhatsApp from @${store.handle}.`;

  /*
   * A store page has always been indexable in principle, but the HTML it shipped
   * was a loading spinner: the storefront fetched its own row in the browser.
   * The title/description here described a page whose body a crawler could not
   * read. `StoreByHandlePage` now seeds the storefront with the server row, so
   * this metadata and the body finally describe the same thing.
   */
  // Derived from the store's own state (`lib/seo.ts`): name, "<name> store",
  // "<name> shop", the handle, categories, and each of those with the city.
  const keywords = storeKeywords({ ...state, bizName }, store.handle);

  // One URL for every crawler, rendered natively by Next.js — no Supabase
  // headers, no robot blocking. The route serves the merchant's own uploaded
  // social image when they set one in SEO settings, and the generated 1200x630
  // card otherwise. The `v` param is the store's last write, so each save
  // invalidates the cached preview automatically.
  /*
   * The OG card route lives on the platform origin even for a custom domain:
   * it is our own renderer reading the store row, and pointing at a hostname
   * whose DNS may still be propagating would break every share preview.
   */
  const dynamicOgImage = `${site}/${store.handle}/opengraph-image?v=${store.updatedAt}`;
  const ogImage = dynamicOgImage;
  const merchantOgImage = resolveMerchantOgImage(state);

  const url = storeUrl;

  return {
    metadataBase: new URL(customDomain ? `https://${customDomain}` : site),
    // Browser/OS metadata ("Add to Home Screen", reader mode) names the shop,
    // not us, on a white-label store.
    applicationName: whiteLabel ? bizName : "SwiftLink",
    authors: [{ name: whiteLabel ? bizName : "SwiftLink" }],
    creator: whiteLabel ? bizName : "SwiftLink",
    publisher: whiteLabel ? bizName : "SwiftLink",
    /*
     * The root layout appends "| SwiftLink" to page titles. A Business storefront
     * opts out with `absolute`: the merchant's own site should not advertise the
     * platform in its tab, and its social card should name the brand, not us.
     */
    title: whiteLabel ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: customDomain ? `https://${customDomain}` : `/${store.handle}` },
    /*
     * Explicit rather than inherited: a large image preview and an uncapped
     * snippet are what make a store result look like a shop in search, and a
     * store page is indexable by design (unknown handles 404 in middleware, so
     * there is no soft-404 to guard against here).
     */
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: whiteLabel ? bizName : "SwiftLink Pro",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          // The generated card is exactly 1200x630. An uploaded image is whatever
          // size the merchant chose, and declaring 1200x630 for it makes a
          // crawler reserve the wrong box, so those two are omitted when the
          // route is serving their upload.
          ...(merchantOgImage ? {} : { width: 1200, height: 630 }),
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

  // Server truth for "is this the merchant looking at their own shop?". The
  // storefront gets a boolean, never the id it was derived from.
  const viewerId = await currentViewerId();
  const viewerIsOwner = viewerOwnsStore(store.id, viewerId, [store.ownerId]);

  // Same origin `generateMetadata` canonicalises to, so the graph and the
  // canonical link cannot point at different URLs for one store.
  const customDomain = store.plan === "business" ? await getVerifiedDomainForStore(store.id) : null;
  const storeUrl = storeOrigin(store.handle, customDomain);

  // Seed the (client) storefront with the row we just read, so its content is in
  // the server HTML rather than arriving after a browser-side fetch.
  const initialState = { ...store.state, id: store.id } as ShopState;
  const jsonLd = buildStoreJsonLd({
    handle: store.handle,
    state: store.state,
    includePlatformInBreadcrumb: store.plan !== "business",
    origin: storeUrl,
    description:
      store.state.ogDescription ||
      store.state.tagline ||
      `Browse ${store.bizName}'s online store. WhatsApp ordering and a live catalog.`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        // The graph is built from store state, never from user HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/*
        Visible breadcrumb: also what the JSON-LD BreadcrumbList mirrors, so the
        two must agree — a Business store has one crumb, its own name, because
        there is nothing above the merchant's home page on their own site.
      */}
      <nav aria-label="Breadcrumb" className="sr-only">
        {store.plan !== "business" && (
          <>
            <a href={SEO_SITE}>SwiftLink Pro</a>
            <span aria-hidden="true">{" / "}</span>
          </>
        )}
        <a href={`/${store.handle}`}>{store.bizName}</a>
      </nav>
      <CustomerStorefrontPage
        shopId={store.id}
        initialState={initialState}
        viewerIsOwner={viewerIsOwner}
        whiteLabel={store.plan === "business"}
      />
    </>
  );
}
