import type { Metadata } from "next";
import Link from "next/link";
import { getPublicStoresForDirectory } from "@/lib/store-lookup";
import { buildStoreDirectoryJsonLd, SEO_SITE } from "@/lib/seo";

/**
 * Public store directory at `/stores`.
 *
 * Why this page exists: a storefront is only reachable at `/<handle>`, so a
 * shopper who knows a store's *name* — "Cyd Store" — has no way to find it, and
 * neither does a search engine. This page lists every public store and supports
 * a real, server-rendered name search (`/stores?q=cyd`), which is the link the
 * `SearchAction` in the site JSON-LD points at.
 */
export const revalidate = 300;

const site = SEO_SITE;

type Search = { q?: string | string[] };

function readQuery(search: Search): string {
  const raw = search?.q;
  return (Array.isArray(raw) ? raw[0] : raw) || "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const search = await searchParams;
  const q = readQuery(search).trim();
  const title = q ? `Stores matching “${q}”` : "Browse stores — shop online on SwiftLink Pro";
  const description = q
    ? `SwiftLink Pro stores matching “${q}”. Open a storefront and order directly on WhatsApp.`
    : "Browse online stores built with SwiftLink Pro. Find a shop by name and open its WhatsApp-ready storefront.";

  return {
    title,
    description,
    keywords: ["find a store", "online stores", "WhatsApp store directory", "SwiftLink stores"],
    alternates: { canonical: "/stores" },
    openGraph: {
      type: "website",
      url: `${site}/stores`,
      title,
      description,
      siteName: "SwiftLink Pro",
      images: [{ url: "/logo.png", width: 512, height: 512, alt: "SwiftLink Pro" }],
    },
    // A filtered search result page should not compete with the directory itself
    // in the index; the canonical above already points at the bare page.
    robots: q ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function StoresDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const q = readQuery(search).trim();
  const stores = await getPublicStoresForDirectory(q);
  const jsonLd = buildStoreDirectoryJsonLd(
    stores.map((s) => ({
      handle: s.handle,
      bizName: s.bizName,
      description: s.tagline || s.description,
      image: s.image || undefined,
    })),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500">
          SwiftLink Pro
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Find a store
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Every store below is a real shopfront built with SwiftLink Pro. Search by the store
          name, then open the store and order straight from your phone.
        </p>

        {/* A plain GET form: the search result is a URL crawlers and shoppers can both use. */}
        <form action="/stores" method="get" role="search" className="mt-6 flex max-w-xl gap-2">
          <label htmlFor="store-search" className="sr-only">
            Search stores by name
          </label>
          <input
            id="store-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search stores by name…"
            className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-emerald-500 px-5 text-sm font-bold text-[#04140D] transition hover:bg-emerald-400"
          >
            Search
          </button>
        </form>
      </header>

      <p className="mb-4 text-xs text-slate-500" aria-live="polite">
        {stores.length} {stores.length === 1 ? "store" : "stores"}
        {q ? ` matching “${q}”` : ""}
      </p>

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm text-slate-300">No stores matched that name.</p>
          <Link href="/stores" className="mt-3 inline-block text-sm font-semibold text-emerald-400 hover:underline">
            Show all stores
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <li key={store.handle}>
              <Link
                href={`/${store.handle}`}
                className="flex h-full gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-500/50 hover:bg-white/10"
              >
                {store.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.image}
                    alt=""
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-lg font-black text-emerald-400">
                    {store.bizName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-white">{store.bizName}</h2>
                  {store.tagline && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{store.tagline}</p>
                  )}
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500">
                    /{store.handle}
                    {store.location ? ` · ${store.location}` : ""}
                    {store.productCount ? ` · ${store.productCount} products` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
