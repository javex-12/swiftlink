import type { CSSProperties } from "react";
import { themeToCssVars } from "@/lib/theme/derive";
import {
  websiteTemplateById,
  type WebsiteTemplateId,
} from "@/lib/theme/templates";
import { cn } from "@/lib/utils";

/**
 * Miniature of a website template.
 *
 * Used on the marketing page, the sign-in panel and the template picker so a
 * merchant sees a whole site — header, hero, products, footer — before they
 * apply it. The colours come from the same theme the live storefront uses.
 * These frames are decorative: no buttons, so they can sit inside a picker control.
 */

export type TemplateFrameSize = "strip" | "card" | "stage";

type Item = { name: string; ngn: string; usd: string };

const MOCK: Record<
  WebsiteTemplateId,
  { name: string; host: string; items: Item[] }
> = {
  editorial: {
    name: "Atelier North",
    host: "atelier.swiftlink.store",
    items: [
      { name: "Linen coat", ngn: "48,000", usd: "85" },
      { name: "Stone bowl", ngn: "12,500", usd: "24" },
      { name: "Wool scarf", ngn: "18,000", usd: "36" },
      { name: "Ivory shirt", ngn: "22,000", usd: "42" },
    ],
  },
  boutique: {
    name: "Maison Rue",
    host: "maison.swiftlink.store",
    items: [
      { name: "Rose oil", ngn: "9,500", usd: "18" },
      { name: "Gift set", ngn: "16,000", usd: "32" },
      { name: "Clay candle", ngn: "7,200", usd: "14" },
      { name: "Silk ribbon", ngn: "3,400", usd: "8" },
    ],
  },
  bold: {
    name: "DROP / 04",
    host: "drop.swiftlink.store",
    items: [
      { name: "Runner 04", ngn: "62,000", usd: "120" },
      { name: "Field cap", ngn: "14,000", usd: "28" },
      { name: "Utility vest", ngn: "38,000", usd: "74" },
      { name: "Court sock", ngn: "6,500", usd: "12" },
    ],
  },
};

function money(currency: string, item: Item) {
  return currency === "$" ? `$${item.usd}` : `${currency}${item.ngn}`;
}

function Swatch({ index, className }: { index: number; className?: string }) {
  const mix = 10 + (index % 4) * 12;
  return (
    <div
      className={cn("h-full w-full", className)}
      style={{
        background: `linear-gradient(${128 + index * 22}deg, color-mix(in srgb, var(--t-accent) ${mix}%, var(--t-surface-alt)), var(--t-surface) 70%)`,
      }}
    />
  );
}

