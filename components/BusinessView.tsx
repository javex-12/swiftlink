"use client";

import { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { getShopPath } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Trash2, RefreshCw, Eye, Sparkles, Palette, ShoppingCart, User, FileText, ExternalLink } from "lucide-react";

export function BusinessView() {
  const [activeTab, setActiveTab] = useState<"store" | "appearance">("store");
  const [expandedSection, setExpandedSection] = useState<string>("themes");

  const {
    state,
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
          <div className={cn("bg-white rounded-3xl border transition-all duration-300 mb-4 overflow-hidden", isOpen ? "border-slate-200 shadow-md" : "border-slate-100 shadow-sm")}>
              <button 
                  className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(isOpen ? "" : id)}
              >
                  <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner border border-slate-50", isOpen ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400")}>
                          <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left flex flex-col">
                          <h3 className="font-black text-sm text-slate-800">{title}</h3>
                          {subtitle && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>}
                      </div>
                  </div>
                  <Plus className={cn("w-5 h-5 text-slate-300 transition-transform duration-300", isOpen && "rotate-[135deg] text-slate-900")} />
              </button>
              <div className={cn("transition-all duration-300 origin-top overflow-hidden", isOpen ? "max-h-[3000px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0")}>
                  <div className="p-5 pt-2 border-t border-slate-50">
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
                          ? "bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-0.5" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                  )}
              >
                  {opt.label}
              </button>
          ))}
      </div>
  );

  return (
    <div className="pb-32 font-sans bg-slate-50/50 min-h-screen">
      
      {/* Real-time Sync Indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl"
          >
             <RefreshCw size={14} className="animate-spin text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">Saving Changes...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto space-y-10 px-6 pt-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic uppercase">Store Editor</h1>
                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Manage your products and brand identity.</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button
                    className={cn("px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "store" ? "bg-slate-900 text-white shadow-lg scale-[1.05]" : "text-slate-400 hover:text-slate-900")}
                    onClick={() => setActiveTab("store")}
                    >
                    Inventory
                    </button>
                    <button
                    className={cn("px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "appearance" ? "bg-slate-900 text-white shadow-lg scale-[1.05]" : "text-slate-400 hover:text-slate-900")}
                    onClick={() => setActiveTab("appearance")}
                    >
                    Design
                    </button>
                </div>
                <button 
                    onClick={openLivePreview}
                    className="flex items-center gap-3 px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
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
            <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <FileText size={200} />
                </div>
                <div className="flex flex-col sm:flex-row gap-10 items-center sm:items-start relative z-10">
                    <label
                    htmlFor="biz-img-upload"
                    className="relative block w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3.5rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group shadow-inner transition-all hover:scale-105 hover:border-emerald-500"
                    style={ state.bizImage ? { backgroundImage: `url(${state.bizImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined }
                    >
                    {!state.bizImage && !isSyncing && <i className="fas fa-camera text-slate-200 text-4xl group-hover:text-emerald-500 transition-colors" />}
                    {isSyncing && <RefreshCw size={32} className="text-emerald-500 animate-spin" />}
                    {state.bizImage && !isSyncing && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><i className="fas fa-sync text-2xl" /></div>}
                    <input type="file" id="biz-img-upload" accept="image/*" disabled={isSyncing} className="hidden" onChange={(e) => { handleImageUpload(e.target.files?.[0], "bizImage"); } } />
                    </label>
                    <div className="flex-1 space-y-6 w-full">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Business Name</label>
                            <input
                            type="text"
                            id="biz-name"
                            value={state.bizName || ""}
                            onChange={(e) => { updateState("bizName", e.target.value); }}
                            className="w-full bg-slate-50 rounded-2xl p-5 font-black text-xl text-slate-900 outline-none border border-slate-100 focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                            placeholder="Elite Fashion"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Hero Tagline</label>
                            <input
                            type="text"
                            id="biz-tagline"
                            value={state.tagline || ""}
                            onChange={(e) => { updateState("tagline", e.target.value); }}
                            className="w-full bg-slate-50 rounded-2xl p-5 font-bold text-sm text-slate-600 outline-none border border-slate-100 focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                            placeholder="Redefining Your Lifestyle."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Manager */}
            <section className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 space-y-8">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900">Your Categories</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Organize your inventory for customers</p>
                    </div>
                    <button onClick={addCategory} className="bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 px-5 py-3 rounded-xl transition-all border border-slate-100">
                        <Plus size={14} /> Add New
                    </button>
                </div>
                <div className="flex flex-wrap gap-3">
                    {state.categories?.map(cat => (
                        <div key={cat} className="group bg-white border border-slate-100 pl-5 pr-2 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{cat}</span>
                        <button onClick={() => removeCategory(cat)} className="w-7 h-7 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                            <X size={12} strokeWidth={3} />
                        </button>
                        </div>
                    ))}
                    {(!state.categories || state.categories.length === 0) && (
                        <div className="w-full py-3">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                            No categories yet. Add categories that match what you sell (e.g. “Hair”, “Perfume”, “Phones”, “Pastries”).
                          </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-8">
                <div className="flex justify-between items-center px-4">
                <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Products</h2>
                <button
                    type="button"
                    disabled={isSyncing}
                    onClick={onAddProduct}
                    className="text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    style={{ backgroundColor: accentStr, boxShadow: `0 20px 40px -10px ${accentStr}66` }}
                >
                    {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                    New Product Entry
                </button>
                </div>

                <div className="space-y-8">
                {state.products.map((p) => {
                    const imgs = p.images || (p.image ? [p.image] : []);
                    return (
                    <div key={p.id} className="bg-white rounded-[3.5rem] p-8 md:p-10 border border-slate-100 shadow-sm relative group transition-all hover:border-emerald-500/20 hover:shadow-2xl">
                    
                    <button onClick={() => removeProduct(p.id)} className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all z-20 border border-slate-100">
                        <Trash2 size={20} />
                    </button>

                    <div className="flex flex-col md:flex-row gap-10">
                        {/* Image Manager */}
                        <div className="w-full md:w-48 shrink-0 flex flex-col gap-4">
                            <label
                                className={cn(
                                    "w-full aspect-square bg-slate-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all shadow-inner",
                                    state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-[2.5rem]"
                                )}
                                style={imgs.length > 0 ? { backgroundImage: `url(${imgs[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                            >
                                {!imgs.length && <i className="fas fa-image text-slate-200 text-5xl" />}
                                {imgs.length > 0 && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fas fa-plus text-white text-2xl" /></div>}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { imgs.length > 0 ? handleImageUpload(e.target.files[0], "image", p.id) : addProductImage(p.id, e.target.files[0]); } }} />
                            </label>
                            
                            {imgs.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
                                    {imgs.slice(1).map((img, idx) => (
                                        <div key={idx} className={cn("w-14 h-14 overflow-hidden relative group shrink-0 border-2 border-slate-100 shadow-sm", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-xl" )}>
                                            <img src={img} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                <button onClick={() => { setPrimaryImage(p.id, idx + 1); }} className="text-xs text-white hover:text-emerald-400"><i className="fas fa-star" /></button>
                                                <button onClick={() => { removeProductImage(p.id, idx + 1); }} className="text-xs text-white hover:text-red-400"><i className="fas fa-times" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <label className={cn("w-14 h-14 bg-slate-50 border-2 border-slate-200 border-dashed flex items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all shrink-0 text-slate-400 hover:text-emerald-500", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-xl")}>
                                        <i className="fas fa-plus text-xs" />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { addProductImage(p.id, e.target.files[0]); } }} />
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-6 min-w-0">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Product Name</label>
                            <input
                                data-product-name={p.id}
                                value={p.name || ""}
                                onChange={(e) => { updateProduct(p.id, "name", e.target.value); }}
                                className="w-[95%] font-black text-2xl md:text-3xl outline-none bg-transparent placeholder:text-slate-200 tracking-tight text-slate-900 border-b-2 border-transparent focus:border-emerald-500 transition-all truncate italic uppercase"
                                placeholder="New Premium Item"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Price</label>
                                <div className="bg-slate-50 px-6 py-3.5 rounded-2xl border-2 border-slate-100 flex items-center gap-3 focus-within:border-emerald-500 transition-all shadow-inner">
                                    <span className="text-slate-400 font-black text-xl">{state.currency}</span>
                                    <input 
                                        data-product-price={p.id}
                                        type="number" value={p.price || ''} onChange={(e) => { updateProduct(p.id, "price", Number(e.target.value)); }} 
                                        className="w-28 md:w-32 bg-transparent font-black text-slate-900 outline-none text-xl" placeholder="0" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Category</label>
                                <div className="bg-slate-50 px-4 py-3.5 rounded-2xl border-2 border-slate-100 flex items-center focus-within:border-emerald-500 transition-all shadow-inner relative">
                                    <select
                                      value={p.category || ""}
                                      onChange={(e) => { updateProduct(p.id, "category", e.target.value); }}
                                      className="bg-transparent text-xs font-black text-slate-700 outline-none appearance-none pr-8 cursor-pointer max-w-[160px] truncate uppercase tracking-widest"
                                    >
                                        <option value="">Uncategorized</option>
                                        {categories.map((cat) => (
                                          <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 pointer-events-none text-slate-400 text-[10px]">▼</div>
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
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Live Status</label>
                                <div className="bg-slate-50 px-4 py-3.5 rounded-2xl border-2 border-slate-100 flex items-center focus-within:border-emerald-500 transition-all shadow-inner relative">
                                    <select value={p.badge || "none"} onChange={(e) => { updateProduct(p.id, "badge", e.target.value === "none" ? undefined : e.target.value); }} className="bg-transparent text-xs font-black text-slate-700 outline-none appearance-none pr-8 cursor-pointer uppercase tracking-widest">
                                        <option value="none">Standard</option>
                                        <option value="hot">🔥 Hot</option>
                                        <option value="new">✨ New</option>
                                        <option value="sale">🏷️ Sale</option>
                                    </select>
                                    <div className="absolute right-4 pointer-events-none text-slate-400 text-[10px]">▼</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Product Story (Description)</label>
                            <textarea
                                value={p.description || ""}
                                onChange={(e) => { updateProduct(p.id, "description", e.target.value); }}
                                className="w-full bg-slate-50 rounded-[2rem] p-6 text-sm font-bold text-slate-600 outline-none h-32 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white resize-none transition-all shadow-inner placeholder:text-slate-300 leading-relaxed overflow-y-auto"
                                placeholder="Describe the quality and details of this product..."
                            />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4">
                            <label className="flex items-center cursor-pointer group/toggle">
                                <div className="relative">
                                <input type="checkbox" className="sr-only peer" checked={p.outOfStock || false} onChange={(e) => { updateProduct(p.id, "outOfStock", e.target.checked); }} />
                                <div className="w-12 h-6.5 bg-slate-100 rounded-full transition-all peer-checked:bg-rose-500 border border-slate-200" />
                                <div className="absolute left-[3px] top-[3px] bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-5.5 shadow-md" />
                                </div>
                                <span className={cn("ml-4 text-[10px] font-black uppercase tracking-[0.25em] transition-colors", p.outOfStock ? "text-rose-500" : "text-slate-400 group-hover/toggle:text-slate-600")}>
                                {p.outOfStock ? "Inventory Depleted" : "In Stock & Ready"}
                                </span>
                            </label>
                            
                            <div className="text-[10px] font-black text-slate-100 uppercase tracking-[0.3em] italic select-none">SKU: {p.id}</div>
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
                    <div className="grid grid-cols-2 gap-4 pb-4">
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
                                    "relative rounded-[2.5rem] overflow-hidden border-4 transition-all hover:scale-105 group text-left",
                                    state.themePreset === t.id ? "border-slate-900 shadow-2xl z-10" : "border-white shadow-sm"
                                )}
                            >
                                <div className="aspect-[4/3] relative">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.preview})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                    <div className="absolute bottom-5 left-5 text-white font-black text-[10px] uppercase tracking-widest">{t.name}</div>
                                    <div className="absolute top-5 right-5 w-5 h-5 rounded-full border-2 border-white/50 shadow-sm" style={{ backgroundColor: t.accent }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </Accordion>
                <Accordion id="visual" title="Design System" subtitle="Micro-Customization" icon={Palette}>
                    <div className="space-y-10 pb-6">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Primary Brand Color</h3>
                            <div className="flex items-center gap-5 bg-white p-3 pl-6 rounded-2xl w-fit border border-slate-100 shadow-sm">
                                <span className="font-black text-sm text-slate-900 uppercase tracking-tighter">{state.accentColor || "#10B981"}</span>
                                <div className="relative w-10 h-10 rounded-xl shadow-lg border border-slate-200 overflow-hidden cursor-pointer shrink-0 inline-flex">
                                    <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={state.accentColor || "#10b981"} onChange={(e) => { updateState("accentColor", e.target.value); updateState("themePreset", "custom"); }} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Grid Configuration</h3>
                            <PillSelector 
                                options={[{label: "Standard Grid", value: "grid"}, {label: "Vertical List", value: "list"}]}
                                value={state.layoutStyle || "grid"}
                                onChange={(v) => { updateState("layoutStyle", v); updateState("themePreset", "custom"); }}
                                className="mb-4"
                            />
                            <PillSelector 
                                options={[{label: "Sharp Corners", value: "square"}, {label: "Curved Soft", value: "rounded"}]}
                                value={state.imageShape || "square"}
                                onChange={(v) => { updateState("imageShape", v); updateState("themePreset", "custom"); }}
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
