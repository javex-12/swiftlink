"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import {
  collectProductCategories,
  normalizeCategoryLabel,
  resolveStorefrontTheme,
} from "@/lib/utils";
import type { Product, StorefrontTheme } from "@/lib/types";

const UNCATEGORIZED = "__uncat__";

function ProductCard({
  p,
  state,
  cart,
  updateCart,
  index,
  compact,
  theme,
}: {
  p: Product;
  state: { bizName: string; currency: string };
  cart: Record<number, number>;
  updateCart: (id: number, delta: number) => void;
  index: number;
  compact?: boolean;
  theme: StorefrontTheme;
}) {
  const isDark = theme.background === "dark";
  const cat = normalizeCategoryLabel(p.category ?? "");
  const primary = theme.primaryColor;
  const radius =
    theme.cardRadius === "subtle" ? "rounded-2xl" : "rounded-[2.5rem]";
  const imgBg = isDark ? "bg-slate-900" : "bg-slate-50";
  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const cardBorder = isDark ? "border-slate-700" : "border-slate-100";
  const titleCls = isDark ? "text-white" : "text-slate-900";
  const descCls = isDark ? "text-slate-500" : "text-slate-400";
  const priceCls = isDark ? "text-white" : "text-slate-900";
  const emptyImgCls = isDark ? "bg-slate-900" : "bg-slate-100";

  return (
    <div
      className={`group card-3d-hover ${cardBg} ${radius} border ${cardBorder} overflow-hidden hover:shadow-2xl transition-all duration-500 animate-fade-in-up shrink-0 ${
        compact ? "w-[220px] sm:w-[260px]" : ""
      }`}
      style={
        {
          animationDelay: `${index * 100}ms`,
          ["--brand" as string]: primary,
        } as CSSProperties
      }
    >
      <div
        className={`aspect-square relative overflow-hidden ${imgBg} ${compact ? "max-h-40" : ""}`}
      >
        {p.image ? (
          <img
            src={p.image}
            alt=""
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${p.outOfStock ? "grayscale opacity-40" : ""}`}
          />
        ) : (
          <div className={`w-full h-full ${emptyImgCls}`} />
        )}
        {p.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/90 backdrop-blur-sm text-red-500 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
              Sold Out
            </span>
          </div>
        )}
        {!p.outOfStock && (
          <button
            type="button"
            onClick={() => updateCart(p.id, 1)}
            className="absolute bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center transform translate-y-24 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:brightness-110"
            style={{ backgroundColor: primary }}
            aria-label="Add to cart"
          >
            <i className="fas fa-plus text-xl" />
          </button>
        )}
      </div>
      <div className={compact ? "p-5" : "p-8 text-left"}>
        {cat ? (
          <span
            className="inline-block text-[9px] font-black uppercase tracking-widest mb-1 opacity-90"
            style={{ color: primary }}
          >
            {cat}
          </span>
        ) : null}
        <h3
          className={`font-black mb-2 truncate transition-colors group-hover:[color:var(--brand)] ${titleCls} ${
            compact ? "text-base" : "text-xl"
          }`}
        >
          {p.name}
        </h3>
        <p
          className={`font-bold mb-4 line-clamp-2 uppercase tracking-wide opacity-60 ${descCls} ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          {p.description}
        </p>
        <div className="flex justify-between items-center">
          <span
            className={`font-black ${priceCls} ${compact ? "text-lg" : "text-2xl"}`}
          >
            {state.currency}
            {Number(p.price).toLocaleString()}
          </span>
          {cart[p.id] ? (
            <span
              className="px-3 py-1 rounded-lg text-xs font-black animate-bounce"
              style={{
                backgroundColor: `${primary}22`,
                color: primary,
              }}
            >
              {cart[p.id]} in cart
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CustomerStorefront() {
  const { state, cart, updateCart, toggleCartDrawer, cartItemCount } =
    useSwiftLink();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const theme = useMemo(() => resolveStorefrontTheme(state), [state]);
  const isDark = theme.background === "dark";

  const categories = useMemo(
    () => collectProductCategories(state.products),
    [state.products],
  );

  const hasUncategorized = useMemo(
    () =>
      state.products.some((p) => !normalizeCategoryLabel(p.category ?? "")),
    [state.products],
  );

  const featuredLabel = normalizeCategoryLabel(state.featuredCategory ?? "");
  const featuredProducts = useMemo(() => {
    if (!featuredLabel) return [];
    return state.products.filter(
      (p) => normalizeCategoryLabel(p.category ?? "") === featuredLabel,
    );
  }, [state.products, featuredLabel]);

  const filteredProducts = useMemo(() => {
    return state.products.filter((p) => {
      const cat = normalizeCategoryLabel(p.category ?? "");
      if (filterCategory === null) return true;
      if (filterCategory === UNCATEGORIZED) return !cat;
      return cat === filterCategory;
    });
  }, [state.products, filterCategory]);

  const initials = state.bizName
    ? state.bizName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
    : "SL";

  const pageBg = isDark ? "bg-slate-950" : "bg-slate-50";
  const navBg = isDark
    ? "bg-slate-900/90 border-white/10"
    : "bg-white/90 border-slate-100";
  const navTitle = isDark ? "text-white" : "text-slate-900";
  const navIcon = isDark ? "text-slate-200" : "text-slate-700";
  const avatarRing = isDark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-slate-100";
  const heroBg = isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-100";
  const heroH1 = isDark ? "text-white" : "text-slate-900";
  const heroLead = isDark ? "text-slate-400" : "text-slate-500";
  const productsBg = isDark ? "bg-slate-950" : "bg-white";
  const sectionHeading = isDark ? "text-white" : "text-slate-900";
  const sectionMuted = isDark ? "text-slate-500" : "text-slate-500";
  const chipInactive = isDark
    ? "bg-slate-800 text-slate-300 hover:bg-slate-800/80"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200";
  const imageFrameBorder = isDark ? "border-slate-700" : "border-slate-100";
  const imageFrameBg = isDark ? "bg-slate-800" : "bg-slate-50";
  const heroImgFallback = isDark ? "text-slate-700" : "text-slate-200";

  const radiusHero =
    theme.cardRadius === "subtle" ? "rounded-3xl" : "rounded-[3rem]";

  const chipActiveStyle = (active: boolean, isAccent: boolean) => {
    if (!active) return undefined;
    if (isAccent) {
      return {
        backgroundColor: theme.primaryColor,
        color: "#ffffff",
        boxShadow: `0 10px 28px -8px ${theme.primaryColor}88`,
      } as CSSProperties;
    }
    return {
      backgroundColor: isDark ? "#f8fafc" : "#0f172a",
      color: isDark ? "#0f172a" : "#f8fafc",
    } as CSSProperties;
  };

  const HeroImageBlock = (
    <div
      className={`animate-float w-full max-w-[300px] md:max-w-[450px] aspect-square ${radiusHero} ${imageFrameBg} shadow-2xl flex items-center justify-center overflow-hidden border ${imageFrameBorder} rotate-3 transform-style-3d`}
    >
      {state.bizImage ? (
        <img
          src={state.bizImage}
          className="w-full h-full object-cover"
          alt=""
        />
      ) : (
        <span
          className={`font-black text-6xl md:text-[10rem] opacity-20 ${heroImgFallback}`}
        >
          {initials}
        </span>
      )}
    </div>
  );

  const HeroCopy = (
    <div
      className={`animate-fade-in-up space-y-6 md:space-y-8 ${
        theme.heroLayout === "centered"
          ? "flex flex-col items-center text-center"
          : "text-center lg:text-left"
      }`}
    >
      {theme.showHeroBadge ? (
        <div
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"
          style={{
            backgroundColor: `${theme.primaryColor}18`,
            color: theme.primaryColor,
          }}
        >
          <i className="fas fa-bolt animate-pulse" />{" "}
          <span>Live catalog · SwiftLink</span>
        </div>
      ) : null}
      <h1 className={`text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] ${heroH1}`}>
        {state.bizName}
        <br />
        <span style={{ color: theme.primaryColor }}>{state.tagline}</span>
      </h1>
      <p
        className={`text-base md:text-xl max-w-lg font-medium leading-relaxed ${heroLead} ${
          theme.heroLayout === "centered" ? "mx-auto" : "mx-auto lg:mx-0"
        }`}
      >
        {state.aboutUs}
      </p>
      <div
        className={`pt-4 ${theme.heroLayout === "centered" ? "flex justify-center" : ""}`}
      >
        <a
          href="#products"
          className="text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all inline-block hover:brightness-105"
          style={{
            backgroundColor: theme.primaryColor,
            boxShadow: `0 24px 48px -12px ${theme.primaryColor}66`,
          }}
        >
          Browse selection
        </a>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col`} id="customer-view">
      <div id="full-catalog-content" className="w-full flex-1">
        <div className={`min-h-screen ${pageBg} flex flex-col`}>
          <nav
            className={`sticky top-0 z-40 backdrop-blur-md border-b h-16 md:h-20 flex items-center transition-all duration-300 ${navBg}`}
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex justify-between items-center">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden border shadow-sm ${avatarRing}`}
                  >
                    {state.bizImage ? (
                      <img
                        src={state.bizImage}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <span className="text-slate-400 font-black text-[10px] md:text-xs">
                        {initials}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-black text-xl md:text-2xl truncate max-w-[150px] md:max-w-none cursor-default ${navTitle}`}
                  >
                    {state.bizName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="relative cursor-pointer group"
                onClick={() => toggleCartDrawer(true)}
              >
                <i
                  className={`fas fa-shopping-bag text-xl md:text-2xl transition-transform group-hover:scale-110 ${navIcon}`}
                />
                <span
                  className="absolute -top-2 -right-2 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 transform transition-all group-hover:scale-110"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderColor: isDark ? "#0f172a" : "#ffffff",
                  }}
                >
                  {cartItemCount}
                </span>
              </button>
            </div>
          </nav>

          <header
            className={`py-12 lg:py-32 border-b relative overflow-hidden perspective-1000 ${heroBg}`}
          >
            <div
              className="absolute top-0 right-0 w-1/2 h-full pointer-events-none bg-gradient-to-l to-transparent"
              style={{
                backgroundImage: `linear-gradient(to left, ${theme.primaryColor}22, transparent)`,
              }}
            />
            {theme.heroLayout === "split" ? (
              <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10">
                {HeroCopy}
                <div className="flex justify-center items-center mt-8 lg:mt-0 perspective-1000">
                  {HeroImageBlock}
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
                {HeroCopy}
                <div className="flex justify-center mt-10 w-full perspective-1000">
                  {HeroImageBlock}
                </div>
              </div>
            )}
          </header>

          <section id="products" className={`py-12 md:py-24 flex-1 ${productsBg}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              {featuredProducts.length > 0 ? (
                <div className="mb-14 md:mb-16">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6 text-left">
                    <div>
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
                        style={{ color: theme.primaryColor }}
                      >
                        Featured collection
                      </p>
                      <h2
                        className={`text-2xl md:text-3xl font-black uppercase tracking-widest ${sectionHeading}`}
                      >
                        {featuredLabel}
                      </h2>
                    </div>
                    <span className={`${sectionMuted} text-xs font-bold`}>
                      {featuredProducts.length} item
                      {featuredProducts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
                    {featuredProducts.map((p, i) => (
                      <div key={p.id} className="snap-start">
                        <ProductCard
                          p={p}
                          state={state}
                          cart={cart}
                          updateCart={updateCart}
                          index={i}
                          compact
                          theme={theme}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="text-center mb-8">
                <h2
                  className={`text-3xl md:text-4xl font-black mb-3 uppercase tracking-widest ${sectionHeading}`}
                >
                  Store inventory
                </h2>
                <p
                  className={`text-sm font-medium max-w-lg mx-auto ${sectionMuted}`}
                >
                  Browse by category or view everything at once.
                </p>
              </div>

              {(categories.length > 0 || hasUncategorized) && (
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                  <button
                    type="button"
                    onClick={() => setFilterCategory(null)}
                    className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${chipInactive}`}
                    style={chipActiveStyle(filterCategory === null, false)}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFilterCategory(c)}
                      className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${chipInactive}`}
                      style={chipActiveStyle(filterCategory === c, true)}
                    >
                      {c}
                    </button>
                  ))}
                  {hasUncategorized ? (
                    <button
                      type="button"
                      onClick={() => setFilterCategory(UNCATEGORIZED)}
                      className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${chipInactive}`}
                      style={chipActiveStyle(
                        filterCategory === UNCATEGORIZED,
                        false,
                      )}
                    >
                      Uncategorized
                    </button>
                  ) : null}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
                {filteredProducts.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    state={state}
                    cart={cart}
                    updateCart={updateCart}
                    index={i}
                    theme={theme}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 ? (
                <p
                  className={`text-center font-bold py-16 uppercase tracking-widest text-sm ${sectionMuted}`}
                >
                  No products in this category yet.
                </p>
              ) : null}
            </div>
          </section>

          <footer className="bg-slate-900 text-white py-16 px-6 text-center border-t border-white/5 mt-auto">
            <img
              src="/logo.png"
              className="w-12 h-12 mx-auto mb-6"
              alt=""
              width={48}
              height={48}
            />
            <h3 className="text-2xl font-black tracking-tight mb-2">
              {state.bizName}
            </h3>
            <p className="text-slate-500 text-sm font-bold mb-8 opacity-60 uppercase tracking-widest">
              {state.tagline}
            </p>
            <div className="flex justify-center space-x-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <a
                href={`https://wa.me/${state.phone.replace(/\D/g, "")}`}
                className="transition-colors hover:brightness-125"
                style={{ color: theme.primaryColor }}
              >
                WhatsApp
              </a>
              <span className="opacity-20">•</span>
              <span className="hover:text-white transition-colors cursor-default">
                Powered by SwiftLink Pro
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
