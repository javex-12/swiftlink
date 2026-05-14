import type { CSSProperties } from "react";

export type ProductAttribute = {
  label: string;
  value: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string; // primary image for backwards compat
  images?: string[]; // new list of multiple images
  outOfStock: boolean;
  
  // Phase 2: Dynamic Attributes
  category?: string;
  attributes?: ProductAttribute[]; // e.g. [{label: "Size", value: "XL"}, {label: "Material", value: "Cotton"}]
  badge?: "hot" | "new" | "sale" | string;
};

export type SectionType = 
  | "hero" 
  | "catalog" 
  | "about" 
  | "testimonials" 
  | "contact" 
  | "features" 
  | "custom_code"
  | "announcement_bar";

export type PageSection = {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: Record<string, any>; // Specific data for the section (e.g. text, image URLs)
  styles?: CSSProperties; // Per-section visual overrides: HEX colors, px radii, font sizes, spacing, etc.
  isVisible: boolean;
  order: number;
  isPublic?: boolean; // For the code sharing feature
};

export type StorefrontTheme = {
  primaryColor: string;
  background: "light" | "dark";
  heroLayout: "split" | "banner";
  cardRadius: "rounded" | "pill" | "sharp";
  showHeroBadge: boolean;
  fontFamily?: string;
  glassmorphism?: boolean;
};

export type Delivery = {
  id: string;
  status: "dispatched" | "delivered" | "in-transit";
  customer: string;
  phone: string;
  item: string;
  driver: string;
  ref: string;
  lastLocation?: { lat: number; lng: number }; // For live tracking
};

export type StoreSocials = {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
};

export type StoreReview = {
  id: string;
  author_name: string;
  message: string;
  rating?: number;
  created_at: string;
  store_id: string;
};

export type AppNotification = {
    id: string;
    title: string;
    message: string;
    type: "order" | "message" | "trend" | "feedback";
    timestamp: string;
    read: boolean;
};

export type ShopState = {
  id: string | null;
  plan?: "free" | "pro" | "business"; 
  ownerId?: string;
  bizName: string;
  bizImage: string;
  storeUsername?: string; 
  phone: string;
  currency: string;
  products: Product[];
  deliveries: Delivery[];
  tagline: string;
  aboutUs: string;
  isLive?: boolean;
  storeHours?: string;
  
  // The Visual Editor Engine
  sections: PageSection[];
  
  // Global Styles
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  fontStyle?: "modern" | "bold" | "classic" | "playful";
  buttonRadius?: "rounded" | "pill" | "sharp";
  
  // Store Behaviour
  orderMethod: "whatsapp" | "paystack" | "both";
  waTemplate?: string;
  minOrder?: number;
  outOfStockDisplay?: "hide" | "show-sold-out" | "show-badge";
  
  // Business Info
  bio?: string;
  contactEmail?: string;
  contactAddress?: string;
  socials?: StoreSocials;
  location?: string;
  deliveryAreas?: string;
  deliveryFee?: string;
  returnPolicy?: string;

  // Social & Feedback
  categories: string[];
  notifications: AppNotification[];
  testimonials?: { id: string; quote: string; author: string; avatar?: string }[];
  storefrontTheme?: Partial<StorefrontTheme>;
  heroTemplate?: string;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  
  // Legacy fields (Keeping for migration safety)
  themePreset?: "custom" | "fresh" | "bold" | "minimal" | "playful";
  layoutStyle?: "grid" | "list" | "magazine";
  heroStyle?: "banner" | "minimal" | "split";
  showHero?: boolean;
  showAbout?: boolean;
};
