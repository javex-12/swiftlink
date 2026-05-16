import { ShopState, StorefrontTheme } from "./schema";

export * from "./schema";

export const defaultShopState = (): ShopState => ({
  id: null,
  plan: "free",
  bizName: "",
  bizImage: "",
  phone: "",
  currency: "₦",
  products: [],
  deliveries: [],
  tagline: "Premium Products",
  aboutUs: "Store launched on SwiftLink.",
  
  // New Visual Editor Sections
  sections: [
    {
      id: "hero-default",
      type: "hero",
      title: "Welcome to our Store",
      subtitle: "Quality products, delivered to you.",
      isVisible: true,
      order: 0,
      content: {
        buttonText: "Shop Now",
        image: ""
      }
    },
    {
      id: "catalog-default",
      type: "catalog",
      title: "Our Collection",
      isVisible: true,
      order: 1
    }
  ],

  accentColor: "#10b981",
  bgColor: "#ffffff",
  textColor: "#111827",
  surfaceColor: "#f8fafc",
  buttonColor: "#10b981",
  fontStyle: "modern",
  buttonRadius: "rounded",

  heroTemplateId: "hero-1",
  catalogTemplateId: "catalog-1",
  aboutTemplateId: "about-1",
  footerTemplateId: "footer-1",

  orderMethod: "whatsapp",
  waTemplate: "Hi, I would like to order:\n{cart_details}\n\nTotal: {total}",
  minOrder: 0,
  outOfStockDisplay: "show-sold-out",

  categories: [],
  notifications: [],
  testimonials: [],

  socials: {},
  location: "",
  deliveryAreas: "",
  deliveryFee: "",
  returnPolicy: "",

  isLive: true,
});

export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = {
  primaryColor: "#10b981",
  background: "light",
  heroLayout: "split",
  cardRadius: "pill",
  showHeroBadge: true,
};

/** Clamp hex for CSS; invalid values fall back to default emerald. */
export function normalizeHexColor(input: string, fallback = "#10b981"): string {
  const s = String(input || "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[1]!,
      g = s[2]!,
      b = s[3]!;
    return (`#${r}${r}${g}${g}${b}${b}`).toLowerCase();
  }
  return fallback;
}

export function resolveStorefrontTheme(
  state: Partial<ShopState>,
): StorefrontTheme {
  const t = state.storefrontTheme || {};
  return {
    ...DEFAULT_STOREFRONT_THEME,
    ...t,
    primaryColor: normalizeHexColor(
      state.accentColor ?? t.primaryColor ?? DEFAULT_STOREFRONT_THEME.primaryColor,
    ),
    background: t.background ?? DEFAULT_STOREFRONT_THEME.background,
    heroLayout: state.heroStyle === "banner" || state.heroStyle === "split" ? state.heroStyle : (t.heroLayout ?? DEFAULT_STOREFRONT_THEME.heroLayout),
    cardRadius: (state.buttonRadius as any) ?? t.cardRadius ?? DEFAULT_STOREFRONT_THEME.cardRadius,
    showHeroBadge:
      t.showHeroBadge ?? DEFAULT_STOREFRONT_THEME.showHeroBadge,
  };
}

export function loadStateLocal(): ShopState {
  const base = defaultShopState();
  try {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("swiftlink_state");
      if (s) return { ...base, ...JSON.parse(s) };
    }
  } catch {
    /* ignore */
  }
  return base;
}
