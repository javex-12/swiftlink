import { permanentRedirect } from "next/navigation";
import { getStoreHandleById } from "@/lib/store-lookup";
import { normalizeStoreUsername } from "@/lib/utils";

/**
 * Legacy storefront URL → canonical.
 *
 * `/store/<handle>?shop=<id>` was the shared URL before the canonical `/<handle>`
 * shape landed. It is 308-redirected here rather than served, so search engines
 * consolidate on one address per store (docs/05-IMPROVEMENT-PLAN.md R-07).
 *
 * When the legacy link carries `?shop=<id>` we resolve the store's *current*
 * handle from the id — that is what makes an old link survive a handle rename,
 * which the bare slug could not.
 */
export default async function LegacyStoreRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ shop?: string }>;
}) {
  const { slug } = await params;
  const { shop } = await searchParams;

  if (shop) {
    const handle = await getStoreHandleById(shop);
    if (handle) permanentRedirect(`/${handle}`);
  }

  const handle = normalizeStoreUsername(slug);
  permanentRedirect(handle ? `/${handle}` : "/");
}
