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

/**
 * The social card the merchant uploaded in SEO settings, if it is one we can
 * actually fetch.
 *
 * Base64 uploads are real to a browser and meaningless to a crawler, and a bare
 * path has no origin to fetch, so both are rejected. The URL is never handed to
 * a crawler directly: `/<handle>/opengraph-image` streams the bytes from our own
 * origin instead, because Supabase Storage answers public objects with
 * `x-robots-tag: none` and Facebook/WhatsApp discard an image served that way.
 */
export function resolveMerchantOgImage(
  state: Partial<ShopState> | null | undefined,
): string | null {
  const value = String(state?.ogImage || "").trim();
  if (!value || value.startsWith("data:")) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  return value;
}

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

/**
 * The public origin for a store: its own verified domain, else `/<handle>`.
 *
 * A Business merchant who has pointed their domain at us must be indexed on
 * *that* URL — canonicalising their homepage to `swiftlink.app/<handle>` would
 * hand the ranking to a URL their customers never see, and split the two host
 * names across two pages of the same content.
 */
export function storeOrigin(handle: string, domain?: string | null): string {
  const host = String(domain || "")
    .trim()
    .toLowerCase();
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
    return `https://${host}`;
  }
  return `${SEO_SITE}/${handle}`;
}

/**
 * Title for a store page.
 *
 * It contains the merchant's name and the word "store" because that is what a
 * shopper actually types: looking for Cyd, they search "cyd store". The old
 * default — "Cyd — Shop Online" — gave a search engine no "store" token on the
 * page that owns the name.
 */
export function storeTitle(bizName: string, tagline?: string | null): string {
  const name = String(bizName || "SwiftLink Store").trim();
  const trimmedTagline = String(tagline || "").trim();
  // A merchant's own tagline is more useful than the generic suffix, and long
  // ones get truncated in a result anyway.
  if (trimmedTagline && trimmedTagline.length <= 45) return `${name} — ${trimmedTagline} | Online Store`;
  return `${name} — Online Store`;
}

/**
 * Search terms a store should be findable by, derived from its own state.
 *
 * Built from what the merchant named rather than a fixed list, so "cyd store",
 * "cyd shop", "@cyd-store" and "sneakers Lagos" all describe the same page.
 */
export function storeKeywords(
  state: Partial<ShopState>,
  handle: string,
): string[] {
  const name = String(state.bizName || "").trim();
  const location = String(state.location || "").trim();
  const categories = (state.categories || []).map(String).slice(0, 10);
  const terms = [
    name,
    `${name} store`,
    `${name} online store`,
    `${name} shop`,
    `shop ${name}`,
    `buy from ${name}`,
    handle,
    `@${handle}`,
    location ? `${name} ${location}` : "",
    location ? `${name} store ${location}` : "",
    ...categories,
    ...categories.map((category) => (location ? `${category} ${location}` : "")),
  ];

  return Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)));
}

/** Public product rows only — hidden/downgraded items must not be advertised. */
export function visibleProducts(products: Product[] | undefined): Product[] {
  return (products || []).filter((p) => p && p.visible !== false);
}

function offerNode(product: Product, currency: string, brand?: string, url?: string) {
  const amount = Number(product.price) || 0;
  /*
   * A quote-priced service has no amount to publish: a `price: 0` offer would
   * put a false "0" in a rich result for a service the merchant quotes by hand.
   * The card tells the shopper to ask for a price, and so does the markup.
   */
  const isQuote = product.priceType === "quote";
  return {
    "@type": "Offer",
    ...(isQuote ? {} : { price: amount, priceCurrency: currency || "NGN" }),
    availability: product.outOfStock
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock",
    url,
    itemOffered: {
      "@type": "Product",
      name: product.name,
      description: (product.description || "").slice(0, 300) || undefined,
      image: product.image && !product.image.startsWith("data:") ? product.image : undefined,
      category: product.category || undefined,
      brand: brand ? { "@type": "Brand", name: brand } : undefined,
    },
  };
}

export type StoreSeoSchemaInput = {
  handle: string;
  state: Partial<ShopState>;
  description: string;
  /**
   * False for a Business storefront: the platform must not appear in the
   * merchant's breadcrumb, because that is the shop's own structured data. The
   * marketing pages still describe the platform; a store page should not.
   */
  includePlatformInBreadcrumb?: boolean;
  /**
   * The store's public origin — its verified custom domain for a Business
   * merchant, otherwise `/<handle>` (see `storeOrigin`). Every absolute URL in
   * the graph follows it so the markup matches the canonical the page emits.
   */
  origin?: string;
};

