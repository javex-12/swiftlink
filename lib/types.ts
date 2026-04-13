export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string; // primary image for backwards compat
  images?: string[]; // new list of multiple images
  outOfStock: boolean;
  
  // Phase 2: Product Options
  category?: string;
  variants?: { name: string; options: string[] }[];
  badge?: "hot" | "new" | "sale" | string;
};

export type StorefrontTheme = {
  primaryColor: string;
  background: "light" | "dark";
  heroLayout: "split" | "banner";
  cardRadius: "rounded" | "pill" | "sharp";
  showHeroBadge: boolean;
};

export type Delivery = {
  id: string;
  status: "dispatched" | "delivered";
  customer: string;
  phone: string;
  item: string;
  driver: string;
  ref: string;
};

export type StoreSocials = {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
};

export type AppNotification = {
    id: string;
    title: string;
    message: string;
    type: "order" | "message" | "trend";
    timestamp: string;
    read: boolean;
};

export type ShopState = {
  id: string | null;
  bizName: string;
  bizImage: string;
  storeUsername?: string; // unique slug for URLs
  phone: string;
  currency: string;
  products: Product[];
  deliveries: Delivery[];
  tagline: string;
  aboutUs: string;
  isLive?: boolean;
  storeHours?: string;
  
  // Custom categories for this store
  categories: string[];
  notifications: AppNotification[];
  
  // Theme Presets
  themePreset?: "custom" | "fresh" | "bold" | "minimal" | "playful";

  // Visual Customization (Phase 1 & 2)
  accentColor?: string;
  fontStyle?: "modern" | "bold" | "classic" | "playful";
  layoutStyle?: "grid" | "list" | "magazine";
  heroStyle?: "banner" | "minimal" | "split";
  buttonRadius?: "rounded" | "pill" | "sharp";
  bgStyle?: "white" | "light-tint" | "pattern";
  imageShape?: "square" | "rounded" | "circle";
  logoSize?: "small" | "medium" | "large";
  priceStyle?: "plain" | "bold" | "strikethrough";

  // Store Behaviour
  orderMethod: "whatsapp" | "paystack" | "both";
  waTemplate?: string;
  minOrder?: number;
  outOfStockDisplay?: "hide" | "show-sold-out" | "show-badge";
  addButtonStyle?: "icon-only" | "icon-text" | "text-only";
  showQtySelector?: boolean;
  showProductShare?: boolean;

  // Marketing
  announcement: string;
  announcementEnabled?: boolean;
  featuredProductId?: number | null;
  promoTimer?: string; // ISO date string for countdown
  trustBadges?: { fastDelivery?: boolean; securePayment?: boolean; verifiedSeller?: boolean };
  testimonials?: { id: string; quote: string; author: string }[];
  showWABubble?: boolean;

  // Business Info
  socials?: StoreSocials;
  location?: string;
  deliveryAreas?: string;
  deliveryFee?: string;
  returnPolicy?: string;

  // Toggles
  showHero?: boolean;
  showAbout?: boolean;

  // Legacy compatibility for components not yet overhauled
  storefrontTheme?: Partial<StorefrontTheme>;
};

export const defaultShopState = (): ShopState => ({
  id: null,
  bizName: "",
  bizImage: "",
  phone: "",
  currency: "₦",
  products: [],
  deliveries: [],
  tagline: "Premium Products",
  aboutUs: "Store launched on SwiftLink.",
  
  themePreset: "custom",
  accentColor: "#10b981",
  fontStyle: "modern",
  layoutStyle: "grid",
  heroStyle: "banner",
  buttonRadius: "rounded",
  bgStyle: "white",
  imageShape: "rounded",
  logoSize: "medium",
  priceStyle: "bold",

  orderMethod: "whatsapp",
  waTemplate: "Hi, I would like to order:\n{cart_details}\n\nTotal: {total}",
  minOrder: 0,
  outOfStockDisplay: "show-sold-out",
  addButtonStyle: "icon-text",
  showQtySelector: true,
  showProductShare: false,

  announcement: "",
  announcementEnabled: false,
  featuredProductId: null,
  promoTimer: "",
  trustBadges: { fastDelivery: false, securePayment: false, verifiedSeller: false },
  testimonials: [],
  showWABubble: true,

  socials: {},
  storeHours: "",
  location: "",
  deliveryAreas: "",
  deliveryFee: "",
  returnPolicy: "",

  showHero: true,
  showAbout: true,

  isLive: true,
  categories: [],
  notifications: [],
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
