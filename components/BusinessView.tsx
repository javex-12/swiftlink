"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Image as ImageIcon, LayoutTemplate, PanelBottom, Save, AlertTriangle, Star,
  Dices
} from "lucide-react";
import { StoreSwitcher } from "./StoreSwitcher";
import { CustomerStorefrontPreview } from "./CustomerStorefront";
import { CountrySelector } from "./CountrySelector";

const PRESET_PALETTES = [
    { name: "Emerald (Default)", accent: "#10b981", bg: "#f2f2f7", surface: "#ffffff", text: "#111827", btn: "#10b981" },
    { name: "Midnight Indigo", accent: "#6366f1", bg: "#020617", surface: "#0f172a", text: "#f8fafc", btn: "#6366f1" },
    { name: "Luxury Gold", accent: "#d4af37", bg: "#0a0a0a", surface: "#161616", text: "#ffffff", btn: "#d4af37" },
    { name: "Rose Garden", accent: "#e11d48", bg: "#fff1f2", surface: "#ffffff", text: "#881337", btn: "#e11d48" },
    { name: "Slate & Amber", accent: "#f59e0b", bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", btn: "#0f172a" },
    { name: "Deep Forest", accent: "#059669", bg: "#f0fdf4", surface: "#ffffff", text: "#064e3b", btn: "#059669" },
    { name: "Cyberpunk", accent: "#ff00ff", bg: "#050505", surface: "#111111", text: "#00ffff", btn: "#ff00ff" },
    { name: "Minimalist", accent: "#000000", bg: "#ffffff", surface: "#fafafa", text: "#000000", btn: "#000000" },
];

// ... rest of StableInput and StableTextarea ...

function StableInput({ value, onChange, className, placeholder, type = "text" }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
}) {
  const [local, setLocal] = useState(value);
  // Sync if parent value changes externally (e.g. store switch)
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      setLocal(value);
      prevValue.current = value;
    }
  }, [value]);
  return (
    <input
      type={type}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) { onChange(local); prevValue.current = local; } }}
      className={className}
      placeholder={placeholder}
    />
  );
}

function StableTextarea({ value, onChange, className, placeholder, rows }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [local, setLocal] = useState(value);
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      setLocal(value);
      prevValue.current = value;
    }
  }, [value]);
  return (
    <textarea
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) { onChange(local); prevValue.current = local; } }}
      className={className}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

const PRIVILEGED_USERS: Record<string, string> = {
    "michaeldosunmu22@gmail.com": "business", 
    "dosunmumichael26@gmail.com": "pro",
};

