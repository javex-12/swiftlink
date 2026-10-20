import type { CSSProperties } from "react";
import type { WebsiteTemplateId } from "./theme/templates";
import type { DiscountCode } from "./discounts";

export type ProductAttribute = {
  label: string;
  value: string;
};

/**
 * A question on a service's price-request form. The merchant writes these, so
 * the form asks what that particular business needs to quote the job rather
 * than a fixed set of fields that only fit some trades.
 */
export type ProductRequestQuestion = {
  id: string;
  label: string;
  required?: boolean;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string; // primary image for backwards compat
  images?: string[]; // new list of multiple images
  outOfStock: boolean;

  /**
   * `fixed` (default) sells at `price`. `quote` is a service whose price depends
   * on the job: the storefront prints "Ask for price" and opens a request form
   * instead of the cart (see `lib/product-pricing.ts`).
   */
  priceType?: "fixed" | "quote";

  /**
   * The buyer questions for a `quote` product, in the merchant's own words.
   * Absent means "use the default set"; an empty array means the merchant
   * removed them all and only wants a name and phone.
   */
  requestQuestions?: ProductRequestQuestion[];
  
  // Phase 2: Dynamic Attributes
  category?: string;
  attributes?: ProductAttribute[]; // e.g. [{label: "Size", value: "XL"}, {label: "Material", value: "Cotton"}]
  badge?: "hot" | "new" | "sale" | string;

  /**
   * Downgrade hiding. Never delete anything: when a plan drops below the
   * catalogue limit, the products the vendor did not keep visible stay in state
   * with `visible: false`. Absent means visible (see `lib/plans.ts`).
   */
  visible?: boolean;
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
  ownerName?: string;
  bizName: string;
  bizImage: string;
  storeUsername?: string; 
  phone: string;
  currency: string;
  products: Product[];
  tagline: string;
  aboutUs: string;
  isLive?: boolean;
  accountStatus?: "active" | "suspended" | "banned";
  onboarding_step?: number;
  ask_buyer_details?: boolean;

  /**
   * Billing lifecycle, mirrored from the `stores` row. `planGraceUntil` is set
   * when a card payment fails; the plan is untouched until it passes.
   * `planLapsedAt` is set once the plan was actually reduced, and permanently
   * opts the store out of inactivity cleanup (`lib/plans.ts`).
   */
  planGraceUntil?: string | null;
  planLapsedAt?: string | null;

  /** The chosen website template — three complete designs, each light + dark. */
  websiteTemplateId?: WebsiteTemplateId;
  storeHours?: string;
  
  /** Custom preloader screen for Business tier storefronts */
  customPreloader?: {
    enabled?: boolean;
    text?: string;
  };
  
  // The Visual Editor Engine
  sections: PageSection[];
  
  // Global Styles
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  surfaceColor?: string; // Color for cards and inner sections
  buttonColor?: string;  // Color for primary action buttons
  fontStyle?: "modern" | "bold" | "classic" | "playful";
  buttonRadius?: "rounded" | "pill" | "sharp";
  
  // Section Templates (1-10)
  heroTemplateId?: string;
  catalogTemplateId?: string;
  aboutTemplateId?: string;
  footerTemplateId?: string;
  
  // Store Behaviour
  /**
   * Legacy single-method flag. Checkout is no longer driven by it: the buyer
   * picks a channel from whatever the store has configured (see
   * `lib/checkout-channels.ts`). Kept because it is stored in every existing
   * `state_json` blob and still feeds the SEO payment copy.
   */
  orderMethod: "whatsapp" | "paystack" | "both";
  waTemplate?: string;
  minOrder?: number;
  /**
   * Discount codes the merchant has published (`lib/discounts.ts`).
   *
   * Public on purpose: the storefront evaluates a code in the buyer's cart, so
   * the codes have to reach the browser. They are shareable by nature — the
   * secret worth protecting is never here, which is why redemption counts are
   * derived from `inquiries`, not from a client-side counter.
   */
  discountCodes?: DiscountCode[];
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
  faqItems?: { q: string; a: string }[];
  storefrontTheme?: Partial<StorefrontTheme>;
  
  // Content overrides for templates
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;

  // SEO & Social sharing meta settings
  seoTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  
  // Legacy fields (Keeping for migration safety)
  themePreset?: "custom" | "fresh" | "bold" | "minimal" | "playful";
  layoutStyle?: "grid" | "list" | "magazine";
  heroStyle?: "banner" | "minimal" | "split";
  showHero?: boolean;
  showAbout?: boolean;
};
