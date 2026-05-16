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
import { SectionRenderer } from "./sections/SectionRenderer";
import { SocialHub } from "./SocialHub";

type Screen = "home" | "product" | "cart" | "success" | "search";

export function CustomerStorefront({
  shopId,
  isEditable = false,
  selectedSectionId,
  onSectionAction
}: {
  shopId?: string;
  isEditable?: boolean;
  selectedSectionId?: string | null;
  onSectionAction?: (id: string, action: string) => void;
}) {
  const { 
      state, 
      cart, 
      updateCart, 
      cartItemCount,
      sendWhatsAppOrder,
      logEvent
  } = useSwiftLink();

  const [publicState, setPublicState] = useState<ShopState | null>(null);
  const effectiveState = shopId ? publicState : state;
  
  const [screen, setScreen] = useState<"home" | "product" | "cart" | "search" | "success" | "community">("home");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "cart" | "community">("home");
  const [activeImgIdx, setActiveImgIdx] = useState(0);
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

  useEffect(() => {
    if (effectiveState?.id) {
        logEvent("view", { shopId: effectiveState.id });
    }
  }, [effectiveState?.id, logEvent]);

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
    if (tab === "home") setScreen("home");
    else if (tab === "search") setScreen("search");
    else if (tab === "cart") setScreen("cart");
    else if (tab === "community") setScreen("community");
  };

  const handleOrder = () => {
    logEvent("whatsapp_checkout", { total: totalPrice, items: Object.keys(cart).length });
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
  const isVisualCanvas = isEditable && (s.plan === "pro" || s.plan === "business");
  
  // If we are in the Visual Editor, we might want to hide the standard shell
  // and only show the dynamic sections.
  const showShell = !isVisualCanvas;

  const pageAnim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 },
  };

  const qty = (id: number) => cart[id] || 0;

  const accentColor = s.accentColor || "#10b981";
  const bgColor = s.bgColor || "#f2f2f7";
  const textColor = s.textColor || "#111827";

  // --- RENDER EARLY RETURN FOR COMMUNITY ---
  // This completely detaches SocialHub from the Storefront wrappers, 
  // guaranteeing it is 100% full screen.
  if (screen === "community" && s.id) {
    return (
      <SocialHub 
        storeId={s.id} 
        accentColor={accentColor} 
        onBack={() => { setScreen("home"); setActiveTab("home"); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center selection:bg-emerald-500 selection:text-white"
         style={{ "--theme-color": accentColor, "--bg-color": bgColor, "--text-color": textColor } as React.CSSProperties}>
      <style>{`
         .bg-emerald-500 { background-color: var(--theme-color) !important; }
         .text-emerald-500 { color: var(--theme-color) !important; }
         .border-emerald-500 { border-color: var(--theme-color) !important; }
         .ring-emerald-500 { --tw-ring-color: var(--theme-color) !important; }
         .shadow-emerald-500\\/20 { box-shadow: 0 4px 6px -1px color-mix(in srgb, var(--theme-color) 20%, transparent), 0 2px 4px -2px color-mix(in srgb, var(--theme-color) 20%, transparent) !important; }
         .fill-emerald-500 { fill: var(--theme-color) !important; }
         .text-emerald-400 { color: color-mix(in srgb, var(--theme-color) 80%, white) !important; }
         .bg-emerald-50 { background-color: color-mix(in srgb, var(--theme-color) 10%, white) !important; }
         .text-emerald-600 { color: color-mix(in srgb, var(--theme-color) 80%, black) !important; }
         
         .bg-\\[\\#f2f2f7\\] { background-color: var(--bg-color) !important; }
         .text-gray-900 { color: var(--text-color) !important; }
         .text-slate-900 { color: var(--text-color) !important; }
         .bg-white { background-color: color-mix(in srgb, var(--bg-color) 15%, white) !important; }
      `}</style>
      {/* 
          WEBSITE WRAPPER:
          On mobile: Full width
          On desktop: Centered container, wider than before but still retaining that "premium store" vibe.
      */}
      <div className="w-full max-w-screen-xl min-h-screen flex flex-col relative overflow-hidden bg-[#f2f2f7] md:shadow-[0_0_100px_rgba(0,0,0,0.05)]">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            
            {/* HOME SCREEN */}
            {screen === "home" && (
              <motion.div key="home" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden bg-[#f2f2f7]">
                
                {/* Store header - Clean & Minimal */}
                {showShell && <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] sticky top-0 z-50 w-full shrink-0">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm overflow-hidden">
                        {s.bizImage ? <img src={s.bizImage} className="w-full h-full object-cover" /> : <Zap size={14} fill="white" className="text-white" />}
                      </div>
                      <div>
                        <p className="text-[11px] md:text-sm font-black text-gray-900 leading-none">{s.bizName || "EliteFashion"}</p>
                        <p className="text-[8px] md:text-[10px] text-emerald-500 font-bold leading-none mt-1">● Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => goTab("search")} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <Search size={16} className="text-gray-500" />
                      </button>
                      <button onClick={() => goTab("cart")} className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ShoppingCart size={16} className="text-gray-500" />
                        <AnimatePresence>
                          {cartItemCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center"
                            >
                              {cartItemCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                </div>}

                {/* Content Area - Internal Scroll */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-4 md:py-8">
                    
                    {/* The Section Engine */}
                    <div className="space-y-6 md:space-y-10">
                      {(() => {
                        const sections = s.sections || [];
                        const firstSection = sections[0];
                        const remainingSections = sections.slice(1);

                        return (
                          <>
                            {/* Render First Section (Usually Hero) */}
                            {firstSection && (
                              <SectionRenderer 
                                sections={[firstSection]} 
                                state={s}
                                cart={cart}
                                updateCart={updateCart}
                                onProductClick={(p) => { 
                                  setSelectedProduct(p); 
                                  setScreen("product"); 
                                  logEvent("product_click", { productId: p.id, productName: p.name });
                                }}
                                activeCategory={activeCategory}
                                isEditable={isEditable}
                                selectedSectionId={selectedSectionId}
                                onSectionAction={onSectionAction}
                              />
                            )}

                            {/* CATEGORIES BAR - Now placed below the first section */}
                            {showShell && (
                              <div className="pb-4 sticky top-0 z-40 backdrop-blur-xl pt-2" style={{ backgroundColor: "color-mix(in srgb, var(--bg-color) 80%, transparent)" }}>
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                                  {categories.map((c) => (
                                    <button
                                      key={c}
                                      onClick={() => setActiveCategory(c)}
                                      className={`flex-shrink-0 px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[12px] font-black transition-all active:scale-95 ${
                                        activeCategory === c ? "shadow-lg" : "border border-black/[0.03] hover:brightness-95"
                                      }`}
                                      style={{
                                        backgroundColor: activeCategory === c ? "var(--text-color)" : "color-mix(in srgb, var(--bg-color) 30%, white)",
                                        color: activeCategory === c ? "var(--bg-color)" : "var(--text-color)"
                                      }}
                                    >
                                      {c}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Render Remaining Sections */}
                            <SectionRenderer 
                              sections={remainingSections} 
                              state={s}
                              cart={cart}
                              updateCart={updateCart}
                              onProductClick={(p) => { 
                                setSelectedProduct(p); 
                                setScreen("product"); 
                                logEvent("product_click", { productId: p.id, productName: p.name });
                              }}
                              activeCategory={activeCategory}
                              isEditable={isEditable}
                              selectedSectionId={selectedSectionId}
                              onSectionAction={onSectionAction}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Community Review Wall was here, now moved to dedicated tab */}
                  
                  {/* Buffer for bottom nav */}
                  <div className="h-24" />
                </div>
              </motion.div>
            )}

            {/* PRODUCT DETAIL SCREEN - Responsive */}
            {screen === "product" && selectedProduct && (
              <motion.div key="product" {...pageAnim} className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto md:flex md:items-stretch md:min-h-screen">
                    
                    {/* Image Column - with carousel */}
                    <div className="relative md:w-1/2 md:h-screen">
                      {(() => {
                        const imgs = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image];
                        const idx = Math.min(activeImgIdx, imgs.length - 1);
                        return (
                          <>
                            <img src={imgs[idx]} alt={selectedProduct.name} className="w-full h-[300px] md:h-full object-cover" />
                            {imgs.length > 1 && (
                              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                                {imgs.map((_, i) => (
                                  <button key={i} onClick={() => setActiveImgIdx(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/50"}`} />
                                ))}
                              </div>
                            )}
                            {imgs.length > 1 && (
                              <div className="absolute bottom-12 left-0 right-0 flex gap-2 px-4 overflow-x-auto no-scrollbar z-20">
                                {imgs.map((img, i) => (
                                  <button key={i} onClick={() => setActiveImgIdx(i)}
                                    className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === idx ? "border-white" : "border-transparent opacity-60"}`}>
                                    <img src={img} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
                      <button onClick={() => { setScreen("home"); setActiveImgIdx(0); }} className="absolute top-5 left-5 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center active:scale-90 shadow-lg">
                        <ChevronLeft size={20} />
                      </button>
                      <button onClick={() => setWishlist(w => w.includes(selectedProduct.id) ? w.filter(x => x !== selectedProduct.id) : [...w, selectedProduct.id])} className="absolute top-5 right-5 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center active:scale-90 shadow-lg">
                        <Heart size={18} className={wishlist.includes(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-gray-500"} />
                      </button>
                    </div>

                    {/* Content Column */}
                    <div className="p-6 md:p-12 md:w-1/2 flex flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h1>
                          <div className="flex items-center gap-2 mt-2 md:mt-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < 4 ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                            ))}
                            <span className="text-[10px] md:text-sm text-gray-400 font-bold ml-1">4.9 (86 Reviews)</span>
                          </div>
                        </div>
                        <p className="text-2xl md:text-4xl font-black text-emerald-600">{s.currency}{Number(selectedProduct.price).toLocaleString()}</p>
                      </div>

                      <p className="text-xs md:text-base text-gray-500 mt-6 md:mt-10 leading-relaxed max-w-md">
                        {selectedProduct.description || `Premium quality ${selectedProduct.name.toLowerCase()} designed for the modern lifestyle. Crafted with top-tier materials for comfort and durability.`}
                      </p>

                      {/* Dynamic Attributes */}
                      {selectedProduct.attributes && selectedProduct.attributes.length > 0 && (
                        <div className="mt-8 md:mt-12 space-y-6">
                          {selectedProduct.attributes.map((attr, i) => (
                            <div key={i}>
                              <p className="text-[10px] md:text-xs font-black text-gray-800 uppercase tracking-widest mb-3 md:mb-5">{attr.label}</p>
                              <div className="flex gap-2 md:gap-4 flex-wrap">
                                {attr.value.split(',').map((val) => (
                                  <button key={val} className="px-5 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black border border-gray-200 text-gray-500 hover:border-gray-900 transition-all active:scale-95">
                                    {val.trim()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-10 md:mt-16 space-y-3 md:space-y-4 max-w-md">
                        {qty(selectedProduct.id) === 0 ? (
                          <button
                            disabled={selectedProduct.outOfStock}
                            onClick={() => updateCart(selectedProduct.id, 1)}
                            className="w-full py-4 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl shadow-black/20 disabled:opacity-50 disabled:grayscale"
                          >
                            <ShoppingCart size={18} /> {selectedProduct.outOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-100 rounded-2xl md:rounded-3xl px-8 py-4 md:py-6">
                            <button onClick={() => updateCart(selectedProduct.id, -1)} className="active:scale-90"><Minus size={20} /></button>
                            <span className="text-lg md:text-xl font-black">{qty(selectedProduct.id)}</span>
                            <button onClick={() => updateCart(selectedProduct.id, 1)} className="active:scale-90 text-emerald-500"><Plus size={20} /></button>
                          </div>
                        )}
                        <button
                          onClick={handleOrder}
                          className="w-full py-4 md:py-6 bg-emerald-500 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/20"
                        >
                          <MessageCircle size={18} /> CHAT ON WHATSAPP
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEARCH SCREEN - Responsive */}
            {screen === "search" && (
              <motion.div key="search" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 md:py-10">
                    <h2 className="text-sm md:text-2xl font-black text-gray-900 mb-4 md:mb-6 tracking-tight">Search Catalog</h2>
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Try 'hoodie' or 'sneakers'..."
                        className="w-full pl-12 pr-6 py-4 md:py-6 bg-gray-100 rounded-2xl md:rounded-3xl text-xs md:text-lg font-bold text-gray-900 placeholder:text-gray-400 outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 space-y-4">
                    {searchQuery && filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setScreen("product"); }}
                        className="w-full flex items-center gap-4 md:gap-8 bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-xl active:scale-[0.98] transition-all group border border-black/[0.01]"
                      >
                        <img src={p.image} alt={p.name} className="w-16 h-16 md:w-32 md:h-32 object-cover rounded-xl md:rounded-[1.5rem] flex-shrink-0 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 text-left">
                          <p className="text-[11px] md:text-xl font-black text-gray-900 leading-none mb-1 md:mb-3">{p.name}</p>
                          <div className="flex items-center gap-1">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="text-[10px] md:text-sm font-bold text-gray-400">4.9</span>
                          </div>
                          <p className="text-[12px] md:text-2xl font-black text-emerald-600 mt-2 md:mt-4">{s.currency}{Number(p.price).toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                          <ArrowRight size={20} />
                        </div>
                      </button>
                    ))}
                    {searchQuery && filteredProducts.length === 0 && (
                      <div className="text-center py-20 text-gray-300">
                        <Search size={48} strokeWidth={1} className="mx-auto mb-4" />
                        <p className="text-xs md:text-sm font-black uppercase tracking-widest">No results for &quot;{searchQuery}&quot;</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CART SCREEN - Responsive */}
            {screen === "cart" && (
              <motion.div key="cart" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 md:py-10 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm md:text-2xl font-black text-gray-900 tracking-tight">Your Shopping Bag</h2>
                      <p className="text-[10px] md:text-sm text-gray-400 font-bold mt-1 uppercase tracking-wider">
                        {cartItemCount} item{cartItemCount > 1 ? "s" : ""} selected
                      </p>
                    </div>
                    <button onClick={() => goTab("home")} className="p-2 md:p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6">
                    {cartItemCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
                          <ShoppingCart size={40} className="text-gray-200" />
                        </div>
                        <p className="text-xs md:text-base font-black text-gray-400 uppercase tracking-[0.2em]">Bag is empty</p>
                        <button onClick={() => goTab("home")} className="mt-8 px-10 py-4 bg-gray-900 text-white text-[11px] md:text-sm font-black rounded-full active:scale-95 transition-all shadow-xl">
                          BROWSE STORE
                        </button>
                      </div>
                    ) : (
                      <div className="md:flex md:gap-12">
                        {/* List */}
                        <div className="flex-1 space-y-4">
                          <AnimatePresence>
                            {Object.entries(cart).map(([id, q]) => {
                              const p = s.products.find(x => x.id === Number(id));
                              if (!p || q <= 0) return null;
                              return (
                                <motion.div
                                  key={id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm flex items-center gap-4 md:gap-8 border border-black/[0.01]"
                                >
                                  <img src={p.image} alt={p.name} className="w-16 h-16 md:w-32 md:h-32 object-cover rounded-xl md:rounded-[1.5rem]" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] md:text-xl font-black text-gray-900 truncate leading-none mb-1.5">{p.name}</p>
                                    <p className="text-[11px] md:text-lg font-black text-emerald-600">{s.currency}{(Number(p.price) * q).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 bg-gray-50 rounded-full p-1 md:p-1.5">
                                    <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 md:w-10 md:h-10 bg-white shadow-sm rounded-full flex items-center justify-center active:scale-90"><Minus size={12} /></button>
                                    <span className="text-xs md:text-lg font-black w-4 md:w-8 text-center">{q}</span>
                                    <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 md:w-10 md:h-10 bg-emerald-500 text-white shadow-sm rounded-full flex items-center justify-center active:scale-90"><Plus size={12} /></button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>

                        {/* Summary */}
                        <div className="md:w-[350px] mt-8 md:mt-0">
                          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-black/[0.02] border border-black/[0.01] sticky top-32">
                            <h3 className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Order Summary</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between text-xs md:text-base font-bold text-gray-400">
                                <span>Subtotal</span><span className="text-gray-900">{s.currency}{totalPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs md:text-base font-bold text-gray-400">
                                <span>Delivery</span><span className="text-emerald-500">FREE</span>
                              </div>
                              <div className="border-t border-gray-50 pt-6 flex justify-between">
                                <span className="text-sm md:text-lg font-black text-gray-900">Total</span>
                                <span className="text-xl md:text-3xl font-black text-emerald-600">{s.currency}{totalPrice.toLocaleString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={handleOrder}
                              className="w-full mt-8 md:mt-10 py-5 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl shadow-black/20"
                            >
                              <MessageCircle size={18} /> CHECKOUT ON WHATSAPP
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUCCESS SCREEN */}
            {screen === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white flex flex-col items-center justify-center p-10 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-24 h-24 md:w-32 md:h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight italic uppercase">Order Sent!</h2>
                  <p className="text-sm md:text-lg text-gray-400 font-medium leading-relaxed">
                    We&apos;ve forwarded your request to the store on WhatsApp. They will contact you shortly to finalize payment and delivery.
                  </p>
                  <button onClick={() => { setScreen("home"); setActiveTab("home"); }} className="px-10 py-4 bg-gray-900 text-white text-xs md:text-sm font-black rounded-full active:scale-95 transition-all shadow-xl">
                    BACK TO STORE
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* COMMUNITY SCREEN TAKEOVER WAS HERE */}
        </div>

        {/* 
            BOTTOM NAVIGATION BAR 
            Repositioned for responsive view. 
            On desktop, it can stay as a centered floating bar or stick to bottom of container.
        */}
        {showShell && screen !== "community" && <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-black/[0.04] md:border-none flex items-center justify-center px-4 md:px-0 md:pb-8" style={{ height: 70 }}>
          <div className="flex items-center w-full max-w-screen-lg mx-auto md:bg-white md:shadow-2xl md:rounded-full md:px-8 md:py-2 md:w-fit md:gap-12">
            {[
              { id: "home", icon: Home, label: "Store" },
              { id: "search", icon: Search, label: "Search" },
              { id: "community", icon: MessageCircle, label: "Reviews" },
              { id: "cart", icon: ShoppingCart, label: "Cart", badge: cartItemCount },
            ].map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => goTab(id as any)}
                className={`flex-1 md:flex-initial flex flex-col items-center gap-1 md:gap-1.5 py-2 relative active:scale-90 transition-all ${
                  activeTab === id ? "text-gray-900" : "text-gray-300 hover:text-gray-400"
                }`}
              >
                <div className="relative">
                  <Icon className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" strokeWidth={activeTab === id ? 2.5 : 1.5} />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-500 text-white text-[7px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${activeTab === id ? "text-gray-900" : "text-gray-300"}`}>{label}</span>
                {activeTab === id && (
                  <motion.div layoutId="nav-dot-live" className="absolute -bottom-1 md:bottom-0 left-1/2 -translate-x-1/2 w-4 md:w-6 h-0.5 md:h-1 bg-gray-900 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>}

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
