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
  MessageCircle, 
  Zap, 
  Loader2, 
  Star, 
  Heart, 
  Home, 
  ArrowRight,
  CheckCircle2,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import type { ShopState, Product } from "@/lib/types";

// ==========================================
// TEMPLATE ENGINE COMPONENTS
// ==========================================

const HeroTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    const title = state.heroTitle || state.bizName || "Premium Store";
    const subtitle = state.heroSubtitle || "Discover our curated collection";
    const btnText = state.heroButtonText || "Shop Now";
    const bg = state.heroImage || state.bizImage;
    const accent = state.accentColor || "#10b981";

    // Template 1 (Default): Full-bleed hero — works with OR without image
    if (!templateId || templateId === "hero-1") {
        return (
            <div className="relative w-full rounded-[2.5rem] overflow-hidden mb-10" style={{ minHeight: 340 }}>
                {/* Background */}
                <div className="absolute inset-0" style={{ background: bg ? `url(${bg}) center/cover no-repeat` : `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)` }} />
                {bg && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />}
                {!bg && <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}18 0%, transparent 70%)` }} />}
                {/* Content */}
                <div className={`relative z-10 flex flex-col justify-end p-8 md:p-16`} style={{ minHeight: 340 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 w-fit" style={{ backgroundColor: accent, color: "white" }}>
                        <span>✦</span> {state.bizName || "Collection"}
                    </div>
                    <h1 className={`text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-4 ${bg ? "text-white" : "text-gray-900"}`}>
                        {title}
                    </h1>
                    <p className={`text-sm md:text-base font-medium max-w-md mb-8 leading-relaxed ${bg ? "text-white/80" : "text-gray-500"}`}>
                        {subtitle}
                    </p>
                    <button className="w-fit px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center gap-3 text-white"
                        style={{ backgroundColor: accent }}>
                        {btnText} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Template 2: Immersive Full-Screen Background
    if (templateId === "hero-2") {
        return (
            <div className="relative w-full h-[60vh] min-h-[420px] flex flex-col items-center justify-center text-center p-6 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
                <div className="absolute inset-0" style={{ backgroundColor: accent, background: bg ? undefined : `linear-gradient(135deg, ${accent}, ${accent}88)` }}>
                    {bg && <img src={bg} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="" />}
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">{title}</h1>
                    <p className="mt-4 text-sm md:text-lg text-white/80 font-bold">{subtitle}</p>
                    <button className="mt-8 px-8 py-4 bg-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform rounded-full" style={{ color: accent }}>{btnText}</button>
                </div>
            </div>
        );
    }

    // Template 3: Minimalist Typography
    if (templateId === "hero-3") {
        return (
            <div className="py-20 md:py-32 text-center px-4 mb-12">
                <div className="inline-block text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border mb-8" style={{ borderColor: accent, color: accent }}>
                    {state.bizName}
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight max-w-3xl mx-auto">{title}</h1>
                <p className="mt-6 text-lg md:text-xl text-gray-500 font-medium max-w-xl mx-auto">{subtitle}</p>
                <button className="mt-10 px-10 py-5 rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-xl text-white" style={{ backgroundColor: accent }}>{btnText}</button>
            </div>
        );
    }

    // Fallback: same as hero-1
    return <HeroTemplate state={state} templateId="hero-1" />;
};

const CatalogTemplate = ({ state, templateId, products, onProductClick }: { state: ShopState, templateId: string, products: Product[], onProductClick: (p: Product) => void }) => {
    
    // Template 2: Magazine List
    if (templateId === "catalog-2") {
        return (
            <div className="space-y-6">
                {products.map(p => (
                    <button key={p.id} onClick={() => onProductClick(p)} className="w-full flex items-center gap-6 p-4 rounded-[2rem] bg-white shadow-sm hover:shadow-xl transition-all group text-left border border-black/[0.02]">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] overflow-hidden bg-gray-50 shrink-0 relative">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            {p.outOfStock && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"><span className="text-[9px] font-black uppercase text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm">Sold Out</span></div>}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {p.badge === "hot" && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Hot</span>}
                                {p.badge === "new" && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">New</span>}
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">{p.name}</h3>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                            <p className="text-lg md:text-xl font-black text-emerald-600 mt-3">{state.currency}{Number(p.price).toLocaleString()}</p>
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    // Template 1 (Default): Modern Grid
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {products.map(p => (
                <button key={p.id} onClick={() => onProductClick(p)} className="flex flex-col text-left group">
                    <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-white shadow-sm mb-4 relative border border-black/[0.02] group-hover:shadow-xl transition-all">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {p.badge === "hot" && <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">Hot</span>}
                            {p.badge === "new" && <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">New</span>}
                            {p.badge === "sale" && <span className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">Sale</span>}
                        </div>

                        {p.outOfStock && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 bg-white px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
                            </div>
                        )}
                    </div>
                    <h3 className="font-black text-sm md:text-lg text-gray-900 truncate px-1">{p.name}</h3>
                    <p className="font-bold text-xs md:text-sm text-gray-400 mt-1 px-1 line-clamp-1">{p.description}</p>
                    <p className="font-black text-sm md:text-xl text-emerald-600 mt-2 px-1">{state.currency}{Number(p.price).toLocaleString()}</p>
                </button>
            ))}
        </div>
    );
};

const AboutTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    if (!state.aboutUs) return null;

    // Template 2: Centered Elegant
    if (templateId === "about-2") {
        return (
            <div className="py-20 text-center max-w-3xl mx-auto border-y border-black/[0.05] my-20">
                <Zap size={32} className="text-emerald-500 mx-auto mb-6 opacity-20" />
                <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-[0.2em] mb-8">The Brand</h2>
                <p className="text-lg md:text-2xl text-gray-600 font-medium leading-relaxed italic">&quot;{state.aboutUs}&quot;</p>
            </div>
        );
    }

    // Template 1 (Default): Card
    return (
        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-black/[0.02] border border-black/[0.01] my-20">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 italic uppercase tracking-tighter mb-6">Our Story</h2>
            <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-2xl">{state.aboutUs}</p>
        </div>
    );
};

const FooterTemplate = ({ state, templateId }: { state: ShopState, templateId: string }) => {
    const accent = state.accentColor || "#10b981";
    const socials = state.socials as any || {};
    
    // Template 2: Minimal centered
    if (templateId === "footer-2") {
        return (
            <footer className="py-16 text-center border-t border-black/[0.06] mt-20 space-y-6">
                <h3 className="text-2xl font-black text-gray-900 italic uppercase">{state.bizName}</h3>
                {state.tagline && <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{state.tagline}</p>}
                <div className="flex justify-center gap-3">
                    {socials.instagram && <a href={socials.instagram} target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                    {socials.twitter && <a href={socials.twitter} target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>}
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Powered by SwiftLink</p>
            </footer>
        );
    }

    // Template 1 (Default): Branded card — uses theme accent color, not hardcoded black
    return (
        <footer className="rounded-[2.5rem] p-10 md:p-16 mt-20 mb-8 flex flex-col md:flex-row gap-10 justify-between" style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}22` }}>
            <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: accent }}>
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 italic uppercase">{state.bizName}</h3>
                </div>
                {state.tagline && <p className="text-gray-500 font-medium text-sm leading-relaxed">{state.tagline}</p>}
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">Powered by SwiftLink</p>
            </div>
            <div className="space-y-5">
                {(state.contactEmail || state.contactAddress || state.phone) && (
                    <div className="space-y-2">
                        {state.contactEmail && <p className="text-xs text-gray-500 font-medium">{state.contactEmail}</p>}
                        {state.phone && <p className="text-xs text-gray-500 font-medium">{state.phone}</p>}
                        {state.contactAddress && <p className="text-xs text-gray-500 font-medium">{state.contactAddress}</p>}
                    </div>
                )}
                <div className="flex gap-3">
                    {socials.instagram && <a href={socials.instagram} target="_blank" className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>}
                    {socials.facebook && <a href={socials.facebook} target="_blank" className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>}
                    {socials.website && <a href={socials.website} target="_blank" className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}><Globe size={16} /></a>}
                </div>
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
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", message: "", rating: 5 });

  useEffect(() => {
      if (screen === "community" && effectiveState?.id) {
          setReviewsLoading(true);
          supabase.from("store_reviews").select("*").eq("store_id", effectiveState.id).order("created_at", { ascending: false })
            .then(({ data }) => {
                if (data) setReviews(data);
                setReviewsLoading(false);
            });
      }
  }, [screen, effectiveState?.id]);

  const submitReview = async () => {
      if (!newReview.name || !newReview.message || !effectiveState?.id) return;
      
      const { data, error } = await supabase.from("store_reviews").insert({
          store_id: effectiveState.id,
          author_name: newReview.name,
          message: newReview.message,
          rating: newReview.rating
      }).select().single();

      if (!error && data) {
          setReviews(prev => [data, ...prev]);
          setShowReviewForm(false);
          setNewReview({ name: "", message: "", rating: 5 });
      }
  };

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

  const pageAnim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 },
  };

  const qty = (id: number) => cart[id] || 0;

  // NEW DYNAMIC COLOR SYSTEM
  const accentColor = s.accentColor || "#10b981";
  const bgColor = s.bgColor || "#f2f2f7";
  const textColor = s.textColor || "#111827";
  const surfaceColor = s.surfaceColor || "#ffffff";
  const buttonColor = s.buttonColor || accentColor;

  return (
    <div className="min-h-screen flex flex-col items-center selection:bg-emerald-500 selection:text-white"
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
         .bg-\\[\\#f2f2f7\\] { background-color: var(--bg-color) !important; }
         .text-gray-900 { color: var(--text-color) !important; }
         .bg-white { background-color: var(--surface-color) !important; border-color: color-mix(in srgb, var(--text-color) 5%, transparent) !important; }
         .bg-gray-50 { background-color: color-mix(in srgb, var(--surface-color) 90%, black) !important; }
         .bg-gray-100 { background-color: color-mix(in srgb, var(--surface-color) 95%, black) !important; }
         .text-gray-500, .text-gray-400 { color: color-mix(in srgb, var(--text-color) 60%, transparent) !important; }
         .bg-gray-900 { background-color: color-mix(in srgb, var(--text-color) 90%, black) !important; color: var(--bg-color) !important; }
      `}</style>
      
      <div className="w-full max-w-screen-xl min-h-screen flex flex-col relative overflow-hidden md:shadow-[0_0_100px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            
            {/* HOME SCREEN */}
            {screen === "home" && (
              <motion.div key="home" {...pageAnim} className="absolute inset-0 flex flex-col overflow-hidden">
                
                {/* Fixed Header */}
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] sticky top-0 z-50 w-full shrink-0">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
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
                      <button onClick={() => goTab("search")} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <Search size={16} className="text-gray-500" />
                      </button>
                      <button onClick={() => goTab("cart")} className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ShoppingCart size={16} className="text-gray-500" />
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

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-4 md:py-8">
                    
                    {/* NEW TEMPLATE ENGINE */}
                    <HeroTemplate state={s} templateId={s.heroTemplateId || "hero-1"} />

                    {/* CATEGORIES BAR */}
                    <div className="pb-8 sticky top-0 z-40 backdrop-blur-xl pt-2">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                            {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setActiveCategory(c)}
                                className={`flex-shrink-0 px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[12px] font-black transition-all active:scale-95 ${
                                activeCategory === c ? "shadow-lg bg-gray-900 text-white" : "border border-black/[0.05] bg-white text-gray-500 hover:brightness-95"
                                }`}
                            >
                                {c}
                            </button>
                            ))}
                        </div>
                    </div>

                    <CatalogTemplate state={s} templateId={s.catalogTemplateId || "catalog-1"} products={filteredProducts} onProductClick={(p) => { setSelectedProduct(p); setScreen("product"); logEvent("product_click", { productId: p.id }); }} />
                    <AboutTemplate state={s} templateId={s.aboutTemplateId || "about-1"} />
                    <FooterTemplate state={s} templateId={s.footerTemplateId || "footer-1"} />

                  </div>
                  <div className="h-24" />
                </div>
              </motion.div>
            )}

            {/* PRODUCT DETAIL SCREEN */}
            {screen === "product" && selectedProduct && (
              <motion.div key="product" {...pageAnim} className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto md:flex md:items-stretch md:min-h-screen">
                    
                    {/* Image Column */}
                    <div className="relative md:w-1/2 md:h-screen">
                      {(() => {
                        const imgs = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image];
                        const idx = Math.min(activeImgIdx, imgs.length - 1);
                        return (
                          <>
                            <img src={imgs[idx]} alt={selectedProduct.name} className="w-full h-[400px] md:h-full object-cover" />
                            {imgs.length > 1 && (
                              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                                {imgs.map((_, i) => (
                                  <button key={i} onClick={() => setActiveImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/50"}`} />
                                ))}
                              </div>
                            )}
                            {imgs.length > 1 && (
                              <div className="absolute bottom-12 left-0 right-0 flex gap-2 px-4 overflow-x-auto no-scrollbar z-20">
                                {imgs.map((img, i) => (
                                  <button key={i} onClick={() => setActiveImgIdx(i)} className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === idx ? "border-white" : "border-transparent opacity-60"}`}>
                                    <img src={img} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
                      <button onClick={() => { setScreen("home"); setActiveImgIdx(0); }} className="absolute top-5 left-5 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center active:scale-90 shadow-lg text-gray-900">
                        <ChevronLeft size={20} />
                      </button>
                    </div>

                    {/* Content Column */}
                    <div className="p-6 md:p-12 md:w-1/2 flex flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h1>
                        </div>
                        <p className="text-2xl md:text-4xl font-black text-emerald-600">{s.currency}{Number(selectedProduct.price).toLocaleString()}</p>
                      </div>

                      <p className="text-xs md:text-base text-gray-500 mt-6 md:mt-10 leading-relaxed max-w-md">
                        {selectedProduct.description || `Premium quality ${selectedProduct.name.toLowerCase()} designed for the modern lifestyle.`}
                      </p>

                      <div className="mt-10 md:mt-16 space-y-3 md:space-y-4 max-w-md">
                        {qty(selectedProduct.id) === 0 ? (
                          <button disabled={selectedProduct.outOfStock} onClick={() => updateCart(selectedProduct.id, 1)} className="w-full py-4 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50 disabled:grayscale">
                            <ShoppingCart size={18} /> {selectedProduct.outOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                          </button>
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
                </div>
              </motion.div>
            )}

            {/* SEARCH SCREEN */}
            {screen === "search" && (
              <motion.div key="search" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 md:py-10">
                    <h2 className="text-sm md:text-2xl font-black text-gray-900 mb-4 md:mb-6 tracking-tight">Search Catalog</h2>
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Try 'hoodie'..." className="w-full pl-12 pr-6 py-4 md:py-6 bg-gray-100 rounded-2xl md:rounded-3xl text-xs md:text-lg font-bold text-gray-900 placeholder:text-gray-400 outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all shadow-inner" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 space-y-4">
                    {searchQuery && filteredProducts.map((p) => (
                      <button key={p.id} onClick={() => { setSelectedProduct(p); setScreen("product"); }} className="w-full flex items-center gap-4 md:gap-8 bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-xl active:scale-[0.98] transition-all group border border-black/[0.01]">
                        <img src={p.image} className="w-16 h-16 md:w-32 md:h-32 object-cover rounded-xl md:rounded-[1.5rem] flex-shrink-0 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 text-left">
                          <p className="text-[11px] md:text-xl font-black text-gray-900 leading-none mb-1 md:mb-3">{p.name}</p>
                          <p className="text-[12px] md:text-2xl font-black text-emerald-600 mt-2 md:mt-4">{s.currency}{Number(p.price).toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all"><ArrowRight size={20} /></div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CART SCREEN */}
            {screen === "cart" && (
              <motion.div key="cart" {...pageAnim} className="absolute inset-0 flex flex-col bg-[#f2f2f7] overflow-hidden">
                <div className="bg-white/90 backdrop-blur-md border-b border-black/[0.06] w-full">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 md:py-10 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm md:text-2xl font-black text-gray-900 tracking-tight">Your Shopping Bag</h2>
                      <p className="text-[10px] md:text-sm text-gray-400 font-bold mt-1 uppercase tracking-wider">{cartItemCount} items selected</p>
                    </div>
                    <button onClick={() => goTab("home")} className="p-2 md:p-3 bg-gray-100 rounded-full text-gray-900"><X size={20} /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6">
                    {cartItemCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ShoppingCart size={40} className="text-gray-200 mb-8" />
                        <p className="text-xs md:text-base font-black text-gray-400 uppercase tracking-[0.2em]">Bag is empty</p>
                        <button onClick={() => goTab("home")} className="mt-8 px-10 py-4 bg-gray-900 text-white text-[11px] md:text-sm font-black rounded-full active:scale-95 transition-all shadow-xl">BROWSE STORE</button>
                      </div>
                    ) : (
                      <div className="md:flex md:gap-12">
                        <div className="flex-1 space-y-4">
                          <AnimatePresence>
                            {Object.entries(cart).map(([id, q]) => {
                              const p = s.products.find(x => x.id === Number(id));
                              if (!p || q <= 0) return null;
                              return (
                                <motion.div key={id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm flex items-center gap-4 md:gap-8 border border-black/[0.01]">
                                  <img src={p.image} className="w-16 h-16 md:w-32 md:h-32 object-cover rounded-xl" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] md:text-xl font-black text-gray-900 truncate leading-none mb-1.5">{p.name}</p>
                                    <p className="text-[11px] md:text-lg font-black text-emerald-600">{s.currency}{(Number(p.price) * q).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 bg-gray-50 rounded-full p-1 md:p-1.5 text-gray-900">
                                    <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 md:w-10 md:h-10 bg-white shadow-sm rounded-full flex items-center justify-center active:scale-90"><Minus size={12} /></button>
                                    <span className="text-xs md:text-lg font-black w-4 md:w-8 text-center">{q}</span>
                                    <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 md:w-10 md:h-10 bg-emerald-500 text-white shadow-sm rounded-full flex items-center justify-center active:scale-90"><Plus size={12} /></button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                        <div className="md:w-[350px] mt-8 md:mt-0">
                          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-black/[0.02] border border-black/[0.01] sticky top-32">
                            <h3 className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Order Summary</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between text-xs md:text-base font-bold text-gray-400"><span>Subtotal</span><span className="text-gray-900">{s.currency}{totalPrice.toLocaleString()}</span></div>
                              <div className="border-t border-gray-50 pt-6 flex justify-between"><span className="text-sm md:text-lg font-black text-gray-900">Total</span><span className="text-xl md:text-3xl font-black text-emerald-600">{s.currency}{totalPrice.toLocaleString()}</span></div>
                            </div>
                            <button onClick={handleOrder} className="w-full mt-8 md:mt-10 py-5 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl text-xs md:text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl">
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
                  <p className="text-sm md:text-lg text-gray-400 font-medium leading-relaxed">We&apos;ve forwarded your request to the store on WhatsApp.</p>
                  <button onClick={() => { setScreen("home"); setActiveTab("home"); }} className="px-10 py-4 bg-gray-900 text-white text-xs md:text-sm font-black rounded-full active:scale-95 transition-all shadow-xl">BACK TO STORE</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-black/[0.04] md:border-none flex items-center justify-center px-4 md:px-0 md:pb-8" style={{ height: 70 }}>
          <div className="flex items-center w-full max-w-screen-lg mx-auto md:bg-white md:shadow-2xl md:rounded-full md:px-8 md:py-2 md:w-fit md:gap-12">
            {[
              { id: "home", icon: Home, label: "Store" },
              { id: "search", icon: Search, label: "Search" },
              { id: "community", icon: MessageCircle, label: "Reviews" },
              { id: "cart", icon: ShoppingCart, label: "Cart", badge: cartItemCount },
            ].map(({ id, icon: Icon, label, badge }) => (
              <button key={id} onClick={() => goTab(id as any)} className={`flex-1 md:flex-initial flex flex-col items-center gap-1 py-2 relative active:scale-90 transition-all ${activeTab === id ? "text-gray-900" : "text-gray-300 hover:text-gray-400"}`}>
                <div className="relative">
                  <Icon className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" strokeWidth={activeTab === id ? 2.5 : 1.5} />
                  {badge != null && badge > 0 && <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">{badge}</span>}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === id ? "text-gray-900" : "text-gray-300"}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
