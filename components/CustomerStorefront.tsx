"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  ChevronLeft, 
  ArrowRight, 
  Zap, 
  Plus, 
  Minus, 
  Star, 
  MessageCircle,
  Home,
  Loader2,
  CheckCircle2,
  Globe,
  Trash2,
  ExternalLink,
  Smartphone,
  Truck,
  Shield,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { type Product, type ShopState } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";

// ==========================================
// INTERNAL TEMPLATES (COMPONENTS)
// ==========================================

const HeroTemplate = ({ state, templateId, onShopClick }: { state: ShopState, templateId: string, onShopClick?: () => void }) => {
    const accent = state.accentColor || "#10b981";
    const title = state.heroTitle || state.bizName || "Welcome to our store";
    const subtitle = state.heroSubtitle || state.tagline || "Quality products, delivered.";
    const btnText = state.heroButtonText || "Shop Now";
    const image = state.heroImage || state.bizImage;

    // Template 1 (Default): Cinematic Dark
    if (templateId === "hero-1" || !templateId) {
        return (
            <div className="relative w-full overflow-hidden mb-10 shadow-2xl border border-white/5 bg-[#050505] min-h-[80vh] md:min-h-[450px]">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center h-full">
                    <div className="p-10 md:p-20 md:w-1/2 z-10">
                        <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">
                            {title}
                        </h1>
                        <p className="text-slate-400 text-lg font-medium mb-10 max-w-md leading-relaxed">
                            {subtitle}
                        </p>
                        <button onClick={onShopClick} className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/20 flex items-center gap-3">
                            {btnText} <ArrowRight size={18} />
                        </button>
                    </div>
                    {image && (
                        <div className="md:w-1/2 h-full relative">
                            <img src={image} className="w-full h-full object-cover md:absolute inset-0" alt="Hero" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent hidden md:block" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 text-center bg-gray-50 rounded-[2.5rem] mb-10 border border-black/5">
            <h1 className="text-3xl font-black uppercase text-gray-900">{title}</h1>
            <p className="mt-4 text-gray-500">{subtitle}</p>
            <button onClick={onShopClick} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest">{btnText}</button>
        </div>
    );
};

const CatalogTemplate = ({ state, templateId, products, onProductClick }: { state: ShopState, templateId: string, products: Product[], onProductClick: (p: Product) => void }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map(p => (
                <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group">
                    <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 shadow-sm mb-4 relative border border-black/[0.02] dark:border-white/5 group-hover:shadow-xl transition-all">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                        {p.outOfStock && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
                            </div>
                        )}
                    </div>
                    <h3 className="font-black text-sm md:text-lg text-gray-900 dark:text-white truncate px-1 uppercase">{p.name}</h3>
                    <p className="font-black text-sm md:text-xl text-emerald-600 dark:text-emerald-400 mt-1 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                </button>
            ))}
        </div>
    );
};

const AboutTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    return (
        <div className="mt-20 p-10 md:p-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-black/[0.02] dark:border-white/5 shadow-sm text-center">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white italic uppercase tracking-tighter mb-8">About Us</h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
                {state.aboutUs || "Welcome to our store. We provide the best quality products with fast delivery."}
            </p>
        </div>
    );
};

const FooterTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    const accent = state.accentColor || "#10b981";
    return (
        <footer className="p-10 md:p-20 mt-20 flex flex-col md:flex-row gap-10 justify-between w-full border-t border-black/5 dark:border-white/5 storefront-footer" style={{ backgroundColor: `${accent}08` }}>
            <div className="space-y-4 max-w-sm">
                <h3 className="text-xl font-black text-gray-900 dark:text-white italic uppercase">{state.bizName}</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{state.tagline || "Premium Products"}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">Powered by SwiftLink</p>
            </div>
            <div className="space-y-3">
                {state.contactEmail && <p className="text-xs text-gray-500 font-medium">{state.contactEmail}</p>}
                {state.phone && <p className="text-xs text-gray-500 font-medium">{state.phone}</p>}
            </div>
        </footer>
    );
};

