"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Plus, X, ChevronLeft, Package, MessageCircle, Zap, Loader2, ChevronRight, ShieldCheck, Store, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { ShopState } from "@/lib/types";

export function CustomerStorefront({
  shopId,
}: {
  shopId?: string;
}) {
  const router = useRouter();
  const { 
      state, 
      cart, 
      updateCart, 
      cartItemCount, 
      toggleCartDrawer
  } = useSwiftLink();

  const [publicState, setPublicState] = useState<ShopState | null>(null);
  const effectiveState = shopId ? publicState : state;
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // THEME OVERRIDE LOGIC
  const themeClass = useMemo(() => {
    if (effectiveState?.storeTheme === "dark") return "dark";
    if (effectiveState?.storeTheme === "light") return "";
    return ""; // Default to light/system behavior
  }, [effectiveState?.storeTheme]);

  useEffect(() => {
    if (!shopId) {
      setPublicState(null);
      return;
    }
    
    // Initial Load
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

    // Real-time subscription
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

  // Theme helper classes
  const themeClasses = useMemo(() => {
    if (!effectiveState) return { fontClass: "font-sans", shapeClass: "rounded-[2.5rem]", btnClass: "rounded-[1.2rem]" };
    const fontClass = 
        effectiveState.fontStyle === "bold" ? "font-black tracking-tight" : 
        effectiveState.fontStyle === "playful" ? "italic" : 
        effectiveState.fontStyle === "classic" ? "font-medium" : "font-sans";
    
    const shapeClass = 
        effectiveState.imageShape === "circle" ? "rounded-full" : 
        effectiveState.imageShape === "square" ? "rounded-none" : "rounded-[2.5rem]";
        
    const btnClass = 
        effectiveState.buttonRadius === "pill" ? "rounded-full" : 
        effectiveState.buttonRadius === "sharp" ? "rounded-none" : "rounded-[1.2rem]";

    return { fontClass, shapeClass, btnClass };
  }, [effectiveState]);

  const categories: string[] = useMemo(() => {
      if (!effectiveState) return ["All"];
      const custom = effectiveState.categories || [];
      const collected = Array.from(new Set((effectiveState.products || []).map(p => p.category).filter(Boolean)));
      const combined = Array.from(new Set(["All", ...custom, ...(collected as string[])]));
      return combined;
  }, [effectiveState]);

  const accentStr = (effectiveState?.accentColor || "#10b981") as string;
  const storeAcceptingOrders = effectiveState ? effectiveState.isLive !== false : false;

  const filteredProducts = useMemo(() => {
    if (!effectiveState) return [];
    return effectiveState.products.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const shouldHide = effectiveState.outOfStockDisplay === "hide" && p.outOfStock;
        return matchesCat && matchesSearch && !shouldHide;
    });
  }, [effectiveState, activeCategory, searchQuery]);

  const goToCart = () => {
    const sid = shopId || effectiveState?.id;
    router.push(`/cart?shop=${encodeURIComponent(String(sid || ""))}`);
  };

  const canAddToCart = (outOfStock: boolean) => {
    return storeAcceptingOrders && !outOfStock;
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

  return (
    <div className={cn(
        "min-h-screen pb-32 transition-colors duration-700 flex flex-col", 
        themeClasses.fontClass, 
        themeClass,
        s.bgStyle === "pattern" ? "bg-slate-50 dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" : "bg-white dark:bg-black"
    )}>
      
      {/* Floating Header */}
      <header className="sticky top-0 z-50 glass dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 h-20 flex items-center px-6 transition-all shrink-0">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg overflow-hidden shrink-0 border border-white/10">
                 {s.bizImage ? <img src={s.bizImage} className="w-full h-full object-cover" alt="" /> : <Store size={20} />}
              </div>
              <div className="hidden sm:block text-left">
                 <h1 className="text-sm font-black uppercase italic tracking-tight dark:text-white leading-none">{s.bizName || "SwiftLink Store"}</h1>
                 {s.plan === "pro" && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1 block">Verified Merchant</span>}
              </div>
           </div>

           <div className="flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-zinc-900/50 border-none pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
              />
           </div>

           <button onClick={() => toggleCartDrawer(true)} className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xl hover:scale-105 active:scale-95 transition-all">
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black animate-bounce">
                    {cartItemCount}
                </span>
              )}
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 w-full flex-1">
        {/* Cinematic Hero */}
        <section className="py-16 md:py-32 relative overflow-hidden">
           <div className="relative z-10 text-center">
              <motion.div 
                initial={{ opacity: 0, y: 40 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                 <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-emerald-500/20 shadow-sm">
                    <Zap size={11} fill="currentColor" className="animate-pulse" /> Live Collection
                 </span>
                 <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-[0.9] uppercase">
                    {s.bizName || "Welcome"}<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-400 drop-shadow-sm">{s.tagline || "Elite Selection"}</span>
                 </h2>
                 <p className="text-sm md:text-lg text-slate-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed italic">
                    {s.aboutUs || "Handpicked quality items, curated for the modern lifestyle. Shop our latest collection with seamless WhatsApp checkout."}
                 </p>
                 <div className="flex justify-center pt-4">
                    <button 
                      onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                      className="group flex flex-col items-center gap-3 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                       <span className="text-[9px] font-black uppercase tracking-[0.3em]">Explore Store</span>
                       <div className="w-1 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ y: [0, 48, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-full h-1/3 bg-emerald-500 rounded-full"
                          />
                       </div>
                    </button>
                 </div>
              </motion.div>
           </div>

           {/* Animated Orbs */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[120px]" 
              />
              <motion.div 
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" 
              />
           </div>
        </section>

        {/* Catalog Entry Point */}
        <div id="catalog" className="pt-10" />

        {/* Category Strip */}
        <section className="mb-16 overflow-x-auto no-scrollbar py-4 -mx-6 px-6 sticky top-20 z-40 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
           <div className="flex items-center gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                    activeCategory === cat 
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-2xl -translate-y-1" 
                      : "bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-zinc-700"
                  )}
                >
                  {cat}
                </button>
              ))}
           </div>
        </section>

        {/* Product Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
           <AnimatePresence mode="popLayout">
              {filteredProducts.map((p, idx) => (
                <motion.div 
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  className="group flex flex-col h-full cursor-pointer"
                  onClick={() => { setSelectedProduct(p); setCurrentImgIndex(0); }}
                >
                  <div className={cn("relative aspect-[4/5] bg-slate-50 dark:bg-zinc-900 overflow-hidden shadow-sm transition-all group-hover:shadow-3xl group-hover:-translate-y-2 border border-slate-100 dark:border-white/5", themeClasses.shapeClass)}>
                     {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={p.name} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-zinc-800">
                           <Package size={48} />
                        </div>
                     )}
                     
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8 backdrop-blur-[4px]">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-4">View Details</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }}
                          disabled={p.outOfStock}
                          className={cn("w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95 disabled:opacity-50", themeClasses.btnClass)}
                        >
                           {p.outOfStock ? "Sold Out" : "Add to Cart"}
                        </button>
                     </div>

                     {p.badge && (
                        <div className="absolute top-5 left-5 px-3 py-1 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-lg border border-white/10">
                           {p.badge}
                        </div>
                     )}
                  </div>
                  
                  <div className="mt-6 space-y-2 text-left">
                     <div className="flex justify-between items-start gap-4">
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase truncate italic tracking-tight">{p.name}</h3>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 italic shrink-0">{s.currency}{Number(p.price).toLocaleString()}</span>
                     </div>
                     <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                        {p.description || "Premium quality guaranteed. High-grade materials and expert craftsmanship."}
                     </p>
                  </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </section>

        {filteredProducts.length === 0 && (
            <div className="py-40 text-center">
               <Package className="mx-auto text-slate-100 dark:text-zinc-900 mb-8 animate-pulse" size={100} />
               <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase">Empty Shelf</h3>
               <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-3">We couldn&apos;t find any items matching your criteria.</p>
            </div>
        )}
      </main>

      {/* --- Product Details Modal --- */}
      <AnimatePresence>
          {selectedProduct && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-900/80 dark:bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-10">
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      className="w-full h-[95vh] md:h-auto md:max-w-6xl bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden md:shadow-[0_60px_120px_rgba(0,0,0,0.5)] md:rounded-[4rem] border dark:border-white/10 relative">
                      
                      {/* Close Cross */}
                      <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-12 h-12 bg-black dark:bg-white rounded-2xl shadow-xl flex items-center justify-center text-white dark:text-black z-50 active:scale-95 border border-white/10"><X size={24} /></button>

                      <div className="relative w-full md:w-1/2 h-[45vh] md:h-[700px] bg-slate-50 dark:bg-zinc-900 shrink-0 border-r border-slate-50 dark:border-white/5 overflow-hidden group">
                          <AnimatePresence mode="wait">
                             <motion.img key={currentImgIndex} src={(selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[currentImgIndex] : selectedProduct.image} 
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full object-contain p-8 md:p-16" />
                          </AnimatePresence>
                          
                          {selectedProduct.images && selectedProduct.images.length > 1 && (
                             <div className="absolute inset-y-0 w-full flex items-center justify-between px-6 pointer-events-none">
                                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === 0 ? selectedProduct.images.length - 1 : prev - 1)); }} 
                                   className="w-12 h-12 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto flex items-center justify-center text-slate-900 dark:text-white active:scale-90 border border-white/10"><ChevronLeft size={24} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === selectedProduct.images.length - 1 ? 0 : prev + 1)); }}
                                   className="w-12 h-12 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto flex items-center justify-center text-slate-900 dark:text-white active:scale-90 border border-white/10"><ChevronRight size={24} /></button>
                             </div>
                          )}

                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
                             {(selectedProduct.images || [selectedProduct.image]).map((_: any, i: number) => (
                                <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(i); }} 
                                  className={cn("w-2.5 h-2.5 rounded-full transition-all border border-black/10 dark:border-white/10", currentImgIndex === i ? "bg-black dark:bg-white w-10" : "bg-slate-300 dark:bg-zinc-700")} 
                                />
                             ))}
                          </div>
                      </div>

                      <div className="flex-1 bg-white dark:bg-black p-8 md:p-24 flex flex-col overflow-y-auto text-left">
                          <div className="mb-12">
                             <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-6 block">{selectedProduct.category || "CURATED ITEM"}</span>
                             <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter uppercase italic mb-8">{selectedProduct.name}</h2>
                             <div className="text-4xl md:text-6xl font-black italic tracking-tighter" style={{ color: accentStr }}>{s.currency}{Number(selectedProduct.price).toLocaleString()}</div>
                          </div>
                          <div className="space-y-6">
                            <p className="text-slate-500 dark:text-zinc-400 text-sm md:text-xl font-medium leading-relaxed italic">{selectedProduct.description || "Experience uncompromising quality. This piece was selected for its exceptional design and durability."}</p>
                            <div className="flex items-center gap-4 pt-4">
                               <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                  <ShieldCheck size={14} className="text-emerald-500" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Quality Assured</span>
                               </div>
                               <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                  <Package size={14} className="text-blue-500" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fast Delivery</span>
                               </div>
                            </div>
                          </div>
                          
                          <div className="mt-16 flex flex-col sm:flex-row gap-4 md:gap-6">
                              <button onClick={(e) => { e.stopPropagation(); if (!canAddToCart(selectedProduct.outOfStock)) return; updateCart(selectedProduct.id, 1); goToCart(); }}
                                  disabled={!canAddToCart(selectedProduct.outOfStock)}
                                  className={cn("flex-1 py-7 rounded-[2.5rem] text-white font-black text-sm md:text-base uppercase tracking-[0.3em] shadow-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-4", canAddToCart(selectedProduct.outOfStock) ? "brightness-100" : "opacity-50 grayscale")}
                                  style={{ backgroundColor: accentStr }}>
                                 {canAddToCart(selectedProduct.outOfStock) ? <><ShoppingCart size={20} strokeWidth={3} /> Proceed to Order</> : "Currently Unavailable"}
                              </button>
                              <button 
                                onClick={() => setSelectedProduct(null)}
                                className="px-10 py-7 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                              >
                                Back to Catalog
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="mt-32 py-20 border-t border-slate-100 dark:border-white/5 text-center shrink-0">
         <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-xl mb-4">
               <Store size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-zinc-700">Powered by SwiftLink Pro</p>
            <div className="flex items-center gap-6 mt-8">
               <ShieldCheck size={16} className="text-slate-200 dark:text-zinc-800" />
               <MessageCircle size={16} className="text-slate-200 dark:text-zinc-800" />
               <Phone size={16} className="text-slate-200 dark:text-zinc-800" />
            </div>
         </div>
      </footer>
    </div>
  );
}