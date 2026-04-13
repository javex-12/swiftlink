"use client";

import Link from "next/link";
import { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CustomerStorefront } from "./CustomerStorefront";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Camera, Image as ImageIcon, Trash2, Star, Link as LinkIcon, RefreshCw, Smartphone, Eye, Sparkles, Palette, ShoppingCart, User, FileText } from "lucide-react";

export function BusinessView() {
  const [activeTab, setActiveTab] = useState<"store" | "appearance">("store");
  const [expandedSection, setExpandedSection] = useState<string>("themes");
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const {
    state,
    updateState,
    setStateMerge,
    copyShopLink,
    addProduct,
    updateProduct,
    removeProduct,
    handleImageUpload,
    addProductImage,
    removeProductImage,
    setPrimaryImage,
    isFirebaseActive,
    isSyncing
  } = useSwiftLink();

  const handleUpdate = (field: keyof ShopState, value: any) => {
    updateState(field, value);
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

  const categories = state.categories && state.categories.length > 0 ? state.categories : ["Tops", "Bottoms", "Footwear", "Accessories"];

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
    <div className="pb-[100px] font-sans">
      
      {/* Dynamic Sync Status bar */}
      <div className={cn("fixed top-20 right-8 z-[100] bg-white border border-slate-100 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl transition-all duration-500", isSyncing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none")}>
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Syncing to Cloud</span>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        
        {/* Left Pane: Editor Tools */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100 sticky top-[72px] z-30 mb-8 backdrop-blur-md bg-white/80">
            <button
              className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all", activeTab === "store" ? "bg-slate-900 text-white shadow-md scale-[1.02]" : "text-slate-400 hover:text-slate-900")}
              onClick={() => setActiveTab("store")}
            >
              Inventory
            </button>
            <button
              className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all", activeTab === "appearance" ? "bg-slate-900 text-white shadow-md scale-[1.02]" : "text-slate-400 hover:text-slate-900")}
              onClick={() => setActiveTab("appearance")}
            >
              Design
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {activeTab === "store" && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                
                {/* Store Profile Card */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <FileText size={120} />
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     Store Identity
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start relative z-10">
                      <label
                        htmlFor="biz-img-upload"
                        className="relative block w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group shadow-inner transition-all hover:scale-105 hover:border-emerald-500"
                        style={ state.bizImage ? { backgroundImage: `url(${state.bizImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined }
                      >
                        {!state.bizImage && !isSyncing && <i className="fas fa-camera text-slate-300 text-3xl group-hover:text-emerald-500 transition-colors" />}
                        {isSyncing && <RefreshCw size={24} className="text-emerald-500 animate-spin" />}
                        {state.bizImage && !isSyncing && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><i className="fas fa-sync" /></div>}
                        <input type="file" id="biz-img-upload" accept="image/*" disabled={isSyncing} className="hidden" onChange={(e) => { handleImageUpload(e.target.files?.[0], "bizImage"); } } />
                      </label>
                      <div className="flex-1 space-y-4 w-full">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Business Name</label>
                             <input
                               type="text"
                               id="biz-name"
                               value={state.bizName || ""}
                               onChange={(e) => { updateState("bizName", e.target.value); }}
                               className="w-full bg-slate-50 rounded-2xl p-4 font-black text-lg text-slate-900 outline-none border border-slate-100 focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                               placeholder="Elite Fashion"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Hero Tagline</label>
                             <input
                               type="text"
                               id="biz-tagline"
                               value={state.tagline || ""}
                               onChange={(e) => { updateState("tagline", e.target.value); }}
                               className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-sm text-slate-600 outline-none border border-slate-100 focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                               placeholder="Redefining Your Lifestyle."
                             />
                          </div>
                      </div>
                  </div>
                </section>

                {/* Categories Manager */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Your Categories</h3>
                      <button onClick={addCategory} className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-all">
                         <Plus size={14} /> Add New
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {state.categories?.map(cat => (
                         <div key={cat} className="group bg-slate-50 border border-slate-100 pl-4 pr-2 py-2 rounded-2xl flex items-center gap-3">
                            <span className="text-xs font-black text-slate-700">{cat}</span>
                            <button onClick={() => removeCategory(cat)} className="w-6 h-6 rounded-lg bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                               <X size={12} strokeWidth={3} />
                            </button>
                         </div>
                      ))}
                      {(!state.categories || state.categories.length === 0) && (
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Using default system categories (Tops, Bottoms...)</p>
                      )}
                   </div>
                </section>

                <section className="space-y-6">
                  <div className="flex justify-between items-end px-2">
                    <h2 className="text-2xl font-black text-slate-900">Products</h2>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={addProduct}
                      className="text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: accentStr }}
                    >
                      {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                      Add Product
                    </button>
                  </div>

                  <div className="space-y-6">
                    {state.products.map((p) => {
                      const imgs = p.images || (p.image ? [p.image] : []);
                      return (
                      <div key={p.id} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm relative group transition-all hover:border-emerald-500 hover:shadow-xl">
                        
                        <button onClick={() => removeProduct(p.id)} className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all z-20">
                           <Trash2 size={18} />
                        </button>

                        <div className="flex flex-col sm:flex-row gap-8">
                          {/* Image Manager */}
                          <div className="w-full sm:w-40 shrink-0 flex flex-col gap-3">
                              <label
                                  className={cn(
                                      "w-full aspect-square bg-slate-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all shadow-inner",
                                      state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-[2rem]"
                                  )}
                                  style={imgs.length > 0 ? { backgroundImage: `url(${imgs[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                              >
                                  {!imgs.length && <i className="fas fa-image text-slate-200 text-4xl" />}
                                  {imgs.length > 0 && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fas fa-plus text-white text-xl" /></div>}
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { imgs.length > 0 ? handleImageUpload(e.target.files[0], "image", p.id) : addProductImage(p.id, e.target.files[0]); } }} />
                              </label>
                              
                              {imgs.length > 0 && (
                                  <div className="flex gap-2.5 overflow-x-auto pb-1 px-1" style={{ scrollbarWidth: "none" }}>
                                      {imgs.slice(1).map((img, idx) => (
                                          <div key={idx} className={cn("w-12 h-12 overflow-hidden relative group shrink-0 border-2 border-slate-50 shadow-sm", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-xl" )}>
                                              <img src={img} className="w-full h-full object-cover" alt="" />
                                              <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                                                  <button onClick={() => { setPrimaryImage(p.id, idx + 1); }} className="text-[10px] text-white hover:text-emerald-400" title="Make Primary"><i className="fas fa-star" /></button>
                                                  <button onClick={() => { removeProductImage(p.id, idx + 1); }} className="text-[10px] text-white hover:text-red-400" title="Delete"><i className="fas fa-times" /></button>
                                              </div>
                                          </div>
                                      ))}
                                      <label className={cn("w-12 h-12 bg-slate-50 border-2 border-slate-200 border-dashed flex items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all shrink-0 text-slate-400 hover:text-emerald-500", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-xl")}>
                                          <i className="fas fa-plus text-xs" />
                                          <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { addProductImage(p.id, e.target.files[0]); } }} />
                                      </label>
                                  </div>
                              )}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Product Name</label>
                                <input
                                  data-product-name={p.id}
                                  value={p.name || ""}
                                  onChange={(e) => { updateProduct(p.id, "name", e.target.value); }}
                                  className="w-[90%] font-black text-2xl md:text-3xl outline-none bg-transparent placeholder:text-slate-200 tracking-tight text-slate-900 border-b-2 border-transparent focus:border-emerald-500 transition-all"
                                  placeholder="New Arrival Item"
                                />
                            </div>
                            
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Price</label>
                                    <div className="bg-slate-50 px-5 py-3 rounded-2xl border-2 border-slate-100 flex items-center gap-2 focus-within:border-emerald-500 transition-all shadow-inner">
                                        <span className="text-slate-400 font-black text-lg">{state.currency}</span>
                                        <input 
                                           data-product-price={p.id}
                                           type="number" value={p.price || ''} onChange={(e) => { updateProduct(p.id, "price", Number(e.target.value)); }} 
                                           className="w-28 bg-transparent font-black text-slate-900 outline-none placeholder:text-slate-300 text-xl" placeholder="0" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Category</label>
                                    <div className="bg-slate-50 px-4 py-3 rounded-2xl border-2 border-slate-100 flex items-center focus-within:border-emerald-500 transition-all shadow-inner">
                                        <select value={p.category || "All"} onChange={(e) => { updateProduct(p.id, "category", e.target.value); }} className="bg-transparent text-xs font-black text-slate-700 outline-none appearance-none pr-8 cursor-pointer">
                                            <option value="All">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Badge</label>
                                    <div className="bg-slate-50 px-4 py-3 rounded-2xl border-2 border-slate-100 flex items-center focus-within:border-emerald-500 transition-all shadow-inner">
                                        <select value={p.badge || "none"} onChange={(e) => { updateProduct(p.id, "badge", e.target.value === "none" ? undefined : e.target.value); }} className="bg-transparent text-xs font-black text-slate-700 outline-none appearance-none pr-8 cursor-pointer">
                                            <option value="none">No Badge</option>
                                            <option value="hot">🔥 Hot</option>
                                            <option value="new">✨ New</option>
                                            <option value="sale">📉 Sale</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Product Story (Description)</label>
                                <textarea
                                    value={p.description || ""}
                                    onChange={(e) => { updateProduct(p.id, "description", e.target.value); }}
                                    className="w-full bg-slate-50 rounded-[1.5rem] p-5 text-sm font-bold text-slate-600 outline-none h-28 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white resize-none transition-all shadow-inner placeholder:text-slate-300"
                                    placeholder="Tell the story of this premium product..."
                                />
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center cursor-pointer group/toggle">
                                  <div className="relative">
                                    <input type="checkbox" className="sr-only peer" checked={p.outOfStock || false} onChange={(e) => { updateProduct(p.id, "outOfStock", e.target.checked); }} />
                                    <div className="w-11 h-6 bg-slate-100 rounded-full transition-all peer-checked:bg-red-500 border border-slate-200" />
                                    <div className="absolute left-[3px] top-[3px] bg-white w-4.5 h-4.5 rounded-full transition-all peer-checked:translate-x-5 shadow-md" />
                                  </div>
                                  <span className={cn("ml-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors", p.outOfStock ? "text-red-500" : "text-slate-400 group-hover/toggle:text-slate-600")}>
                                    {p.outOfStock ? "Sold Out" : "In Stock"}
                                  </span>
                                </label>
                                
                                <div className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic select-none">ID: {p.id}</div>
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">

                  {/* Themes */}
                  <Accordion id="themes" title="Theme Engine" subtitle="1-Click Rebrand" icon={Sparkles}>
                      <div className="grid grid-cols-2 gap-3 pb-3">
                          {[
                              { id: "fresh", name: "Fresh", accent: "#10b981", bg: "white", preview: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
                              { id: "bold", name: "Bold", accent: "#f59e0b", bg: "#1e293b", preview: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba" },
                              { id: "minimal", name: "Minimal", accent: "#475569", bg: "#f8fafc", preview: "https://images.unsplash.com/photo-1491553895911-0055eca6402d" },
                              { id: "playful", name: "Playful", accent: "#d946ef", bg: "#fff0f5", preview: "https://images.unsplash.com/photo-1512496015851-a1c8cebc41e7" },
                          ].map(t => (
                              <button
                                  key={t.id}
                                  onClick={() => applyThemePreset(t.id as any)}
                                  className={cn(
                                      "relative rounded-[2rem] overflow-hidden border-4 transition-all hover:scale-105 group text-left",
                                      state.themePreset === t.id ? "border-slate-900 shadow-xl z-10" : "border-slate-100 shadow-sm"
                                  )}
                              >
                                  <div className="aspect-[4/3] relative">
                                     <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.preview})` }} />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                     <div className="absolute bottom-4 left-4 text-white font-black text-xs md:text-sm">{t.name}</div>
                                     <div className="absolute top-4 right-4 w-4 h-4 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: t.accent }} />
                                  </div>
                              </button>
                          ))}
                      </div>
                  </Accordion>

                  <Accordion id="visual" title="Design System" subtitle="Colors, Layouts & Shapes" icon={Palette}>
                      <div className="space-y-8 pb-4">
                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Accent Color</h3>
                              <div className="flex items-center gap-4 bg-slate-50 p-2 pl-4 rounded-2xl w-fit border border-slate-100">
                                  <span className="font-bold text-sm text-slate-900 uppercase">{state.accentColor || "#10B981"}</span>
                                  <div className="relative w-10 h-10 rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer shrink-0 inline-flex">
                                      <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={state.accentColor || "#10b981"} onChange={(e) => { updateState("accentColor", e.target.value); updateState("themePreset", "custom"); }} />
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Product Layout</h3>
                              <PillSelector 
                                  options={[{label: "Grid Layout", value: "grid"}, {label: "List Layout", value: "list"}]}
                                  value={state.layoutStyle || "grid"}
                                  onChange={(v) => { updateState("layoutStyle", v); updateState("themePreset", "custom"); }}
                              />
                          </div>
                          
                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Shape & Corners</h3>
                              <PillSelector 
                                  options={[{label: "Square", value: "square"}, {label: "Rounded", value: "rounded"}]}
                                  value={state.imageShape || "square"}
                                  onChange={(v) => { updateState("imageShape", v); updateState("themePreset", "custom"); }}
                              />
                          </div>
                          
                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Typography & Buttons</h3>
                              <PillSelector 
                                  options={[{label: "Modern Core", value: "modern"}, {label: "Bold & Heavy", value: "bold"}]}
                                  value={state.fontStyle || "modern"}
                                  onChange={(v) => { updateState("fontStyle", v); updateState("themePreset", "custom"); }}
                                  className="mb-3"
                              />
                              <PillSelector 
                                  options={[{label: "Rounded", value: "rounded"}, {label: "Pill Buttons", value: "pill"}]}
                                  value={state.buttonRadius || "rounded"}
                                  onChange={(v) => { updateState("buttonRadius", v); updateState("themePreset", "custom"); }}
                              />
                          </div>
                      </div>
                  </Accordion>

                  <Accordion id="behaviour" title="Shopping Cart" subtitle="Orders & Stock Rules" icon={ShoppingCart}>
                     <div className="space-y-6 pb-2">
                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Processing</h3>
                              <PillSelector 
                                  options={[{label: "WhatsApp Only", value: "whatsapp"}, {label: "Paystack (Pro)", value: "paystack"}, {label: "Both", value: "both"}]}
                                  value={state.orderMethod || "whatsapp"}
                                  onChange={(v) => handleUpdate("orderMethod", v)}
                              />
                          </div>

                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Public storefront</h3>
                              <PillSelector
                                  options={[
                                    { label: "Live — accepting orders", value: "live" },
                                    { label: "Paused — browse only", value: "paused" },
                                  ]}
                                  value={state.isLive === false ? "paused" : "live"}
                                  onChange={(v) => updateState("isLive", v === "live")}
                              />
                              <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
                                Paused turns off add-to-cart and WhatsApp checkout on your shared store link.
                              </p>
                          </div>

                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Min Cart Value <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded">{state.currency}{state.minOrder || 0}</span></h3>
                              <input type="range" min="0" max="50000" step="1000" value={state.minOrder || 0} onChange={(e) => updateState("minOrder", Number(e.target.value))} className="w-full accent-emerald-500" />
                          </div>

                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Out of Stock Rules</h3>
                              <PillSelector 
                                  options={[{label: "Show as Sold Out", value: "show-sold-out"}, {label: "Hide entirely", value: "hide"}]}
                                  value={state.outOfStockDisplay || "show-sold-out"}
                                  onChange={(v) => updateState("outOfStockDisplay", v)}
                              />
                          </div>
                     </div>
                  </Accordion>

                  <Accordion id="info" title="Business Info" subtitle="Socials, Location, Bio" icon={User}>
                      <div className="space-y-6 pb-2">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Currency</h3>
                                  <PillSelector 
                                      options={[{label: "₦ NGN", value: "₦"}, {label: "$ USD", value: "$"}, {label: "£ GBP", value: "£"}]}
                                      value={state.currency || "₦"}
                                      onChange={(v) => updateState("currency", v)}
                                  />
                              </div>
                              <div>
                                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp Contact</h3>
                                  <input type="text" value={state.phone || ""} onChange={(e) => updateState("phone", e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold text-sm outline-none border border-slate-100" placeholder="+234..." />
                              </div>
                          </div>

                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location</h3>
                              <input type="text" value={state.location || ""} onChange={(e) => updateState("location", e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold text-sm outline-none border border-slate-100" placeholder="Lagos, Nigeria" />
                          </div>

                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Social Hub</h3>
                              <div className="space-y-3">
                                  {["instagram", "twitter", "tiktok"].map(social => (
                                      <div key={social} className="flex flex-1 items-center bg-slate-50 rounded-2xl border border-slate-100 px-4 focus-within:border-slate-300 transition-colors">
                                          <i className={`fab fa-${social} text-slate-400 text-lg`} />
                                          <input type="url" value={(state.socials as any)?.[social] || ""} onChange={(e) => setStateMerge({ socials: { ...(state.socials || {}), [social]: e.target.value } })} className="flex-1 bg-transparent p-3 text-xs font-bold outline-none" placeholder={`@your${social}`} />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </Accordion>
                  
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Right Pane: Desktop Phone Preview */}
        <div className="lg:col-span-5 hidden lg:flex items-start justify-center sticky top-28 h-[calc(100vh-140px)]">
          <div className="relative w-[300px] xl:w-[340px] aspect-[9/19.5] bg-slate-900 rounded-[3rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-slate-800 ring-1 ring-slate-700 overflow-hidden">
            {/* Realistic Notch / Dynamic Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-b-2xl z-[60] flex items-center justify-center border-x border-b border-slate-800/50">
               <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>
            
            {/* Screen Content */}
            <div className="h-full w-full rounded-[2.2rem] overflow-hidden bg-white relative shadow-inner border border-slate-800">
                <div className="w-full h-full overflow-y-auto no-scrollbar scroll-smooth relative bg-[#f8fafc]">
                    <div className="scale-[0.9] origin-top w-[111.11%] h-[111.11%]">
                        <CustomerStorefront isPreview={true} />
                    </div>
                </div>
            </div>

            {/* Physical Buttons (CSS) */}
            <div className="absolute left-[-9px] top-24 w-1.5 h-8 bg-slate-800 rounded-l-md border-y border-l border-slate-700" />
            <div className="absolute left-[-9px] top-36 w-1.5 h-12 bg-slate-800 rounded-l-md border-y border-l border-slate-700" />
            <div className="absolute left-[-9px] top-52 w-1.5 h-12 bg-slate-800 rounded-l-md border-y border-l border-slate-700" />
            <div className="absolute right-[-9px] top-40 w-1.5 h-16 bg-slate-800 rounded-r-md border-y border-r border-slate-700" />
            
            {/* Reflection Shine */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-white/10 z-[55]" />
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA for bringing up Preview Modal */}
      {/* Keeps "Preview Live" constantly accessible while scrolling settings */}
      <div className="lg:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 p-4 pb-safe z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
         <button 
             onClick={() => setShowMobilePreview(true)}
             className="w-full py-4 text-white font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform" 
             style={{ backgroundColor: accentStr }}
         >
            Preview Mobile Store <i className="fas fa-eye text-xs opacity-70" />
         </button>
      </div>

      {/* Mobile Fullscreen Preview Modal Layer */}
      <AnimatePresence>
          {showMobilePreview && (
              <motion.div 
                 initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }}
                 className="fixed inset-0 z-50 bg-slate-900 flex flex-col"
              >
                  <div className="bg-slate-900 pt-safe px-4 py-3 flex justify-between items-center z-10 shrink-0 border-b border-slate-800">
                      <span className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live Preview</span>
                      <button onClick={() => setShowMobilePreview(false)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 transition-transform">
                          <i className="fas fa-times" />
                      </button>
                  </div>
                  <div className="flex-1 bg-white overflow-y-auto w-full max-w-lg mx-auto">
                      <CustomerStorefront isPreview={true} />
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
