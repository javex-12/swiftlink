"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Heart, Plus, Home, X, ChevronLeft, MapPin, Package, MessageSquare, CheckCircle2, TrendingUp, Zap, LogIn, Loader2, ChevronRight, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { ShopState } from "@/lib/types";

type ViewState = "store" | "search";

export function CustomerStorefront({
  isPreview = false,
  shopId,
}: {
  isPreview?: boolean;
  shopId?: string;
} = {}) {
  const router = useRouter();
  const { 
      state, 
      cart, 
      updateCart, 
      cartItemCount, 
      user, 
      startLocationTracking,
      toggleCartDrawer
  } = useSwiftLink();

  const [publicState, setPublicState] = useState<ShopState | null>(null);
  const effectiveState = shopId ? publicState : state;
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

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
  
  const filteredProducts = useMemo(() => {
    if (!effectiveState) return [];
    return effectiveState.products.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });
  }, [effectiveState, activeCategory, searchQuery]);

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
    <div className={cn("min-h-screen pb-32 transition-colors duration-500", themeClasses.fontClass, s.bgStyle === "pattern" ? "bg-slate-50 dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" : "bg-white dark:bg-black")}>
      
      {/* Floating Header */}
      <header className="sticky top-0 z-50 glass dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 h-20 flex items-center px-6 transition-all">
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

      <main className="max-w-7xl mx-auto px-6">
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
                  className="group flex flex-col h-full"
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
                          onClick={() => updateCart(p.id, 1)}
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
                  
                  <div className="mt-6 space-y-2">
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

      {/* Footer Branding */}
      <footer className="mt-32 py-20 border-t border-slate-100 dark:border-white/5 text-center">
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
  const visibleProducts = (effectiveState?.products || []).filter(p => {
      if (effectiveState?.outOfStockDisplay === "hide" && p.outOfStock) return false;
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (activeView === "search" && searchQuery) {
          return p.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
  });

  const goToCart = () => {
      const sid = shopId || effectiveState?.id;
      router.push(`/cart?shop=${encodeURIComponent(String(sid || ""))}`);
  };

  if (shopId && !effectiveState) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-slate-500 font-bold text-sm">Loading store…</div>
      </main>
    );
  }

  return (
    <div className={cn(
        "w-full relative flex flex-col transition-colors duration-500",
        effectiveState?.bgStyle === "light-tint" ? "bg-slate-50" : effectiveState?.bgStyle === "pattern" ? "bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]" : "bg-[#f8fafc]",
        themeClasses.fontClass,
        isPreview ? "min-h-full" : "min-h-screen"
    )} id={isPreview ? undefined : "customer-view"}>
      
      {!isPreview && !storeAcceptingOrders && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 text-center z-50 sticky top-0">
          <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Ordering is currently paused
          </p>
        </div>
      )}

      {/* ── TOP NAV HEADER ── */}
      <nav className={cn(
          "bg-white/95 backdrop-blur-xl z-[45] sticky border-b border-slate-100 shadow-sm w-full transition-all",
          isPreview ? "top-0" : storeAcceptingOrders ? "top-0 pt-safe" : "top-12 pt-safe"
      )}>
         <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 overflow-hidden ring-1 ring-slate-100" style={{ backgroundColor: accentStr }}>
                     {effectiveState?.bizImage ? 
                         <img src={effectiveState.bizImage} className="w-full h-full object-cover" alt="" /> :
                         <Zap className="text-white" size={24} fill="white" />
                     }
                 </div>
                 <div className="flex flex-col min-w-0 text-left">
                     <span className="font-black text-slate-900 text-lg md:text-xl leading-none tracking-tighter truncate uppercase italic">
                         {effectiveState?.bizName || "My Store"}
                     </span>
                     <div className="flex items-center gap-2 mt-1.5 min-w-0">
                         <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse")} />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                           {storeAcceptingOrders ? "Live Catalog" : "Viewing Only"}
                         </span>
                     </div>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <button className="relative group" onClick={goToCart}>
                     <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white shadow-xl active:scale-95 transition-all">
                        <ShoppingCart size={20} strokeWidth={2.5} />
                     </div>
                     {cartItemCount > 0 && (
                         <div className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-black text-white shadow-lg border-2 border-white animate-bounce-slow">
                             {cartItemCount}
                         </div>
                     )}
                 </button>
             </div>
         </div>
         
         {activeView === "store" && categories.length > 1 && (
             <div className="px-5 py-3 flex items-center gap-2.5 overflow-x-auto snap-x bg-white/50 border-t border-slate-50 no-scrollbar">
                 {categories.map(cat => (
                     <button 
                         key={cat}
                         onClick={() => setActiveCategory(cat)}
                         className={cn(
                             "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap snap-start transition-all border",
                             activeCategory === cat 
                                ? "bg-slate-900 text-white border-slate-900 shadow-lg -translate-y-0.5" 
                                : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-900"
                         )}
                     >
                         {cat}
                     </button>
                 ))}
             </div>
         )}
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full max-w-7xl mx-auto flex-1 pb-32 md:pb-16 flex flex-col min-w-0">
         {activeView === "store" && (
           <div className="px-5 py-6 md:px-10 md:py-10 w-full animate-fade-in-up">
               <div className={cn(
                   "w-full relative rounded-[3rem] overflow-hidden shadow-2xl mb-12 group border-4 border-white",
                   effectiveState?.heroStyle === "minimal" ? "aspect-[4/1] md:aspect-[6/1]" : effectiveState?.heroStyle === "split" ? "aspect-[4/5] md:aspect-[2/1]" : "aspect-[4/3] md:aspect-[3/1]"
               )}>
                   <img 
                       src={effectiveState?.bizImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"} 
                       alt="Banner" 
                       className={cn(
                           "absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110",
                           effectiveState?.heroStyle === "split" ? "md:w-1/2 md:translate-x-full" : ""
                       )}
                   />
                   <div className={cn(
                       "absolute inset-0 p-8 md:p-16 flex flex-col justify-center items-start text-left",
                       effectiveState?.heroStyle === "split" ? "bg-slate-900 md:w-1/2" : "bg-gradient-to-r from-black/90 via-black/40 to-transparent"
                   )}>
                       <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-6">
                          <div className="h-0.5 w-8 bg-emerald-500" />
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-emerald-400 drop-shadow">{effectiveState?.announcement || "QUALITY GUARANTEED"}</span>
                       </motion.div>
                       <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          className={cn("font-black text-white leading-[1] mb-8 drop-shadow-2xl uppercase italic tracking-tighter",
                              effectiveState?.heroStyle === "minimal" ? "text-2xl md:text-4xl max-w-xl" : "text-4xl md:text-7xl max-w-[300px] md:max-w-2xl")}>
                           {effectiveState?.tagline || "Redefining Your Lifestyle."}
                       </motion.h2>
                       <button onClick={() => { const el = document.getElementById('product-grid'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                         className={cn("px-8 py-4 md:px-12 md:py-5 flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-2xl active:scale-95 transition-all hover:brightness-110 group/btn", themeClasses.btnClass)} style={{ backgroundColor: accentStr }}>
                           Browse Catalog <ChevronRight size={16} strokeWidth={3} />
                       </button>
                   </div>
               </div>

               <div id="product-grid" className={cn(effectiveState?.layoutStyle === "list" ? "flex flex-col gap-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8")}>
                   {visibleProducts.map((p, i) => (
                       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={p.id} 
                          onClick={() => { setSelectedProduct(p); setCurrentImgIndex(0); }} 
                          className={cn("bg-white shadow-sm border border-slate-100 flex relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group hover:shadow-2xl hover:border-emerald-500/20",
                              effectiveState?.layoutStyle === "list" ? "flex-row items-center p-4 gap-6 rounded-[2rem]" : "flex-col " + themeClasses.shapeClass)}>
                           <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                               {p.badge && <div className="bg-white/95 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg border border-slate-100">{p.badge}</div>}
                               {p.outOfStock && <div className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">Sold out</div>}
                           </div>
                           <div className={cn("relative overflow-hidden bg-slate-50", effectiveState?.layoutStyle === "list" ? "w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl" : "w-full aspect-[4/5] border-b border-slate-50")}>
                               <img src={p.image} alt="" className={cn("w-full h-full object-cover transition-transform duration-1000 group-hover:scale-115", p.outOfStock ? "grayscale opacity-50" : "")} />
                           </div>
                           <div className={cn("flex flex-col flex-1 bg-white relative text-left", effectiveState?.layoutStyle === "list" ? "p-0" : "p-5 md:p-6")}>
                               <h3 className="font-black text-sm md:text-lg text-slate-900 mb-1 leading-tight line-clamp-1 uppercase italic tracking-tight">{p.name}</h3>
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">{p.category || "General"}</p>
                               <div className="mt-auto flex items-center justify-between gap-4">
                                   <span className="font-black text-lg md:text-2xl tracking-tighter text-slate-900 italic">{effectiveState?.currency}{Number(p.price).toLocaleString()}</span>
                                   <button onClick={(e) => { e.stopPropagation(); if (!canAddToCart(p.outOfStock)) return; updateCart(p.id, 1); }}
                                       disabled={!canAddToCart(p.outOfStock)}
                                       className={cn("flex items-center justify-center transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-xl", effectiveState?.layoutStyle === "list" ? "w-10 h-10" : "w-12 h-12", themeClasses.btnClass, cart[p.id] ? "bg-emerald-500 text-white" : "bg-slate-900 text-white")}>
                                       {cart[p.id] ? <CheckCircle2 size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                                   </button>
                               </div>
                           </div>
                       </motion.div>
                   ))}
               </div>
           </div>
         )}
      </main>

      {/* --- Product Details Modal --- */}
      <AnimatePresence>
          {selectedProduct && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-10">
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      className="w-full h-[90vh] md:h-auto md:max-w-6xl bg-white flex flex-col md:flex-row overflow-hidden md:shadow-[0_40px_100px_rgba(0,0,0,0.25)] md:rounded-[4rem]">
                      
                      <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-slate-50 shrink-0 border-r border-slate-50 overflow-hidden group">
                          <AnimatePresence mode="wait">
                             <motion.img key={currentImgIndex} src={(selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[currentImgIndex] : selectedProduct.image} 
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="w-full h-full object-contain p-8 md:p-16" />
                          </AnimatePresence>
                          
                          <button onClick={() => setSelectedProduct(null)} className="absolute top-6 left-6 w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-slate-900 z-10 active:scale-95 border border-slate-100"><X size={24} /></button>
                          
                          {selectedProduct.images && selectedProduct.images.length > 1 && (
                             <div className="absolute inset-y-0 w-full flex items-center justify-between px-4 pointer-events-none">
                                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === 0 ? selectedProduct.images.length - 1 : prev - 1)); }} 
                                   className="w-10 h-10 bg-white/80 rounded-full shadow pointer-events-auto flex items-center justify-center text-slate-900 active:scale-90"><ChevronLeft size={20} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === selectedProduct.images.length - 1 ? 0 : prev + 1)); }}
                                   className="w-10 h-10 bg-white/80 rounded-full shadow pointer-events-auto flex items-center justify-center text-slate-900 active:scale-90"><ChevronRight size={20} /></button>
                             </div>
                          )}

                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                             {(selectedProduct.images || [selectedProduct.image]).map((_: any, i: number) => (
                                <div key={i} className={cn("w-2 h-2 rounded-full transition-all", currentImgIndex === i ? "bg-slate-900 w-6" : "bg-slate-300")} />
                             ))}
                          </div>
                      </div>

                      <div className="flex-1 bg-white p-8 md:p-20 flex flex-col overflow-y-auto text-left">
                          <div className="mb-10">
                             <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 block">{selectedProduct.category}</span>
                             <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1] tracking-tighter uppercase italic mb-6">{selectedProduct.name}</h2>
                             <div className="text-3xl md:text-5xl font-black italic tracking-tighter" style={{ color: accentStr }}>{effectiveState?.currency}{Number(selectedProduct.price).toLocaleString()}</div>
                          </div>
                          <p className="text-slate-500 text-sm md:text-xl font-medium leading-relaxed italic mb-12">{selectedProduct.description || "Premium quality item."}</p>
                          <div className="mt-auto pt-8 border-t border-slate-50 flex gap-4 md:gap-6">
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
    </div>
  );
}
