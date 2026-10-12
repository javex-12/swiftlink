import type { Product, ShopState } from "./schema";

/**
 * Structured data for the storefront.
 *
 * The storefront used to ship no JSON-LD at all, so a search result for a store
 * name had nothing to build a rich card from — no price, no availability, no
 * address. Building the graph from the same state the page renders (rather than
 * from a hand-maintained map) keeps the markup and the page from drifting.
 *
 * Everything here is derived only from public store fields and is safe to embed
 * in a `<script type="application/ld+json">`.
 */

export const SEO_SITE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://swiftlinkpro.vercel.app");

const SOCIAL_HOST_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X",
  facebook: "Facebook",
  youtube: "YouTube",
};

function absoluteImage(url: string | undefined, fallback = `${SEO_SITE}/logo.png`): string {
  const value = String(url || "").trim();
  // Base64 uploads are real to a browser and useless to a crawler.
  if (!value || value.startsWith("data:")) return fallback;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SEO_SITE}${value}`;
  return fallback;
}

/** Public product rows only — hidden/downgraded items must not be advertised. */
export function visibleProducts(products: Product[] | undefined): Product[] {
  return (products || []).filter((p) => p && p.visible !== false);
}

function offerNode(product: Product, currency: string) {
  return {
    "@type": "Offer",
    price: Number(product.price) || 0,
    priceCurrency: currency || "NGN",
    availability: product.outOfStock
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock",
    itemOffered: {
      "@type": "Product",
      name: product.name,
      description: (product.description || "").slice(0, 300) || undefined,
      image: product.image && !product.image.startsWith("data:") ? product.image : undefined,
      category: product.category || undefined,
    },
  };
}

export type StoreSeoSchemaInput = {
  handle: string;
  state: Partial<ShopState>;
  description: string;
};

/**
 * `Store` + `ItemList` graph for a single storefront.
 *
 * `Store` (rather than a generic `Organization`) is the type whose rich results
 * Google actually shows for a shop: name, logo, address, and the offer catalog.
 */
export function buildStoreJsonLd({ handle, state, description }: StoreSeoSchemaInput) {
  const url = `${SEO_SITE}/${handle}`;
  const products = visibleProducts(state.products);
  const sameAs = Object.entries(state.socials || {})
    .filter(([key, value]) => Boolean(value) && Boolean(SOCIAL_HOST_LABELS[key]))
    .map(([, value]) => String(value))
    .filter((value) => value.startsWith("http"));

  const store: Record<string, unknown> = {
    "@type": "Store",
    "@id": `${url}#store`,
    name: state.bizName || "SwiftLink Store",
    url,
    description: description.slice(0, 400),
    image: absoluteImage(state.bizImage || state.heroImage),
    logo: absoluteImage(state.bizImage),
    currenciesAccepted: state.currency || "NGN",
    paymentAccepted: state.orderMethod === "whatsapp" ? "Cash, Mobile Money" : "Card, Cash",
  };

  if (state.phone) store.telephone = String(state.phone);
  if (state.contactEmail) store.email = String(state.contactEmail);
  if (state.location || state.contactAddress) {
    store.address = {
      "@type": "PostalAddress",
      streetAddress: state.contactAddress || undefined,
      addressLocality: state.location || undefined,
      addressCountry: "NG",
    };
  }
  if (sameAs.length) store.sameAs = sameAs;
  if (state.tagline) store.slogan = String(state.tagline);
  if (products.length) store.hasOfferCatalog = offerCatalog(products, state.currency || "NGN");

  const graph: Record<string, unknown>[] = [store];

  // An ItemList gives a crawler the catalogue in order without needing to follow
  // the client-rendered product overlay.
  if (products.length) {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#catalog`,
      name: `${state.bizName || "Store"} catalog`,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 100).map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: `${url}?product=${encodeURIComponent(p.name)}`,
          image: p.image && !p.image.startsWith("data:") ? p.image : undefined,
          description: (p.description || "").slice(0, 200) || undefined,
          offers: offerNode(p, state.currency || "NGN"),
        },
      })),
    });
  }

  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SwiftLink Pro", item: SEO_SITE },
      { "@type": "ListItem", position: 2, name: state.bizName || "Store", item: url },
    ],
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

function offerCatalog(products: Product[], currency: string) {
  return {
    "@type": "OfferCatalog",
    name: "Products",
    itemListElement: products.slice(0, 100).map((product) => offerNode(product, currency)),
  };
}

/** Site-wide `WebSite` + `Organization` node, including the sitelinks search box. */
export function buildSiteJsonLd(siteName: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SEO_SITE}/#website`,
        url: SEO_SITE,
        name: siteName,
        description,
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SEO_SITE}/stores?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SEO_SITE}/#organization`,
        name: siteName,
        url: SEO_SITE,
        logo: `${SEO_SITE}/logo.png`,
        description:
          "SwiftLink Pro lets businesses launch a fast, mobile-first online store and take orders straight to WhatsApp.",
        foundingLocation: { "@type": "Place", name: "Nigeria" },
        areaServed: "Worldwide",
      },
    ],
  };
}

/** Search-page structured data so the directory itself is eligible for a result. */
export function buildStoreDirectoryJsonLd(
  stores: { handle: string; bizName: string; description?: string; image?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse stores on SwiftLink Pro",
    url: `${SEO_SITE}/stores`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: stores.length,
      itemListElement: stores.slice(0, 200).map((store, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SEO_SITE}/${store.handle}`,
        name: store.bizName,
        description: store.description,
        image: absoluteImage(store.image),
      })),
    },
  };
}
