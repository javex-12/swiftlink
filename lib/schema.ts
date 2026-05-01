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
  plan?: "free" | "pro" | "business"; // New plan field
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
  storeTheme?: "light" | "dark" | "system"; // New field

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
