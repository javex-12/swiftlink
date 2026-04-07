export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  outOfStock: boolean;
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
  bizImage: string;
  phone: string;
  currency: string;
  products: Product[];
  deliveries: Delivery[];
  tagline: string;
  aboutUs: string;
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
