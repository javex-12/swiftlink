"use client";

import { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { getShopPath } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Trash2, RefreshCw, Eye, Sparkles, Palette, ShoppingCart, User, FileText, ExternalLink, Shield, Code2, Copy, Image as ImageIcon } from "lucide-react";

const HERO_TEMPLATES = [
    {
        id: "spotlight",
        name: "Spotlight",
        description: "Full-width product image with strong text overlay.",
        className: "from-black/85 via-black/35 to-transparent",
    },
    {
        id: "split-showcase",
        name: "Split Showcase",
        description: "Text and product photo side by side.",
        className: "from-emerald-950 via-slate-950 to-slate-900",
    },
    {
        id: "editorial",
        name: "Editorial",
        description: "Magazine-style launch section for premium brands.",
        className: "from-stone-950 via-neutral-900 to-zinc-800",
    },
    {
        id: "drop-card",
        name: "Drop Card",
        description: "Compact promo card for fast sales campaigns.",
        className: "from-slate-950 via-emerald-950 to-slate-950",
    },
] as const;

export function BusinessView() {
  const [activeTab, setActiveTab] = useState<"store" | "appearance">("store");
  const [expandedSection, setExpandedSection] = useState<string>("themes");

  const {
    state,
    isSupabaseActive,
    updateState,
    setStateMerge,
    addProduct,
    updateProduct,
    removeProduct,
    handleImageUpload,
    addProductImage,
    removeProductImage,
    setPrimaryImage,
    isSyncing,
    addSystemNotification
  } = useSwiftLink();

  const handleUpdate = (field: keyof ShopState, value: any) => {
    updateState(field, value);
  };

  const onAddProduct = () => {
    addProduct();
    addSystemNotification("Product Draft Created", "A new item has been added to your inventory.", "message");
  };

  const openLivePreview = () => {
    const path = getShopPath(state);
    const url = `${window.location.origin}${path}`;
    window.open(url, "_blank");
  };

  const exportHeroCode = async () => {
    const heroImage = state.heroImage || state.bizImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200";
    const heroTitle = state.heroTitle || state.tagline || "Premium Products";
    const heroSubtitle = state.heroSubtitle || state.aboutUs || "Shop the latest collection from our store.";
    const heroButton = state.heroButtonText || "Shop Now";
    const code = `<section class="swiftlink-hero swiftlink-hero-${state.heroTemplate || "spotlight"}">
  <img src="${heroImage}" alt="${state.bizName || "Store"} hero" />
  <div class="swiftlink-hero-content">
    <p>${state.bizName || "SwiftLink Store"}</p>
    <h1>${heroTitle}</h1>
    <span>${heroSubtitle}</span>
    <a href="#products">${heroButton}</a>
  </div>
</section>`;
    await navigator.clipboard.writeText(code);
    addSystemNotification("Hero Code Copied", "Your current hero section code was copied to clipboard.", "message");
  };

  const addCategory = async () => {
    const name = await (window as any).customPrompt("New Category", "Enter name (e.g. Caps, Watches):");
    if (name) {
        const current = state.categories || [];
        if (!current.includes(name)) {
            handleUpdate("categories", [...current, name]);
        }
    }
  };

  const removeCategory = async (cat: string) => {
    const ok = await (window as any).customConfirm(`Remove category?`, `Products in "${cat}" will stay, but the filter will be gone.`);
    if (ok) {
        handleUpdate("categories", (state.categories || []).filter(c => c !== cat));
    }
  };

  const categories = state.categories || [];
  const accentStr = state.accentColor || "#10b981";

  const applyThemePreset = (preset: ShopState["themePreset"]) => {
    let updates: Partial<ShopState> = { themePreset: preset };
    switch (preset) {
        case "fresh":
            updates = { ...updates, accentColor: "#10b981", fontStyle: "modern", layoutStyle: "grid", heroStyle: "banner", buttonRadius: "rounded", bgStyle: "white", imageShape: "square", priceStyle: "bold" };
            break;
        case "bold":
            updates = { ...updates, accentColor: "#f59e0b", fontStyle: "bold", layoutStyle: "magazine", heroStyle: "split", buttonRadius: "sharp", bgStyle: "white", imageShape: "square", priceStyle: "strikethrough" };
            break;
        case "minimal":
            updates = { ...updates, accentColor: "#0f172a", fontStyle: "classic", layoutStyle: "list", heroStyle: "minimal", buttonRadius: "sharp", bgStyle: "white", imageShape: "square", priceStyle: "plain" };
            break;
        case "playful":
            updates = { ...updates, accentColor: "#d946ef", fontStyle: "playful", layoutStyle: "grid", heroStyle: "banner", buttonRadius: "pill", bgStyle: "light-tint", imageShape: "circle", priceStyle: "bold" };
            break;
    }
    setStateMerge(updates);
  };

  const Accordion = ({ id, title, icon: Icon, subtitle, children }: { id: string, title: string, icon: any, subtitle?: string, children: React.ReactNode }) => {
      const isOpen = expandedSection === id;
      return (
          <div className={cn("bg-white dark:bg-black rounded-3xl border transition-all duration-300 mb-4 overflow-hidden", isOpen ? "border-slate-200 dark:border-white/10 shadow-md" : "border-slate-100 dark:border-white/5 shadow-sm")}>
              <button 
                  className="w-full px-5 py-4 flex items-center justify-between bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                  onClick={() => setExpandedSection(isOpen ? "" : id)}
              >
                  <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner border border-slate-50 dark:border-white/5", isOpen ? "bg-slate-900 dark:bg-white text-white dark:text-black" : "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600")}>
                          <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left flex flex-col">
                          <h3 className="font-black text-sm text-slate-800 dark:text-white">{title}</h3>
                          {subtitle && <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{subtitle}</span>}
                      </div>
                  </div>
                  <Plus className={cn("w-5 h-5 text-slate-300 dark:text-zinc-700 transition-transform duration-300", isOpen && "rotate-[135deg] text-slate-900 dark:text-white")} />
              </button>
              <div className={cn("transition-all duration-300 origin-top overflow-hidden", isOpen ? "max-h-[3000px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0")}>
                  <div className="p-5 pt-2 border-t border-slate-50 dark:border-white/5">
                     {children}
                  </div>
              </div>
          </div>
      );
  };

  const PillSelector = ({ options, value, onChange, className }: { options: {label: string, value: string}[], value: string, onChange: (v: string) => void, className?: string }) => (
      <div className={cn("flex flex-wrap gap-2", className)}>
          {options.map(opt => (
              <button
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={cn(
                      "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border shrink-0",
                      value === opt.value 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-md transform -translate-y-0.5" 
                          : "bg-white dark:bg-black text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                  )}
              >
                  {opt.label}
              </button>
          ))}
      </div>
  );

  return (
    <div className="pb-32 font-sans bg-slate-50/50 dark:bg-black min-h-screen transition-colors duration-300">
      
      {/* Real-time Sync Indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-white text-white dark:text-black border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl"
          >
             <RefreshCw size={14} className="animate-spin text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">Saving Changes...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto space-y-10 px-4 md:px-6 pt-4 md:pt-8">
        
        {!isSupabaseActive && (
           <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                 <Shield size={24} />
              </div>
              <div className="text-center md:text-left">
                 <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Supabase Not Configured</h4>
                 <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Global sync and public store links require Supabase environment variables. Check your .env file.</p>
              </div>
           </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
            <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Store Editor</h1>
                  {state.plan === "pro" && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase tracking-widest shadow-lg shadow-emerald-500/20">Pro</span>
                  )}
                </div>
                <p className="text-slate-400 dark:text-zinc-500 font-bold text-sm mt-1 uppercase tracking-widest">Manage your products and brand identity.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <div className="flex bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 w-full sm:w-auto">
                    <button
                    className={cn("flex-1 sm:px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "store" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg scale-[1.05]" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                    onClick={() => setActiveTab("store")}
                    >
                    Inventory
                    </button>
                    <button
                    className={cn("flex-1 sm:px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "appearance" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg scale-[1.05]" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                    onClick={() => setActiveTab("appearance")}
                    >
                    Design
                    </button>
                </div>
                <button 
                    onClick={openLivePreview}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <ExternalLink size={16} />
                    View Live Store
                </button>
            </div>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === "store" && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            
            {/* Store Profile Card */}
            <section className="bg-white dark:bg-black rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm border border-slate-100 dark:border-white/10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-slate-900 dark:text-white hidden md:block">
                    <FileText size={200} />
                </div>
                <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start relative z-10">
                    <label
                    htmlFor="biz-img-upload"
                    className="relative block w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[3.5rem] bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group shadow-inner transition-all hover:scale-105 hover:border-emerald-500"
                    style={ state.bizImage ? { backgroundImage: `url(${state.bizImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined }
                    >
                    {!state.bizImage && !isSyncing && <i className="fas fa-camera text-slate-200 dark:text-zinc-800 text-4xl group-hover:text-emerald-500 transition-colors" />}
                    {isSyncing && <RefreshCw size={32} className="text-emerald-500 animate-spin" />}
                    {state.bizImage && !isSyncing && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><i className="fas fa-sync text-2xl" /></div>}
                    <input type="file" id="biz-img-upload" accept="image/*" disabled={isSyncing} className="hidden" onChange={(e) => { handleImageUpload(e.target.files?.[0], "bizImage"); } } />
                    </label>
                    <div className="flex-1 space-y-6 w-full">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Business Name</label>
                            <input
                            type="text"
                            id="biz-name"
                            data-tour-biz-name
                            value={state.bizName || ""}
                            onChange={(e) => { updateState("bizName", e.target.value); }}
                            className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-black text-lg md:text-xl text-slate-900 dark:text-white outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-all shadow-inner"
                            placeholder="Elite Fashion"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">WhatsApp Number</label>
                            <input
                            type="tel"
                            id="biz-phone"
                            data-tour-biz-phone
                            value={state.phone || ""}
                            onChange={(e) => { updateState("phone", e.target.value); }}
                            className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-all shadow-inner"
                            placeholder="+234..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Hero Tagline</label>
                            <input
                            type="text"
                            id="biz-tagline"
                            value={state.tagline || ""}
                            onChange={(e) => { updateState("tagline", e.target.value); }}
                            className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-all shadow-inner"
                            placeholder="Redefining Your Lifestyle."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Manager */}
            <section className="bg-white dark:bg-black rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-white/10 space-y-8">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">Your Categories</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mt-1">Organize your inventory for customers</p>
                    </div>
                    <button onClick={addCategory} className="bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 px-5 py-3 rounded-xl transition-all border border-slate-100 dark:border-white/5">
                        <Plus size={14} /> Add New
                    </button>
                </div>
                <div className="flex flex-wrap gap-3">
                    {state.categories?.map(cat => (
                        <div key={cat} className="group bg-white dark:bg-black border border-slate-100 dark:border-white/10 pl-5 pr-2 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                        <span className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-tighter">{cat}</span>
                        <button onClick={() => removeCategory(cat)} className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-zinc-900 text-slate-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                            <X size={12} strokeWidth={3} />
                        </button>
                        </div>
                    ))}
                    {(!state.categories || state.categories.length === 0) && (
                        <div className="w-full py-3">
                          <p className="text-[10px] font-bold text-slate-300 dark:text-zinc-700 uppercase tracking-widest italic">
                            No categories yet. Add categories that match what you sell (e.g. “Hair”, “Perfume”, “Phones”, “Pastries”).
                          </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-6 md:space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Products</h2>
                <button
                    type="button"
                    data-tour-add-product
                    disabled={isSyncing}
                    onClick={onAddProduct}
                    className="w-full sm:w-auto text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    style={{ backgroundColor: accentStr, boxShadow: `0 20px 40px -10px ${accentStr}66` }}
                >
                    {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                    New Product Entry
                </button>
                </div>

                <div className="space-y-6 md:space-y-8">
                {state.products.map((p) => {
                    const imgs = p.images || (p.image ? [p.image] : []);
                    return (
                    <div key={p.id} className="bg-white dark:bg-black rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 border border-slate-100 dark:border-white/10 shadow-sm relative group transition-all hover:border-emerald-500/20 hover:shadow-2xl">
                    
                    <button onClick={() => removeProduct(p.id)} className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-zinc-900 text-slate-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all z-20 border border-slate-100 dark:border-white/5">
                        <Trash2 size={18} />
                    </button>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                        {/* Image Manager */}
                        <div className="w-full md:w-48 shrink-0 flex flex-col gap-4">
                            <label
                                className={cn(
                                    "w-full aspect-square bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all shadow-inner",
                                    state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-[2.5rem]"
                                )}
                                style={imgs.length > 0 ? { backgroundImage: `url(${imgs[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                            >
                                {!imgs.length && <i className="fas fa-image text-slate-200 dark:text-zinc-800 text-5xl" />}
                                {imgs.length > 0 && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fas fa-plus text-white text-2xl" /></div>}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { imgs.length > 0 ? handleImageUpload(e.target.files[0], "image", p.id) : addProductImage(p.id, e.target.files[0]); } }} />
                            </label>
                            
                            {imgs.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
                                    {imgs.slice(1).map((img, idx) => (
                                        <div key={idx} className={cn("w-14 h-14 overflow-hidden relative group shrink-0 border-2 border-slate-100 dark:border-white/10 shadow-sm", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-xl" )}>
                                            <img src={img} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                <button onClick={() => { setPrimaryImage(p.id, idx + 1); }} className="text-xs text-white hover:text-emerald-400"><i className="fas fa-star" /></button>
                                                <button onClick={() => { removeProductImage(p.id, idx + 1); }} className="text-xs text-white hover:text-red-400"><i className="fas fa-times" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <label className={cn("w-14 h-14 bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 border-dashed flex items-center justify-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 transition-all shrink-0 text-slate-400 dark:text-zinc-700 hover:text-emerald-500", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-xl")}>
                                        <i className="fas fa-plus text-xs" />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { addProductImage(p.id, e.target.files[0]); } }} />
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-6 min-w-0">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Product Name</label>
                            <input
                                data-product-name={p.id}
                                value={p.name || ""}
                                onChange={(e) => { updateProduct(p.id, "name", e.target.value); }}
                                className="w-[95%] font-black text-2xl md:text-3xl outline-none bg-transparent placeholder:text-slate-200 dark:placeholder:text-zinc-800 tracking-tight text-slate-900 dark:text-white border-b-2 border-transparent focus:border-emerald-500 transition-all truncate italic uppercase"
                                placeholder="New Premium Item"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Price</label>
                                <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-white/5 flex items-center gap-3 focus-within:border-emerald-500 transition-all shadow-inner">
                                    <span className="text-slate-400 dark:text-zinc-600 font-black text-xl">{state.currency}</span>
                                    <input 
                                        data-product-price={p.id}
                                        type="number" value={p.price || ''} onChange={(e) => { updateProduct(p.id, "price", Number(e.target.value)); }} 
                                        className="w-28 md:w-32 bg-transparent font-black text-slate-900 dark:text-white outline-none text-xl" placeholder="0" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Category</label>
                                <div className="bg-slate-50 dark:bg-zinc-900/50 px-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-white/5 flex items-center focus-within:border-emerald-500 transition-all shadow-inner relative">
                                    <select
                                      value={p.category || ""}
                                      onChange={(e) => { updateProduct(p.id, "category", e.target.value); }}
                                      className="bg-transparent text-xs font-black text-slate-700 dark:text-zinc-300 outline-none appearance-none pr-8 cursor-pointer max-w-[160px] truncate uppercase tracking-widest"
                                    >
                                        <option value="" className="bg-white dark:bg-black">Uncategorized</option>
                                        {categories.map((cat) => (
                                          <option key={cat} value={cat} className="bg-white dark:bg-black">{cat}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 pointer-events-none text-slate-400 dark:text-zinc-600 text-[10px]">▼</div>
                                </div>
                                {categories.length === 0 && (
                                  <button
                                    type="button"
                                    onClick={addCategory}
                                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 mt-1 ml-1"
                                  >
                                    + Add a category
                                  </button>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Live Status</label>
                                <div className="bg-slate-50 dark:bg-zinc-900/50 px-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-white/5 flex items-center focus-within:border-emerald-500 transition-all shadow-inner relative">
                                    <select value={p.badge || "none"} onChange={(e) => { updateProduct(p.id, "badge", e.target.value === "none" ? undefined : e.target.value); }} className="bg-transparent text-xs font-black text-slate-700 dark:text-zinc-300 outline-none appearance-none pr-8 cursor-pointer uppercase tracking-widest">
                                        <option value="none" className="bg-white dark:bg-black">Standard</option>
                                        <option value="hot" className="bg-white dark:bg-black">🔥 Hot</option>
                                        <option value="new" className="bg-white dark:bg-black">✨ New</option>
                                        <option value="sale" className="bg-white dark:bg-black">🏷️ Sale</option>
                                    </select>
                                    <div className="absolute right-4 pointer-events-none text-slate-400 dark:text-zinc-600 text-[10px]">▼</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Product Story (Description)</label>
                            <textarea
                                value={p.description || ""}
                                onChange={(e) => { updateProduct(p.id, "description", e.target.value); }}
                                className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-[2rem] p-6 text-sm font-bold text-slate-600 dark:text-zinc-400 outline-none h-32 border-2 border-slate-100 dark:border-white/5 focus:border-emerald-500 focus:bg-white dark:focus:bg-black resize-none transition-all shadow-inner placeholder:text-slate-300 dark:placeholder:text-zinc-800 leading-relaxed overflow-y-auto"
                                placeholder="Describe the quality and details of this product..."
                            />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4">
                            <label className="flex items-center cursor-pointer group/toggle">
                                <div className="relative">
                                <input type="checkbox" className="sr-only peer" checked={p.outOfStock || false} onChange={(e) => { updateProduct(p.id, "outOfStock", e.target.checked); }} />
                                <div className="w-12 h-7 bg-slate-100 dark:bg-zinc-900 rounded-full transition-all peer-checked:bg-rose-500 border border-slate-200 dark:border-white/10" />
                                <div className="absolute left-[3px] top-[3px] bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-6 shadow-md" />
                                </div>
                                <span className={cn("ml-4 text-[10px] font-black uppercase tracking-[0.25em] transition-colors", p.outOfStock ? "text-rose-500" : "text-slate-400 dark:text-zinc-600 group-hover/toggle:text-slate-600 dark:group-hover/toggle:text-zinc-400")}>
                                {p.outOfStock ? "Inventory Depleted" : "In Stock & Ready"}
                                </span>
                            </label>
                            
                            <div className="text-[10px] font-black text-slate-100 dark:text-zinc-900 uppercase tracking-[0.3em] italic select-none">SKU: {p.id}</div>
                        </div>
                        </div>
                    </div>
                    </div>
                )})}
                </div>
            </section>
            </motion.div>
        )}

        {activeTab === "appearance" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6">
                {/* Themes */}
                <Accordion id="themes" title="Theme Engine" subtitle="Instant Brand Transformation" icon={Sparkles}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                        {[
                            { id: "fresh", name: "Fresh Emerald", accent: "#10b981", bg: "white", preview: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
                            { id: "bold", name: "Midnight Gold", accent: "#f59e0b", bg: "#1e293b", preview: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba" },
                            { id: "minimal", name: "Clean Slate", accent: "#475569", bg: "#f8fafc", preview: "https://images.unsplash.com/photo-1491553895911-0055eca6402d" },
                            { id: "playful", name: "Bubblegum", accent: "#d946ef", bg: "#fff0f5", preview: "https://images.unsplash.com/photo-1512496015851-a1c8cebc41e7" },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => applyThemePreset(t.id as any)}
                                className={cn(
                                    "relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 transition-all hover:scale-105 group text-left",
                                    state.themePreset === t.id ? "border-slate-900 dark:border-white shadow-2xl z-10" : "border-white dark:border-white/10 shadow-sm"
                                )}
                            >
                                <div className="aspect-video sm:aspect-[4/3] relative">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.preview})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white font-black text-[10px] uppercase tracking-widest">{t.name}</div>
                                    <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-white/50 shadow-sm" style={{ backgroundColor: t.accent }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </Accordion>
                <Accordion id="hero-builder" title="Visual Hero Builder" subtitle="Pick, Edit, Export" icon={Code2}>
                    <div className="space-y-8 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {HERO_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => {
                                        updateState("heroTemplate", template.id);
                                        updateState("heroStyle", template.id === "split-showcase" ? "split" : "banner");
                                        updateState("themePreset", "custom");
                                    }}
                                    className={cn(
                                        "overflow-hidden rounded-[2rem] border-4 bg-white text-left transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-black",
                                        (state.heroTemplate || "spotlight") === template.id ? "border-emerald-500 shadow-2xl" : "border-slate-100 dark:border-white/10"
                                    )}
                                >
                                    <div className={cn("relative h-36 bg-gradient-to-br", template.className)}>
                                        <div className="absolute inset-y-5 right-5 w-24 rounded-2xl bg-cover bg-center shadow-2xl" style={{ backgroundImage: `url(${state.heroImage || state.bizImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"})` }} />
                                        <div className="absolute left-5 top-6 w-32 space-y-2">
                                            <div className="h-2 w-12 rounded-full bg-emerald-400" />
                                            <div className="h-5 rounded-full bg-white/90" />
                                            <div className="h-3 w-24 rounded-full bg-white/40" />
                                            <div className="h-7 w-20 rounded-full bg-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{template.name}</p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{template.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hero Headline</label>
                                    <input
                                        value={state.heroTitle || ""}
                                        onChange={(e) => updateState("heroTitle", e.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                                        placeholder={state.tagline || "The New Collection"}
                                    />
                                </div>
                                <div>
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supporting Text</label>
                                    <textarea
                                        value={state.heroSubtitle || ""}
                                        onChange={(e) => updateState("heroSubtitle", e.target.value)}
                                        className="mt-2 h-28 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-600 outline-none transition-all focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
                                        placeholder={state.aboutUs || "Tell customers what makes this collection special."}
                                    />
                                </div>
                                <div>
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Button Text</label>
                                    <input
                                        value={state.heroButtonText || ""}
                                        onChange={(e) => updateState("heroButtonText", e.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                                        placeholder="Shop Now"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="group relative flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-emerald-500/10">
                                    {(state.heroImage || state.bizImage) ? (
                                        <>
                                            <img src={state.heroImage || state.bizImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </>
                                    ) : null}
                                    <div className="relative z-10 flex flex-col items-center gap-3 px-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-lg">
                                            <ImageIcon size={22} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-300">Change Hero Image</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], "heroImage")} />
                                </label>
                                <button
                                    type="button"
                                    onClick={exportHeroCode}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 dark:bg-white dark:text-black"
                                >
                                    <Copy size={15} />
                                    Export Hero Code
                                </button>
                            </div>
                        </div>
                    </div>
                </Accordion>
                <Accordion id="visual" title="Design System" subtitle="Micro-Customization" icon={Palette}>
                    <div className="space-y-8 md:space-y-10 pb-6">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Primary Brand Color</h3>
                            <div className="flex items-center gap-5 bg-white dark:bg-black p-3 pl-6 rounded-2xl w-full sm:w-fit border border-slate-100 dark:border-white/10 shadow-sm">
                                <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tighter">{state.accentColor || "#10B981"}</span>
                                <div 
                                    className="relative w-10 h-10 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer shrink-0 inline-flex"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input 
                                        type="color" 
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer bg-transparent border-none outline-none" 
                                        value={state.accentColor || "#10b981"} 
                                        onChange={(e) => { 
                                            updateState("accentColor", e.target.value); 
                                            updateState("themePreset", "custom"); 
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Grid Configuration</h3>
                                <PillSelector 
                                    options={[{label: "Standard Grid", value: "grid"}, {label: "Vertical List", value: "list"}]}
                                    value={state.layoutStyle || "grid"}
                                    onChange={(v) => { updateState("layoutStyle", v); updateState("themePreset", "custom"); }}
                                    className="mb-4"
                                />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Image Styling</h3>
                                <PillSelector 
                                    options={[{label: "Sharp Corners", value: "square"}, {label: "Curved Soft", value: "rounded"}]}
                                    value={state.imageShape || "square"}
                                    onChange={(v) => { updateState("imageShape", v); updateState("themePreset", "custom"); }}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Storefront Theme (Public View)</h3>
                            <PillSelector 
                                options={[{label: "Light Mode", value: "light"}, {label: "Dark Mode", value: "dark"}, {label: "Follow System", value: "system"}]}
                                value={state.storeTheme || "system"}
                                onChange={(v) => { updateState("storeTheme", v); }}
                            />
                        </div>
                    </div>
                </Accordion>
                <Accordion id="behaviour" title="Behaviour" subtitle="Store Workflow" icon={ShoppingCart}>
                    <div className="space-y-8 pb-4">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Operational Mode</h3>
                            <PillSelector
                                options={[{ label: "Live Commerce", value: "live" }, { label: "Paused / Catalog Only", value: "paused" }]}
                                value={state.isLive === false ? "paused" : "live"}
                                onChange={(v) => updateState("isLive", v === "live")}
                            />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 flex justify-between">Min Checkout Value <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{state.currency}{state.minOrder || 0}</span></h3>
                            <input type="range" min="0" max="100000" step="5000" value={state.minOrder || 0} onChange={(e) => updateState("minOrder", Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900" />
                        </div>
                    </div>
                </Accordion>
            </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}
