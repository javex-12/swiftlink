/**
 * High-resolution, production-grade stock product ideas.
 * Each idea includes realistic e-commerce attributes:
 * title, category, price, full description, cover photo, gallery, and badge.
 * Designed to let merchants populate a store in 1 tap without dummy placeholders.
 */

export interface StockProductIdea {
  id: string;
  label: string;
  name: string;
  category: string;
  price: number;
  description: string;
  url: string;
  gallery: string[];
  badge?: string;
  attributes?: { label: string; value: string }[];
}

export const STOCK_PRODUCT_IDEAS: StockProductIdea[] = [
  {
    id: "stock-1",
    label: "Classic Oxford Shirt",
    name: "Signature Oxford Cotton Shirt",
    category: "Tops & Shirts",
    price: 18500,
    description:
      "Tailored from 100% breathable organic combed cotton with button-down collar, Mother-of-pearl buttons, and structured cuffs. Built for enduring style across formal and smart-casual occasions.",
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1620012253295-c15c429f6b90?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "POPULAR",
    attributes: [{ label: "Size", value: "S, M, L, XL, XXL" }],
  },
  {
    id: "stock-2",
    label: "Retro Leather Sneakers",
    name: "Vintage Street Low-Top Sneakers",
    category: "Footwear",
    price: 42000,
    description:
      "Hand-stitched full grain Italian leather upper with cushioned EVA midsole, vulcanized gum rubber outsole, and reinforced heel counter for supreme all-day comfort and street style.",
    url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "HOT",
    attributes: [{ label: "EU Size", value: "40, 41, 42, 43, 44, 45" }],
  },
  {
    id: "stock-3",
    label: "Artisanal Leather Bag",
    name: "Full-Grain Leather Everyday Tote",
    category: "Bags & Accessories",
    price: 36000,
    description:
      "Rich vegetable-tanned genuine leather tote featuring dual reinforced carry handles, internal padded 15-inch laptop compartment, antique brass hardware, and interior zip organizing pockets.",
    url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "FEATURED",
    attributes: [{ label: "Color", value: "Cognac Brown, Midnight Black, Tan" }],
  },
  {
    id: "stock-4",
    label: "Minimalist Chronograph",
    name: "Obsidian Chronograph Wristwatch",
    category: "Watches & Jewelry",
    price: 65000,
    description:
      "Matte black surgical-grade 316L stainless steel case, scratch-resistant sapphire crystal glass, Japanese quartz movement with split-second stopwatch, and interchangeable quick-release strap.",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "NEW",
    attributes: [{ label: "Strap", value: "Black Leather, Mesh Steel, Olive NATO" }],
  },
  {
    id: "stock-5",
    label: "Polarized Sunglasses",
    name: "Architect Polarized Sunglasses",
    category: "Eyewear",
    price: 24000,
    description:
      "Handcrafted Italian cellulose acetate frames with 100% UV400 category-3 polarized composite lenses that eliminate reflective glare. Includes genuine hard case and microfiber cleaning cloth.",
    url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "TRENDING",
    attributes: [{ label: "Frame", value: "Tortoise Shell, Matte Black, Clear Crystal" }],
  },
  {
    id: "stock-6",
    label: "Heavyweight Boxy Hoodie",
    name: "Heavyweight French Terry Hoodie",
    category: "Apparel",
    price: 29500,
    description:
      "Milled from premium 480GSM loopback French terry cotton. Features double-layered hood with clean drape, ribbed side gussets, seamless kangaroo pocket, and drop-shoulder relaxed silhouette.",
    url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "BESTSELLER",
    attributes: [{ label: "Size", value: "S, M, L, XL" }],
  },
  {
    id: "stock-7",
    label: "Pour-Over Coffee Carafe",
    name: "Artisan Glass Pour-Over Brewer",
    category: "Home & Living",
    price: 19500,
    description:
      "Thermal shock-resistant borosilicate glass with polished natural walnut collar and genuine leather tie. Engineered for consistent flow extraction and clean, nuanced specialty coffee flavors.",
    url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "NEW",
    attributes: [{ label: "Capacity", value: "600ml (3-4 cups), 800ml (5-6 cups)" }],
  },
  {
    id: "stock-8",
    label: "Wireless ANC Headphones",
    name: "Studio Pro Wireless ANC Headphones",
    category: "Audio & Electronics",
    price: 78000,
    description:
      "Custom 40mm titanium composite drivers delivering high-fidelity audio, hybrid active noise cancellation with transparency mode, 35-hour battery life, and ultra-plush memory foam earcups.",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
    gallery: [
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800",
    ],
    badge: "TOP RATED",
    attributes: [{ label: "Color", value: "Matte Black, Silver Cloud, Forest Green" }],
  },
];
