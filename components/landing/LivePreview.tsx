"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  Home,
  Search,
  User,
  Package,
  Star,
  ChevronLeft,
  CheckCircle2,
  MessageCircle,
  Truck,
  Tag,
  Zap,
  ArrowRight,
  Settings,
  Bell,
} from "lucide-react";
import { useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  priceRaw: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  color?: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Urban Hoodie",
    price: "₦45,000",
    priceRaw: 45000,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400",
    category: "Tops",
    rating: 4.8,
    reviews: 124,
    badge: "🔥 Hot",
    color: "#10b981",
  },
  {
    id: 2,
    name: "Retro Sneakers",
    price: "₦72,500",
    priceRaw: 72500,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=400",
    category: "Footwear",
    rating: 4.9,
    reviews: 89,
    badge: "✨ New",
    color: "#3b82f6",
  },
  {
    id: 3,
    name: "Cargo Pants",
    price: "₦38,000",
    priceRaw: 38000,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400",
    category: "Bottoms",
    rating: 4.5,
    reviews: 56,
    color: "#8b5cf6",
  },
  {
    id: 4,
    name: "Chain Necklace",
    price: "₦22,000",
    priceRaw: 22000,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400",
    category: "Accessories",
    rating: 4.7,
    reviews: 43,
    badge: "🏷 Sale",
    color: "#f59e0b",
  },
];

const CATS = ["All", "Tops", "Footwear", "Bottoms", "Accessories"];

type Screen = "home" | "product" | "cart" | "success" | "search" | "profile";
type CartItem = Product & { qty: number };

