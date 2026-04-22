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
    <div className={cn("min-h-screen pb-32 transition-colors duration-500 flex flex-col", themeClasses.fontClass, s.bgStyle === "pattern" ? "bg-slate-50 dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" : "bg-white dark:bg-black")}>
      
      {/* Floating Header */}
      <header className="sticky top-0 z-50 glass dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 h-20 flex items-center px-6 transition-all shrink-0">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg overflow-hidden shrink-0 border border-white/10">
                 {s.bizImage ? <img src={s.bizImage} className="w-full h-full object-cover" alt="" /> : <Store size={20} />}
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-sm font-black uppercase italic tracking-tight dark:text-white leading-none">{s.bizName || "SwiftLink Store"}</h1>
                 {s.plan === "pro" && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified Merchant</span>}
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
        <section className="py-12 md:py-20 relative overflow-hidden">
           <div className="relative z-10 text-center space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                 <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/20">
                    <Zap size={10} fill="currentColor" /> Live Catalog
                 </span>
                 <h2 className="mt-6 text-4xl md:text-7xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-[0.95]">
                    {s.bizName?.toUpperCase() || "WELCOME"}<br />
                    <span className="text-emerald-500">{s.tagline?.toUpperCase() || "PREMIUM SELECTION"}</span>
                 </h2>
                 <p className="mt-6 text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed">
                    {s.aboutUs || "Experience seamless shopping with direct WhatsApp checkout. High quality items, delivered fast."}
                 </p>
              </motion.div>
           </div>

           {/* Animated Background Elements */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-50 dark:opacity-20">
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-400 rounded-full blur-[150px] animate-pulse" />
           </div>
        </section>

        {/* Category Strip */}
        <section className="mb-12 overflow-x-auto no-scrollbar py-4 -mx-6 px-6">
           <div className="flex items-center gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                    activeCategory === cat 
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xl -translate-y-1" 
                      : "bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border-slate-100 dark:border-white/5 hover:border-slate-200"
                  )}
                >
                  {cat}
                </button>
              ))}
           </div>
        </section>

        {/* Product Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           <AnimatePresence mode="popLayout">
              {filteredProducts.map((p, idx) => (
                <motion.div 
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex flex-col h-full cursor-pointer"
                  onClick={() => { setSelectedProduct(p); setCurrentImgIndex(0); }}
                >
                  <div className={cn("relative aspect-[4/5] bg-slate-50 dark:bg-zinc-900 overflow-hidden shadow-sm transition-all group-hover:shadow-2xl group-hover:-translate-y-2 border border-slate-100 dark:border-white/5", themeClasses.shapeClass)}>
                     {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-zinc-800">
                           <Package size={48} />
                        </div>
                     )}
                     
                     {/* Quick Add Overlay */}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 backdrop-blur-[2px]">
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }}
                          disabled={p.outOfStock}
                          className={cn("w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95 disabled:opacity-50", themeClasses.btnClass)}
                        >
                           {p.outOfStock ? "Out of Stock" : "Add to Cart"}
                        </button>
                     </div>

                     {p.badge && (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm">
                           {p.badge}
                        </div>
                     )}
                  </div>
                  
                  <div className="mt-6 space-y-2 text-left">
                     <div className="flex justify-between items-start gap-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate italic">{p.name}</h3>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 italic shrink-0">{s.currency}{Number(p.price).toLocaleString()}</span>
                     </div>
                     <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                        {p.description || "Premium quality guaranteed. Click for details."}
                     </p>
                  </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </section>

        {filteredProducts.length === 0 && (
            <div className="py-32 text-center">
               <Package className="mx-auto text-slate-100 dark:text-zinc-900 mb-6" size={80} />
               <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase">No items found</h3>
               <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2">Try adjusting your filters or search terms.</p>
            </div>
        )}
      </main>

      {/* --- Product Details Modal --- */}
      <AnimatePresence>
          {selectedProduct && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-10">
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      className="w-full h-[90vh] md:h-auto md:max-w-6xl bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden md:shadow-[0_40px_100px_rgba(0,0,0,0.25)] md:rounded-[4rem] border dark:border-white/10">
                      
                      <div className="relative w-full md:w-1/2 h-1/2 md:h-[600px] bg-slate-50 dark:bg-zinc-900 shrink-0 border-r border-slate-50 dark:border-white/5 overflow-hidden group">
                          <AnimatePresence mode="wait">
                             <motion.img key={currentImgIndex} src={(selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[currentImgIndex] : selectedProduct.image} 
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="w-full h-full object-contain p-8 md:p-16" />
                          </AnimatePresence>
                          
                          <button onClick={() => setSelectedProduct(null)} className="absolute top-6 left-6 w-12 h-12 bg-white dark:bg-black rounded-2xl shadow-xl flex items-center justify-center text-slate-900 dark:text-white z-10 active:scale-95 border border-slate-100 dark:border-white/10"><X size={24} /></button>
                          
                          {selectedProduct.images && selectedProduct.images.length > 1 && (
                             <div className="absolute inset-y-0 w-full flex items-center justify-between px-4 pointer-events-none">
                                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === 0 ? selectedProduct.images.length - 1 : prev - 1)); }} 
                                   className="w-10 h-10 bg-white/80 dark:bg-black/80 rounded-full shadow pointer-events-auto flex items-center justify-center text-slate-900 dark:text-white active:scale-90"><ChevronLeft size={20} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === selectedProduct.images.length - 1 ? 0 : prev + 1)); }}
                                   className="w-10 h-10 bg-white/80 dark:bg-black/80 rounded-full shadow pointer-events-auto flex items-center justify-center text-slate-900 dark:text-white active:scale-90"><ChevronRight size={20} /></button>
                             </div>
                          )}

                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                             {(selectedProduct.images || [selectedProduct.image]).map((_: any, i: number) => (
                                <div key={i} className={cn("w-2 h-2 rounded-full transition-all", currentImgIndex === i ? "bg-black dark:bg-white w-6" : "bg-slate-300 dark:bg-zinc-700")} />
                             ))}
                          </div>
                      </div>

                      <div className="flex-1 bg-white dark:bg-black p-8 md:p-20 flex flex-col overflow-y-auto text-left">
                          <div className="mb-10">
                             <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 block">{selectedProduct.category}</span>
                             <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1] tracking-tighter uppercase italic mb-6">{selectedProduct.name}</h2>
                             <div className="text-3xl md:text-5xl font-black italic tracking-tighter" style={{ color: accentStr }}>{s.currency}{Number(selectedProduct.price).toLocaleString()}</div>
                          </div>
                          <p className="text-slate-500 dark:text-zinc-400 text-sm md:text-xl font-medium leading-relaxed italic mb-12">{selectedProduct.description || "Premium quality item."}</p>
                          <div className="mt-auto pt-8 border-t border-slate-50 dark:border-white/5 flex gap-4 md:gap-6">
                              <button onClick={() => { if (!canAddToCart(selectedProduct.outOfStock)) return; updateCart(selectedProduct.id, 1); goToCart(); }}
                                  disabled={!canAddToCart(selectedProduct.outOfStock)}
                                  className={cn("flex-1 py-6 rounded-[2.5rem] text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all", canAddToCart(selectedProduct.outOfStock) ? "brightness-100" : "opacity-50 grayscale")}
                                  style={{ backgroundColor: accentStr }}>
                                 {canAddToCart(selectedProduct.outOfStock) ? "Proceed to Checkout" : "Unavailable"}
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