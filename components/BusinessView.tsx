"use client";

import { useState, useEffect, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState, PageSection, Product, StoreReview } from "@/lib/schema";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { getShopPath } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, Trash2, RefreshCw, Sparkles, Palette, 
  ExternalLink, Layout, Smartphone, Globe, ChevronDown, Store, FileText, X,
  MessageSquare, Mail, MapPin, User, Video, AtSign, Hash, Link2,
  Image as ImageIcon, LayoutTemplate, PanelBottom, Save, AlertTriangle
} from "lucide-react";
import { StoreSwitcher } from "./StoreSwitcher";

export function BusinessView() {
  const [activeTab, setActiveTab] = useState<"store" | "appearance" | "inbox">("store");
  const [expandedSection, setExpandedSection] = useState<string>("");
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    state: globalState,
    stores,
    switchStore,
    createNewStore,
    saveFullState,
    addToast,
    addSystemNotification,
    user
  } = useSwiftLink();

  // MANUAL SAVE LOCAL STATE
  const [localState, setLocalState] = useState<ShopState>(globalState);
  const [isDirty, setIsDirty] = useState(false);

  // Sync from global when switching stores or initial load (if clean)
  useEffect(() => {
    if (!isDirty) {
      setLocalState(globalState);
    }
  }, [globalState.id]); // Only sync when switching stores

  // Handle Tab Switch Warning
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
  };

  const updateLocalState = (field: keyof ShopState, value: any) => {
    setLocalState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const updateProductLocal = (id: number, field: keyof Product, value: any) => {
    setLocalState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
    setIsDirty(true);
  };

  const saveChanges = () => {
    saveFullState(localState);
    setIsDirty(false);
    addToast("Changes saved successfully!", "success");
  };

  // Exit warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Upload Engine
  const uploadImageDirect = async (file: File, pathPrefix: string) => {
    if (!user) return null;
    setIsUploading(true);
    const path = `${user.id}/${pathPrefix}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from('branding').upload(path, file);
    if (error) {
       addToast(`Upload failed: ${error.message}`, "error");
       setIsUploading(false);
       return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);
    setIsUploading(false);
    return publicUrl;
  };

  const handleCreateNew = async () => {
    const isPro = globalState.plan === "pro" || globalState.plan === "business";
    if (!isPro && stores.length >= 1) {
        addSystemNotification("Pro Feature", "Free accounts are limited to 1 store. Upgrade to PRO to create multiple brands.", "feedback");
        return;
    }
    const name = await (window as any).customPrompt("New Store", "Enter brand name:");
    if (name) {
        await createNewStore(name);
        setShowStoreDropdown(false);
    }
  };

  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [handleInput, setHandleInput] = useState(localState.storeUsername || "");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => { setHandleInput(localState.storeUsername || ""); }, [localState.storeUsername]);

  useEffect(() => {
    if (!handleInput || handleInput === globalState.storeUsername) {
       setHandleStatus("idle");
       return;
    }
    const cleanHandle = handleInput.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setHandleStatus("checking");
    const timeoutId = setTimeout(async () => {
        const { data } = await supabase.from("stores").select("id").eq("store_username", cleanHandle).maybeSingle();
        if (data && data.id !== localState.id) {
            setHandleStatus("taken");
        } else {
            setHandleStatus("available");
            updateLocalState("storeUsername", cleanHandle);
        }
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [handleInput, localState.id]);

  useEffect(() => {
    if (activeTab !== "inbox" || !localState.id) return;
    setReviewsLoading(true);
    supabase.from("store_reviews").select("*").eq("store_id", localState.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setReviews(data as StoreReview[]); setReviewsLoading(false); });
  }, [activeTab, localState.id]);

  const categories = localState.categories || [];
  const isProUser = localState.plan === "pro" || localState.plan === "business";

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

  const ColorPicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => (
      <div>
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</p>
          <input 
              type="color" 
              value={value || "#ffffff"} 
              onChange={(e) => onChange(e.target.value)} 
              className="w-20 h-10 rounded-xl overflow-hidden cursor-pointer border border-slate-200 dark:border-zinc-700" 
          />
      </div>
  );

  const TemplateSelector = ({ type, current, onChange }: { type: string, current: string, onChange: (v: string) => void }) => {
      // Generate 10 templates, 1-5 free, 6-10 PRO
      const templates = Array.from({ length: 10 }).map((_, i) => ({
          id: `${type}-${i + 1}`,
          name: `Design ${i + 1}`,
          isPro: i >= 5
      }));
      return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {templates.map(t => (
                  <button
                      key={t.id}
                      onClick={() => {
                          if (t.isPro && !isProUser) {
                              addSystemNotification("Pro Feature", "This template is exclusively for PRO users.", "feedback");
                              return;
                          }
                          onChange(t.id);
                      }}
                      className={cn(
                          "relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 aspect-[4/3]",
                          current === t.id 
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                              : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                      )}
                  >
                      {t.isPro && <span className="absolute top-2 right-2 text-[10px]">🔒</span>}
                      <LayoutTemplate size={24} className={current === t.id ? "text-emerald-500" : "text-slate-300 dark:text-zinc-700"} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                  </button>
              ))}
          </div>
      );
  };

  return (
    <div className="pb-32 font-sans bg-slate-50/50 dark:bg-black min-h-screen transition-colors duration-300">
      
      {/* FLOATING SAVE BUTTON */}
      <AnimatePresence>
        {isDirty && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full px-6 py-3 shadow-2xl">
             <div className="flex items-center gap-2">
                 <AlertTriangle size={16} className="text-amber-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Unsaved Changes</span>
             </div>
             <div className="w-px h-6 bg-white/20 dark:bg-black/20" />
             <button onClick={saveChanges} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                 <Save size={14} /> Save Now
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-10 px-4 md:px-6 pt-8">
        
        {/* MULTI-STORE SWITCHER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                    <Store size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">{localState.bizName || 'SwiftLink Store'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Outlet</p>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <button onClick={() => setShowStoreDropdown(!showStoreDropdown)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-black text-slate-400 rounded-xl text-[9px] font-black uppercase hover:text-slate-900 dark:hover:text-white transition-all">
                        Switch Store <ChevronDown className={cn("transition-transform", showStoreDropdown && "rotate-180")} size={12} />
                    </button>
                    <AnimatePresence>
                        {showStoreDropdown && (
                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 md:left-auto md:right-0 mt-4 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 z-50 p-3 w-[280px]">
                                <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                                    {stores.map(store => (
                                        <button key={store.id} onClick={() => { switchStore(store.id!); setShowStoreDropdown(false); }} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all", localState.id === store.id ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}>
                                            <div className="flex items-center gap-4 text-left min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-black flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                                    {store.bizImage ? <img src={store.bizImage} className="w-full h-full object-cover" /> : <Store size={14} />}
                                                </div>
                                                <div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-tight dark:text-white truncate">{store.bizName}</p></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-50 dark:border-white/5">
                                    <button onClick={handleCreateNew} className="w-full flex items-center justify-center gap-3 p-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                                        <Plus size={16} /> Create New Brand {!isProUser && stores.length >= 1 && <span className="ml-1">🔒</span>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <button onClick={() => window.open(`${window.location.origin}${getShopPath(localState)}`, "_blank")} className="p-3 bg-slate-50 dark:bg-black text-slate-400 rounded-xl hover:text-emerald-500 transition-all"><ExternalLink size={18} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="text-center lg:text-left">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Engine Room</h1>
                <p className="text-slate-400 dark:text-zinc-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Manage inventory, branding, and operations.</p>
            </div>
            <div className="flex justify-center">
                <div className="flex bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    <button className={cn("px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "store" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400")} onClick={() => handleTabChange("store")}>Inventory</button>
                    <button className={cn("px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "appearance" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400")} onClick={() => handleTabChange("appearance")}>Design</button>
                    <button className={cn("px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "inbox" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400")} onClick={() => handleTabChange("inbox")}>Inbox</button>
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
                        <div className="flex flex-col items-center">
                            <label
                            htmlFor="biz-img-upload"
                            className="relative block w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[3.5rem] bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group shadow-inner transition-all hover:scale-105 hover:border-emerald-500"
                            style={ localState.bizImage ? { backgroundImage: `url(${localState.bizImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined }
                            >
                            {!localState.bizImage && !isUploading && <Plus size={32} className="text-slate-200" />}
                            {isUploading && <RefreshCw size={32} className="text-emerald-500 animate-spin" />}
                            <input type="file" id="biz-img-upload" accept="image/*" disabled={isUploading} className="hidden" onChange={async (e) => { 
                                if(e.target.files?.[0]) {
                                    const url = await uploadImageDirect(e.target.files[0], "branding");
                                    if(url) updateLocalState("bizImage", url);
                                }
                            }} />
                            </label>
                            <p className="text-[9px] font-black uppercase text-slate-400 mt-4 tracking-widest text-center">Store Profile Pic</p>
                        </div>
                        <div className="flex-1 space-y-6 w-full">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">Business Name</label>
                                <input type="text" value={localState.bizName || ""} onChange={(e) => updateLocalState("bizName", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-black text-lg md:text-xl text-slate-900 dark:text-white outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all" placeholder="Elite Fashion" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">WhatsApp Number</label>
                                <input type="tel" value={localState.phone || ""} onChange={(e) => updateLocalState("phone", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all" placeholder="+234..." />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                   <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-[0.2em]">Store Handle (Link)</label>
                                   {handleStatus === "checking" && <span className="text-[10px] text-amber-500 font-bold uppercase">Checking...</span>}
                                   {handleStatus === "available" && <span className="text-[10px] text-emerald-500 font-bold uppercase">Available!</span>}
                                   {handleStatus === "taken" && <span className="text-[10px] text-red-500 font-bold uppercase">Taken!</span>}
                                </div>
                                <div className="relative">
                                  <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold">@</span>
                                  <input type="text" value={handleInput} onChange={(e) => setHandleInput(e.target.value)} className={`w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl py-4 md:py-5 pl-10 md:pl-12 pr-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border ${handleStatus === "taken" ? "border-red-500" : handleStatus === "available" ? "border-emerald-500" : "border-slate-100 dark:border-white/5"} transition-all`} placeholder="my-store" />
                                </div>
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
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">
                                <User size={12} /> Bio / About You
                            </label>
                            <textarea value={localState.bio || ""} onChange={(e) => updateLocalState("bio", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 dark:text-zinc-400 outline-none h-28 border border-slate-100 dark:border-white/5 resize-none transition-all focus:border-emerald-500" placeholder="Tell your customers who you are..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 ml-1"><Mail size={12} /> Contact Email</label>
                                <input type="email" value={localState.contactEmail || ""} onChange={(e) => updateLocalState("contactEmail", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500" placeholder="hello@brand.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 ml-1"><MapPin size={12} /> Address</label>
                                <input type="text" value={localState.contactAddress || ""} onChange={(e) => updateLocalState("contactAddress", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500" placeholder="Lagos, Nigeria" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-white/5 space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Social Links</p>
                            {[
                                { key: "instagram", icon: AtSign, placeholder: "instagram.com/..." },
                                { key: "tiktok", icon: Hash, placeholder: "tiktok.com/@..." },
                                { key: "twitter", icon: AtSign, placeholder: "x.com/..." }
                            ].map(({ key, icon: Icon, placeholder }) => (
                                <div key={key} className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl px-4 py-3 border border-slate-100 dark:border-white/5">
                                    <Icon size={16} className="text-slate-400 shrink-0" />
                                    <input type="url" value={(localState.socials as any)?.[key] || ""} onChange={(e) => updateLocalState("socials", { ...(localState.socials || {}), [key]: e.target.value })} className="flex-1 bg-transparent text-sm font-bold text-slate-600 dark:text-zinc-400 outline-none placeholder:text-slate-300" placeholder={placeholder} />
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
                        </div>
                        <button onClick={async () => {
                            const name = await (window as any).customPrompt("New Category", "Enter name:");
                            if (name && !categories.includes(name)) updateLocalState("categories", [...categories, name]);
                        }} className="bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 px-5 py-3 rounded-xl transition-all">
                            <Plus size={14} /> Add New
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {categories.map(cat => (
                            <div key={cat} className="bg-white dark:bg-black border border-slate-100 dark:border-white/10 pl-5 pr-2 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                            <span className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-tighter">{cat}</span>
                            <button onClick={() => updateLocalState("categories", categories.filter(c => c !== cat))} className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-zinc-900 text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center">
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
                        onClick={() => {
                            const newP: Product = { id: Date.now(), name: "New Product", price: 0, description: "", image: "", images: [], outOfStock: false };
                            updateLocalState("products", [newP, ...localState.products]);
                        }}
                        className="w-full sm:w-auto text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-3 bg-slate-900 dark:bg-emerald-600"
                    >
                        <Plus size={16} /> New Product Entry
                    </button>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                    {localState.products.map((p) => {
                        const imgs = p.images || (p.image ? [p.image] : []);
                        return (
                        <div key={p.id} className="bg-white dark:bg-black rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 border border-slate-100 dark:border-white/10 shadow-sm relative group transition-all hover:border-emerald-500/20 hover:shadow-2xl">
                        
                        <button onClick={() => updateLocalState("products", localState.products.filter(prod => prod.id !== p.id))} className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all z-20">
                            <Trash2 size={18} />
                        </button>

                        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                            {/* MULTIPLE IMAGE MANAGER */}
                            <div className="w-full md:w-48 shrink-0 flex flex-col gap-4">
                                <label
                                    className="w-full aspect-square bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden rounded-[2.5rem] cursor-pointer relative group transition-all shadow-inner"
                                    style={imgs.length > 0 ? { backgroundImage: `url(${imgs[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                                >
                                    {!imgs.length && <Plus size={48} className="text-slate-200" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => { 
                                        if (e.target.files?.[0]) { 
                                            const url = await uploadImageDirect(e.target.files[0], `products/${p.id}`);
                                            if (url) updateProductLocal(p.id, "images", [...imgs, url]);
                                        } 
                                    }} />
                                </label>
                                
                                {imgs.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
                                        {imgs.map((img, idx) => (
                                            <div key={idx} className="w-14 h-14 overflow-hidden relative group shrink-0 border-2 border-slate-100 dark:border-white/10 rounded-xl">
                                                <img src={img} className="w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                    {idx > 0 && <button onClick={() => {
                                                        const nextImgs = [...imgs];
                                                        const primary = nextImgs.splice(idx, 1)[0];
                                                        nextImgs.unshift(primary);
                                                        updateProductLocal(p.id, "images", nextImgs);
                                                    }} className="text-[10px] text-white"><Sparkles size={12} /></button>}
                                                    <button onClick={() => {
                                                        updateProductLocal(p.id, "images", imgs.filter((_, i) => i !== idx));
                                                    }} className="text-[10px] text-white"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {imgs.length < 5 && (
                                            <label className="w-14 h-14 bg-slate-50 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-500 shrink-0">
                                                <Plus size={16} className="text-slate-400" />
                                                <input type="file" className="hidden" accept="image/*" onChange={async (e) => { 
                                                    if (e.target.files?.[0]) { 
                                                        const url = await uploadImageDirect(e.target.files[0], `products/${p.id}`);
                                                        if (url) updateProductLocal(p.id, "images", [...imgs, url]);
                                                    } 
                                                }} />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-6 min-w-0">
                                <input value={p.name || ""} onChange={(e) => updateProductLocal(p.id, "name", e.target.value)} className="w-full font-black text-2xl md:text-3xl outline-none bg-transparent text-slate-900 dark:text-white uppercase italic" placeholder="Product Name" />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Price</label>
                                        <div className="bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <span className="text-slate-400 font-black">{localState.currency}</span>
                                            <input type="number" value={p.price || ''} onChange={(e) => updateProductLocal(p.id, "price", Number(e.target.value))} className="bg-transparent font-black text-slate-900 dark:text-white outline-none w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                                        <select value={p.category || ""} onChange={(e) => updateProductLocal(p.id, "category", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 font-black text-xs uppercase dark:text-white">
                                            <option value="">None</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Badge</label>
                                        <select value={p.badge || ""} onChange={(e) => updateProductLocal(p.id, "badge", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 font-black text-xs uppercase dark:text-white">
                                            <option value="">None</option>
                                            <option value="hot">🔥 Hot</option>
                                            <option value="new">✨ New</option>
                                            <option value="sale">🏷️ Sale</option>
                                        </select>
                                    </div>
                                </div>

                                <textarea value={p.description || ""} onChange={(e) => updateProductLocal(p.id, "description", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 dark:text-zinc-400 outline-none h-24 border border-slate-100 dark:border-white/5 resize-none transition-all focus:border-emerald-500" placeholder="Describe your product..." />

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={p.outOfStock} onChange={(e) => updateProductLocal(p.id, "outOfStock", e.target.checked)} />
                                        <div className="w-10 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full peer-checked:bg-rose-500 transition-all relative">
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sold Out</span>
                                    </label>
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
                
                <Accordion id="visual" title="Color System" subtitle="Global Palette" icon={Palette}>
                    <div className="space-y-6 pb-4 grid grid-cols-2 md:grid-cols-5 gap-6">
                        <ColorPicker label="Accent Color" value={localState.accentColor || "#10b981"} onChange={(v) => updateLocalState("accentColor", v)} />
                        <ColorPicker label="Background" value={localState.bgColor || "#f2f2f7"} onChange={(v) => updateLocalState("bgColor", v)} />
                        <ColorPicker label="Surface/Cards" value={localState.surfaceColor || "#ffffff"} onChange={(v) => updateLocalState("surfaceColor", v)} />
                        <ColorPicker label="Text Color" value={localState.textColor || "#111827"} onChange={(v) => updateLocalState("textColor", v)} />
                        <ColorPicker label="Button Color" value={localState.buttonColor || "#10b981"} onChange={(v) => updateLocalState("buttonColor", v)} />
                    </div>
                </Accordion>

                <Accordion id="hero" title="Hero Template" subtitle="Top Banner Design" icon={LayoutTemplate}>
                    <div className="space-y-6">
                        <TemplateSelector type="hero" current={localState.heroTemplateId || "hero-1"} onChange={(v) => updateLocalState("heroTemplateId", v)} />
                        <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Hero Content Overrides</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Hero Image</label>
                                    <label className="block w-full h-24 bg-slate-50 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 overflow-hidden relative">
                                        {localState.heroImage ? (
                                            <img src={localState.heroImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-slate-400">Upload Hero Image</span>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                            if(e.target.files?.[0]) {
                                                const url = await uploadImageDirect(e.target.files[0], "branding");
                                                if (url) updateLocalState("heroImage", url);
                                            }
                                        }} />
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <input value={localState.heroTitle || ""} onChange={e => updateLocalState("heroTitle", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 font-black text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-white/5" placeholder="Welcome to our store" />
                                    <input value={localState.heroSubtitle || ""} onChange={e => updateLocalState("heroSubtitle", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 font-bold text-xs text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-white/5" placeholder="Quality products, delivered" />
                                    <input value={localState.heroButtonText || ""} onChange={e => updateLocalState("heroButtonText", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 font-bold text-xs text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-white/5" placeholder="Shop Now" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Accordion>

                <Accordion id="catalog" title="Catalog Template" subtitle="Products Grid Design" icon={LayoutTemplate}>
                    <TemplateSelector type="catalog" current={localState.catalogTemplateId || "catalog-1"} onChange={(v) => updateLocalState("catalogTemplateId", v)} />
                </Accordion>

                <Accordion id="about_tpl" title="About Template" subtitle="Brand Story Design" icon={LayoutTemplate}>
                    <div className="space-y-6">
                        <TemplateSelector type="about" current={localState.aboutTemplateId || "about-1"} onChange={(v) => updateLocalState("aboutTemplateId", v)} />
                        <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">About Content</h4>
                            <textarea value={localState.aboutUs || ""} onChange={e => updateLocalState("aboutUs", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 outline-none h-32 border border-slate-100" placeholder="Write your brand story here..." />
                        </div>
                    </div>
                </Accordion>

                <Accordion id="footer_tpl" title="Footer Template" subtitle="Bottom Area Design" icon={PanelBottom}>
                    <div className="space-y-6">
                        <TemplateSelector type="footer" current={localState.footerTemplateId || "footer-1"} onChange={(v) => updateLocalState("footerTemplateId", v)} />
                        <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Footer Content</h4>
                            <input value={localState.tagline || ""} onChange={e => updateLocalState("tagline", e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-4 font-bold text-sm text-slate-600 border border-slate-100" placeholder="Premium Products Tagline" />
                        </div>
                    </div>
                </Accordion>
            </motion.div>
        )}

        {activeTab === "inbox" && (
            <motion.div key="inbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
                <div className="bg-white dark:bg-black rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-white/10">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight mb-1">Customer Reviews</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">What your customers are saying publicly</p>
                    
                    {reviewsLoading ? (
                        <div className="py-16 flex justify-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : reviews.length === 0 ? (
                        <div className="py-16 flex flex-col items-center text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                            <MessageSquare size={32} className="text-slate-200 mb-3" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No reviews yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((r) => (
                                <div key={r.id} className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-3xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-sm">{r.author_name?.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{r.author_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{r.message}</p>
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
