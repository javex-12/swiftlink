"use client";

import type { Product, ShopState } from "@/lib/schema";
import { websiteTemplateById, type WebsiteTemplate } from "@/lib/theme/templates";
import { cn } from "@/lib/utils";

/**
 * The three website templates as complete storefronts.
 *
 * Editorial, Boutique and Bold each own the whole home page: navigation, hero,
 * catalog, story and footer. They read the tenant tokens already applied on
 * `[data-theme-scope="storefront"]`, so light and dark stay the contrast-checked
 * theme from `lib/theme/templates.ts`. Cart, search and reviews stay the
 * storefront's existing screens — this component is the shop the customer lands on.
 */

export type TemplateSiteProps = {
  state: ShopState;
  products: Product[];
  categories: string[];
  activeCategory: string;
  cartCount: number;
  onCategory: (category: string) => void;
  onProduct: (product: Product) => void;
  onSearch: () => void;
  onCart: () => void;
  onReviews: () => void;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t-accent)]";

function formatPrice(currency: string, price: number) {
  return `${currency}${Number(price).toLocaleString()}`;
}

function shopNow() {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("catalog")?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

function ProductMedia({ product, className }: { product: Product; className?: string }) {
  const src = product.image || product.images?.[0];
  if (!src) {
    return (
      <div
        className={cn("h-full w-full bg-t-surface-alt", className)}
        style={{
          background:
            "linear-gradient(160deg, var(--t-accent-subtle), var(--t-surface-alt) 60%, var(--t-surface))",
        }}
        aria-hidden="true"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- merchant-uploaded product photo
    <img src={src} alt="" className={cn("h-full w-full object-cover", className)} />
  );
}

function CartMark({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex items-center justify-center rounded-t-pill bg-t-accent px-1.5 text-[10px] font-semibold tabular-nums text-t-accent-fg">
      {count}
    </span>
  );
}

function EmptyCatalog() {
  return (
    <div className="border border-dashed border-t-border px-6 py-16 text-center">
      <p className="font-t-display text-2xl">Your catalog starts here</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-t-text-muted">
        Add a product in your workspace and it will show up in this layout.
      </p>
    </div>
  );
}

function storyOf(state: ShopState, template: WebsiteTemplate) {
  return state.aboutUs?.trim() || state.bio?.trim() || state.tagline?.trim() || template.tagline;
}

function EditorialSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const heroImage = state.heroImage || state.bizImage || products[0]?.image;
  const story = storyOf(state, template);

  return (
    <div className="bg-t-bg pb-28 font-t-body text-t-text">
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button type="button" onClick={shopNow} className={cn("font-t-display text-2xl leading-none", focusRing)}>
            {state.bizName || template.name}
          </button>
          <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Store">
            <button type="button" onClick={shopNow} className={cn("hover:text-t-text", focusRing)}>
              Shop
            </button>
            <a href="#story" className={cn("text-t-text-muted hover:text-t-text", focusRing)}>
              Story
            </a>
            <button type="button" onClick={props.onReviews} className={cn("text-t-text-muted hover:text-t-text", focusRing)}>
              Reviews
            </button>
          </nav>
          <div className="flex items-center gap-1">
            <button type="button" onClick={props.onSearch} className={cn("px-3 py-2 text-sm", focusRing)}>
              Search
            </button>
            <button type="button" onClick={props.onCart} className={cn("px-3 py-2 text-sm", focusRing)}>
              Bag
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-14 md:grid-cols-12 md:px-8 md:py-24">
        <div className="md:col-span-7">
          <p className="text-xs uppercase tracking-[0.22em] text-t-text-muted">The collection</p>
          <h1 className="mt-4 font-t-display text-5xl leading-[0.92] md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-t-text-muted">{subtitle}</p>
          <button
            type="button"
            onClick={shopNow}
            className={cn("mt-8 border-b border-t-text pb-1 text-sm", focusRing)}
          >
            {state.heroButtonText || "Shop the edit"}
          </button>
        </div>
        <div className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden bg-t-surface-alt">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- merchant hero image
              <img src={heroImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-end p-6">
                <p className="font-t-display text-3xl leading-tight">{template.tagline}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="catalog" className="scroll-mt-20 border-t border-t-border">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-t-display text-4xl">The edit</h2>
            <div className="flex gap-4 overflow-x-auto" role="tablist" aria-label="Categories">
              {categories.map((category) => {
                const selected = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => props.onCategory(category)}
                    className={cn(
                      "shrink-0 border-b pb-1 text-sm",
                      focusRing,
                      selected ? "border-t-text text-t-text" : "border-transparent text-t-text-muted",
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="mt-10">
              <EmptyCatalog />
            </div>
          ) : (
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => props.onProduct(product)}
                    className={cn("group w-full text-left", focusRing)}
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-t-surface-alt">
                      <ProductMedia
                        product={product}
                        className="motion-safe:transition-transform motion-safe:duration-slow motion-safe:group-hover:scale-[1.03]"
                      />
                    </div>
                    <span className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="text-sm">{product.name}</span>
                      <span className="shrink-0 text-sm tabular-nums text-t-text-muted">
                        {formatPrice(state.currency, product.price)}
                      </span>
                    </span>
                    {product.outOfStock && (
                      <span className="mt-1 block text-xs text-t-text-muted">Sold out</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="story" className="border-t border-t-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-12 md:px-8 md:py-24">
          <p className="text-xs uppercase tracking-[0.22em] text-t-text-muted md:col-span-3">Our story</p>
          <p className="font-t-display text-3xl leading-snug md:col-span-8 md:text-4xl">{story}</p>
        </div>
      </section>

      <footer className="border-t border-t-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-t-text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <span className="font-t-display text-xl text-t-text">{state.bizName || template.name}</span>
          <span>{state.phone || "Orders open on WhatsApp"}</span>
          <span>{state.deliveryAreas || state.location || "Local delivery"}</span>
        </div>
      </footer>
    </div>
  );
}

function BoutiqueSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const mark = state.bizImage;

  return (
    <div className="bg-t-bg pb-28 font-t-body text-t-text">
      <div className="bg-t-accent-subtle px-5 py-2 text-center text-xs text-t-accent-text">
        {state.tagline || template.tagline}
      </div>
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg">
        <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-5 py-3 md:px-8">
          <button type="button" onClick={props.onSearch} className={cn("justify-self-start text-sm", focusRing)}>
            Search
          </button>
          <button type="button" onClick={shopNow} className={cn("flex flex-col items-center gap-1", focusRing)}>
            <span className="h-9 w-9 overflow-hidden rounded-t-pill bg-t-accent-subtle">
              {mark ? (
                // eslint-disable-next-line @next/next/no-img-element -- merchant logo
                <img src={mark} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm font-semibold text-t-accent-text">
                  {(state.bizName || template.name).slice(0, 1)}
                </span>
              )}
            </span>
            <span className="text-sm font-semibold">{state.bizName || template.name}</span>
          </button>
          <button type="button" onClick={props.onCart} className={cn("justify-self-end text-sm", focusRing)}>
            Bag
            <CartMark count={cartCount} />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="rounded-t-lg bg-t-surface-alt px-6 py-14 text-center md:px-16 md:py-20">
          <h1 className="font-t-display text-4xl leading-tight md:text-6xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-md text-base text-t-text-muted">{subtitle}</p>
          <button
            type="button"
            onClick={shopNow}
            className={cn(
              "mt-8 rounded-t-pill bg-t-accent px-6 py-3 text-sm font-semibold text-t-accent-fg",
              focusRing,
            )}
          >
            {state.heroButtonText || "Shop favourites"}
          </button>
        </div>
      </section>

      <section id="catalog" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
          <div className="flex gap-2 overflow-x-auto pb-4" role="tablist" aria-label="Categories">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded-t-pill px-4 py-2 text-sm",
                    focusRing,
                    selected ? "bg-t-accent text-t-accent-fg" : "bg-t-surface-alt text-t-text",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {products.length === 0 ? (
            <EmptyCatalog />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => props.onProduct(product)}
                    className={cn(
                      "w-full overflow-hidden rounded-t-lg bg-t-surface p-3 text-left shadow-[var(--t-shadow-card)]",
                      focusRing,
                    )}
                  >
                    <div className="aspect-[4/5] overflow-hidden rounded-t-md bg-t-surface-alt">
                      <ProductMedia product={product} />
                    </div>
                    <span className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="shrink-0 rounded-t-pill bg-t-accent-subtle px-2.5 py-1 text-xs font-semibold tabular-nums text-t-accent-text">
                        {formatPrice(state.currency, product.price)}
                      </span>
                    </span>
                    {product.outOfStock && (
                      <span className="mt-2 block text-xs text-t-text-muted">Sold out</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="story" className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <div className="rounded-t-lg bg-t-accent-subtle px-6 py-10 md:px-12 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-t-accent-text">From the maker</p>
          <p className="mt-4 max-w-2xl font-t-display text-3xl leading-snug">{story}</p>
          <button type="button" onClick={props.onReviews} className={cn("mt-6 text-sm font-medium underline", focusRing)}>
            Read reviews
          </button>
        </div>
      </section>

      <footer className="border-t border-t-border px-5 py-10 text-center text-sm text-t-text-muted">
        <p className="text-base font-semibold text-t-text">{state.bizName || template.name}</p>
        <p className="mt-2">{state.phone || "Message us on WhatsApp to order"}</p>
        <p className="mt-1">{state.deliveryAreas || state.location || ""}</p>
      </footer>
    </div>
  );
}

function BoldSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);

  return (
    <div className="bg-t-bg pb-28 font-t-body text-t-text">
      <div className="h-2 bg-t-accent" />
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={shopNow}
            className={cn("text-sm font-semibold uppercase tracking-[0.18em]", focusRing)}
          >
            {state.bizName || template.name}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={props.onSearch} className={cn("px-2 py-2 text-xs uppercase tracking-wider", focusRing)}>
              Search
            </button>
            <button
              type="button"
              onClick={props.onCart}
              className={cn("bg-t-accent px-3 py-2 text-xs font-semibold uppercase tracking-wider text-t-accent-fg", focusRing)}
            >
              Bag
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      <section className="bg-t-accent text-t-accent-fg">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-4 py-12 md:grid-cols-12 md:px-6 md:py-20">
          <div className="md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em]">This week</p>
            <h1 className="mt-3 text-5xl font-semibold uppercase leading-[0.84] tracking-tight md:text-8xl">
              {title}
            </h1>
            <p className="mt-5 max-w-sm text-sm md:text-base">{subtitle}</p>
            <button
              type="button"
              onClick={shopNow}
              className={cn(
                "mt-8 bg-t-bg px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-t-text",
                focusRing,
              )}
            >
              {state.heroButtonText || "Shop the drop"}
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-px md:col-span-5">
            {products.slice(0, 2).map((product) => (
              <li key={product.id}>
                <button type="button" onClick={() => props.onProduct(product)} className={cn("block w-full", focusRing)}>
                  <div className="aspect-square bg-t-bg">
                    <ProductMedia product={product} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="catalog" className="scroll-mt-16">
        <div className="flex gap-4 overflow-x-auto border-b border-t-border px-4 py-3 md:px-6" role="tablist" aria-label="Categories">
          {categories.map((category) => {
            const selected = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => props.onCategory(category)}
                className={cn(
                  "shrink-0 text-xs font-semibold uppercase tracking-[0.16em]",
                  focusRing,
                  selected ? "text-t-text" : "text-t-text-muted",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>

        {products.length === 0 ? (
          <div className="px-4 py-10 md:px-6">
            <EmptyCatalog />
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-px bg-t-border lg:grid-cols-4">
            {products.map((product, index) => (
              <li key={product.id} className="bg-t-bg">
                <button
                  type="button"
                  onClick={() => props.onProduct(product)}
                  className={cn("block w-full text-left", focusRing)}
                >
                  <div className="relative aspect-square bg-t-surface-alt">
                    <ProductMedia product={product} />
                    <span className="absolute left-2 top-2 text-[10px] font-semibold tabular-nums text-t-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="flex items-center justify-between gap-2 px-2 py-2">
                    <span className="truncate text-xs font-semibold uppercase tracking-wide">{product.name}</span>
                    <span className="shrink-0 text-xs tabular-nums">
                      {formatPrice(state.currency, product.price)}
                    </span>
                  </span>
                  {product.outOfStock && (
                    <span className="block px-2 pb-2 text-[10px] uppercase tracking-wider text-t-text-muted">
                      Sold out
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="story" className="border-t border-t-border px-4 py-12 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-2xl font-semibold uppercase leading-tight tracking-tight">{story}</p>
          <button type="button" onClick={props.onReviews} className={cn("text-xs font-semibold uppercase tracking-[0.16em]", focusRing)}>
            Reviews
          </button>
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t border-t-border px-4 py-6 text-[11px] uppercase tracking-[0.16em] text-t-text-muted md:flex-row md:justify-between md:px-6">
        <span>{state.bizName || template.name}</span>
        <span>{state.phone || "WhatsApp checkout"}</span>
        <span>{state.deliveryAreas || state.location || ""}</span>
      </footer>
    </div>
  );
}

export function TemplateSite(props: TemplateSiteProps) {
  const template = websiteTemplateById(props.state.websiteTemplateId);
  if (!template) return null;
  if (template.id === "boutique") return <BoutiqueSite {...props} template={template} />;
  if (template.id === "bold") return <BoldSite {...props} template={template} />;
  return <EditorialSite {...props} template={template} />;
}
