"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Heart, Search, Star, ChevronLeft,
  CheckCircle2, MessageCircle, Plus, Minus, ArrowRight,
  Zap, Package, Home, User,
} from "lucide-react";
import { useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  priceRaw: number;
  image: string;
  category: string;
  badge?: string;
  desc: string;
};

const ACCENT = "#10b981";

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Urban Hoodie",
    price: "₦45,000",
    priceRaw: 45000,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400",
    category: "Tops",
    badge: "🔥 HOT",
    desc: "Premium heavyweight cotton with ribbed cuffs and hem.",
  },
  {
    id: 2,
    name: "Retro Sneakers",
    price: "₦72,500",
    priceRaw: 72500,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=400",
    category: "Footwear",
    badge: "✨ NEW",
    desc: "Chunky sole silhouette for maximum street presence.",
  },
  {
    id: 3,
    name: "Cargo Pants",
    price: "₦38,000",
    priceRaw: 38000,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400",
    category: "Bottoms",
    desc: "Multi-pocket utility cut with adjustable waist.",
  },
  {
    id: 4,
    name: "Chain Necklace",
    price: "₦22,000",
    priceRaw: 22000,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400",
    category: "Accessories",
    badge: "🏷 SALE",
    desc: "18k gold-plated stainless steel, tarnish-resistant.",
  },
];

const CATS = ["All", "Tops", "Footwear", "Bottoms", "Accessories"];
type Screen = "home" | "product" | "cart" | "success";
type CartItem = Product & { qty: number };