export const LivePreview = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [cat, setCat] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "cart" | "profile">("home");

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.priceRaw * i.qty, 0);

  const filtered = PRODUCTS.filter((p) => {
    if (cat !== "All" && p.category !== cat) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const addToCart = (p: Product) =>
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      return ex
        ? prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...p, qty: 1 }];
    });

  const removeFromCart = (id: number) =>
    setCart((prev) => {
      const ex = prev.find((i) => i.id === id);
      if (!ex) return prev;
      return ex.qty === 1 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
    });

  const qty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;

  const goTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setScreen(tab === "home" ? "home" : tab === "search" ? "search" : tab === "cart" ? "cart" : "profile");
  };

  const sendOrder = () => {
    const lines = cart.map((i) => `• ${i.name} x${i.qty} — ${i.price}`).join("\n");
    window.open(
      `https://wa.me/2348000000000?text=${encodeURIComponent(`🛒 NEW ORDER\n\n${lines}\n\n💰 Total: ₦${totalPrice.toLocaleString()}\n_Via SwiftLink Pro_`)}`
    );
    setCart([]);
    setScreen("success");
    setTimeout(() => { setScreen("home"); setActiveTab("home"); }, 3000);
  };

  const pageAnim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 },
  };

  return (
    <div
      className="relative mx-auto"
      style={{ width: 280, aspectRatio: "9/19.5" }}
    >
      {/* ── Outer Phone Shell ─────────────────────────────────────────── */}
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-[#1c1c1e] to-[#111] shadow-[0_60px_120px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col border border-white/[0.06]">
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[80px] w-[3px] h-[26px] bg-[#2a2a2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[116px] w-[3px] h-[40px] bg-[#2a2a2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[164px] w-[3px] h-[40px] bg-[#2a2a2e] rounded-l-sm" />
        <div className="absolute -right-[3px] top-[130px] w-[3px] h-[52px] bg-[#2a2a2e] rounded-r-sm" />

        {/* Status bar */}
        <div className="flex-shrink-0 h-8 flex items-end pb-1 justify-between px-5">
          <span className="text-[9px] font-black text-white/80">9:41</span>
          <div className="w-20 h-5 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px] items-end h-3">
              {[2, 3, 4, 5].map((h, i) => (
                <div key={h} className="w-[2px] rounded-sm bg-white/80" style={{ height: h }} />
              ))}
            </div>
            <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1.5 8.5C5.2 4.8 10.3 2.5 12 2.5s6.8 2.3 10.5 6l-1.5 1.5C17.6 6.6 14.9 5 12 5S6.4 6.6 3 10l-1.5-1.5z"/>
              <path d="M4.5 11.5c2.1-2.1 5-3.5 7.5-3.5s5.4 1.4 7.5 3.5L18 13c-1.6-1.6-3.8-2.5-6-2.5s-4.4.9-6 2.5l-1.5-1.5z"/>
              <circle cx="12" cy="18" r="2.5"/>
            </svg>
            <div className="flex items-center gap-0.5 bg-white/10 rounded-sm px-0.5">
              <div className="w-4 h-2 rounded-[2px] border border-white/40 flex items-center">
                <div className="h-full w-[70%] bg-green-400 rounded-[1px]" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Screen Content ───────────────────────────────────────────── */}
        <div className="flex-1 bg-[#f2f2f7] overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">

            {/* HOME ─────────────────────────────────────────────────────── */}
            {screen === "home" && (
              <motion.div key="home" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden bg-[#f2f2f7]">
                {/* Store header */}
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
                        <Zap size={12} fill="white" className="text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-gray-900 leading-none">EliteFashion</p>
                        <p className="text-[8px] text-emerald-500 font-bold leading-none mt-0.5">● Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => goTab("search")}>
                        <Search size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => goTab("cart")} className="relative">
                        <ShoppingCart size={14} className="text-gray-500" />
                        <AnimatePresence>
                          {totalItems > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 text-white text-[7px] font-black rounded-full flex items-center justify-center"
                            >
                              {totalItems}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {CATS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black transition-all active:scale-95 ${
                          cat === c ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 custom-scrollbar">
                  {/* Hero Banner */}
                  <div className="relative rounded-2xl overflow-hidden mb-3 bg-gray-900" style={{ aspectRatio: "16/7" }}>
                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"
                      className="w-full h-full object-cover opacity-70"
                      alt="Banner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex flex-col justify-center px-4">
                      <p className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">New Drop</p>
                      <p className="text-white text-[13px] font-black leading-tight mt-0.5">The SS26<br />Collection</p>
                      <button
                        onClick={() => setSelected(PRODUCTS[0])}
                        className="mt-2 flex items-center gap-1 text-white text-[8px] font-black bg-emerald-500 rounded-full px-2.5 py-1 w-fit active:scale-95 transition-transform"
                      >
                        Shop <ArrowRight size={8} />
                      </button>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {filtered.map((p) => (
                      <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div onClick={() => { setSelected(p); setScreen("product"); }} className="w-full text-left cursor-pointer">
                          <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative">
                            <div className="aspect-square overflow-hidden relative">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                              {p.badge && (
                                <span className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[7px] font-black px-1.5 py-0.5 rounded-full">
                                  {p.badge}
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setWishlist((w) => w.includes(p.id) ? w.filter((x) => x !== p.id) : [...w, p.id]); }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center active:scale-90"
                              >
                                <Heart size={9} className={wishlist.includes(p.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                              </button>
                            </div>

                            <div className="p-2">
                              <p className="text-[9px] font-black text-gray-900 truncate leading-none">{p.name}</p>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Star size={7} className="fill-amber-400 text-amber-400" />
                                <span className="text-[7px] font-bold text-gray-400">{p.rating}</span>
                                <span className="text-[6px] text-gray-300 ml-0.5">({p.reviews})</span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-[10px] font-black text-emerald-600">{p.price}</p>
                                {qty(p.id) === 0 ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                    className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                  >
                                    <Plus size={10} />
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); removeFromCart(p.id); }} className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">
                                      <Minus size={7} />
                                    </button>
                                    <span className="text-[9px] font-black w-3 text-center">{qty(p.id)}</span>
                                    <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center active:scale-90">
                                      <Plus size={7} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                      <Package size={24} />
                      <p className="text-[9px] font-bold mt-2">Nothing here</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PRODUCT DETAIL ──────────────────────────────────────────── */}
            {screen === "product" && selected && (
              <motion.div key="product" {...pageAnim} className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                <div className="relative flex-shrink-0" style={{ height: 180 }}>
                  <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <button onClick={() => setScreen("home")} className="absolute top-3 left-3 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center active:scale-90">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setWishlist((w) => w.includes(selected.id) ? w.filter((x) => x !== selected.id) : [...w, selected.id])} className="absolute top-3 right-3 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center active:scale-90">
                    <Heart size={11} className={wishlist.includes(selected.id) ? "fill-red-500 text-red-500" : "text-gray-500"} />
                  </button>
                  {selected.badge && (
                    <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[7px] font-black px-2 py-0.5 rounded-full">{selected.badge}</span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 leading-tight">{selected.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={8} className={i < Math.floor(selected.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                        ))}
                        <span className="text-[8px] text-gray-400 font-bold ml-1">{selected.rating} ({selected.reviews})</span>
                      </div>
                    </div>
                    <p className="text-[15px] font-black text-emerald-600">{selected.price}</p>
                  </div>

                  <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
                    Premium quality {selected.name.toLowerCase()} designed for the modern lifestyle. Crafted with top-tier materials for comfort and durability.
                  </p>

                  {/* Size selector */}
                  <div className="mt-3">
                    <p className="text-[8px] font-black text-gray-800 uppercase tracking-widest mb-1.5">Size</p>
                    <div className="flex gap-1.5">
                      {["S", "M", "L", "XL"].map((s, i) => (
                        <button key={s} className={`w-8 h-8 rounded-xl text-[8px] font-black border transition-all active:scale-95 ${i === 1 ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Qty + add */}
                  <div className="mt-4 space-y-2">
                    {qty(selected.id) === 0 ? (
                      <button
                        onClick={() => addToCart(selected)}
                        className="w-full py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <ShoppingCart size={11} /> Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-5 py-3">
                        <button onClick={() => removeFromCart(selected.id)} className="active:scale-90"><Minus size={12} /></button>
                        <span className="text-xs font-black">{qty(selected.id)}</span>
                        <button onClick={() => addToCart(selected)} className="active:scale-90 text-emerald-500"><Plus size={12} /></button>
                      </div>
                    )}
                    <button
                      onClick={() => window.open(`https://wa.me/2348000000000?text=${encodeURIComponent(`Hi! I'm interested in ${selected.name} — ${selected.price}`)}`)}
                      className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <MessageCircle size={11} /> Chat on WhatsApp
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEARCH ──────────────────────────────────────────────────── */}
            {screen === "search" && (
              <motion.div key="search" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06]">
                  <p className="text-[11px] font-black text-gray-900 mb-2">Search</p>
                  <div className="relative">
                    <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Try 'hoodie' or 'sneakers'..."
                      className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-xl text-[9px] font-bold text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelected(p); setScreen("product"); }}
                      className="w-full flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <img src={p.image} alt={p.name} className="w-11 h-11 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-[9px] font-black text-gray-900 leading-none">{p.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={7} className="fill-amber-400 text-amber-400" />
                          <span className="text-[7px] text-gray-400 font-bold">{p.rating}</span>
                        </div>
                        <p className="text-[9px] font-black text-emerald-600 mt-0.5">{p.price}</p>
                      </div>
                      <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                  {query && PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).length === 0 && (
                    <div className="text-center py-8 text-gray-300">
                      <Search size={24} className="mx-auto mb-2" />
                      <p className="text-[9px] font-bold">No results for &quot;{query}&quot;</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* CART ────────────────────────────────────────────────────── */}
            {screen === "cart" && (
              <motion.div key="cart" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06] flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-900">Cart</p>
                    {totalItems > 0 && (
                      <span className="text-[8px] font-bold text-gray-400">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <ShoppingCart size={22} className="text-gray-300" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400">Cart is empty</p>
                    <button onClick={() => goTab("home")} className="mt-3 px-5 py-2 bg-gray-900 text-white text-[9px] font-black rounded-full active:scale-95 transition-transform">
                      Browse Store
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                      <AnimatePresence>
                        {cart.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5"
                          >
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black text-gray-900 truncate leading-none">{item.name}</p>
                              <p className="text-[9px] font-black text-emerald-600 mt-1">₦{(item.priceRaw * item.qty).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => removeFromCart(item.id)} className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center active:scale-90"><Minus size={7} /></button>
                              <span className="text-[9px] font-black w-3 text-center">{item.qty}</span>
                              <button onClick={() => addToCart(item)} className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center active:scale-90"><Plus size={7} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Summary */}
                      <div className="bg-white rounded-2xl p-3 shadow-sm mt-1">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-bold text-gray-400">
                            <span>Subtotal</span><span>₦{totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-gray-400">
                            <span>Delivery</span><span className="text-emerald-500">Free</span>
                          </div>
                          <div className="border-t border-gray-50 pt-1.5 flex justify-between text-[9px] font-black text-gray-900">
                            <span>Total</span><span className="text-emerald-600">₦{totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#f2f2f7] flex-shrink-0">
                      <button
                        onClick={sendOrder}
                        className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-[9px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                      >
                        <MessageCircle size={11} className="text-emerald-400" />
                        Order via WhatsApp · ₦{totalPrice.toLocaleString()}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* SUCCESS ─────────────────────────────────────────────────── */}
            {screen === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-3 p-6">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, repeat: 2 }} className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </motion.div>
                <p className="text-sm font-black text-gray-900">Order Sent! 🎉</p>
                <p className="text-[9px] text-gray-400 text-center font-medium">Your order was sent via WhatsApp. Expect a confirmation soon.</p>
              </motion.div>
            )}

            {/* PROFILE ─────────────────────────────────────────────────── */}
            {screen === "profile" && (
              <motion.div key="profile" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06]">
                  <p className="text-[11px] font-black text-gray-900">My Account</p>
                </div>

                {/* Profile card */}
                <div className="m-3 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow">A</div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900">Ada Obi</p>
                    <p className="text-[8px] text-gray-400 font-bold">ada@gmail.com</p>
                  </div>
                  <button className="ml-auto w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">
                    <Settings size={11} className="text-gray-500" />
                  </button>
                </div>

                <div className="mx-3 space-y-1.5">
                  {[
                    { icon: Package, label: "My Orders", sub: "3 Orders", color: "bg-blue-100 text-blue-500" },
                    { icon: Heart, label: "Wishlist", sub: `${wishlist.length} saved`, color: "bg-red-100 text-red-500" },
                    { icon: Truck, label: "Track Delivery", sub: "1 active", color: "bg-amber-100 text-amber-500" },
                    { icon: MessageCircle, label: "Support Chat", sub: "We're online", color: "bg-emerald-100 text-emerald-500" },
                    { icon: Bell, label: "Notifications", sub: "4 unread", color: "bg-purple-100 text-purple-500" },
                  ].map(({ icon: Icon, label, sub, color }) => (
                    <button key={label} className="w-full flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm active:scale-[0.98] transition-transform">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={13} />
                      </div>
                      <span className="flex-1 text-left text-[9px] font-black text-gray-800">{label}</span>
                      <span className="text-[8px] font-bold text-gray-400">{sub}</span>
                      <ArrowRight size={10} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom Nav Bar ───────────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-black/[0.06] flex items-center" style={{ height: 50, paddingBottom: 0 }}>
          {([
            { tab: "home", Icon: Home, label: "Store" },
            { tab: "search", Icon: Search, label: "Search" },
            { tab: "cart", Icon: ShoppingCart, label: "Cart", badge: totalItems },
            { tab: "profile", Icon: User, label: "Profile" },
          ] as any[]).map(({ tab, Icon, label, badge }) => (
            <button
              key={tab}
              onClick={() => goTab(tab)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative active:scale-90 transition-transform ${
                activeTab === tab ? "text-gray-900" : "text-gray-300"
              }`}
            >
              <Icon size={15} strokeWidth={activeTab === tab ? 2.5 : 1.5} />
              <span className={`text-[7px] font-black ${activeTab === tab ? "text-gray-900" : "text-gray-300"}`}>{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1.5 right-[25%] w-3.5 h-3.5 bg-emerald-500 text-white text-[6px] font-black rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
              {activeTab === tab && (
                <motion.div layoutId="nav-dot" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* iPhone home indicator */}
        <div className="flex-shrink-0 bg-white flex items-center justify-center" style={{ height: 18 }}>
          <div className="w-20 h-1 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};