function EditorialMini({
  size,
  currency,
}: {
  size: TemplateFrameSize;
  currency: string;
}) {
  const mock = MOCK.editorial;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-t-bg text-t-text", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className="h-1 bg-t-text" />
      <div className={cn("flex items-center justify-between", stage ? "px-8 py-4" : "px-3 py-2")}>
        <span className={cn("font-t-display", stage ? "text-2xl" : "text-sm")}>{mock.name}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-t-text-muted">Shop</span>
      </div>
      <div className={cn("grid grid-cols-5 gap-3", stage ? "px-8 pb-8" : "px-3 pb-3")}>
        <div className="col-span-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-t-text-muted">New season</p>
          <p
            className={cn(
              "mt-1 font-t-display leading-[0.95]",
              stage ? "text-5xl" : "text-xl",
            )}
          >
            Considered goods, cut this week.
          </p>
        </div>
        <div className={cn("col-span-2 overflow-hidden bg-t-surface-alt", stage ? "aspect-[4/5]" : "h-16")}>
          <Swatch index={0} />
        </div>
      </div>
      {size !== "strip" && (
        <div className={cn("grid grid-cols-2 border-t border-t-border", stage && "grid-cols-4")}>
          {items.map((item, index) => (
            <div key={item.name} className={cn("border-t-border", stage ? "p-4" : "p-2", index > 0 && "border-l")}>
              <div className={cn("overflow-hidden bg-t-surface-alt", stage ? "aspect-[4/5]" : "aspect-[4/3]")}>
                <Swatch index={index + 1} />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className={cn("truncate", stage ? "text-sm" : "text-[10px]")}>{item.name}</span>
                <span className={cn("shrink-0 tabular-nums text-t-text-muted", stage ? "text-sm" : "text-[10px]")}>
                  {money(currency, item)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {stage && (
        <div className="flex items-center justify-between border-t border-t-border px-8 py-4 text-[11px] uppercase tracking-[0.16em] text-t-text-muted">
          <span>{mock.name}</span>
          <span>WhatsApp orders</span>
        </div>
      )}
    </div>
  );
}

function BoutiqueMini({
  size,
  currency,
}: {
  size: TemplateFrameSize;
  currency: string;
}) {
  const mock = MOCK.boutique;
  const stage = size === "stage";
  const items = (stage ? mock.items : mock.items.slice(0, 2));
  return (
    <div className={cn("bg-t-bg text-t-text", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("bg-t-accent-subtle text-center text-t-accent-text", stage ? "px-6 py-2 text-xs" : "px-3 py-1 text-[9px]")}>
        Small-batch, wrapped to order
      </div>
      <div className={cn("text-center", stage ? "px-8 pt-6" : "px-3 pt-2")}>
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-t-pill bg-t-accent-subtle",
            stage ? "h-12 w-12" : "h-6 w-6",
          )}
        >
          <Swatch index={2} />
        </div>
        <p className={cn("mt-2 font-t-display", stage ? "text-2xl" : "text-sm")}>{mock.name}</p>
      </div>
      <div className={cn(stage ? "px-8 py-6" : "px-3 py-2")}>
        <div className={cn("bg-t-surface-alt text-center", stage ? "rounded-t-lg px-6 py-10" : "rounded-t-md px-3 py-3")}>
          <p className={cn("font-t-display leading-tight", stage ? "text-4xl" : "text-lg")}>Gifts, made slowly.</p>
          {stage && (
            <span className="mt-5 inline-block rounded-t-pill bg-t-accent px-4 py-2 text-xs font-semibold text-t-accent-fg">
              Shop favourites
            </span>
          )}
        </div>
      </div>
      {size !== "strip" && (
        <div className={cn("grid grid-cols-2", stage ? "gap-4 px-8 pb-8" : "gap-2 px-3 pb-3")}>
          {items.map((item, index) => (
            <div key={item.name} className={cn("bg-t-surface shadow-[var(--t-shadow-card)]", stage ? "rounded-t-lg p-3" : "rounded-t-md p-1.5")}>
              <div className={cn("overflow-hidden rounded-t-md bg-t-surface-alt", stage ? "aspect-[4/5]" : "aspect-square")}>
                <Swatch index={index + 3} />
              </div>
              <p className={cn("mt-2 truncate", stage ? "text-sm" : "text-[10px]")}>{item.name}</p>
              <p className={cn("tabular-nums text-t-accent-text", stage ? "text-sm" : "text-[10px]")}>
                {money(currency, item)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoldMini({
  size,
  currency,
}: {
  size: TemplateFrameSize;
  currency: string;
}) {
  const mock = MOCK.bold;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-t-bg text-t-text", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className="h-1.5 bg-t-accent" />
      <div className={cn("flex items-center justify-between", stage ? "px-8 py-4" : "px-3 py-2")}>
        <span className={cn("font-semibold uppercase tracking-[0.18em]", stage ? "text-sm" : "text-[10px]")}>
          {mock.name}
        </span>
        <span className={cn("bg-t-accent font-semibold uppercase text-t-accent-fg", stage ? "px-3 py-1.5 text-[11px]" : "px-1.5 py-0.5 text-[8px]")}>
          Bag
        </span>
      </div>
      <div className={cn("bg-t-accent text-t-accent-fg", stage ? "px-8 py-10" : "px-3 py-3")}>
        <p className={cn("font-semibold uppercase leading-[0.85] tracking-tight", stage ? "text-6xl" : "text-2xl")}>
          New drop.
          <br />
          This week.
        </p>
      </div>
      {size !== "strip" && (
        <div className="grid grid-cols-2 gap-px bg-t-border">
          {items.map((item, index) => (
            <div key={item.name} className="relative bg-t-bg">
              <div className={cn("bg-t-surface-alt", stage ? "aspect-square" : "aspect-[5/4]")}>
                <Swatch index={index + 1} />
              </div>
              <div className="flex items-center justify-between gap-2 bg-t-surface px-2 py-1.5">
                <span className={cn("truncate uppercase", stage ? "text-xs tracking-wider" : "text-[9px]")}>{item.name}</span>
                <span className={cn("shrink-0 tabular-nums", stage ? "text-xs" : "text-[9px]")}>{money(currency, item)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TemplateFrame({
  id,
  appearance,
  currency = "₦",
  size = "card",
  className,
}: {
  id: WebsiteTemplateId;
  appearance: "light" | "dark";
  currency?: string;
  size?: TemplateFrameSize;
  className?: string;
}) {
  const template = websiteTemplateById(id);
  if (!template) return null;
  const theme = appearance === "dark" ? template.dark : template.light;
  const vars = themeToCssVars(theme) as CSSProperties;

  const site =
    id === "boutique" ? (
      <BoutiqueMini size={size} currency={currency} />
    ) : id === "bold" ? (
      <BoldMini size={size} currency={currency} />
    ) : (
      <EditorialMini size={size} currency={currency} />
    );

  const framed = (
    <div data-theme-scope="storefront" style={vars} className="bg-t-bg text-t-text">
      {site}
    </div>
  );

  if (size !== "stage") {
    return <div className={cn("overflow-hidden bg-t-bg", className)}>{framed}</div>;
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-lg", className)}>
      <div className="flex items-center gap-2 border-b border-app-border bg-app-surface px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-app-border-strong" />
        <span className="h-2 w-2 rounded-full bg-app-border-strong" />
        <span className="h-2 w-2 rounded-full bg-app-border-strong" />
        <span className="ml-2 truncate font-mono text-[11px] text-app-text-subtle">{MOCK[id].host}</span>
      </div>
      {framed}
    </div>
  );
}