export const LivePreview = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [cat, setCat] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "search" | "cart" | "profile">("home");

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.priceRaw * i.qty, 0);
  const filtered = PRODUCTS.filter((p) => cat === "All" || p.category === cat);

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
    setScreen(tab === "cart" ? "cart" : "home");
  };

  const pageAnim = {
    initial: { opacity: 0, x: 14 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -14 },
    transition: { duration: 0.18 },
  };

  return (
    <div className="relative mx-auto" style={{ width: 270, aspectRatio: "9/19.5" }}>
      {/* Phone shell */}
      <div className="absolute inset-0 rounded-[2.8rem] overflow-hidden flex flex-col"
        style={{ background: "#111", boxShadow: "0 60px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[76px] w-[3px] h-[24px] bg-[#2a2a2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[110px] w-[3px] h-[38px] bg-[#2a2a2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[157px] w-[3px] h-[38px] bg-[#2a2a2e] rounded-l-sm" />
        <div className="absolute -right-[3px] top-[124px] w-[3px] h-[50px] bg-[#2a2a2e] rounded-r-sm" />

        {/* Status bar */}
        <div className="flex-shrink-0 h-7 flex items-end pb-1 justify-between px-5" style={{ background: "#050505" }}>
          <span className="text-[8px] font-bold text-white/80">9:41</span>
          <div className="w-16 h-4 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px] items-end h-2.5">
              {[2, 3, 4, 5].map((h) => (
                <div key={h} className="w-[2px] rounded-sm" style={{ height: h, background: "rgba(255,255,255,0.8)" }} />
              ))}
            </div>
            <div className="w-4 h-2 rounded-[2px] border border-white/40 flex items-center ml-0.5">
              <div className="h-full w-[70%] rounded-[1px]" style={{ background: ACCENT }} />
            </div>
          </div>
        </div>

        {/* Screen area */}
        <div className="flex-1 overflow-hidden relative flex flex-col" style={{ background: "#f2f2f7" }}>
          <AnimatePresence mode="wait">

            {/* ── HOME ── */}
            {screen === "home" && (
              <motion.div key="home" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: "#f2f2f7" }}>

                {/* Sticky header */}
                <div className="flex-shrink-0 px-3.5 pt-2 pb-2.5 border-b flex items-center justify-between"
                  style={{ background: "rgba(242,242,247,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: ACCENT }}>
                      <Zap size={10} fill="white" className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-900 leading-none">EliteFashion</p>
                      <p className="text-[7px] font-bold leading-none mt-0.5" style={{ color: ACCENT }}>● Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-gray-500" />
                    <button onClick={() => goTab("cart")} className="relative">
                      <ShoppingCart size={13} className="text-gray-500" />
                      <AnimatePresence>
                        {totalItems > 0 && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 text-white text-[6px] font-black rounded-full flex items-center justify-center"
                            style={{ background: ACCENT }}>
                            {totalItems}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {/* Cinematic hero — matches real store hero-1 template */}
                  <div className="relative overflow-hidden" style={{ height: 130, background: "#050505" }}>
                    {/* Ambient glow orb */}
                    <div className="absolute inset-0" style={{
                      background: `radial-gradient(ellipse at 70% 50%, ${ACCENT}22 0%, transparent 70%)`
                    }} />
                    {/* Grid lines like real store */}
                    <div className="absolute inset-0 opacity-[0.06]" style={{
                      backgroundImage: `linear-gradient(${ACCENT} 1px, transparent 1px), linear-gradient(90deg, ${ACCENT} 1px, transparent 1px)`,
                      backgroundSize: "24px 24px"
                    }} />
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(to right, rgba(5,5,5,0.98) 35%, rgba(5,5,5,0.3) 100%)"
                    }} />
                    <div className="relative z-10 flex flex-col justify-center px-4 h-full">
                      <p className="text-[7px] font-black uppercase tracking-[0.3em] mb-1.5" style={{ color: ACCENT }}>New Drop</p>
                      <p className="text-white text-[17px] font-black leading-[1.0] uppercase tracking-tight mb-3">
                        The SS26<br />Collection
                      </p>
                      <button
                        onClick={() => { setSelected(PRODUCTS[0]); setScreen("product"); }}
                        className="flex items-center gap-1 text-white text-[7px] font-black rounded-full px-3 py-1 w-fit active:scale-95 transition-transform"
                        style={{ background: ACCENT }}>
                        Shop Now <ArrowRight size={7} />
                      </button>
                    </div>
                  </div>

                  {/* Category chips */}
                  <div className="flex gap-1.5 px-3 pt-2.5 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {CATS.map((c) => (
                      <button key={c} onClick={() => setCat(c)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-full text-[7.5px] font-black transition-all active:scale-95"
                        style={cat === c
                          ? { background: "#111", color: "#fff" }
                          : { background: "#fff", color: "#555", border: "1px solid rgba(0,0,0,0.06)" }}>
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Product grid — matches CatalogTemplate default grid */}
                  <div className="grid grid-cols-2 gap-2 px-2.5 pb-3">
                    {filtered.map((p) => (
                      <motion.button key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={() => { setSelected(p); setScreen("product"); }}
                        className="flex flex-col text-left bg-white rounded-[1.2rem] overflow-hidden shadow-sm active:scale-[0.97] transition-transform"
                        style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
                        <div className="w-full aspect-[4/5] overflow-hidden relative">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          {p.badge && (
                            <span className="absolute top-1.5 left-1.5 text-[6px] font-black text-white px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
                              {p.badge}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setWishlist((w) => w.includes(p.id) ? w.filter((x) => x !== p.id) : [...w, p.id]); }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center active:scale-90"
                            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)" }}>
                            <Heart size={8} style={wishlist.includes(p.id) ? { fill: "#ef4444", color: "#ef4444" } : { color: "#aaa" }} />
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-[8px] font-black text-gray-900 truncate uppercase tracking-tight">{p.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[9px] font-black" style={{ color: ACCENT }}>{p.price}</p>
                            {qty(p.id) === 0 ? (
                              <button onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white active:scale-90"
                                style={{ background: "#111" }}>
                                <Plus size={9} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-0.5">
                                <button onClick={(e) => { e.stopPropagation(); removeFromCart(p.id); }}
                                  className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">
                                  <Minus size={6} />
                                </button>
                                <span className="text-[8px] font-black w-3 text-center">{qty(p.id)}</span>
                                <button onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                  className="w-4 h-4 rounded-full text-white flex items-center justify-center active:scale-90"
                                  style={{ background: ACCENT }}>
                                  <Plus size={6} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PRODUCT DETAIL ── */}
            {screen === "product" && selected && (
              <motion.div key="product" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden bg-white">
                {/* Hero image */}
                <div className="relative flex-shrink-0" style={{ height: 155 }}>
                  <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
                  <button onClick={() => setScreen("home")}
                    className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}>
                    <ChevronLeft size={12} />
                  </button>
                  <button onClick={() => setWishlist((w) => w.includes(selected.id) ? w.filter((x) => x !== selected.id) : [...w, selected.id])}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}>
                    <Heart size={10} style={wishlist.includes(selected.id) ? { fill: "#ef4444", color: "#ef4444" } : { color: "#666" }} />
                  </button>
                  {selected.badge && (
                    <span className="absolute bottom-2.5 left-3 text-[6.5px] font-black text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.65)" }}>
                      {selected.badge}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3.5" style={{ scrollbarWidth: "none" }}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex-1">{selected.name}</p>
                    <p className="text-[12px] font-black ml-2" style={{ color: ACCENT }}>{selected.price}</p>
                  </div>

                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 mb-2.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={7} style={i < 4 ? { fill: "#f59e0b", color: "#f59e0b" } : { color: "#e5e7eb", fill: "#e5e7eb" }} />
                    ))}
                    <span className="text-[7px] text-gray-400 font-bold ml-1">4.8 (124)</span>
                  </div>

                  <p className="text-[8px] text-gray-400 leading-relaxed mb-3">{selected.desc}</p>

                  {/* Size row */}
                  <div className="mb-3">
                    <p className="text-[7px] font-black uppercase tracking-widest text-gray-700 mb-1.5">Size</p>
                    <div className="flex gap-1.5">
                      {["S", "M", "L", "XL"].map((s, i) => (
                        <button key={s}
                          className="w-7 h-7 rounded-lg text-[7px] font-black border transition-all active:scale-95"
                          style={i === 1
                            ? { background: "#111", color: "#fff", border: "1px solid #111" }
                            : { color: "#999", border: "1px solid #e5e7eb" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="space-y-2">
                    {qty(selected.id) === 0 ? (
                      <button onClick={() => addToCart(selected)}
                        className="w-full py-2.5 rounded-xl text-white text-[8px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                        style={{ background: "#111" }}>
                        <ShoppingCart size={9} /> Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                        style={{ background: "#f5f5f5" }}>
                        <button onClick={() => removeFromCart(selected.id)} className="active:scale-90"><Minus size={10} /></button>
                        <span className="text-[9px] font-black">{qty(selected.id)}</span>
                        <button onClick={() => addToCart(selected)} className="active:scale-90" style={{ color: ACCENT }}><Plus size={10} /></button>
                      </div>
                    )}
                    <button
                      className="w-full py-2.5 rounded-xl text-white text-[8px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      style={{ background: ACCENT }}>
                      <MessageCircle size={9} /> Order via WhatsApp
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CART ── */}
            {screen === "cart" && (
              <motion.div key="cart" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: "#f2f2f7" }}>
                <div className="flex-shrink-0 px-3.5 py-2.5 border-b flex items-center justify-between"
                  style={{ background: "rgba(242,242,247,0.95)", borderColor: "rgba(0,0,0,0.06)" }}>
                  <button onClick={() => { setScreen("home"); setActiveTab("home"); }}>
                    <ChevronLeft size={14} className="text-gray-600" />
                  </button>
                  <p className="text-[10px] font-black text-gray-900">Cart · {totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                  <div className="w-5" />
                </div>

                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#f5f5f5" }}>
                      <ShoppingCart size={18} className="text-gray-300" />
                    </div>
                    <p className="text-[9px] font-black text-gray-400">Your cart is empty</p>
                    <button onClick={() => { setScreen("home"); setActiveTab("home"); }}
                      className="px-4 py-1.5 rounded-full text-white text-[8px] font-black mt-1 active:scale-95 transition-transform"
                      style={{ background: "#111" }}>
                      Browse Store
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2" style={{ scrollbarWidth: "none" }}>
                      <AnimatePresence>
                        {cart.map((item) => (
                          <motion.div key={item.id}
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="bg-white rounded-2xl p-2 shadow-sm flex items-center gap-2"
                            style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[8px] font-black text-gray-900 truncate uppercase">{item.name}</p>
                              <p className="text-[8px] font-black mt-0.5" style={{ color: ACCENT }}>
                                ₦{(item.priceRaw * item.qty).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => removeFromCart(item.id)} className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center active:scale-90"><Minus size={7} /></button>
                              <span className="text-[8px] font-black w-3 text-center">{item.qty}</span>
                              <button onClick={() => addToCart(item)} className="w-5 h-5 rounded-full text-white flex items-center justify-center active:scale-90" style={{ background: ACCENT }}><Plus size={7} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <div className="bg-white rounded-2xl p-2.5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
                        <div className="flex justify-between text-[7.5px] font-bold text-gray-400 mb-1">
                          <span>Subtotal</span><span>₦{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[7.5px] font-bold text-gray-400 mb-1.5">
                          <span>Delivery</span><span style={{ color: ACCENT }}>Free</span>
                        </div>
                        <div className="border-t pt-1.5 flex justify-between text-[8.5px] font-black text-gray-900">
                          <span>Total</span>
                          <span style={{ color: ACCENT }}>₦{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 flex-shrink-0" style={{ background: "#f2f2f7" }}>
                      <button onClick={() => { setScreen("success"); setTimeout(() => { setCart([]); setScreen("home"); setActiveTab("home"); }, 2500); }}
                        className="w-full py-3 rounded-xl text-white text-[8px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                        style={{ background: "#111" }}>
                        <MessageCircle size={10} style={{ color: ACCENT }} />
                        Order via WhatsApp · ₦{totalPrice.toLocaleString()}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {screen === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-3 p-6">
                <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.5, repeat: 2 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: `${ACCENT}18` }}>
                  <CheckCircle2 size={26} style={{ color: ACCENT }} />
                </motion.div>
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Order Sent!</p>
                <p className="text-[8px] text-gray-400 text-center font-medium leading-relaxed">
                  Sent via WhatsApp.<br />Expect a confirmation soon.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav — matches real storefront */}
        <div className="flex-shrink-0 flex items-center border-t"
          style={{ height: 46, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(0,0,0,0.06)" }}>
          {([
            { tab: "home", Icon: Home, label: "Store" },
            { tab: "search", Icon: Search, label: "Search" },
            { tab: "cart", Icon: ShoppingCart, label: "Cart", badge: totalItems },
            { tab: "profile", Icon: User, label: "Profile" },
          ] as any[]).map(({ tab, Icon, label, badge }) => (
            <button key={tab} onClick={() => goTab(tab)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 relative active:scale-90 transition-transform">
              <Icon size={13} strokeWidth={activeTab === tab ? 2.5 : 1.5}
                style={{ color: activeTab === tab ? "#111" : "#bbb" }} />
              <span className="text-[6.5px] font-black" style={{ color: activeTab === tab ? "#111" : "#bbb" }}>{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1 right-[24%] w-3 h-3 text-white text-[5.5px] font-black rounded-full flex items-center justify-center"
                  style={{ background: ACCENT }}>
                  {badge}
                </span>
              )}
              {activeTab === tab && (
                <motion.div layoutId="nav-line"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 16, height: 2, background: "#111" }} />
              )}
            </button>
          ))}
        </div>

        {/* Home indicator */}
        <div className="flex-shrink-0 flex items-center justify-center bg-white" style={{ height: 14 }}>
          <div className="w-16 h-0.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
};