// ==========================================
// MAIN STOREFRONT
// ==========================================

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
      logEvent,
      user
  } = useSwiftLink();

  const [publicState, setPublicState] = useState<ShopState | null>(null);
  const effectiveState = shopId ? publicState : state;
  
  const isStoreOwner = isEditable || (user && effectiveState && effectiveState.ownerId === user.id);
  
  const [screen, setScreen] = useState<"home" | "product" | "cart" | "search" | "success" | "community">("home");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "cart" | "community">("home");
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", message: "", rating: 5 });
  const [comments, setComments] = useState<Record<string, any[]>>({});
  
  const homeScrollContainerRef = useRef<HTMLDivElement>(null);

  // ─── BROWSER HISTORY LOGIC ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState({ screen: "home" }, "");

    const handlePopState = (e: PopStateEvent) => {
      const s = e.state?.screen || "home";
      setScreen(s);
      if (s === "home") setActiveTab("home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const changeScreen = (next: typeof screen) => {
    if (next !== screen) {
      window.history.pushState({ screen: next }, "");
      setScreen(next);
    }
  };

  const goTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    changeScreen(tab === "home" ? "home" : tab as any);
  };

  // ─── FETCH REVIEWS ───
  useEffect(() => {
      if (screen === "community" && effectiveState?.id) {
          setReviewsLoading(true);
          supabase.from("store_reviews").select("*").eq("store_id", effectiveState.id).neq("type", "post").order("created_at", { ascending: false })
            .then(async ({ data: reviewsData }) => {
                if (reviewsData) {
                    const filteredReviews = reviewsData.filter(r => !effectiveState.ownerId || r.author_id !== effectiveState.ownerId);
                    setReviews(filteredReviews);
                    const reviewIds = filteredReviews.map(r => r.id);
                    if (reviewIds.length > 0) {
                        const { data: commentsData } = await supabase
                          .from("store_review_comments")
                          .select("*")
                          .in("review_id", reviewIds)
                          .order("created_at", { ascending: true });
                          
                        if (commentsData) {
                            const grouped: Record<string, any[]> = {};
                            commentsData.forEach(c => {
                                if (!grouped[c.review_id]) grouped[c.review_id] = [];
                                grouped[c.review_id].push(c);
                            });
                            setComments(grouped);
                        }
                    }
                }
                setReviewsLoading(false);
            });
      }
  }, [screen, effectiveState?.id]);

  useEffect(() => {
    if (!shopId) {
      setPublicState(null);
      return;
    }
    
    supabase.from('stores').select('state_json').eq('id', shopId).single()
      .then(({ data }) => {
        if (data?.state_json) {
           const s = data.state_json as ShopState;
           setPublicState({ ...s, id: shopId });
        }
      });

    const channel = supabase.channel(`customer-shop-${shopId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${shopId}` }, payload => {
        if (payload.new?.state_json) {
          const data = payload.new.state_json as Partial<ShopState>;
          setPublicState((prev) => ({ ...(prev || ({} as ShopState)), ...(data as ShopState), id: shopId }));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  useEffect(() => {
    if (effectiveState?.id) { logEvent("view", { shopId: effectiveState.id }); }
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

  const handleOrder = () => {
    logEvent("whatsapp_checkout", { total: totalPrice, items: Object.keys(cart).length });
    sendWhatsAppOrder();
    changeScreen("success");
    setTimeout(() => { changeScreen("home"); setActiveTab("home"); }, 3000);
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
  const accentColor = s.accentColor || "#10b981";
  const bgColor = s.bgColor || "#f2f2f7";
  const textColor = s.textColor || "#111827";
  const surfaceColor = s.surfaceColor || "#ffffff";
  const buttonColor = s.buttonColor || accentColor;

  return (
    <div className="min-h-screen flex flex-col items-center selection:bg-emerald-500 selection:text-white w-full overflow-x-hidden"
         style={{ 
            backgroundColor: bgColor,
            "--theme-color": accentColor, 
            "--bg-color": bgColor, 
            "--text-color": textColor,
            "--surface-color": surfaceColor,
            "--btn-color": buttonColor
         } as React.CSSProperties}>
      <style>{`
         .bg-emerald-500 { background-color: var(--btn-color) !important; }
         .text-emerald-500 { color: var(--theme-color) !important; }
         .text-emerald-600 { color: color-mix(in srgb, var(--theme-color) 80%, black) !important; }
         .border-emerald-500 { border-color: var(--theme-color) !important; }
         .bg-gray-100 { background-color: color-mix(in srgb, var(--bg-color) 95%, var(--text-color)) !important; }
         .text-gray-900 { color: var(--text-color) !important; }
         .bg-white { background-color: var(--surface-color) !important; border-color: color-mix(in srgb, var(--text-color) 10%, transparent) !important; }
         .bg-gray-50 { background-color: color-mix(in srgb, var(--surface-color) 95%, var(--text-color)) !important; }
         .text-gray-500, .text-gray-400 { color: color-mix(in srgb, var(--text-color) 60%, transparent) !important; }
         .bg-gray-900 { background-color: var(--text-color) !important; color: var(--bg-color) !important; }
         header.storefront-header, div.storefront-header { background-color: var(--bg-color) !important; }
         footer.storefront-footer, div.storefront-footer, footer { background-color: var(--bg-color) !important; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--text-color) 20%, transparent); }
      `}</style>
      
      <div className="w-full min-h-screen flex flex-col relative overflow-x-hidden">
        <div className="flex-1 flex flex-col relative">
            
            {/* HOME SCREEN - PERSISTENT TO PRESERVE SCROLL */}
            <div 
              ref={homeScrollContainerRef}
              className={cn(
                "flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300", 
                screen !== "home" && "opacity-0 pointer-events-none hidden"
              )}
            >
                {/* Fixed Header */}
                <div className="backdrop-blur-md border-b border-black/[0.06] sticky top-0 z-50 w-full shrink-0 storefront-header" style={{ backgroundColor: `${bgColor}e6` }}>
                  <div className="w-full px-4 md:px-12 py-3 md:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm overflow-hidden">
                        {s.bizImage ? <img src={s.bizImage} className="w-full h-full object-cover" /> : <Zap size={14} fill="white" className="text-white" />}
                      </div>
                      <div>
                        <p className="text-[11px] md:text-sm font-black text-gray-900 leading-none">{s.bizName || "Store"}</p>
                        <p className="text-[8px] md:text-[10px] text-emerald-500 font-bold leading-none mt-1">● Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => goTab("search")} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                        <Search size={16} className="text-gray-900" />
                      </button>
                      <button onClick={() => goTab("cart")} className="relative p-1.5 hover:bg-black/5 rounded-full transition-colors">
                        <ShoppingCart size={16} className="text-gray-900" />
                        <AnimatePresence>
                          {cartItemCount > 0 && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                              {cartItemCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="w-full">
                    <HeroTemplate state={s} templateId={s.heroTemplateId || "hero-1"} onShopClick={() => {
                        const target = document.getElementById("sl-catalog");
                        if(target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }} />
                  </div>
                  <div className="w-full flex-1">
                    <div className="max-w-screen-xl mx-auto px-4 md:px-12 py-4 md:py-8">
                        <div id="sl-catalog" className="pb-8 sticky top-0 z-40 backdrop-blur-xl pt-2">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                                {categories.map((c) => (
                                <button key={c} onClick={() => setActiveCategory(c)} className={`flex-shrink-0 px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[12px] font-black transition-all active:scale-95 ${activeCategory === c ? "shadow-lg bg-gray-900 text-white" : "border border-black/[0.05] bg-white text-gray-900 hover:brightness-95"}`}>
                                    {c}
                                </button>
                                ))}
                            </div>
                        </div>
                        <CatalogTemplate state={s} templateId={s.catalogTemplateId || "catalog-1"} products={filteredProducts} onProductClick={(p) => { setSelectedProduct(p); changeScreen("product"); logEvent("product_click", { productId: p.id }); }} />
                        <AboutTemplate state={s} templateId={s.aboutTemplateId || "about-1"} />
                    </div>
                  </div>
                  <div className="w-full mt-auto">
                    <FooterTemplate state={s} templateId={s.footerTemplateId || "footer-1"} />
                  </div>
                </div>
            </div>

            {/* OVERLAYS */}
            <AnimatePresence mode="wait">
                {screen !== "home" && (
                    <motion.div 
                      key={screen}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="fixed inset-0 z-[100] flex flex-col bg-white overflow-y-auto custom-scrollbar"
                    >
                        {screen === "product" && selectedProduct && (
                            <div className="w-full md:flex md:items-stretch md:min-h-screen bg-white text-gray-900">
                                <div className="md:w-1/2 relative bg-gray-100 shrink-0">
                                    {(() => {
                                        const imgs = selectedProduct.images?.length ? selectedProduct.images : (selectedProduct.image ? [selectedProduct.image] : []);
                                        const idx = activeImgIdx % (imgs.length || 1);
                                        return (
                                            <>
                                                <img src={imgs[idx]} alt={selectedProduct.name} className="w-full h-[400px] md:h-full object-cover" />
                                                <button onClick={() => changeScreen("home")} className="absolute top-5 left-5 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center active:scale-90 shadow-lg text-gray-900"><ChevronLeft size={20} /></button>
                                                {imgs.length > 1 && (
                                                    <div className="absolute bottom-12 left-0 right-0 flex gap-2 px-4 overflow-x-auto no-scrollbar z-20">
                                                        {imgs.map((img, i) => (
                                                            <button key={i} onClick={() => setActiveImgIdx(i)} className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === idx ? "border-white" : "border-transparent opacity-60"}`}><img src={img} className="w-full h-full object-cover" /></button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="p-6 md:p-12 md:w-1/2 flex flex-col justify-center">
                                    <div className="flex items-start justify-between">
                                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h1>
                                        <p className="text-2xl md:text-4xl font-black text-emerald-600">{s.currency}{Number(selectedProduct.price).toLocaleString()}</p>
                                    </div>
                                    <p className="text-xs md:text-base text-gray-500 mt-6 md:mt-10 leading-relaxed max-w-md">{selectedProduct.description || `Premium quality product.`}</p>
                                    <div className="mt-10 md:mt-16 space-y-3 md:space-y-4 max-w-md">
                                        {qty(selectedProduct.id) === 0 ? (
                                            <button disabled={selectedProduct.outOfStock} onClick={() => updateCart(selectedProduct.id, 1)} className="w-full py-4 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"><ShoppingCart size={18} /> ADD TO CART</button>
                                        ) : (
                                            <div className="flex items-center justify-between bg-gray-100 rounded-2xl md:rounded-3xl px-8 py-4 md:py-6 text-gray-900">
                                                <button onClick={() => updateCart(selectedProduct.id, -1)} className="active:scale-90"><Minus size={20} /></button>
                                                <span className="text-lg md:text-xl font-black">{qty(selectedProduct.id)}</span>
                                                <button onClick={() => updateCart(selectedProduct.id, 1)} className="active:scale-90 text-emerald-500"><Plus size={20} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {screen === "search" && (
                            <div className="w-full flex flex-col min-h-screen bg-white" style={{ backgroundColor: bgColor }}>
                                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full storefront-header p-6">
                                    <button onClick={() => changeScreen("home")} className="mb-4 text-gray-900"><ChevronLeft size={24} /></button>
                                    <div className="relative">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search catalog..." className="w-full pl-12 pr-6 py-4 bg-gray-100 rounded-2xl outline-none text-gray-900" />
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    {searchQuery && filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => { setSelectedProduct(p); changeScreen("product"); }} className="w-full flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-black/5"><img src={p.image} className="w-16 h-16 object-cover rounded-xl" /><div className="flex-1 text-left"><p className="text-sm font-black text-gray-900">{p.name}</p><p className="text-sm font-black text-emerald-600">{s.currency}{Number(p.price).toLocaleString()}</p></div></button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {screen === "cart" && (
                            <div className="w-full flex flex-col min-h-screen bg-white" style={{ backgroundColor: bgColor }}>
                                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full storefront-header p-6 flex items-center gap-4">
                                    <button onClick={() => changeScreen("home")} className="text-gray-900"><ChevronLeft size={24} /></button>
                                    <h2 className="text-xl font-black text-gray-900">Your Bag</h2>
                                </div>
                                <div className="p-6 flex-1">
                                    {cartItemCount === 0 ? <p className="text-center text-gray-400 py-20 font-black uppercase tracking-widest">Bag is empty</p> : (
                                        <div className="space-y-4">
                                            {Object.entries(cart).map(([id, q]) => {
                                                const p = s.products.find(x => x.id === Number(id));
                                                if (!p || q <= 0) return null;
                                                return <div key={id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 border border-black/5"><img src={p.image} className="w-16 h-16 object-cover rounded-xl" /><div className="flex-1 text-sm font-black text-gray-900">{p.name}<br /><span className="text-emerald-600">{s.currency}{(p.price * q).toLocaleString()}</span></div><div className="flex items-center gap-3 text-gray-900"><button onClick={() => updateCart(p.id, -1)}><Minus size={14}/></button><span>{q}</span><button onClick={() => updateCart(p.id, 1)}><Plus size={14}/></button></div></div>
                                            })}
                                            <div className="pt-10 space-y-4">
                                                <div className="flex justify-between font-black text-gray-900"><span>Total</span><span className="text-xl text-emerald-600">{s.currency}{totalPrice.toLocaleString()}</span></div>
                                                <button onClick={handleOrder} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl">CHECKOUT ON WHATSAPP</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {screen === "community" && (
                            <div className="w-full flex flex-col min-h-screen bg-white" style={{ backgroundColor: bgColor }}>
                                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full storefront-header p-6 flex items-center gap-4">
                                    <button onClick={() => changeScreen("home")} className="text-gray-900"><ChevronLeft size={24} /></button>
                                    <h2 className="text-xl font-black text-gray-900">Reviews</h2>
                                </div>
                                <div className="p-6">
                                    {reviews.length === 0 ? <p className="text-center text-gray-400 py-20 font-black uppercase tracking-widest">No reviews yet</p> : (
                                        <div className="space-y-6">
                                            {reviews.map(r => (
                                                <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5"><div className="flex justify-between mb-4"><span className="font-black text-sm text-gray-900">{r.author_name}</span><div className="flex gap-1">{Array.from({length:5}).map((_,i) => <Star key={i} size={12} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}/>)}</div></div><p className="text-sm text-gray-600 font-medium">{r.message}</p></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {screen === "success" && (
                            <div className="w-full flex flex-col items-center justify-center p-10 text-center min-h-screen bg-white">
                                <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
                                <h2 className="text-3xl font-black text-gray-900 italic uppercase">Order Sent!</h2>
                                <p className="text-gray-400 font-medium mt-4">We've forwarded your request to the store on WhatsApp.</p>
                                <button onClick={() => changeScreen("home")} className="mt-10 px-10 py-4 bg-gray-900 text-white rounded-full font-black shadow-xl">BACK TO STORE</button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-md border-t border-black/[0.04] md:border-none flex items-center justify-center px-4 md:px-0 md:pb-8" style={{ height: 75, backgroundColor: `${bgColor}f2` }}>
          <div className="flex items-center w-full max-w-screen-lg mx-auto md:px-8 md:py-2 md:w-fit md:gap-12">
            {[
              { id: "home", icon: Home, label: "Store" },
              { id: "search", icon: Search, label: "Search" },
              { id: "community", icon: MessageCircle, label: "Reviews" },
              { id: "cart", icon: ShoppingCart, label: "Cart", badge: cartItemCount },
            ].map(({ id, icon: Icon, label, badge }) => (
              <button key={id} onClick={() => goTab(id as any)} className={`flex-1 md:flex-initial flex flex-col items-center gap-1 py-2 relative active:scale-90 transition-all ${activeTab === id ? "text-gray-900" : "text-gray-300 hover:text-gray-400"}`}>
                <div className="relative">
                  <Icon className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" style={{ color: activeTab === id ? textColor : undefined }} strokeWidth={activeTab === id ? 2.5 : 1.5} />
                  {badge != null && badge > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">{badge}</span>}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest`} style={{ color: activeTab === id ? textColor : undefined }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW EXPORT — renders a single section template for the Live Preview Modal
// Called from BusinessView's LivePreviewModal component.
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerStorefrontPreview({
  type,
  templateId,
  state,
}: {
  type: "hero" | "catalog" | "about" | "footer";
  templateId: string;
  state: ShopState;
}) {
  // Build a tiny mock product list for catalog previews
  const mockProducts: Product[] = [
    { id: 1, name: "Premium Item", description: "Handcrafted with care", price: 12500, image: "", images: [], outOfStock: false, category: "Featured" },
    { id: 2, name: "Signature Piece", description: "Limited edition quality", price: 8900, image: "", images: [], outOfStock: false, category: "New" },
    { id: 3, name: "Classic Collection", description: "Timeless design excellence", price: 15000, image: "", images: [], outOfStock: false, category: "Popular" },
  ];

  const accent = state.accentColor || "#10b981";

  const wrapperClass = type === "hero"
    ? "min-h-[340px] relative overflow-hidden"
    : type === "catalog"
    ? "py-4 px-2"
    : type === "about"
    ? "py-4 px-2"
    : "px-2 py-2";

  return (
    <div className={wrapperClass}>
      {type === "hero" && (
        <HeroTemplate state={state} templateId={templateId} />
      )}
      {type === "catalog" && (
        <CatalogTemplate state={state} templateId={templateId} products={mockProducts} onProductClick={() => {}} />
      )}
      {type === "about" && (
        <AboutTemplate state={state} templateId={templateId} />
      )}
      {type === "footer" && (
        <FooterTemplate state={state} templateId={templateId} />
      )}
    </div>
  );
}