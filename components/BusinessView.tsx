"use client";

import Link from "next/link";
import { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CustomerStorefront } from "./CustomerStorefront";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

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
  } = useSwiftLink();

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

  const Accordion = ({ id, title, icon, subtitle, children }: { id: string, title: string, icon: string, subtitle?: string, children: React.ReactNode }) => {
      const isOpen = expandedSection === id;
      return (
          <div className={cn("bg-white rounded-3xl border transition-all duration-300 mb-4 overflow-hidden", isOpen ? "border-slate-200 shadow-md" : "border-slate-100 shadow-sm")}>
              <button 
                  className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(isOpen ? "" : id)}
              >
                  <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner border border-slate-50", isOpen ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400")}>
                          <i className={`fas ${icon} text-lg`} />
                      </div>
                      <div className="text-left flex flex-col">
                          <h3 className="font-black text-sm text-slate-800">{title}</h3>
                          {subtitle && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>}
                      </div>
                  </div>
                  <i className={cn("fas fa-plus text-slate-300 transition-transform duration-300", isOpen && "rotate-[135deg] text-slate-900")} />
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
    <div className="min-h-screen bg-[#f8fafc] pb-[100px] font-sans">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 md:px-6 py-4 flex justify-between items-center border-b border-slate-100 shadow-sm relative">
        <Link
          href="/"
          className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
        >
          <i className="fas fa-arrow-left" />
        </Link>
        <span className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] md:text-xs">
          Store Editor
        </span>
        <button
          type="button"
          onClick={copyShopLink}
          className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform border border-emerald-100"
          style={{ backgroundColor: `${accentStr}15`, color: accentStr, borderColor: `${accentStr}30` }}
        >
          <i className="fas fa-link" />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
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
                <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-5">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Store Identity</h3>
                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                      <label
                        htmlFor="biz-img-upload"
                        className="relative block w-28 h-28 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group shadow-sm transition-transform hover:scale-105"
                        style={ state.bizImage ? { backgroundImage: `url(${state.bizImage})`, backgroundSize: 'cover' } : undefined }
                      >
                        {!state.bizImage && <i className="fas fa-camera text-slate-300 text-2xl group-hover:text-slate-400 transition-colors" />}
                        {state.bizImage && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><i className="fas fa-camera text-white" /></div>}
                        <input type="file" id="biz-img-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], "bizImage") } />
                      </label>
                      <div className="flex-1 space-y-3 w-full">
                          <input
                            type="text"
                            value={state.bizName}
                            onChange={(e) => updateState("bizName", e.target.value)}
                            className="w-full bg-slate-50 rounded-2xl p-4 font-black text-slate-900 outline-none border border-slate-100 focus:border-slate-300 transition-colors"
                            placeholder="Store Name"
                          />
                          <input
                            type="text"
                            value={state.tagline}
                            onChange={(e) => updateState("tagline", e.target.value)}
                            className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-sm text-slate-600 outline-none border border-slate-100 focus:border-slate-300 transition-colors"
                            placeholder="Hero Tagline (e.g. Premium Fits)"
                          />
                      </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex justify-between items-end px-2">
                    <h2 className="text-2xl font-black text-slate-900">Products</h2>
                    <button
                      type="button"
                      onClick={addProduct}
                      className="text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                      style={{ backgroundColor: accentStr }}
                    >
                      <Plus size={16} strokeWidth={3} /> Add Product
                    </button>
                  </div>

                  <div className="space-y-5">
                    {state.products.map((p) => {
                      const imgs = p.images || (p.image ? [p.image] : []);
                      return (
                      <div key={p.id} className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm relative group">
                        
                        <button onClick={() => removeProduct(p.id)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                          <i className="fas fa-trash-can text-xs" />
                        </button>

                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* Image Manager */}
                          <div className="w-full sm:w-32 shrink-0 flex flex-col gap-2">
                              <label
                                  className={cn(
                                      "w-full aspect-square bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all",
                                      state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-2xl"
                                  )}
                                  style={imgs.length > 0 ? { backgroundImage: `url(${imgs[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                              >
                                  {!imgs.length && <i className="fas fa-image text-slate-300 text-xl" />}
                                  {imgs.length > 0 && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fas fa-plus text-white shadow-sm" /></div>}
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { imgs.length > 0 ? handleImageUpload(e.target.files[0], "image", p.id) : addProductImage(p.id, e.target.files[0]); } }} />
                              </label>
                              
                              {/* Sub images array logic inside UI */}
                              {imgs.length > 0 && (
                                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                                      {imgs.slice(1).map((img, idx) => (
                                          <div key={idx} className={cn("w-10 h-10 overflow-hidden relative group shrink-0 border border-slate-100", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-lg" )}>
                                              <img src={img} className="w-full h-full object-cover" alt="" />
                                              <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                                                  <button onClick={() => setPrimaryImage(p.id, idx + 1)} className="text-[10px] text-white hover:text-emerald-400" title="Make Primary"><i className="fas fa-star" /></button>
                                                  <button onClick={() => removeProductImage(p.id, idx + 1)} className="text-[10px] text-white hover:text-red-400" title="Delete"><i className="fas fa-times" /></button>
                                              </div>
                                          </div>
                                      ))}
                                      <label className={cn("w-10 h-10 bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shrink-0", state.imageShape === "circle" ? "rounded-full" : state.imageShape === "square" ? "rounded-none" : "rounded-lg")}>
                                          <i className="fas fa-plus text-slate-400 text-[10px]" />
                                          <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) addProductImage(p.id, e.target.files[0]); }} />
                                      </label>
                                  </div>
                              )}
                          </div>

                          <div className="flex-1 space-y-3">
                            <input
                              value={p.name}
                              onChange={(e) => updateProduct(p.id, "name", e.target.value)}
                              className="w-[90%] font-black text-xl md:text-2xl outline-none bg-transparent placeholder:text-slate-300 tracking-tight"
                              placeholder="Product Name"
                            />
                            
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                                    <span className="text-slate-400 font-bold">{state.currency}</span>
                                    <input type="number" value={p.price || ''} onChange={(e) => updateProduct(p.id, "price", Number(e.target.value))} className="w-20 bg-transparent font-black text-slate-900 outline-none placeholder:text-slate-300 text-lg" placeholder="0" />
                                </div>
                                
                                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center">
                                    <select value={p.category || "All"} onChange={(e) => updateProduct(p.id, "category", e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none appearance-none pr-4">
                                        <option value="All">Category</option>
                                        <option value="Tops">Tops</option>
                                        <option value="Bottoms">Bottoms</option>
                                        <option value="Footwear">Footwear</option>
                                        <option value="Accessories">Accessories</option>
                                    </select>
                                </div>
                                
                                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center">
                                    <select value={p.badge || "none"} onChange={(e) => updateProduct(p.id, "badge", e.target.value === "none" ? undefined : e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none appearance-none">
                                        <option value="none">Badge: None</option>
                                        <option value="hot">🔥 Hot</option>
                                        <option value="new">✨ New</option>
                                        <option value="sale">📉 Sale</option>
                                    </select>
                                </div>
                            </div>
                            
                            <textarea
                                value={p.description}
                                onChange={(e) => updateProduct(p.id, "description", e.target.value)}
                                className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-600 outline-none h-20 border border-slate-100 resize-none transition-colors"
                                placeholder="Add product details..."
                            />
                            
                            <label className="flex items-center cursor-pointer w-fit mt-2">
                              <div className="relative">
                                <input type="checkbox" className="sr-only peer" checked={p.outOfStock} onChange={(e) => updateProduct(p.id, "outOfStock", e.target.checked)} />
                                <div className="w-9 h-5 bg-slate-200 rounded-full transition-all peer-checked:bg-red-500" />
                                <div className="absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4 shadow-sm" />
                              </div>
                              <span className={cn("ml-2 text-[10px] font-black uppercase tracking-widest transition-colors", p.outOfStock ? "text-red-500" : "text-slate-400")}>
                                Sold Out
                              </span>
                            </label>
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
                  <Accordion id="themes" title="Theme Engine" subtitle="1-Click Rebrand" icon="fa-wand-magic-sparkles">
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

                  <Accordion id="visual" title="Design System" subtitle="Colors, Layouts & Shapes" icon="fa-palette">
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

                  <Accordion id="behaviour" title="Shopping Cart" subtitle="Orders & Stock Rules" icon="fa-shopping-cart">
                     <div className="space-y-6 pb-2">
                          <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Processing</h3>
                              <PillSelector 
                                  options={[{label: "WhatsApp Only (Free)", value: "whatsapp"}, {label: "Paystack Checkouts (Pro)", value: "paystack"}]}
                                  value={state.orderMethod || "whatsapp"}
                                  onChange={(v) => updateState("orderMethod", v)}
                              />
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

                  <Accordion id="info" title="Business Info" subtitle="Socials, Location, Bio" icon="fa-address-card">
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
        <div className="lg:col-span-5 hidden lg:block sticky top-28 h-fit pb-10">
          <div className="w-[340px] xl:w-[380px] mx-auto bg-black rounded-[3rem] p-2.5 shadow-2xl relative overflow-hidden ring-1 ring-slate-200">
            {/* Dynamic Island Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-[20px] z-[60]" />
            <div className="h-[750px] w-full rounded-[2.5rem] overflow-hidden bg-white relative">
                {/* Embedded Live Storefront Component */}
                <div className="w-full h-full overflow-y-auto no-scrollbar scroll-smooth relative">
                    <CustomerStorefront isPreview={true} />
                </div>
            </div>
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
