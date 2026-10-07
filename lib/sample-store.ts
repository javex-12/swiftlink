/**
 * Sample Store Data for Template Preview
 *
 * Fictional store with ~8 products, categories, bio, and CSS/SVG-generated placeholder images.
 * Used strictly in template previews (in Onboarding Step 3 and the Design tab).
 * NEVER written to database, NEVER creates inquiries, NEVER counts in analytics.
 */

import type { Product, ShopState } from "./schema";
import { STOCK_PRODUCT_IDEAS } from "./stock-ideas";

export function getSampleProducts(currency: string = "NGN"): Product[] {
  // Major unit prices scaled sensibly
  const isNgn = currency === "NGN";
  const mult = isNgn ? 1 : 0.001; // e.g. 15000 NGN or 15 USD/GBP

  return STOCK_PRODUCT_IDEAS.map((idea, index) => ({
    id: 9001 + index,
    name: idea.name,
    price: Math.round(idea.price * mult),
    description: idea.description,
    category: idea.category,
    image: idea.url,
    images: [idea.url, ...idea.gallery],
    badge: idea.badge,
    outOfStock: false,
    attributes: idea.attributes,
  }));
}

export function getSampleShopState(templateId: string = "editorial", currency: string = "NGN"): ShopState {
  return {
    id: "sample-preview-store",
    ownerId: "sample-preview-user",
    bizName: "Aura Goods & Co.",
    storeUsername: "aura-goods",
    tagline: "Modern essentials for living, apparel and bespoke lifestyle.",
    aboutUs: "Founded in 2022, Aura Goods & Co. curates premium, timeless everyday essentials designed to last. Every garment, accessory, and object is hand-selected with high craftsmanship standards and delivered nationwide with tracking.",
    bio: "Minimalist fashion, leather goods, and refined objects for daily living.",
    phone: "+2348123456789",
    currency: currency,
    websiteTemplateId: templateId as any,
    isLive: true,
    accentColor: "#19C37D",
    bgColor: "#0A1210",
    surfaceColor: "#111C18",
    textColor: "#E8F1EC",
    buttonColor: "#19C37D",
    buttonRadius: "rounded",
    fontStyle: "modern",
    sections: [],
    notifications: [],
    heroTitle: "Timeless Quality for Daily Life",
    heroSubtitle: "Curated apparel, footwear, leather goods and objects. Instant order confirmation on WhatsApp.",
    heroButtonText: "Explore Collection",
    heroImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
    bizImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400",
    orderMethod: "whatsapp",
    waTemplate: "Hello Aura Goods, I would like to order: {product} for {price}. Options: {option}.",
    categories: ["All", "Tops & Shirts", "Footwear", "Bags & Accessories", "Watches & Jewelry", "Apparel", "Home & Living"],
    deliveryAreas: "Lagos, Abuja, Port Harcourt, and nationwide delivery",
    deliveryFee: "Free on orders over ₦50,000",
    location: "Victoria Island, Lagos, Nigeria",
    products: getSampleProducts(currency),
  };
}