/**
 * `Store` + `ItemList` graph for a single storefront.
 *
 * `Store` (rather than a generic `Organization`) is the type whose rich results
 * Google actually shows for a shop: name, logo, address, and the offer catalog.
 */
export function buildStoreJsonLd({
  handle,
  state,
  description,
  includePlatformInBreadcrumb = true,
  origin,
}: StoreSeoSchemaInput) {
  const url = origin || `${SEO_SITE}/${handle}`;
  const products = visibleProducts(state.products);
  const sameAs = Object.entries(state.socials || {})
    .filter(([key, value]) => Boolean(value) && Boolean(SOCIAL_HOST_LABELS[key]))
    .map(([, value]) => String(value))
    .filter((value) => value.startsWith("http"));

  const bizName = state.bizName || "SwiftLink Store";
  const postedPrices = products
    .filter((product) => product.priceType !== "quote")
    .map((product) => Number(product.price) || 0)
    .filter((amount) => amount > 0);

  const store: Record<string, unknown> = {
    "@type": "Store",
    "@id": `${url}#store`,
    name: bizName,
    url,
    description: description.slice(0, 400),
    image: absoluteImage(state.bizImage || state.heroImage),
    logo: absoluteImage(state.bizImage),
    currenciesAccepted: state.currency || "NGN",
    paymentAccepted: state.orderMethod === "whatsapp" ? "Cash, Mobile Money" : "Card, Cash",
    /*
     * Names the same shop can also be found by: its handle (`@cyd-store`) and
     * the plain "<name> store" / "<name> shop" a shopper types. Both are
     * strings the merchant already publishes, and a name that already contains
     * the word is not doubled up (an "Ada Threads Store store").
     */
    alternateName: alternateNames(bizName, handle),
  };

  // The catalogue's actual span tells a crawler this is a real, priced shop.
  if (postedPrices.length) {
    const currency = state.currency || "NGN";
    const min = Math.min(...postedPrices);
    const max = Math.max(...postedPrices);
    store.priceRange =
      min === max
        ? `${currency}${min.toLocaleString()}`
        : `${currency}${min.toLocaleString()}–${currency}${max.toLocaleString()}`;
  }

  if (state.location) {
    store.areaServed = { "@type": "Place", name: String(state.location) };
  }

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
  if (products.length) {
    store.hasOfferCatalog = offerCatalog(products, state.currency || "NGN", bizName, url);
  }

  /*
   * How the shop takes an order. A shopper searching the shop's name is most of
   * the way to buying, so the action points at the same channel the storefront
   * uses (WhatsApp for most stores) rather than at a generic contact page.
   */
  const whatsappDigits = String(state.phone || "").replace(/\D/g, "");
  if (whatsappDigits && state.orderMethod !== "paystack") {
    store.potentialAction = {
      "@type": "OrderAction",
      deliveryMethod: "https://schema.org/ParcelService",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://wa.me/${whatsappDigits}`,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
    };
  }

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
          offers: offerNode(p, state.currency || "NGN", bizName, `${url}?product=${encodeURIComponent(p.name)}`),
        },
      })),
    });
  }

  /*
   * Two crumbs for a platform storefront (home → store), one for a white-label
   * one. A single-crumb BreadcrumbList is valid, and it is the honest shape:
   * nothing above the merchant's own home page belongs to a Business site.
   */
  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: includePlatformInBreadcrumb
      ? [
          { "@type": "ListItem", position: 1, name: "SwiftLink Pro", item: SEO_SITE },
          { "@type": "ListItem", position: 2, name: state.bizName || "Store", item: url },
        ]
      : [{ "@type": "ListItem", position: 1, name: state.bizName || "Store", item: url }],
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

/** The names one shop answers to, without duplicating a word it already has. */
function alternateNames(bizName: string, handle: string): string[] {
  const names = new Set<string>([handle, `@${handle}`]);
  if (!/\bstore\b/i.test(bizName)) names.add(`${bizName} store`);
  if (!/\bshop\b/i.test(bizName)) names.add(`${bizName} shop`);
  return Array.from(names);
}

function offerCatalog(products: Product[], currency: string, brand?: string, url?: string) {
  return {
    "@type": "OfferCatalog",
    name: "Products",
    itemListElement: products
      .slice(0, 100)
      .map((product) => offerNode(product, currency, brand, url ? `${url}?product=${encodeURIComponent(product.name)}` : undefined)),
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
