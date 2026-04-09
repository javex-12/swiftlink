export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  outOfStock: boolean;
  /** e.g. Tops, Shoes — used for filters and featured collection */
  category?: string;
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

/** Merchant-facing storefront appearance (customer site). */
export type StorefrontTheme = {
  /** Brand accent (hex). Buttons, badges, links. */
  primaryColor: string;
  /** Page mood */
  background: "light" | "dark";
  /** Hero: split (image beside text) or centered stack */
  heroLayout: "split" | "centered";
  /** Product card corners */
  cardRadius: "pill" | "subtle";
  showHeroBadge: boolean;
};

export type ShopState = {
  id: string | null;
  bizName: string;
  /** Public handle for /store/your-handle (lowercase, a-z 0-9 hyphen). */
  storeUsername?: string;
  /** Last slug written to swiftlink_slugs (for index cleanup when the handle changes). */
  publishedStoreSlug?: string;
  bizImage: string;
  phone: string;
  currency: string;
  products: Product[];
  deliveries: Delivery[];
  tagline: string;
  aboutUs: string;
  /** When set, matching products appear in a featured block above the catalog */
  featuredCategory?: string;
  /** Customize colors, layout, and hero on the public storefront */
  storefrontTheme?: Partial<StorefrontTheme>;
  isLive?: boolean;
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
});
