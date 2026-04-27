"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ChevronLeft, 
  Package, 
  MessageCircle, 
  Zap, 
  Loader2, 
  Star, 
  Heart, 
  Home, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { ShopState, Product } from "@/lib/types";

type Screen = "home" | "product" | "cart" | "success" | "search";

export function CustomerStorefront({
  shopId,
}: {
  shopId?: string;
}) {
  const { 
      state, 
      cart, 
      updateCart, 
      cartItemCount,
      sendWhatsAppOrder
  } = useSwiftLink();

  const [publicState, setPublicState] = useState<ShopState | null>(null);
  const effectiveState = shopId ? publicState : state;
  
  const [screen, setScreen] = useState<Screen>("home");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "cart">("home");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    if (!shopId) {
      setPublicState(null);
      return;
    }
    
    supabase
      .from('stores')
      .select('state_json')
      .eq('id', shopId)
      .single()
      .then(({ data }) => {
        if (data?.state_json) {
           const s = data.state_json as ShopState;
           setPublicState({ ...s, id: shopId });
        }
      });

    const channel = supabase
      .channel(`customer-shop-${shopId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${shopId}` }, payload => {
        if (payload.new?.state_json) {
          const data = payload.new.state_json as Partial<ShopState>;
          setPublicState((prev) => ({ ...(prev || ({} as ShopState)), ...(data as ShopState), id: shopId }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  const categories: string[] = useMemo(() => {
      if (!effectiveState) return ["All"];
      const custom = effectiveState.categories || [];
      const collected = Array.from(new Set((effectiveState.products || []).map(p => p.category).filter(Boolean)));
      return Array.from(new Set(["All", ...custom, ...(collected as string[])]));
  }, [effectiveState]);

  const filteredProducts = useMemo(() => {
    if (!effectiveState) return [];
    return effectiveState.products.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const shouldHide = effectiveState.outOfStockDisplay === "hide" && p.outOfStock;
        return matchesCat && matchesSearch && !shouldHide;
    });
  }, [effectiveState, activeCategory, searchQuery]);

  const totalPrice = useMemo(() => {
    if (!effectiveState) return 0;
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const p = effectiveState.products.find(x => x.id === Number(id));
      return total + (p?.price || 0) * qty;
    }, 0);
  }, [cart, effectiveState]);

  const goTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setScreen(tab === "home" ? "home" : tab === "search" ? "search" : "cart");
  };

  const handleOrder = () => {
    sendWhatsAppOrder();
    setScreen("success");
    setTimeout(() => {
      setScreen("home");
      setActiveTab("home");
    }, 3000);
  };

  if (!effectiveState && shopId) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Storefront…</p>
        </div>
    );
  }

  const s = effectiveState!;
  const pageAnim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 },
  };

  const qty = (id: number) => cart[id] || 0;

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex justify-center selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md bg-[#f2f2f7] min-h-screen flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.1)] border-x border-black/[0.02]">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#f2f2f7]">
          <AnimatePresence mode="wait">
            
            {/* HOME SCREEN */}
            {screen === "home" && (
              <motion.div key="home" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden bg-[#f2f2f7]">
                {/* Store header - EXACT DEMO STYLE */}
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06] sticky top-0 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm overflow-hidden">
                        {s.bizImage ? <img src={s.bizImage} className="w-full h-full object-cover" /> : <Zap size={12} fill="white" className="text-white" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-gray-900 leading-none">{s.bizName || "EliteFashion"}</p>
                        <p className="text-[8px] text-emerald-500 font-bold leading-none mt-0.5">● Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => goTab("search")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <Search size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => goTab("cart")} className="relative p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <ShoppingCart size={14} className="text-gray-500" />
                        <AnimatePresence>
                          {cartItemCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white text-[7px] font-black rounded-full flex items-center justify-center"
                            >
                              {cartItemCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>

                  {/* Categories - EXACT DEMO STYLE */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setActiveCategory(c)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black transition-all active:scale-95 ${
                          activeCategory === c ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Grid - EXACT DEMO STYLE */}
                <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 custom-scrollbar">
                  {/* Hero Banner - EXACT DEMO STYLE */}
                  <div className="relative rounded-2xl overflow-hidden mb-3 bg-gray-900 shadow-sm" style={{ aspectRatio: "16/7" }}>
                    <img
                      src={s.bizImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"}
                      className="w-full h-full object-cover opacity-70"
                      alt="Banner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex flex-col justify-center px-4">
                      <p className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">New Drop</p>
                      <p className="text-white text-[13px] font-black leading-tight mt-0.5">{s.tagline || "The SS26 Collection"}</p>
                      <button
                        onClick={() => {
                            if (filteredProducts.length > 0) {
                              setSelectedProduct(filteredProducts[0]);
                              setScreen("product");
                            }
                        }}
                        className="mt-2 flex items-center gap-1 text-white text-[8px] font-black bg-emerald-500 rounded-full px-2.5 py-1 w-fit active:scale-95 transition-transform"
                      >
                        Shop <ArrowRight size={8} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredProducts.map((p) => (
                      <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div onClick={() => { setSelectedProduct(p); setScreen("product"); }} className="w-full text-left cursor-pointer">
                          <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative border border-black/[0.01]">
                            <div className="aspect-square overflow-hidden relative">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                              {p.badge && (
                                <span className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                  {p.badge}
                                </span>
                              )}
                              <button
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setWishlist(w => w.includes(p.id) ? w.filter(x => x !== p.id) : [...w, p.id]); 
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center active:scale-90"
                              >
                                <Heart size={9} className={wishlist.includes(p.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                              </button>
                            </div>

                            <div className="p-2">
                              <p className="text-[9px] font-black text-gray-900 truncate leading-none">{p.name}</p>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Star size={7} className="fill-amber-400 text-amber-400" />
                                <span className="text-[7px] font-bold text-gray-400">4.9</span>
                                <span className="text-[6px] text-gray-300 ml-0.5">(86)</span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-[10px] font-black text-emerald-600">{s.currency}{Number(p.price).toLocaleString()}</p>
                                {qty(p.id) === 0 ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }}
                                    className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                  >
                                    <Plus size={10} />
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); updateCart(p.id, -1); }} className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">
                                      <Minus size={7} />
                                    </button>
                                    <span className="text-[9px] font-black w-3 text-center">{qty(p.id)}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }} className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center active:scale-90">
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

                  {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                      <Package size={24} />
                      <p className="text-[9px] font-bold mt-2 uppercase tracking-widest">Nothing here</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PRODUCT DETAIL SCREEN - EXACT DEMO STYLE */}
            {screen === "product" && selectedProduct && (
              <motion.div key="product" {...pageAnim} className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                <div className="relative flex-shrink-0" style={{ height: 180 }}>
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <button onClick={() => setScreen("home")} className="absolute top-3 left-3 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center active:scale-90">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setWishlist(w => w.includes(selectedProduct.id) ? w.filter(x => x !== selectedProduct.id) : [...w, selectedProduct.id])} className="absolute top-3 right-3 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center active:scale-90">
                    <Heart size={11} className={wishlist.includes(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-gray-500"} />
                  </button>
                  {selectedProduct.badge && (
                    <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase">{selectedProduct.badge}</span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 leading-tight">{selectedProduct.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={8} className={i < 4 ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                        ))}
                        <span className="text-[8px] text-gray-400 font-bold ml-1">4.9 (86 Reviews)</span>
                      </div>
                    </div>
                    <p className="text-[15px] font-black text-emerald-600">{s.currency}{Number(selectedProduct.price).toLocaleString()}</p>
                  </div>

                  <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
                    {selectedProduct.description || `Premium quality ${selectedProduct.name.toLowerCase()} designed for the modern lifestyle. Crafted with top-tier materials for comfort and durability.`}
                  </p>

                  {/* Size selector */}
                  <div className="mt-3">
                    <p className="text-[8px] font-black text-gray-800 uppercase tracking-widest mb-1.5">Size</p>
                    <div className="flex gap-1.5">
                      {["S", "M", "L", "XL"].map((size, i) => (
                        <button key={size} className={`w-8 h-8 rounded-xl text-[8px] font-black border transition-all active:scale-95 ${i === 1 ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {qty(selectedProduct.id) === 0 ? (
                      <button
                        onClick={() => updateCart(selectedProduct.id, 1)}
                        className="w-full py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-black/10"
                      >
                        <ShoppingCart size={11} /> Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-5 py-3">
                        <button onClick={() => updateCart(selectedProduct.id, -1)} className="active:scale-90"><Minus size={12} /></button>
                        <span className="text-xs font-black">{qty(selectedProduct.id)}</span>
                        <button onClick={() => updateCart(selectedProduct.id, 1)} className="active:scale-90 text-emerald-500"><Plus size={12} /></button>
                      </div>
                    )}
                    <button
                      onClick={handleOrder}
                      className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                    >
                      <MessageCircle size={11} /> Chat on WhatsApp
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEARCH SCREEN - EXACT DEMO STYLE */}
            {screen === "search" && (
              <motion.div key="search" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06]">
                  <p className="text-[11px] font-black text-gray-900 mb-2">Search</p>
                  <div className="relative">
                    <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Try 'hoodie' or 'sneakers'..."
                      className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-xl text-[9px] font-bold text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {searchQuery && filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setScreen("product"); }}
                      className="w-full flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <img src={p.image} alt={p.name} className="w-11 h-11 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-[9px] font-black text-gray-900 leading-none">{p.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={7} className="fill-amber-400 text-amber-400" />
                          <span className="text-[7px] font-bold text-gray-400">4.9</span>
                        </div>
                        <p className="text-[9px] font-black text-emerald-600 mt-0.5">{s.currency}{Number(p.price).toLocaleString()}</p>
                      </div>
                      <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                  {searchQuery && filteredProducts.length === 0 && (
                    <div className="text-center py-10 text-gray-300">
                      <Search size={24} className="mx-auto mb-2" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">No results</p>
                    </div>
                  )}
                  {!searchQuery && (
                    <div className="text-center py-10 text-gray-300">
                      <Search size={24} className="mx-auto mb-2" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">Type to search</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* CART SCREEN - EXACT DEMO STYLE */}
            {screen === "cart" && (
              <motion.div key="cart" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md px-4 pt-2 pb-3 border-b border-black/[0.06] flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-900">Cart</p>
                    {cartItemCount > 0 && (
                      <span className="text-[8px] font-bold text-gray-400">{cartItemCount} item{cartItemCount > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                {cartItemCount === 0 ? (
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
                        {Object.entries(cart).map(([id, q]) => {
                          const p = s.products.find(x => x.id === Number(id));
                          if (!p || q <= 0) return null;
                          return (
                            <motion.div
                              key={id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-white rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5"
                            >
                              <img src={p.image} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-gray-900 truncate leading-none">{p.name}</p>
                                <p className="text-[9px] font-black text-emerald-600 mt-1">{s.currency}{(Number(p.price) * q).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => updateCart(p.id, -1)} className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center active:scale-90"><Minus size={7} /></button>
                                <span className="text-[9px] font-black w-3 text-center">{q}</span>
                                <button onClick={() => updateCart(p.id, 1)} className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center active:scale-90"><Plus size={7} /></button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      <div className="bg-white rounded-2xl p-3 shadow-sm mt-1">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-bold text-gray-400">
                            <span>Subtotal</span><span>{s.currency}{totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-gray-400">
                            <span>Delivery</span><span className="text-emerald-500">Free</span>
                          </div>
                          <div className="border-t border-gray-50 pt-1.5 flex justify-between text-[9px] font-black text-gray-900">
                            <span>Total</span><span className="text-emerald-600">{s.currency}{totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#f2f2f7] flex-shrink-0">
                      <button
                        onClick={handleOrder}
                        className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-[9px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                      >
                        <MessageCircle size={11} className="text-emerald-400" />
                        Order via WhatsApp · {s.currency}{totalPrice.toLocaleString()}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* SUCCESS SCREEN - EXACT DEMO STYLE */}
            {screen === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-3 p-6 text-center">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, repeat: 2 }} className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </motion.div>
                <p className="text-sm font-black text-gray-900">Order Sent</p>
                <p className="text-[9px] text-gray-400 text-center font-medium">Your order was sent via WhatsApp. Expect a confirmation soon.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION BAR - EXACT DEMO STYLE */}
        <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-black/[0.06] flex items-center" style={{ height: 50, paddingBottom: 0 }}>
          {[
            { id: "home", icon: Home, label: "Store" },
            { id: "search", icon: Search, label: "Search" },
            { id: "cart", icon: ShoppingCart, label: "Cart", badge: cartItemCount },
          ].map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => goTab(id as any)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative active:scale-90 transition-transform ${
                activeTab === id ? "text-gray-900" : "text-gray-300"
              }`}
            >
              <Icon size={15} strokeWidth={activeTab === id ? 2.5 : 1.5} />
              <span className={`text-[7px] font-black ${activeTab === id ? "text-gray-900" : "text-gray-300"}`}>{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1.5 right-[25%] w-3.5 h-3.5 bg-emerald-500 text-white text-[6px] font-black rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
              {activeTab === id && (
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

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
