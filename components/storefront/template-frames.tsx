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
  studio: {
    name: "Studio Form",
    host: "studio.swiftlink.store",
    items: [
      { name: "Poster set", ngn: "21,000", usd: "40" },
      { name: "Ceramic vase", ngn: "33,000", usd: "64" },
      { name: "Art print", ngn: "17,500", usd: "34" },
      { name: "Notebook", ngn: "6,000", usd: "12" },
    ],
  },
  market: {
    name: "Corner Market",
    host: "market.swiftlink.store",
    items: [
      { name: "Rice 5kg", ngn: "11,500", usd: "22" },
      { name: "Cooking oil", ngn: "8,200", usd: "16" },
      { name: "Tomato crate", ngn: "5,400", usd: "11" },
      { name: "Fresh eggs", ngn: "3,600", usd: "7" },
    ],
  },
  noir: {
    name: "Maison Noir",
    host: "noir.swiftlink.store",
    items: [
      { name: "Gold timepiece", ngn: "420,000", usd: "800" },
      { name: "Leather case", ngn: "96,000", usd: "185" },
      { name: "Silk tie", ngn: "34,000", usd: "66" },
      { name: "Cufflinks", ngn: "52,000", usd: "100" },
    ],
  },
  bloom: {
    name: "Bloom & Co",
    host: "bloom.swiftlink.store",
    items: [
      { name: "Peony bouquet", ngn: "24,000", usd: "46" },
      { name: "Rose box", ngn: "31,000", usd: "60" },
      { name: "Shea set", ngn: "12,800", usd: "25" },
      { name: "Scented candle", ngn: "8,900", usd: "17" },
    ],
  },
  forge: {
    name: "Forge Supply",
    host: "forge.swiftlink.store",
    items: [
      { name: "Impact drill", ngn: "88,000", usd: "170" },
      { name: "Tool set", ngn: "54,000", usd: "104" },
      { name: "Work gloves", ngn: "7,500", usd: "14" },
      { name: "Steel tape", ngn: "4,200", usd: "8" },
    ],
  },
  coast: {
    name: "Coast Supply",
    host: "coast.swiftlink.store",
    items: [
      { name: "Linen towel", ngn: "14,500", usd: "28" },
      { name: "Beach tote", ngn: "22,000", usd: "42" },
      { name: "Sea salt soap", ngn: "5,800", usd: "11" },
      { name: "Sun hat", ngn: "18,600", usd: "36" },
    ],
  },
  oasis: {
    name: "Oasis Home",
    host: "oasis.swiftlink.store",
    items: [
      { name: "Terracotta pot", ngn: "16,400", usd: "31" },
      { name: "Woven basket", ngn: "23,000", usd: "44" },
      { name: "Cotton throw", ngn: "39,000", usd: "75" },
      { name: "Clay mug", ngn: "6,900", usd: "13" },
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
            New items in stock.
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
        Order direct on WhatsApp
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
          <p className={cn("font-t-display leading-tight", stage ? "text-4xl" : "text-lg")}>Featured products</p>
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
          Latest
          <br />
          arrivals.
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

function StudioMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.studio;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-t-bg text-t-text font-mono", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("flex items-center justify-between border-b border-t-border", stage ? "px-8 py-3" : "px-3 py-1.5")}>
        <span className={cn("tracking-widest uppercase font-bold", stage ? "text-sm" : "text-[9px]")}>{mock.name}</span>
        <span className={cn("text-t-text-muted", stage ? "text-xs" : "text-[8px]")}>{"// ARCHIVE 2026"}</span>
      </div>
      <div className={cn("border-b border-t-border bg-t-surface-alt", stage ? "p-8" : "p-3")}>
        <div className="flex items-center gap-2 text-[8px] text-t-accent-text tracking-widest uppercase mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-t-accent" />
          <span>Curated Editions</span>
        </div>
        <p className={cn("font-bold tracking-tight uppercase leading-tight", stage ? "text-3xl" : "text-sm")}>
          Design Objects & Prints
        </p>
      </div>
      {size !== "strip" && (
        <div className="grid grid-cols-2 divide-x divide-t-border">
          {items.map((item, index) => (
            <div key={item.name} className={cn("bg-t-bg", stage ? "p-4" : "p-2")}>
              <div className={cn("relative overflow-hidden bg-t-surface-alt border border-t-border/50", stage ? "aspect-[4/3]" : "aspect-square")}>
                <Swatch index={index + 5} />
                <span className="absolute top-1 left-1 px-1 py-0.5 bg-t-bg/90 text-[7px] text-t-text-muted">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-1">
                <span className={cn("truncate text-[9px] font-semibold", stage ? "text-xs" : "")}>{item.name}</span>
                <span className={cn("tabular-nums text-t-accent-text font-bold text-[8px]", stage ? "text-xs" : "")}>{money(currency, item)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.market;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-t-bg text-t-text", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("bg-t-accent text-t-accent-fg flex items-center justify-between", stage ? "px-6 py-2 text-xs" : "px-3 py-1 text-[8px]")}>
        <span className="font-bold uppercase tracking-wider">{mock.name}</span>
        <span className="rounded bg-black/20 px-1.5 py-0.5 font-medium">Fast Dispatch</span>
      </div>
      <div className={cn("bg-t-surface border-b border-t-border", stage ? "px-6 py-3" : "px-3 py-2")}>
        <div className="rounded-full bg-t-surface-alt border border-t-border px-2.5 py-1 flex items-center gap-1.5 text-[8px] text-t-text-muted">
          <span className="text-[9px]">🔍</span>
          <span>Search groceries & essentials...</span>
        </div>
      </div>
      {size !== "strip" && (
        <div className={cn("grid grid-cols-2", stage ? "gap-3 p-6" : "gap-1.5 p-2.5")}>
          {items.map((item, index) => (
            <div key={item.name} className="rounded-lg border border-t-border bg-t-surface p-1.5 flex flex-col justify-between">
              <div className={cn("rounded-md overflow-hidden bg-t-surface-alt", stage ? "aspect-[4/3]" : "aspect-[5/4]")}>
                <Swatch index={index + 7} />
              </div>
              <div className="mt-1.5">
                <span className="inline-block rounded bg-emerald-500/15 text-emerald-500 font-bold text-[7px] px-1 py-0.5 mb-0.5">IN STOCK</span>
                <p className={cn("font-bold truncate", stage ? "text-xs" : "text-[9px]")}>{item.name}</p>
                <p className={cn("font-extrabold text-t-accent-text tabular-nums", stage ? "text-xs" : "text-[9px]")}>{money(currency, item)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoirMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.noir;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-[#070709] text-[#f4f4f5] font-serif", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("border-b border-[#27272a] bg-black/90 text-center tracking-[0.25em] uppercase text-[#a1a1aa]", stage ? "py-2.5 text-[10px]" : "py-1 text-[7px]")}>
        Concierge Atelier
      </div>
      <div className={cn("text-center border-b border-[#27272a]/60", stage ? "py-8 px-6" : "py-3 px-3")}>
        <p className={cn("tracking-widest uppercase font-light", stage ? "text-2xl" : "text-xs")}>{mock.name}</p>
        <div className="mx-auto my-1.5 h-px w-8 bg-[#d4af37]" />
        <p className="text-[7px] text-[#71717a] uppercase tracking-widest">Haute Horlogerie & Rare Pieces</p>
      </div>
      {size !== "strip" && (
        <div className="grid grid-cols-2 divide-x divide-[#27272a]">
          {items.map((item, index) => (
            <div key={item.name} className={cn("bg-[#0c0c0e] p-2", stage ? "p-4" : "")}>
              <div className={cn("relative overflow-hidden bg-[#18181b] border border-[#27272a]", stage ? "aspect-[3/4]" : "aspect-square")}>
                <Swatch index={index + 10} />
                <span className="absolute bottom-1 right-1 text-[7px] text-[#d4af37] font-sans font-bold bg-black/80 px-1 py-0.5 rounded">
                  VIP
                </span>
              </div>
              <p className={cn("mt-1.5 truncate text-[9px] text-[#e4e4e7]", stage ? "text-xs" : "")}>{item.name}</p>
              <p className={cn("font-sans font-semibold text-[#d4af37] tabular-nums text-[8px]", stage ? "text-xs" : "")}>{money(currency, item)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BloomMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.bloom;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-t-bg text-t-text", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("bg-t-surface-alt/70 text-center rounded-b-2xl mx-2 border-b border-t-border/60", stage ? "py-3" : "py-1.5")}>
        <span className="text-[8px] tracking-wider font-semibold text-t-accent-text uppercase">Hand-tied with love</span>
        <p className={cn("font-serif font-bold leading-tight", stage ? "text-xl" : "text-xs")}>{mock.name}</p>
      </div>
      {size !== "strip" && (
        <div className={cn("grid grid-cols-2 gap-2", stage ? "p-6" : "p-2.5")}>
          {items.map((item, index) => (
            <div key={item.name} className="rounded-2xl border border-t-border bg-t-surface p-2 shadow-xs flex flex-col items-center text-center">
              <div className={cn("w-full overflow-hidden rounded-t-full bg-t-surface-alt", stage ? "aspect-[4/5]" : "aspect-square")}>
                <Swatch index={index + 12} />
              </div>
              <p className={cn("mt-1.5 font-medium truncate w-full", stage ? "text-xs" : "text-[9px]")}>{item.name}</p>
              <span className={cn("mt-0.5 rounded-full bg-t-accent-subtle px-2 py-0.5 font-bold text-t-accent-text text-[8px]", stage ? "text-xs" : "")}>
                {money(currency, item)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ForgeMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.forge;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-[#121316] text-[#e6e8ec] font-mono", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("bg-[#f97316] text-[#000] font-black uppercase tracking-widest flex items-center justify-between", stage ? "px-6 py-2 text-xs" : "px-2.5 py-1 text-[8px]")}>
        <span>{mock.name}</span>
        <span className="border border-black px-1">INDUSTRIAL SPEC</span>
      </div>
      <div className={cn("border-b-2 border-[#26282e] bg-[#1a1c22]", stage ? "p-6" : "p-2.5")}>
        <span className="text-[7px] text-[#f97316] font-bold tracking-widest uppercase">{"// HEAVY HARDWARE & GEAR"}</span>
        <p className={cn("font-black tracking-tight uppercase leading-none mt-0.5", stage ? "text-2xl" : "text-xs")}>BUILT FOR RIGOROUS USE</p>
      </div>
      {size !== "strip" && (
        <div className="grid grid-cols-2 divide-x-2 divide-[#26282e]">
          {items.map((item, index) => (
            <div key={item.name} className="p-2 bg-[#141519]">
              <div className={cn("overflow-hidden border-2 border-[#26282e] bg-[#1f2128]", stage ? "aspect-square" : "aspect-[4/3]")}>
                <Swatch index={index + 14} />
              </div>
              <p className={cn("mt-1.5 font-bold truncate uppercase text-[8px]", stage ? "text-xs" : "")}>{item.name}</p>
              <p className={cn("font-black text-[#f97316] tabular-nums text-[8px]", stage ? "text-xs" : "")}>{money(currency, item)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoastMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.coast;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-t-bg text-t-text", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("bg-gradient-to-r from-sky-500/20 to-teal-500/20 text-center border-b border-t-border", stage ? "py-4" : "py-2")}>
        <span className="text-[8px] uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 font-bold">Resort & Summer Living</span>
        <p className={cn("font-serif font-bold text-t-text mt-0.5", stage ? "text-2xl" : "text-sm")}>{mock.name}</p>
      </div>
      {size !== "strip" && (
        <div className={cn("grid grid-cols-2 gap-2", stage ? "p-6" : "p-2.5")}>
          {items.map((item, index) => (
            <div key={item.name} className="rounded-xl border border-t-border bg-t-surface p-1.5 shadow-xs">
              <div className={cn("overflow-hidden rounded-lg bg-t-surface-alt", stage ? "aspect-[4/5]" : "aspect-square")}>
                <Swatch index={index + 16} />
              </div>
              <p className={cn("mt-1.5 font-medium truncate text-[9px]", stage ? "text-xs" : "")}>{item.name}</p>
              <p className={cn("font-bold text-teal-600 dark:text-teal-400 tabular-nums text-[8px]", stage ? "text-xs" : "")}>{money(currency, item)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OasisMini({ size, currency }: { size: TemplateFrameSize; currency: string }) {
  const mock = MOCK.oasis;
  const stage = size === "stage";
  const items = stage ? mock.items : mock.items.slice(0, 2);
  return (
    <div className={cn("bg-[#fbf7f2] dark:bg-[#1a1412] text-[#2c1d18] dark:text-[#f4ede7]", size === "strip" && "max-h-[168px] overflow-hidden")}>
      <div className={cn("border-b border-[#e5dcd3] dark:border-[#382b26] text-center", stage ? "py-3" : "py-1.5")}>
        <span className="text-[8px] uppercase tracking-widest text-[#9c6a46] font-bold">Artisan Market</span>
        <p className={cn("font-serif font-bold", stage ? "text-xl" : "text-xs")}>{mock.name}</p>
      </div>
      {size !== "strip" && (
        <div className={cn("grid grid-cols-2 gap-2", stage ? "p-6" : "p-2.5")}>
          {items.map((item, index) => (
            <div key={item.name} className="rounded-xl border border-[#e5dcd3] dark:border-[#382b26] bg-white dark:bg-[#251d1a] p-1.5">
              <div className={cn("overflow-hidden rounded-t-[14px] bg-[#f0e7de] dark:bg-[#342722]", stage ? "aspect-[4/5]" : "aspect-square")}>
                <Swatch index={index + 18} />
              </div>
              <p className={cn("mt-1 font-serif truncate text-[9px]", stage ? "text-xs" : "")}>{item.name}</p>
              <p className={cn("font-bold text-[#b45309] dark:text-[#f59e0b] tabular-nums text-[8px]", stage ? "text-xs" : "")}>{money(currency, item)}</p>
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

  // Render dedicated distinct visual experience per template
  const site = (() => {
    switch (id) {
      case "boutique": return <BoutiqueMini size={size} currency={currency} />;
      case "bold": return <BoldMini size={size} currency={currency} />;
      case "studio": return <StudioMini size={size} currency={currency} />;
      case "market": return <MarketMini size={size} currency={currency} />;
      case "noir": return <NoirMini size={size} currency={currency} />;
      case "bloom": return <BloomMini size={size} currency={currency} />;
      case "forge": return <ForgeMini size={size} currency={currency} />;
      case "coast": return <CoastMini size={size} currency={currency} />;
      case "oasis": return <OasisMini size={size} currency={currency} />;
      case "editorial":
      default: return <EditorialMini size={size} currency={currency} />;
    }
  })();

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
        <span className="ml-2 truncate font-mono text-[11px] text-app-text-subtle">
          {MOCK[id]?.host ?? "swiftlink.store"}
        </span>
      </div>
      {framed}
    </div>
  );
}
