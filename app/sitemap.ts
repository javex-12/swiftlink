import type { MetadataRoute } from "next";
import { getLiveStoresForSitemap } from "@/lib/store-lookup";
import { SEO_SITE } from "@/lib/seo";

const site = SEO_SITE;

/** Storefronts change on save; the sitemap does not need to be live. */
export const revalidate = 3600;

/**
 * The sitemap now lists the public storefronts as well as the marketing pages.
 *
 * Only stores that are published and not banned are included: extra stores left
 * unpublished by a downgrade, and paused stores, must not be advertised to
 * search engines (`lib/store-lookup.ts`). Each entry uses the canonical
 * `/<handle>` URL, matching the `alternates.canonical` the storefront emits.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const stores = await getLiveStoresForSitemap();

  return [
    {
      url: site,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The directory is how a shopper or a crawler finds a store by name; it
      // has to be in the sitemap for that to mean anything.
      url: `${site}/stores`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${site}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...stores.map((store) => ({
      url: `${site}/${store.handle}`,
      lastModified: store.updatedAt ? new Date(store.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
