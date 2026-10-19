import type { MetadataRoute } from "next";
import { getLiveStoresForSitemap } from "@/lib/store-lookup";
import { getVerifiedDomainsByStore } from "@/lib/domains-server";
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
 * `/<handle>` URL, matching the `alternates.canonical` the storefront emits —
 * which for a Business merchant on their own domain is that domain, so it is
 * listed too.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const stores = await getLiveStoresForSitemap();
  const domains = await getVerifiedDomainsByStore();

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
    ...stores.flatMap((store) => {
      const lastModified = store.updatedAt ? new Date(store.updatedAt) : now;
      const entries: MetadataRoute.Sitemap = [
        {
          url: `${site}/${store.handle}`,
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ];

      /*
       * The merchant's own hostname, for a Business store that finished DNS
       * verification. Listed *after* the platform URL, and only when it resolves
       * to the same storefront (`resolve_store_domain` filters unverified rows).
       */
      const domain = store.plan === "business" && store.id ? domains.get(store.id) : undefined;
      if (domain) {
        entries.push({
          url: `https://${domain}`,
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        });
      }

      return entries;
    }),
  ];
}