export function BusinessView() {
  const [activeTab, setActiveTab] = useState<"store" | "appearance" | "inbox">("store");
  const [expandedSection, setExpandedSection] = useState<string>("");
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const { state: globalState, updateState, saveFullState, addSystemNotification, addToast, user, stores, switchStore, createNewStore, transferStore } = useSwiftLink();

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

  const submitReply = async (reviewId: string) => {
    const replyMessage = replyInputs[reviewId]?.trim();
    if (!replyMessage) return;

    const { data, error } = await supabase.from("store_review_comments").insert({
        review_id: reviewId,
        author_name: localState.bizName || "Store Owner",
        author_id: user?.id || null,
        message: replyMessage,
        store_id: localState.id
    }).select().single();

    if (!error && data) {
        setComments(prev => ({
            ...prev,
            [reviewId]: [...(prev[reviewId] || []), data]
        }));
        setReplyInputs(prev => ({ ...prev, [reviewId]: "" }));
        addToast("Reply posted successfully!", "success");
    } else {
        console.error("[submitReply] Supabase error:", error);
        addToast(`Reply failed: ${error?.message || "Check Supabase table/RLS"}`, "error");
    }
  };

  const updateProductLocal = (id: number, field: keyof Product, value: any) => {
    setLocalState(prev => ({
      ...prev,
      products: prev.products.map(p => {
          if (p.id === id) {
              const updated = { ...p, [field]: value };
              // SYNC: Ensure p.image (thumbnail) is always the first image from gallery
              if (field === "images" && Array.isArray(value) && value.length > 0) {
                  updated.image = value[0];
              }
              return updated;
          }
          return p;
      })
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
    if (!user) return;
    
    // Check privileged status directly using the top-level constant
    const userEmail = user.email || "";
    const assignedPlan = PRIVILEGED_USERS[userEmail];
    const isPremium = assignedPlan === "business" || assignedPlan === "pro" || globalState.plan === "business" || globalState.plan === "pro";

    if (!isPremium && stores.length >= 1) {
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
    supabase.from("store_reviews").select("*").eq("store_id", localState.id).neq("type", "post").order("created_at", { ascending: false }).limit(50)
      .then(async ({ data }) => {
          if (data) {
              // Filter out any reviews the store owner themselves submitted
              const filteredData = data.filter(r => !user || r.author_id !== user.id);
              setReviews(filteredData as StoreReview[]);
              const reviewIds = filteredData.map(r => r.id);
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

  const StableColorPicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
      const [local, setLocal] = useState(value);
      const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

      useEffect(() => {
        setLocal(value);
      }, [value]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setLocal(next);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onChange(next);
        }, 50);
      };

      return (
          <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</p>
              <input 
                  type="color" 
                  value={local || "#ffffff"} 
                  onChange={handleChange} 
                  className="w-20 h-10 rounded-xl overflow-hidden cursor-pointer border border-slate-200 dark:border-zinc-700 hover:scale-105 transition-transform" 
              />
          </div>
      );
  };

  const DiceButton = ({ onClick, title = "Randomize" }: { onClick: () => void, title?: string }) => {
      const [isSpinning, setIsSpinning] = useState(false);
      const handleDiceClick = () => {
          setIsSpinning(true);
          onClick();
          setTimeout(() => setIsSpinning(false), 600);
      };
      return (
          <button 
              onClick={handleDiceClick}
              title={title}
              className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-emerald-500 rounded-xl transition-all active:scale-90"
          >
              <motion.div animate={isSpinning ? { rotate: 360, scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5, ease: "easeInOut" }}>
                  <Dices size={18} />
              </motion.div>
          </button>
      );
  };

  // ─── Template metadata ──────────────────────────────────────────

  const TEMPLATE_META: Record<string, { id: string; name: string; desc: string; dark: boolean; isPro: boolean; icon: React.ReactNode }[]> = {
    hero: [
      { id:"hero-1",  name:"Ambient Orbs",    desc:"Dark glass with glowing orb animations",       dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#050505"/><circle cx="45" cy="8" r="12" fill="#10b981" opacity=".25"/><circle cx="10" cy="35" r="9" fill="#10b981" opacity=".15"/><rect x="8" y="26" width="28" height="3" rx="1.5" fill="white" opacity=".9"/><rect x="8" y="31" width="18" height="2" rx="1" fill="white" opacity=".4"/><rect x="8" y="36" width="14" height="5" rx="2.5" fill="white" opacity=".9"/></> },
      { id:"hero-2",  name:"Editorial Dark",  desc:"Full bleed overlay with accent bar",           dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#111"/><rect x="0" y="0" width="3" height="40" fill="#10b981"/><rect x="8" y="8" width="6" height="2" rx="1" fill="#10b981"/><rect x="8" y="15" width="38" height="5" rx="1.5" fill="white" opacity=".9"/><rect x="8" y="22" width="24" height="2" rx="1" fill="white" opacity=".4"/><rect x="8" y="28" width="16" height="6" rx="2.5" fill="#10b981"/></> },
      { id:"hero-3",  name:"Magazine Light",  desc:"Clean editorial with clipped image mask",      dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="0" y="0" width="60" height="5" fill="#f8f8f8"/><rect x="8" y="1" width="20" height="2" rx="1" fill="#ccc"/><rect x="8" y="12" width="30" height="4" rx="1.5" fill="#111" opacity=".9"/><rect x="8" y="18" width="20" height="2" rx="1" fill="#999"/><rect x="8" y="23" width="14" height="5" rx="2.5" fill="#111"/><rect x="42" y="0" width="18" height="40" rx="0" fill="#e5e5e5"/></> },
      { id:"hero-4",  name:"Torus Knot 3D",   desc:"Live 3D glowing torus knot canvas",           dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#020205"/><ellipse cx="45" cy="20" rx="12" ry="14" fill="none" stroke="#10b981" strokeWidth="1.5" opacity=".6"/><ellipse cx="45" cy="20" rx="7" ry="9" fill="none" stroke="#10b981" strokeWidth="1" opacity=".3"/><rect x="6" y="12" width="28" height="4" rx="1.5" fill="white" opacity=".9"/><rect x="6" y="19" width="20" height="2" rx="1" fill="white" opacity=".4"/><rect x="6" y="24" width="14" height="6" rx="2.5" fill="#10b981"/></> },
      { id:"hero-5",  name:"Cyber Grid 3D",   desc:"Animated wireframe floor mesh canvas",        dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#050b0a"/><line x1="0" y1="32" x2="60" y2="32" stroke="#10b981" strokeWidth=".5" opacity=".3"/><line x1="10" y1="40" x2="30" y2="32" stroke="#10b981" strokeWidth=".5" opacity=".2"/><line x1="50" y1="40" x2="30" y2="32" stroke="#10b981" strokeWidth=".5" opacity=".2"/><rect x="12" y="10" width="36" height="5" rx="1.5" fill="transparent" stroke="none"/><rect x="8" y="10" width="44" height="5" rx="1.5" fill="white" opacity=".1"/><text x="30" y="17" textAnchor="middle" fill="white" fontSize="5" fontWeight="900" opacity=".9">YOUR TITLE</text><rect x="18" y="22" width="24" height="6" rx="3" fill="white"/></> },
      { id:"hero-6",  name:"Cosmic Particles", desc:"Deep-space particle universe canvas",        dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#000"/><circle cx="10" cy="5" r="1" fill="#10b981" opacity=".8"/><circle cx="25" cy="12" r=".7" fill="white" opacity=".5"/><circle cx="45" cy="8" r="1.2" fill="#10b981" opacity=".6"/><circle cx="55" cy="20" r=".8" fill="white" opacity=".4"/><circle cx="30" cy="30" r=".6" fill="#10b981" opacity=".7"/><circle cx="5" cy="28" r="1" fill="white" opacity=".3"/><rect x="10" y="14" width="40" height="5" rx="2" fill="white" opacity=".9"/><rect x="15" y="21" width="30" height="2" rx="1" fill="white" opacity=".4"/><rect x="20" y="27" width="20" height="6" rx="3" fill="#10b981"/></> },
      { id:"hero-7",  name:"DNA Helix 3D",    desc:"Organic rotating DNA helix canvas",           dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#03020c"/><path d="M48 2 Q52 10 48 18 Q44 26 48 34 Q52 42 48 40" stroke="#10b981" strokeWidth="1.5" fill="none" opacity=".7"/><path d="M54 2 Q50 10 54 18 Q58 26 54 34 Q50 42 54 40" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity=".5"/><rect x="6" y="14" width="30" height="4" rx="2" fill="white" opacity=".9"/><rect x="6" y="21" width="22" height="2" rx="1" fill="white" opacity=".4"/><rect x="6" y="27" width="16" height="5" rx="2.5" fill="white"/></> },
      { id:"hero-8",  name:"Starfield Warp",  desc:"Hyperspace starfield warp speed canvas",      dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#000"/><line x1="30" y1="20" x2="2" y2="2" stroke="white" strokeWidth=".5" opacity=".3"/><line x1="30" y1="20" x2="58" y2="2" stroke="white" strokeWidth=".5" opacity=".3"/><line x1="30" y1="20" x2="58" y2="38" stroke="white" strokeWidth=".5" opacity=".3"/><line x1="30" y1="20" x2="2" y2="38" stroke="white" strokeWidth=".5" opacity=".3"/><rect x="5" y="14" width="30" height="4" rx="2" fill="white" opacity=".9"/><rect x="5" y="21" width="22" height="2" rx="1" fill="white" opacity=".5"/><rect x="5" y="27" width="14" height="5" rx="2.5" fill="#10b981"/></> },
      { id:"hero-9",  name:"Wave Mesh 3D",    desc:"Oceanic animated wireframe wave canvas",      dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#050811"/><path d="M0 30 Q15 22 30 30 Q45 38 60 30" stroke="#10b981" strokeWidth="1" fill="none" opacity=".4"/><path d="M0 34 Q15 26 30 34 Q45 42 60 34" stroke="#10b981" strokeWidth=".7" fill="none" opacity=".2"/><rect x="10" y="10" width="40" height="5" rx="2" fill="white" opacity=".9"/><rect x="14" y="18" width="32" height="2" rx="1" fill="white" opacity=".4"/><rect x="18" y="24" width="24" height="6" rx="3" fill="white"/></> },
      { id:"hero-10", name:"Neon Rings 3D",   desc:"Cyberpunk neon ring tunnel canvas",           dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#0a000f"/><ellipse cx="30" cy="20" rx="25" ry="16" fill="none" stroke="#a855f7" strokeWidth="1" opacity=".5"/><ellipse cx="30" cy="20" rx="17" ry="10" fill="none" stroke="#10b981" strokeWidth="1" opacity=".4"/><ellipse cx="30" cy="20" rx="9" ry="5" fill="none" stroke="#a855f7" strokeWidth="1" opacity=".3"/><rect x="10" y="16" width="40" height="5" rx="2" fill="white" opacity=".9"/></> },
    ],
    catalog: [
      { id:"catalog-1",  name:"Clean Grid",      desc:"Classic borderless product grid",          dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#f8f8f8"/><rect x="3" y="3" width="17" height="22" rx="3" fill="white" stroke="#eee" strokeWidth=".5"/><rect x="22" y="3" width="17" height="22" rx="3" fill="white" stroke="#eee" strokeWidth=".5"/><rect x="41" y="3" width="17" height="22" rx="3" fill="white" stroke="#eee" strokeWidth=".5"/><rect x="4" y="27" width="12" height="2" rx="1" fill="#111" opacity=".7"/><rect x="4" y="31" width="8" height="2" rx="1" fill="#10b981" opacity=".9"/></> },
      { id:"catalog-2",  name:"Magazine List",   desc:"Horizontal list with image & details",     dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="3" y="4" width="12" height="12" rx="2" fill="#e5e5e5"/><rect x="17" y="5" width="25" height="2.5" rx="1" fill="#111" opacity=".8"/><rect x="17" y="9" width="18" height="2" rx="1" fill="#999"/><rect x="17" y="13" width="12" height="2.5" rx="1" fill="#10b981"/><rect x="3" y="18" width="12" height="12" rx="2" fill="#e5e5e5"/><rect x="17" y="19" width="25" height="2.5" rx="1" fill="#111" opacity=".8"/><rect x="17" y="23" width="18" height="2" rx="1" fill="#999"/><rect x="17" y="27" width="12" height="2.5" rx="1" fill="#10b981"/></> },
      { id:"catalog-3",  name:"Glassmorphic",    desc:"Frosted glass cards with neon edges",      dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#1a1a2e"/><rect x="3" y="3" width="17" height="22" rx="4" fill="white" fillOpacity=".1" stroke="white" strokeWidth=".5" strokeOpacity=".2"/><rect x="22" y="3" width="17" height="22" rx="4" fill="white" fillOpacity=".1" stroke="white" strokeWidth=".5" strokeOpacity=".2"/><rect x="41" y="3" width="17" height="22" rx="4" fill="white" fillOpacity=".1" stroke="white" strokeWidth=".5" strokeOpacity=".2"/><rect x="4" y="27" width="14" height="2" rx="1" fill="white" opacity=".7"/><rect x="4" y="31" width="9" height="2" rx="1" fill="#10b981" opacity=".9"/></> },
      { id:"catalog-4",  name:"Cyber Dark",      desc:"Charcoal panels with green neon trim",     dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#09090b"/><rect x="3" y="3" width="17" height="22" rx="3" fill="#18181b" stroke="#10b981" strokeWidth=".5" strokeOpacity=".3"/><rect x="22" y="3" width="17" height="22" rx="3" fill="#18181b" stroke="#10b981" strokeWidth=".5" strokeOpacity=".3"/><rect x="41" y="3" width="17" height="22" rx="3" fill="#18181b" stroke="#10b981" strokeWidth=".5" strokeOpacity=".3"/><rect x="4" y="27" width="14" height="2" rx="1" fill="#10b981" opacity=".8"/><rect x="4" y="31" width="9" height="2" rx="1" fill="#10b981" opacity=".5"/></> },
      { id:"catalog-5",  name:"Swipe Carousel",  desc:"Horizontal scrollable cards",              dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#f8f8f8"/><rect x="3" y="6" width="15" height="28" rx="4" fill="white" stroke="#eee" strokeWidth=".5"/><rect x="20" y="6" width="15" height="28" rx="4" fill="white" stroke="#eee" strokeWidth=".5"/><rect x="37" y="6" width="15" height="28" rx="4" fill="white" stroke="#eee" strokeWidth=".5" opacity=".5"/><rect x="57" y="6" width="5" height="28" rx="2" fill="#e5e5e5" opacity=".5"/></> },
      { id:"catalog-6",  name:"Spec Sheet",      desc:"Compact table-style product listing",      dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="3" y="6" width="55" height="7" rx="2" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><rect x="5" y="8" width="6" height="3" rx="1" fill="#e5e5e5"/><rect x="13" y="9" width="20" height="2" rx="1" fill="#111" opacity=".6"/><rect x="48" y="8" width="8" height="3" rx="1.5" fill="#10b981"/><rect x="3" y="15" width="55" height="7" rx="2" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><rect x="5" y="17" width="6" height="3" rx="1" fill="#e5e5e5"/><rect x="13" y="18" width="20" height="2" rx="1" fill="#111" opacity=".6"/></> },
      { id:"catalog-7",  name:"Polaroid Retro",  desc:"Square photos with handwritten style",     dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#faf8f5"/><rect x="4" y="3" width="16" height="20" fill="white" stroke="#e5e5e5" strokeWidth="1"/><rect x="5" y="4" width="14" height="12" fill="#e5e5e5"/><rect x="5" y="18" width="14" height="2" rx=".5" fill="#888"/><rect x="22" y="5" width="16" height="18" fill="white" stroke="#e5e5e5" strokeWidth="1" transform="rotate(2 22 5)"/><rect x="23" y="6" width="14" height="10" fill="#e5e5e5" transform="rotate(2 22 5)"/></> },
      { id:"catalog-8",  name:"Masonry Grid",    desc:"Asymmetric column masonry layout",         dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="3" y="3" width="17" height="26" rx="3" fill="#e5e5e5"/><rect x="22" y="3" width="17" height="16" rx="3" fill="#e5e5e5"/><rect x="22" y="21" width="17" height="12" rx="3" fill="#e5e5e5" opacity=".6"/><rect x="41" y="3" width="17" height="20" rx="3" fill="#e5e5e5" opacity=".8"/><rect x="41" y="25" width="17" height="8" rx="3" fill="#e5e5e5" opacity=".4"/></> },
      { id:"catalog-9",  name:"Hover Reveal",    desc:"Details emerge only on hover",             dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#f1f5f9"/><rect x="3" y="3" width="17" height="22" rx="3" fill="#d0d0d0"/><rect x="22" y="3" width="17" height="22" rx="3" fill="#d0d0d0"/><rect x="22" y="17" width="17" height="8" rx="0" fill="rgba(0,0,0,.5)"/><rect x="24" y="19" width="12" height="2" rx="1" fill="white" opacity=".9"/><rect x="24" y="23" width="8" height="1.5" rx=".75" fill="#10b981"/><rect x="41" y="3" width="17" height="22" rx="3" fill="#d0d0d0"/></> },
      { id:"catalog-10", name:"Brutalist",       desc:"Bold borders and offset shadow",           dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#fffbeb"/><rect x="3" y="3" width="16" height="21" rx="0" fill="white" stroke="black" strokeWidth="2"/><rect x="5" y="5" width="12" height="14" rx="0" fill="#e5e5e5"/><rect x="3" y="26" width="12" height="2.5" rx="0" fill="black"/><rect x="3" y="30" width="8" height="2.5" rx="0" fill="#10b981"/><rect x="23" y="3" width="16" height="21" rx="0" fill="white" stroke="black" strokeWidth="2"/><rect x="43" y="3" width="16" height="21" rx="0" fill="white" stroke="black" strokeWidth="2"/></> },
    ],
    about: [
      { id:"about-1",  name:"Story Card",    desc:"Clean card with rich typography",         dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white" stroke="#eee" strokeWidth=".5"/><rect x="6" y="8" width="30" height="4" rx="2" fill="#111" opacity=".9"/><rect x="6" y="15" width="48" height="2" rx="1" fill="#999"/><rect x="6" y="19" width="44" height="2" rx="1" fill="#999" opacity=".7"/><rect x="6" y="23" width="36" height="2" rx="1" fill="#999" opacity=".5"/></> },
      { id:"about-2",  name:"Center Quote",  desc:"Large italic centered brand quote",       dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="0" y="0" width="60" height="1" fill="#eee"/><rect x="0" y="39" width="60" height="1" fill="#eee"/><text x="30" y="14" textAnchor="middle" fill="#10b981" fontSize="8" opacity=".3">"</text><rect x="12" y="16" width="36" height="3" rx="1.5" fill="#111" opacity=".7"/><rect x="16" y="21" width="28" height="2" rx="1" fill="#999"/><rect x="18" y="25" width="24" height="2" rx="1" fill="#999" opacity=".7"/></> },
      { id:"about-3",  name:"Split Color",   desc:"Contrast split-panel accent layout",      dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="0" y="0" width="25" height="40" rx="0" fill="#10b981" fillOpacity=".1"/><rect x="5" y="10" width="14" height="4" rx="2" fill="#10b981" opacity=".7"/><rect x="30" y="8" width="25" height="2.5" rx="1" fill="#999"/><rect x="30" y="13" width="22" height="2" rx="1" fill="#999" opacity=".7"/><rect x="30" y="18" width="18" height="2" rx="1" fill="#999" opacity=".5"/></> },
      { id:"about-4",  name:"Pillars Grid",  desc:"3 core value columns layout",            dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="24" y="3" width="12" height="2.5" rx="1" fill="#111" opacity=".8"/><rect x="3" y="10" width="17" height="22" rx="3" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><rect x="22" y="10" width="17" height="22" rx="3" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><rect x="41" y="10" width="17" height="22" rx="3" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><text x="11.5" y="21" textAnchor="middle" fill="#10b981" fontSize="6" fontWeight="900" opacity=".7">01</text><text x="30.5" y="21" textAnchor="middle" fill="#10b981" fontSize="6" fontWeight="900" opacity=".7">02</text><text x="49.5" y="21" textAnchor="middle" fill="#10b981" fontSize="6" fontWeight="900" opacity=".7">03</text></> },
      { id:"about-5",  name:"Cyber Block",   desc:"Dark monospaced terminal aesthetic",      dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#09090b"/><text x="5" y="10" fill="#10b981" fontSize="5">&gt; ABOUT_US</text><rect x="5" y="13" width="33" height="2" rx="1" fill="#3f3f46"/><rect x="5" y="17" width="28" height="2" rx="1" fill="#3f3f46" opacity=".7"/><rect x="5" y="21" width="33" height="2" rx="1" fill="#3f3f46" opacity=".5"/><rect x="42" y="13" width="13" height="15" fill="none" stroke="#3f3f46" strokeWidth=".5"/><text x="48.5" y="21" textAnchor="middle" fill="#10b981" fontSize="4">LIVE</text></> },
      { id:"about-6",  name:"Frosted Float", desc:"Glassmorphic card with ambient glow",    dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#1a1a2e"/><circle cx="10" cy="10" r="12" fill="#10b981" opacity=".2" filter="blur(4px)"/><rect x="8" y="8" width="44" height="26" rx="6" fill="white" fillOpacity=".08" stroke="white" strokeWidth=".5" strokeOpacity=".2"/><rect x="12" y="12" width="20" height="3" rx="1.5" fill="white" opacity=".9"/><rect x="12" y="17" width="30" height="2" rx="1" fill="white" opacity=".4"/><rect x="12" y="21" width="26" height="2" rx="1" fill="white" opacity=".3"/></> },
      { id:"about-7",  name:"Timeline",      desc:"Milestone history timeline display",      dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="15" y="3" width="1" height="35" fill="#e5e5e5"/><circle cx="15.5" cy="10" r="3" fill="#10b981"/><circle cx="15.5" cy="22" r="3" fill="#10b981" opacity=".5"/><circle cx="15.5" cy="34" r="3" fill="#10b981" opacity=".3"/><rect x="22" y="8" width="30" height="4" rx="2" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><rect x="22" y="20" width="30" height="4" rx="2" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/><rect x="22" y="32" width="30" height="4" rx="2" fill="#f8f8f8" stroke="#eee" strokeWidth=".5"/></> },
      { id:"about-8",  name:"Brutalist",     desc:"Heavy black borders and oversized type",  dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#fff7ed"/><rect x="3" y="3" width="55" height="35" rx="0" fill="none" stroke="black" strokeWidth="2.5"/><rect x="5" y="6" width="15" height="5" rx="0" fill="#fde68a" stroke="black" strokeWidth="1.5"/><rect x="5" y="14" width="50" height="6" rx="0" fill="none"/><text x="6" y="20" fill="black" fontSize="7" fontWeight="900">DIRECTIVE.</text><rect x="5" y="22" width="50" height="1.5" fill="black"/></> },
      { id:"about-9",  name:"Serif Strip",   desc:"Minimal editorial serif typography",      dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="0" y="4" width="60" height=".7" fill="#ddd"/><rect x="0" y="36" width="60" height=".7" fill="#ddd"/><rect x="5" y="10" width="18" height="3" rx="0" fill="#111" opacity=".9"/><rect x="5" y="15" width="16" height="2" rx="0" fill="#111" opacity=".5"/><rect x="28" y="10" width="26" height="2" rx="0" fill="#999"/><rect x="28" y="14" width="24" height="2" rx="0" fill="#999" opacity=".7"/><rect x="28" y="18" width="22" height="2" rx="0" fill="#999" opacity=".5"/></> },
      { id:"about-10", name:"Aura Glow",     desc:"Pulsing rainbow gradient aura card",      dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><ellipse cx="30" cy="20" rx="28" ry="18" fill="none" stroke="url(#g1)" strokeWidth="1.5" opacity=".5"/><defs><linearGradient id="g1" x1="0" y1="0" x2="60" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#10b981"/><stop offset=".5" stopColor="#6366f1"/><stop offset="1" stopColor="#a855f7"/></linearGradient></defs><rect x="12" y="14" width="36" height="4" rx="2" fill="#111" opacity=".9"/><rect x="16" y="21" width="28" height="2" rx="1" fill="#999"/></> },
    ],
    footer: [
      { id:"footer-1",  name:"Branded Card",   desc:"Accent-tinted card with contact info",   dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#f0fdf4"/><rect x="3" y="4" width="54" height="32" rx="4" fill="#10b981" fillOpacity=".08" stroke="#10b981" strokeWidth=".5" strokeOpacity=".3"/><rect x="7" y="10" width="6" height="6" rx="1.5" fill="#10b981"/><rect x="15" y="11" width="16" height="3" rx="1.5" fill="#111" opacity=".8"/><rect x="15" y="15" width="10" height="1.5" rx=".75" fill="#999"/><rect x="35" y="10" width="18" height="1.5" rx=".75" fill="#999"/><rect x="35" y="13" width="14" height="1.5" rx=".75" fill="#999"/><rect x="35" y="16" width="16" height="1.5" rx=".75" fill="#999"/></> },
      { id:"footer-2",  name:"Minimal Center", desc:"Centered logo + socials strip",          dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="0" y="2" width="60" height=".7" fill="#eee"/><rect x="20" y="10" width="20" height="4" rx="2" fill="#111" opacity=".8"/><rect x="25" y="17" width="10" height="2" rx="1" fill="#999"/><rect x="20" y="23" width="5" height="5" rx="2.5" fill="#10b981"/><rect x="27" y="23" width="5" height="5" rx="2.5" fill="#10b981" opacity=".7"/><rect x="34" y="23" width="5" height="5" rx="2.5" fill="#10b981" opacity=".5"/><rect x="22" y="31" width="16" height="1.5" rx=".75" fill="#ddd"/></> },
      { id:"footer-3",  name:"Directory",      desc:"Multi-column links & brand footer",      dark:false, isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="3" y="4" width="12" height="3" rx="1.5" fill="#111" opacity=".8"/><rect x="3" y="9" width="10" height="1.5" rx=".75" fill="#999"/><rect x="3" y="12" width="10" height="1.5" rx=".75" fill="#999" opacity=".7"/><rect x="3" y="15" width="10" height="1.5" rx=".75" fill="#999" opacity=".5"/><rect x="22" y="4" width="10" height="2" rx="1" fill="#10b981" opacity=".5"/><rect x="22" y="9" width="10" height="1.5" rx=".75" fill="#999"/><rect x="22" y="12" width="8" height="1.5" rx=".75" fill="#999" opacity=".7"/><rect x="42" y="4" width="10" height="2" rx="1" fill="#10b981" opacity=".5"/><rect x="42" y="9" width="12" height="1.5" rx=".75" fill="#999"/><rect x="42" y="12" width="10" height="1.5" rx=".75" fill="#999" opacity=".7"/><rect x="0" y="30" width="60" height=".7" fill="#eee"/><rect x="3" y="33" width="20" height="1.5" rx=".75" fill="#ddd"/><rect x="38" y="33" width="20" height="1.5" rx=".75" fill="#ddd"/></> },
      { id:"footer-4",  name:"Dark Panel",     desc:"Premium dark with accent directory",     dark:true,  isPro:false, icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#09090b"/><rect x="0" y="0" width="60" height="40" rx="6" stroke="#27272a" strokeWidth=".7" fill="none"/><rect x="4" y="5" width="6" height="6" rx="1.5" fill="#10b981"/><rect x="12" y="6" width="16" height="3" rx="1.5" fill="white" opacity=".9"/><rect x="4" y="14" width="14" height="1.5" rx=".75" fill="#52525b"/><rect x="4" y="17" width="12" height="1.5" rx=".75" fill="#52525b" opacity=".7"/><rect x="33" y="6" width="8" height="1.5" rx=".75" fill="#10b981" opacity=".6"/><rect x="33" y="10" width="20" height="1.5" rx=".75" fill="#52525b"/><rect x="33" y="13" width="18" height="1.5" rx=".75" fill="#52525b" opacity=".7"/><rect x="0" y="32" width="60" height=".7" fill="#27272a"/></> },
      { id:"footer-5",  name:"Email Subscribe", desc:"Subscribe form embedded in footer",     dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="3" y="4" width="54" height="26" rx="4" fill="#10b981" fillOpacity=".06" stroke="#10b981" strokeWidth=".5" strokeOpacity=".3"/><rect x="18" y="8" width="24" height="3" rx="1.5" fill="#111" opacity=".8"/><rect x="22" y="13" width="16" height="2" rx="1" fill="#999"/><rect x="8" y="19" width="30" height="5" rx="2" fill="white" stroke="#ddd" strokeWidth=".7"/><rect x="40" y="19" width="13" height="5" rx="2" fill="#10b981"/></> },
      { id:"footer-6",  name:"Glass Bar",      desc:"Frosted glass floating pill footer",     dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#0f172a"/><rect x="5" y="14" width="50" height="14" rx="5" fill="white" fillOpacity=".07" stroke="white" strokeWidth=".5" strokeOpacity=".2"/><rect x="9" y="18" width="5" height="5" rx="1.5" fill="#10b981"/><rect x="16" y="19" width="14" height="2.5" rx="1" fill="white" opacity=".8"/><rect x="35" y="18" width="5" height="5" rx="2.5" fill="#10b981" opacity=".7"/><rect x="42" y="18" width="5" height="5" rx="2.5" fill="#10b981" opacity=".5"/></> },
      { id:"footer-7",  name:"Brutalist",      desc:"Massive name + bold rule lines",         dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="3" y="4" width="54" height="3" fill="black"/><rect x="3" y="11" width="40" height="6" rx="0" fill="none"/><text x="4" y="17" fill="black" fontSize="7" fontWeight="900">STORE NAME</text><rect x="3" y="21" width="30" height="1.5" fill="black" opacity=".2"/><rect x="3" y="36" width="54" height="1" fill="black" opacity=".1"/></> },
      { id:"footer-8",  name:"Contact Badges", desc:"Pill badges for quick contact access",   dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="4" y="10" width="18" height="8" rx="4" fill="#f8f8f8" stroke="#eee" strokeWidth=".7"/><rect x="24" y="10" width="16" height="8" rx="4" fill="#f8f8f8" stroke="#eee" strokeWidth=".7"/><rect x="42" y="10" width="14" height="8" rx="4" fill="#f8f8f8" stroke="#eee" strokeWidth=".7"/><rect x="22" y="22" width="16" height="2.5" rx="1" fill="#111" opacity=".7"/><rect x="24" y="26" width="12" height="1.5" rx=".75" fill="#ddd"/></> },
      { id:"footer-9",  name:"Cyber Terminal", desc:"Monospaced dark console telemetry",      dark:true,  isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="#09090b"/><rect x="0" y="0" width="60" height="40" rx="6" stroke="#27272a" strokeWidth=".7" fill="none"/><text x="4" y="10" fill="#10b981" fontSize="4">&gt; ENTITY_ID</text><text x="4" y="15" fill="white" fontSize="5" fontWeight="900">STORE_NAME</text><text x="24" y="10" fill="#10b981" fontSize="4">&gt; CONTACT</text><text x="24" y="15" fill="#52525b" fontSize="3.5">email@store.com</text><text x="44" y="10" fill="#10b981" fontSize="4">&gt; SOCIAL</text><text x="44" y="15" fill="#52525b" fontSize="3.5">instagram</text><rect x="0" y="28" width="60" height=".5" fill="#27272a"/><text x="4" y="34" fill="#3f3f46" fontSize="3">SYS.YEAR: 2026</text></> },
      { id:"footer-10", name:"Minimal Strip",  desc:"Single row copyright strip",             dark:false, isPro:true,  icon:<><rect x="0" y="0" width="60" height="40" rx="6" fill="white"/><rect x="0" y="17" width="60" height=".7" fill="#eee"/><rect x="4" y="20" width="18" height="2" rx="1" fill="#ccc"/><rect x="25" y="19" width="5" height="4" rx="2" fill="#10b981"/><rect x="32" y="19" width="5" height="4" rx="2" fill="#10b981" opacity=".7"/><rect x="39" y="19" width="5" height="4" rx="2" fill="#10b981" opacity=".5"/><rect x="47" y="20" width="10" height="2" rx="1" fill="#ccc"/></> },
    ],
  };

  const [previewModal, setPreviewModal] = React.useState<{ type: "hero" | "catalog" | "about" | "footer"; templateId: string } | null>(null);

  const TemplateSelector = ({ type, current, onChange }: { type: "hero" | "catalog" | "about" | "footer"; current: string; onChange: (v: string) => void }) => {
    const templates = TEMPLATE_META[type] || [];
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {templates.map(t => (
          <div key={t.id} className="relative group">
            <button
              onClick={() => {
                if (t.isPro && !isProUser) {
                  addSystemNotification("Pro Feature", "This template is exclusively for PRO users.", "feedback");
                  return;
                }
                onChange(t.id);
              }}
              className={cn(
                "relative w-full p-0 rounded-2xl border-2 transition-all overflow-hidden group flex flex-col",
                current === t.id
                  ? "border-emerald-500 ring-2 ring-emerald-500/20"
                  : "border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
              )}
            >
              {/* Visual thumbnail */}
              <div className={cn("w-full aspect-[3/2] flex items-center justify-center relative overflow-hidden", t.dark ? "bg-zinc-950" : "bg-slate-50")}>
                <svg viewBox="0 0 60 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {t.icon}
                </svg>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                {/* Selected checkmark */}
                {current === t.id && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                {/* Pro badge */}
                {t.isPro && !isProUser && (
                  <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">PRO</div>
                )}
              </div>
              {/* Label */}
              <div className={cn("px-2 py-2 text-left", current === t.id ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-white dark:bg-zinc-900")}>
                <p className={cn("text-[9px] font-black uppercase tracking-wider truncate", current === t.id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-zinc-400")}>{t.name}</p>
              </div>
            </button>
            {/* Preview eye button */}
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewModal({ type, templateId: t.id }); }}
              className="absolute bottom-[2.2rem] right-1.5 w-6 h-6 bg-black/70 hover:bg-black/90 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              title="Live Preview"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  // ─── Live Preview Modal ──────────────────────────────────────────
  const LivePreviewModal = () => {
    if (!previewModal) return null;
    const { type, templateId } = previewModal;
    const meta = TEMPLATE_META[type]?.find(t => t.id === templateId);
    const isPro = meta?.isPro ?? false;

    const mockState = {
      ...localState,
      heroTitle: localState.heroTitle || localState.bizName || "Premium Collection",
      heroSubtitle: localState.heroSubtitle || "Crafted for those who value quality and aesthetic above all else.",
      heroButtonText: localState.heroButtonText || "Shop Now",
      aboutUs: localState.aboutUs || "We are a passionate team dedicated to bringing you the finest products with unmatched customer service and same-day delivery options.",
      currency: localState.currency || "₦",
    };

    const SECTION_LABEL: Record<string, string> = {
      hero: "Hero Section",
      catalog: "Catalogue Section",
      about: "About Us Section",
      footer: "Footer Section",
    };

    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={() => setPreviewModal(null)}
      >
        <div
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/5 shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{SECTION_LABEL[type]} Preview</p>
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase">{meta?.name || templateId}</h3>
              {meta?.desc && <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>}
            </div>
            <button
              onClick={() => setPreviewModal(null)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-zinc-900">
            {isPro && !isProUser ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl">🔒</div>
                <h4 className="font-black text-gray-900 dark:text-white uppercase">Pro Template</h4>
                <p className="text-sm text-gray-400 max-w-xs">Upgrade to SwiftLink Pro to unlock this template and 20+ other premium designs.</p>
                <button className="px-6 py-3 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-black/[0.04] dark:border-white/5 shadow-sm bg-white dark:bg-black">
                {/* Render different template previews */}
                {type === "hero" && (
                  <div className="text-xs text-center text-gray-400 py-3 border-b border-black/[0.04] dark:border-white/5">
                    Live preview — hero section with your store settings
                  </div>
                )}
                <div className={cn("p-4", type === "footer" && "bg-white dark:bg-zinc-950")}>
                  <CustomerStorefrontPreview type={type} templateId={templateId} state={mockState as any} />
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.06] dark:border-white/5 shrink-0 bg-white dark:bg-zinc-950">
            <button
              onClick={() => setPreviewModal(null)}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            <button
              disabled={isPro && !isProUser}
              onClick={() => {
                if (isPro && !isProUser) {
                  addSystemNotification("Pro Feature", "This template is exclusively for PRO users.", "feedback");
                  return;
                }
                const fieldMap: Record<"hero" | "catalog" | "about" | "footer", keyof ShopState> = { hero: "heroTemplateId", catalog: "catalogTemplateId", about: "aboutTemplateId", footer: "footerTemplateId" };
                updateLocalState(fieldMap[type], templateId);
                setPreviewModal(null);
              }}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all",
                isPro && !isProUser
                  ? "bg-amber-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 active:scale-95"
              )}
            >
              {isPro && !isProUser ? "🔒 Pro Only" : "✓ Apply Design"}
            </button>
          </div>
        </div>
      </div>
    );
  };


  const randomizePalette = () => {
      const p = PRESET_PALETTES[Math.floor(Math.random() * PRESET_PALETTES.length)];
      setLocalState(prev => ({
          ...prev,
          accentColor: p.accent,
          bgColor: p.bg,
          surfaceColor: p.surface,
          textColor: p.text,
          buttonColor: p.btn
      }));
      setIsDirty(true);
      addToast(`Applied ${p.name} palette!`, "success");
  };

  const randomizeTemplate = (type: "hero" | "catalog" | "about" | "footer") => {
      const templates = TEMPLATE_META[type];
      // Only pick free templates if user is not pro
      const available = templates.filter(t => isProUser || !t.isPro);
      const t = available[Math.floor(Math.random() * available.length)];
      const fieldMap: Record<string, keyof ShopState> = { hero: "heroTemplateId", catalog: "catalogTemplateId", about: "aboutTemplateId", footer: "footerTemplateId" };
      updateLocalState(fieldMap[type], t.id);
      addToast(`Applied ${t.name} template!`, "success");
  };

  return (
    <div className="pb-32 font-sans bg-slate-50/50 dark:bg-black min-h-screen transition-colors duration-300">


      <LivePreviewModal />
      
      {/* FLOATING SAVE BUTTON — CSS only, no mount/unmount = no layout reflow = no keyboard snap */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: `translateX(-50%) translateY(${isDirty ? "0" : "80px"})`,
          opacity: isDirty ? 1 : 0,
          pointerEvents: isDirty ? "auto" : "none",
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          backgroundColor: "#0f172a",
          color: "white",
          borderRadius: "9999px",
          padding: "0.75rem 1.5rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap"
        }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Unsaved Changes</span>
        </div>
        <div style={{ width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.2)" }} />
        <button
          onMouseDown={(e) => { e.preventDefault(); saveChanges(); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all"
        >
          <Save size={14} /> Save Now
        </button>
      </div>

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
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Workspace</h1>
                <p className="text-slate-400 dark:text-zinc-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Manage products, branding, and orders.</p>
            </div>
            <div className="flex justify-center">
                <div className="flex bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    <button className={cn("px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === "store" ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-slate-400")} onClick={() => handleTabChange("store")}>Products</button>
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
                                <StableInput type="text" value={localState.bizName || ""} onChange={(v) => updateLocalState("bizName", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-black text-lg md:text-xl text-slate-900 dark:text-white outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all" placeholder="Elite Fashion" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-[0.2em]">WhatsApp Number</label>
                                <div className="flex gap-3">
                                   <div className="shrink-0">
                                      <CountrySelector 
                                        value={localState.phone?.startsWith('+') ? localState.phone.split(' ')[0] : "+234"} 
                                        onChange={(code: string) => {
                                            const current = localState.phone || "";
                                            const pure = current.replace(/^\+\d+\s?/, "");
                                            updateLocalState("phone", `${code} ${pure}`);
                                        }} 
                                      />
                                   </div>
                                   <StableInput type="tel" value={localState.phone?.replace(/^\+\d+\s?/, "") || ""} onChange={(v) => {
                                       const code = localState.phone?.startsWith('+') ? localState.phone.split(' ')[0] : "+234";
                                       updateLocalState("phone", `${code} ${v}`);
                                   }} className="flex-1 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-5 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all" placeholder="808 000 0000" />
                                </div>
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
                            <StableTextarea value={localState.aboutUs || localState.bio || ""} onChange={(v) => { updateLocalState("aboutUs", v); updateLocalState("bio", v); }} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 dark:text-zinc-400 outline-none h-28 border border-slate-100 dark:border-white/5 resize-none transition-all focus:border-emerald-500" placeholder="Tell your customers who you are..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 ml-1"><Mail size={12} /> Contact Email</label>
                                <StableInput type="email" value={localState.contactEmail || ""} onChange={(v) => updateLocalState("contactEmail", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500" placeholder="hello@brand.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 ml-1"><MapPin size={12} /> Address</label>
                                <StableInput type="text" value={localState.contactAddress || ""} onChange={(v) => updateLocalState("contactAddress", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500" placeholder="Lagos, Nigeria" />
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
                                    <StableInput type="url" value={(localState.socials as any)?.[key] || ""} onChange={(v) => updateLocalState("socials", { ...(localState.socials || {}), [key]: v })} className="flex-1 bg-transparent text-sm font-bold text-slate-600 dark:text-zinc-400 outline-none placeholder:text-slate-300" placeholder={placeholder} />
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
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <label className="w-full sm:w-auto text-slate-900 dark:text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 hover:dark:bg-emerald-800/50 cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-700">
                            <Sparkles size={16} className="text-emerald-500" /> Smart Add
                            <input type="file" multiple accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                                if (!e.target.files?.length) return;
                                const files = Array.from(e.target.files);
                                const currentPlan = globalState.plan || "free";
                                const maxProducts = (currentPlan === "business" || currentPlan === "pro") ? Infinity : 5;
                                if (localState.products.length + files.length > maxProducts) {
                                    addSystemNotification("Plan Limit Reached", `Your ${currentPlan.toUpperCase()} plan allows a maximum of ${maxProducts} products. Upgrade to add more!`, "feedback");
                                    return;
                                }
                                setIsUploading(true);
                                const newProducts: Product[] = [];
                                for (let i = 0; i < files.length; i++) {
                                    const file = files[i];
                                    const tempId = Date.now() + i;
                                    const url = await uploadImageDirect(file, `products/${tempId}`);
                                    if (url) {
                                        let name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                                        name = name.replace(/\b\w/g, c => c.toUpperCase());
                                        newProducts.push({ 
                                            id: tempId, 
                                            name, 
                                            price: 0, 
                                            description: "", 
                                            image: url, // Set primary image
                                            images: [url], 
                                            outOfStock: false, 
                                            category: "" 
                                        });
                                    }
                                }
                                updateLocalState("products", [...newProducts, ...localState.products]);
                                setIsUploading(false);
                            }} />
                        </label>
                        <button
                            onClick={() => {
                                const currentPlan = globalState.plan || "free";
                                const maxProducts = (currentPlan === "business" || currentPlan === "pro") ? Infinity : 5;
                                if (localState.products.length >= maxProducts) {
                                    addSystemNotification("Plan Limit Reached", `Your ${currentPlan.toUpperCase()} plan allows a maximum of ${maxProducts} products. Upgrade to add more!`, "feedback");
                                    return;
                                }
                                const newP: Product = { id: Date.now(), name: "New Product", price: 0, description: "", image: "", images: [], outOfStock: false };
                                updateLocalState("products", [newP, ...localState.products]);
                            }}
                            className="w-full sm:w-auto text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-3 bg-slate-900 dark:bg-emerald-600"
                        >
                            <Plus size={16} /> New Product Entry
                        </button>
                    </div>
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
                                <StableInput value={p.name || ""} onChange={(v) => updateProductLocal(p.id, "name", v)} className="w-full font-black text-2xl md:text-3xl outline-none bg-transparent text-slate-900 dark:text-white uppercase italic" placeholder="Product Name" />
                                
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

                                <StableTextarea value={p.description || ""} onChange={(v) => updateProductLocal(p.id, "description", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm font-medium text-slate-600 dark:text-zinc-400 outline-none h-24 border border-slate-100 dark:border-white/5 resize-none transition-all focus:border-emerald-500" placeholder="Describe your product..." />

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
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-6 grid grid-cols-2 md:grid-cols-5 gap-6">
                            <StableColorPicker label="Accent Color" value={localState.accentColor || "#10b981"} onChange={(v) => updateLocalState("accentColor", v)} />
                            <StableColorPicker label="Background" value={localState.bgColor || "#f2f2f7"} onChange={(v) => updateLocalState("bgColor", v)} />
                            <StableColorPicker label="Surface/Cards" value={localState.surfaceColor || "#ffffff"} onChange={(v) => updateLocalState("surfaceColor", v)} />
                            <StableColorPicker label="Text Color" value={localState.textColor || "#111827"} onChange={(v) => updateLocalState("textColor", v)} />
                            <StableColorPicker label="Button Color" value={localState.buttonColor || "#10b981"} onChange={(v) => updateLocalState("buttonColor", v)} />
                        </div>
                        <div className="shrink-0 flex items-center pt-4 md:pt-0">
                            <div className="flex flex-col items-center gap-2">
                                <DiceButton onClick={randomizePalette} title="Random Palette" />
                                <span className="text-[8px] font-black uppercase text-slate-400">Randomize</span>
                            </div>
                        </div>
                    </div>
                </Accordion>

                <Accordion id="hero" title="Hero Template" subtitle="Top Banner Design" icon={LayoutTemplate}>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] font-black uppercase text-slate-400">Choose a Layout</p>
                            <DiceButton onClick={() => randomizeTemplate("hero")} title="Random Hero" />
                        </div>
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
                                    <StableInput value={localState.heroTitle || ""} onChange={(v) => updateLocalState("heroTitle", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 font-black text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-white/5" placeholder="Welcome to our store" />
                                    <StableInput value={localState.heroSubtitle || ""} onChange={(v) => updateLocalState("heroSubtitle", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 font-bold text-xs text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-white/5" placeholder="Quality products, delivered" />
                                    <StableInput value={localState.heroButtonText || ""} onChange={(v) => updateLocalState("heroButtonText", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 font-bold text-xs text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-white/5" placeholder="Shop Now" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Accordion>

                <Accordion id="catalog" title="Catalog Template" subtitle="Products Grid Design" icon={LayoutTemplate}>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] font-black uppercase text-slate-400">Choose a Layout</p>
                            <DiceButton onClick={() => randomizeTemplate("catalog")} title="Random Catalog" />
                        </div>
                        <TemplateSelector type="catalog" current={localState.catalogTemplateId || "catalog-1"} onChange={(v) => updateLocalState("catalogTemplateId", v)} />
                    </div>
                </Accordion>

                <Accordion id="about_tpl" title="About Section Style" subtitle="Brand Story Template" icon={LayoutTemplate}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Pick visual layout</p>
                            <DiceButton onClick={() => randomizeTemplate("about")} title="Random About" />
                        </div>
                        <TemplateSelector type="about" current={localState.aboutTemplateId || "about-1"} onChange={(v) => updateLocalState("aboutTemplateId", v)} />
                    </div>
                </Accordion>

                <Accordion id="footer_tpl" title="Footer Template" subtitle="Bottom Area Design" icon={PanelBottom}>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] font-black uppercase text-slate-400">Choose a Layout</p>
                            <DiceButton onClick={() => randomizeTemplate("footer")} title="Random Footer" />
                        </div>
                        <TemplateSelector type="footer" current={localState.footerTemplateId || "footer-1"} onChange={(v) => updateLocalState("footerTemplateId", v)} />
                        <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Footer Content</h4>
                                    <StableInput value={localState.tagline || ""} onChange={(v) => updateLocalState("tagline", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-4 font-bold text-sm text-slate-600 border border-slate-100" placeholder="Premium Products Tagline" />
                                </div>
                    </div>
                </Accordion>

                <Accordion id="seo_settings" title="SEO & Meta Tags" subtitle="Search & Share Preview" icon={Globe}>
                    <div className="space-y-6">
                        <p className="text-[10px] font-black uppercase text-slate-400">Configure how your site looks on Google, WhatsApp, & Twitter</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1">Meta Title (SEO Title)</label>
                                    <StableInput value={localState.seoTitle || ""} onChange={(v) => updateLocalState("seoTitle", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3.5 font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 focus:border-emerald-500 outline-none" placeholder={localState.bizName || "Store name"} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1">Meta Description (Social Sharing)</label>
                                    <StableTextarea value={localState.ogDescription || ""} onChange={(v) => updateLocalState("ogDescription", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3.5 font-bold text-xs text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 focus:border-emerald-500 outline-none h-24 resize-none" placeholder="Get the best products at the most affordable prices. Fast WhatsApp orders and quick deliveries." />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1">Meta Share Image (OG Image)</label>
                                <label className="block w-full h-40 bg-slate-50 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 overflow-hidden relative">
                                    {localState.ogImage ? (
                                        <img src={localState.ogImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Upload OG/Meta Image</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Recommended: 1200 x 630 px</span>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        if(e.target.files?.[0]) {
                                            const url = await uploadImageDirect(e.target.files[0], "branding");
                                            if (url) updateLocalState("ogImage", url);
                                        }
                                    }} />
                                </label>
                            </div>
                        </div>
                    </div>
                </Accordion>
                
                <section className="bg-white dark:bg-black rounded-[3rem] p-8 md:p-10 shadow-sm border border-red-100 dark:border-red-900/30 space-y-6 mt-10">
                    <div className="px-2">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-red-500 dark:text-red-400">Danger Zone</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mt-1">Transfer ownership of this store to another user via email. They must be registered on SwiftLink.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 px-2">
                        <StableInput type="email" placeholder="New owner's email address" value={(window as any)._transferEmail || ""} onChange={(v) => { (window as any)._transferEmail = v; }} className="w-full md:flex-1 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 font-bold text-sm text-slate-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 focus:border-red-500" />
                        <button onClick={async () => {
                            const email = (window as any)._transferEmail;
                            if (!email) return addToast("Please enter an email", "error");
                            if (confirm(`Are you SURE you want to transfer this store to ${email}? You will lose access immediately.`)) {
                                const success = await transferStore(email);
                                if (success) {
                                    (window as any)._transferEmail = "";
                                }
                            }
                        }} className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 whitespace-nowrap">
                            Transfer Store
                        </button>
                    </div>
                </section>
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
                        <div className="space-y-6">
                            {reviews.map((r) => {
                                const revComments = comments[r.id] || [];
                                return (
                                    <div key={r.id} className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-4">
                                        <div className="flex items-start justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-inner">
                                                    {r.author_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{r.author_name}</p>
                                                    <p className="text-[9px] text-slate-400 mt-0.5">
                                                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Stars */}
                                            <div className="flex gap-0.5 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={10} className={i < (r.rating || 5) ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Message */}
                                        <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed pl-1">
                                            {r.message}
                                        </p>

                                        {/* Existing Replies */}
                                        {revComments.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3 pl-4 md:pl-8">
                                                {revComments.map((c) => (
                                                    <div key={c.id} className="bg-white dark:bg-black/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <h5 className="font-black text-[10px] text-slate-900 dark:text-white uppercase">{c.author_name}</h5>
                                                            <span className="text-[7px] font-black uppercase text-white bg-emerald-500 px-1 rounded">Store Owner</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold pl-3">{c.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reply Box */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex gap-3 max-w-xl">
                                            <input 
                                                type="text" 
                                                value={replyInputs[r.id] || ""} 
                                                onChange={(e) => setReplyInputs(prev => ({ ...prev, [r.id]: e.target.value }))} 
                                                placeholder="Write an official reply..." 
                                                className="flex-1 bg-white dark:bg-black p-3.5 rounded-xl text-xs font-medium dark:text-white outline-none border border-slate-100 dark:border-white/5 focus:border-emerald-500 transition-all"
                                            />
                                            <button 
                                                onClick={() => submitReply(r.id)} 
                                                disabled={!replyInputs[r.id]?.trim()}
                                                className="px-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-102 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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
