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
