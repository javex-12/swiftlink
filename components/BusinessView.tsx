"use client";

import { useState, useEffect } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState, PageSection, Product } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { getShopPath } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, Trash2, RefreshCw, Sparkles, Palette, 
  ShoppingCart, ExternalLink, Shield, 
  Layout, Settings2, Smartphone, Globe, ChevronDown, Store, FileText, X,
  GripVertical, ChevronUp, MessageSquare, AlertTriangle,
  Link2, Mail, MapPin, User, Video, AtSign, Hash
} from "lucide-react";
import { VisualEditor } from "./VisualEditor";
import { StoreSwitcher } from "./StoreSwitcher";

export function BusinessView() {
  const [activeTab, setActiveTab] = useState<"store" | "appearance" | "inbox">("store");
  const [expandedSection, setExpandedSection] = useState<string>("");
  const [showVisualEditor, setShowVisualEditor] = useState(false);

  const {
    state,
    stores,
    switchStore,
    createNewStore,
    isSupabaseActive,
    updateState,
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

  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  const handleCreateNew = async () => {
    const name = await (window as any).customPrompt("New Store", "Enter brand name:");
    if (name) {
        await createNewStore(name);
        setShowStoreDropdown(false);
    }
  };

  const StoreSwitcher = () => (
      <div className="relative">
          <button 
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-black text-slate-400 rounded-xl text-[9px] font-black uppercase hover:text-slate-900 dark:hover:text-white transition-all"
          >
              Switch Store <ChevronDown className={cn("transition-transform", showStoreDropdown && "rotate-180")} size={12} />
          </button>

          <AnimatePresence>
              {showStoreDropdown && (
                  <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-4 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 z-50 p-3 overflow-hidden w-[280px] max-w-[calc(100vw-2rem)]"
                  >
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                          {stores.map(store => (
                              <button
                                  key={store.id}
                                  onClick={() => { switchStore(store.id!); setShowStoreDropdown(false); }}
                                  className={cn(
                                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                                      state.id === store.id ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                                  )}
                              >
                                  <div className="flex items-center gap-4 text-left min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-black flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                          {store.bizImage ? <img src={store.bizImage} className="w-full h-full object-cover" /> : <Store size={14} />}
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-[11px] font-black uppercase tracking-tight dark:text-white truncate">{store.bizName}</p>
                                          <p className="text-[8px] font-bold text-slate-400 uppercase">{store.products.length} Products</p>
                                      </div>
                                  </div>
                                  {state.id === store.id && <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2 shrink-0" />}
                              </button>
                          ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-50 dark:border-white/5">
                          <button 
                              onClick={handleCreateNew}
                              className="w-full flex items-center justify-center gap-3 p-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                          >
                              <Plus size={16} /> Create New Brand
                          </button>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
  );

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
            updateState("categories", [...current, name]);
            addSystemNotification("Category Added", `"${name}" is now available for your products.`, "message");
        }
    }
  };

  const removeCategory = async (cat: string) => {
    const ok = await (window as any).customConfirm(`Remove category?`, `The category "${cat}" will be deleted, but products will remain.`);
    if (ok) {
        updateState("categories", (state.categories || []).filter(c => c !== cat));
    }
  };

  const categories = state.categories || [];
  const accentStr = state.accentColor || "#10b981";

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

  const DebouncedColorPicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
      const [localValue, setLocalValue] = useState(value);
      
      useEffect(() => {
          setLocalValue(value);
      }, [value]);
  
      useEffect(() => {
          const t = setTimeout(() => {
              if (localValue !== value) onChange(localValue);
          }, 300);
          return () => clearTimeout(t);
      }, [localValue, onChange, value]);

      return (
          <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</p>
              <input 
                  type="color" 
                  value={localValue} 
                  onChange={(e) => setLocalValue(e.target.value)} 
                  className="w-20 h-10 rounded-xl overflow-hidden cursor-pointer border border-slate-200 dark:border-zinc-700" 
              />
          </div>
      );
  };

  const PillSelector = ({ options, value, onChange }: { options: {label: string, value: string}[], value: string, onChange: (v: string) => void }) => (
      <div className="flex flex-wrap gap-2">
          {options.map(opt => (
              <button
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={cn(
                      "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border shrink-0",
                      value === opt.value 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-md" 
                          : "bg-white dark:bg-black text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                  )}
              >
                  {opt.label}
              </button>
          ))}
      </div>
  );

  return (
    <div className="pb-32 font-sans bg-slate-50/50 dark:bg-black min-h-screen transition-colors duration-300">
      
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-white text-white dark:text-black border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl">
             <RefreshCw size={14} className="animate-spin text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">Saving...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVisualEditor && <VisualEditor onClose={() => setShowVisualEditor(false)} />}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-10 px-4 md:px-6 pt-8">
        
        {/* MULTI-STORE SWITCHER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Store size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">{state.bizName || 'SwiftLink Store'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Outlet</p>
                </div>
            </div>
            <div className="flex gap-2">
                <StoreSwitcher />
                <button onClick={openLivePreview} className="p-3 bg-slate-50 dark:bg-black text-slate-400 rounded-xl hover:text-emerald-500 transition-all"><ExternalLink size={18} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="text-center lg:text-left">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Engine Room</h1>
                <p className="text-slate-400 dark:text-zinc-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Manage inventory, branding, and operations.</p>
            </div>
            <div className="flex justify-center">
                <div className="flex bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    <button className={cn("px-6 sm:px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "store" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")} onClick={() => setActiveTab("store")}>Inventory</button>
                    <button className={cn("px-6 sm:px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "appearance" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")} onClick={() => setActiveTab("appearance")}>Design</button>
                    <button className={cn("px-6 sm:px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "inbox" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")} onClick={() => setActiveTab("inbox")}>Inbox</button>
                </div>
            </div>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === "store" && (
            <motion.div key="store" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                
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
                        {!state.bizImage && !isSyncing && <Plus size={32} className="text-slate-200" />}
                        {isSyncing && <RefreshCw size={32} className="text-emerald-500 animate-spin" />}
                        <input type="file" id="biz-img-upload" accept="image/*" disabled={isSyncing} className="hidden" onChange={(e) => { handleImageUpload(e.target.files?.[0], "bizImage"); } } />
                        </label>
                        <div className="flex-1 space-y-6 w-full">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Business Name</label>
                                <input
                                type="text"
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
                                value={state.phone || ""}
                                onChange={(e) => { updateState("phone", e.target.value); }}
                                className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-all shadow-inner"
                                placeholder="+234..."
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* About & Socials */}
                <section className="bg-white dark:bg-black rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-white/10 space-y-8">
                    <div className="px-2">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">About & Socials</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mt-1">Your story, links & contact info</p>
                    </div>

                    <div className="space-y-5">
                        {/* Bio */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">
                                <User size={12} /> Bio / About You
                            </label>
                            <textarea
                                value={state.bio || ""}
                                onChange={(e) => updateState("bio", e.target.value)}
                                className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 dark:text-zinc-400 outline-none h-28 border border-slate-100 dark:border-white/5 resize-none transition-all focus:border-emerald-500"
                                placeholder="Tell your customers who you are, what you sell, and why they should trust you..."
                            />
                        </div>

                        {/* Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">
                                    <Mail size={12} /> Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={state.contactEmail || ""}
                                    onChange={(e) => updateState("contactEmail", e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all"
                                    placeholder="hello@yourbrand.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">
                                    <MapPin size={12} /> Address / Area
                                </label>
                                <input
                                    type="text"
                                    value={state.contactAddress || ""}
                                    onChange={(e) => updateState("contactAddress", e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all"
                                    placeholder="Lagos, Nigeria"
                                />
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="pt-4 border-t border-slate-50 dark:border-white/5 space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Social Links</p>
                            {[
                                { key: "instagram", label: "Instagram", icon: AtSign, placeholder: "https://instagram.com/yourbrand" },
                                { key: "tiktok", label: "TikTok", icon: Hash, placeholder: "https://tiktok.com/@yourbrand" },
                                { key: "twitter", label: "Twitter / X", icon: AtSign, placeholder: "https://x.com/yourbrand" },
                                { key: "facebook", label: "Facebook", icon: Link2, placeholder: "https://facebook.com/yourbrand" },
                                { key: "youtube", label: "YouTube", icon: Video, placeholder: "https://youtube.com/@yourbrand" },
                                { key: "website", label: "Website", icon: Globe, placeholder: "https://yourbrand.com" },
                            ].map(({ key, label, icon: Icon, placeholder }) => (
                                <div key={key} className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl px-4 py-3 border border-slate-100 dark:border-white/5">
                                    <Icon size={16} className="text-slate-400 shrink-0" />
                                    <input
                                        type="url"
                                        value={(state.socials as any)?.[key] || ""}
                                        onChange={(e) => updateState("socials", { ...(state.socials || {}), [key]: e.target.value })}
                                        className="flex-1 bg-transparent text-sm font-bold text-slate-600 dark:text-zinc-400 outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                                        placeholder={placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Categories Manager */}
                <section className="bg-white dark:bg-black rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-white/10 space-y-8">
                    <div className="flex justify-between items-center px-2">
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">Your Categories</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mt-1">Organize your inventory</p>
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
                    </div>
                </section>

                <section className="space-y-6 md:space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Products</h2>
                    <button
                        onClick={addProduct}
                        className="w-full sm:w-auto text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-3"
                        style={{ backgroundColor: accentStr, boxShadow: `0 20px 40px -10px ${accentStr}66` }}
                    >
                        <Plus size={16} strokeWidth={3} />
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
                                    className="w-full aspect-square bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden rounded-[2.5rem] cursor-pointer relative group transition-all shadow-inner"
                                    style={imgs.length > 0 ? { backgroundImage: `url(${imgs[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                                >
                                    {!imgs.length && <Plus size={48} className="text-slate-200" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { addProductImage(p.id, e.target.files[0]); } }} />
                                </label>
                                
                                {imgs.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
                                        {imgs.map((img, idx) => (
                                            <div key={idx} className="w-14 h-14 overflow-hidden relative group shrink-0 border-2 border-slate-100 dark:border-white/10 rounded-xl">
                                                <img src={img} className="w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                    {idx > 0 && <button onClick={() => setPrimaryImage(p.id, idx)} className="text-[10px] text-white"><Sparkles size={12} /></button>}
                                                    <button onClick={() => removeProductImage(p.id, idx)} className="text-[10px] text-white"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-6 min-w-0">
                                <input
                                    value={p.name || ""}
                                    onChange={(e) => { updateProduct(p.id, "name", e.target.value); }}
                                    className="w-full font-black text-2xl md:text-3xl outline-none bg-transparent text-slate-900 dark:text-white uppercase italic"
                                    placeholder="Product Name"
                                />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Price</label>
                                        <div className="bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <span className="text-slate-400 font-black">{state.currency}</span>
                                            <input type="number" value={p.price || ''} onChange={(e) => { updateProduct(p.id, "price", Number(e.target.value)); }} className="bg-transparent font-black text-slate-900 dark:text-white outline-none w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                                        <select value={p.category || ""} onChange={(e) => updateProduct(p.id, "category", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 font-black text-xs uppercase dark:text-white">
                                            <option value="">None</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Badge</label>
                                        <select value={p.badge || ""} onChange={(e) => updateProduct(p.id, "badge", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 font-black text-xs uppercase dark:text-white">
                                            <option value="">None</option>
                                            <option value="hot">🔥 Hot</option>
                                            <option value="new">✨ New</option>
                                            <option value="sale">🏷️ Sale</option>
                                        </select>
                                    </div>
                                </div>

                                <textarea
                                    value={p.description || ""}
                                    onChange={(e) => { updateProduct(p.id, "description", e.target.value); }}
                                    className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 dark:text-zinc-400 outline-none h-24 border border-slate-100 dark:border-white/5 resize-none transition-all focus:border-emerald-500"
                                    placeholder="Describe your product..."
                                />

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={p.outOfStock} onChange={(e) => updateProduct(p.id, "outOfStock", e.target.checked)} />
                                        <div className="w-10 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full peer-checked:bg-rose-500 transition-all relative">
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sold Out</span>
                                    </label>
                                    <span className="text-[9px] font-black text-slate-200 dark:text-zinc-800 italic uppercase">ID: {p.id}</span>
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
            <motion.div key="design" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-8">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-600 p-[2px] rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 group overflow-hidden">
                    <div className="bg-white dark:bg-black rounded-[2.4rem] p-8 md:p-10 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                            <div className="text-center md:text-left space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Visual Engine <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase not-italic">Pro</span></h3>
                                <p className="text-slate-500 dark:text-zinc-400 font-bold text-sm max-w-md">The ultimate editor. Drag and drop sections, browse the gallery with 40+ premium templates, and build your site live.</p>
                            </div>
                            <button onClick={() => setShowVisualEditor(true)} className="w-full md:w-auto px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Launch Visual Editor</button>
                        </div>
                    </div>
                </div>

                <Accordion id="visual" title="Brand Styling" subtitle="Global Vibes" icon={Palette}>
                    <div className="space-y-6 pb-4 flex flex-wrap gap-6">
                        <DebouncedColorPicker label="Accent Color" value={state.accentColor || "#10b981"} onChange={(v) => updateState("accentColor", v)} />
                        <DebouncedColorPicker label="Background Color" value={state.bgColor || "#f2f2f7"} onChange={(v) => updateState("bgColor", v)} />
                        <DebouncedColorPicker label="Text Color" value={state.textColor || "#111827"} onChange={(v) => updateState("textColor", v)} />
                    </div>
                </Accordion>
            </motion.div>
        )}

        {activeTab === "inbox" && (
            <motion.div key="inbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-8">
                <div className="bg-white dark:bg-black rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-white/10 relative overflow-hidden">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight mb-2">Customer Inbox</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-8">System alerts and customer feedback</p>
                    
                    {(!state.notifications || state.notifications.length === 0) ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600 mb-4">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Inbox is Empty</h3>
                            <p className="text-[10px] text-slate-400 uppercase mt-2">When customers interact with your store, alerts will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {state.notifications.map((notif) => (
                                <div key={notif.id} className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-3xl flex gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                                        {notif.type === 'feedback' || notif.type === 'message' ? <MessageSquare size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">{notif.title}</h4>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{notif.timestamp}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">{notif.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}
