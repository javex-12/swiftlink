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
  Dices, Eye
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

function StableInput({ value, onChange, className, placeholder, type = "text" }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
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

  const { state: globalState, updateState, saveFullState, addSystemNotification, addToast, user, stores, switchStore, createNewStore, transferStore, addProduct, removeProduct } = useSwiftLink();

  const [localState, setLocalState] = useState<ShopState>(globalState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setLocalState(globalState);
    }
  }, [globalState.id]);

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
        setComments(prev => ({ ...prev, [reviewId]: [...(prev[reviewId] || []), data] }));
        setReplyInputs(prev => ({ ...prev, [reviewId]: "" }));
        addToast("Reply posted successfully!", "success");
    }
  };

  const updateProductLocal = (id: number, field: keyof Product, value: any) => {
    setLocalState(prev => ({
      ...prev,
      products: prev.products.map(p => {
          if (p.id === id) {
              const updated = { ...p, [field]: value };
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

  const applyTheme = (theme: "lumina" | "void") => {
      if (theme === "lumina") {
          setLocalState(prev => ({
              ...prev,
              accentColor: "#C85A3F",
              bgColor: "#0A0A0A",
              surfaceColor: "#111111",
              textColor: "#EAEAEA",
              buttonColor: "#C85A3F",
              heroTemplateId: "hero-lumina",
              catalogTemplateId: "catalog-lumina",
              aboutTemplateId: "about-editorial",
              footerTemplateId: "footer-editorial"
          }));
      } else {
          setLocalState(prev => ({
              ...prev,
              accentColor: "#ffffff",
              bgColor: "#000000",
              surfaceColor: "#09090b",
              textColor: "#ffffff",
              buttonColor: "#ffffff",
              heroTemplateId: "hero-void",
              catalogTemplateId: "catalog-void",
              aboutTemplateId: "about-brutalist",
              footerTemplateId: "footer-cinema"
          }));
      }
      setIsDirty(true);
      addToast(`Applied ${theme.toUpperCase()} theme!`, "success");
  };

  const TEMPLATE_META: Record<string, { id: string; name: string; desc: string; dark: boolean; isPro: boolean; icon: React.ReactNode }[]> = {
    hero: [
      { id:"hero-1",  name:"OLED Minimal",    desc:"Dark glass with glowing animations",       dark:true,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#050505"/> },
      { id:"hero-lumina",  name:"Lumina Luxe",    desc:"Editorial serif with heavy shadows",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#0A0A0A"/> },
      { id:"hero-void",  name:"Void Story",    desc:"Monospaced glitch depth tunnel",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#000"/> },
      { id:"hero-tokyo",  name:"Tokyo Night",    desc:"Neon blue/pink gradients",       dark:true,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#000"/> },
      { id:"hero-brutalist",  name:"Raw Brutalist",    desc:"Heavy black borders",       dark:false,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#F0F0F0"/> },
      { id:"hero-glass",  name:"Glass Float",    desc:"Translucent cards",       dark:true,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#0f172a"/> },
      { id:"hero-split",  name:"Split Minimal",    desc:"Contrast image/text split",       dark:false,  isPro:false, icon:<><rect x="0" y="0" width="30" height="40" fill="black"/><rect x="30" y="0" width="30" height="40" fill="#ddd"/></> },
      { id:"hero-vogue",  name:"Editorial V",    desc:"Clean high-fashion look",       dark:false,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#f9f9f9"/> },
      { id:"hero-9",  name:"Wave Mesh 3D",    desc:"Animated wireframe wave canvas",      dark:true,  isPro:true,  icon:<rect x="0" y="0" width="60" height="40" fill="#050811"/> },
      { id:"hero-10", name:"Neon Rings 3D",   desc:"Cyber neon ring tunnel",           dark:true,  isPro:true,  icon:<rect x="0" y="0" width="60" height="40" fill="#0a000f"/> },
      { id:"hero-midnight",  name:"Midnight Luxe",    desc:"Deep navy blue glow",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#020617"/> },
      { id:"hero-solaris",  name:"Solar Flare",    desc:"High-energy solar amber",       dark:false,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#FFFbeb"/> },
      { id:"hero-quartz",  name:"Quartz Minimal",    desc:"Framed minimal clean layout",       dark:false,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="white"/> },
      { id:"hero-velocity",  name:"High Velocity",    desc:"Speed lines black",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="black"/> },
      { id:"hero-mono",  name:"Mono Focus",    desc:"Product-first dark",       dark:true,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#111"/> },
      { id:"hero-art",  name:"Chaos Art",    desc:"Blurry artistic gradients",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#000"/> },
      { id:"hero-tech",  name:"Equipment",    desc:"Tech grid interface",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#050505"/> },
      { id:"hero-nature",  name:"Organic Root",    desc:"Earthy tones split",       dark:false,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#E8E8E1"/> },
      { id:"hero-slate",  name:"Slate Work",    desc:"Professional dark layout",       dark:true,  isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#0f172a"/> },
      { id:"hero-infinite",  name:"Forward",    desc:"Dynamic mesh text focus",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#000"/> },
      { id:"hero-bento",  name:"Bento Box",    desc:"Modular marketplace grid",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#111"/> },
      { id:"hero-typo",  name:"Typo Chaos",    desc:"Oversized typography",       dark:false,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="white"/> },
      { id:"hero-modernist",  name:"Modernist",    desc:"Bauhaus inspired clean",       dark:false,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#E5E5E5"/> },
      { id:"hero-velvet",  name:"Velvet Dark",    desc:"Deep rose luxury",       dark:true,  isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#1a0b0b"/> },
    ],
    catalog: [
      { id:"catalog-1",  name:"Clean Grid",      desc:"Classic product grid",          dark:false, isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#f8f8f8"/> },
      { id:"catalog-lumina",  name:"Editorial Luxe",   desc:"Heavy shadows serif list",     dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#0A0A0A"/> },
      { id:"catalog-void",  name:"Glitch Matrix",   desc:"Mono grayscale grid",     dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#000"/> },
      { id:"catalog-2",  name:"Magazine List",   desc:"Horizontal list format",     dark:false, isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#white"/> },
      { id:"catalog-10", name:"Raw Brutalist",       desc:"Bold black borders",           dark:false, isPro:true,  icon:<rect x="0" y="0" width="60" height="40" fill="#fffbeb"/> },
      { id:"catalog-masonry", name:"Masonry",      desc:"Asymmetric masonry",          dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#f1f5f9"/> },
      { id:"catalog-spec", name:"Spec Sheet",      desc:"Detailed table list",          dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="white"/> },
      { id:"catalog-glass", name:"Floating Glass",      desc:"Glassmorphic cards",          dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#0f172a"/> },
      { id:"catalog-scroll", name:"Focus Scroll",      desc:"Horizontal scroll focus",          dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#f8fafc"/> },
      { id:"catalog-bauhaus", name:"Bauhaus Block",      desc:"Clean border grid",          dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#e5e5e5"/> },
      { id:"catalog-vertical", name:"Cinema Vertical",      desc:"Full-width cinema list",          dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#111"/> },
      { id:"catalog-aurora", name:"Aurora Glass",      desc:"Pulsing colorful glass",          dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#1e1b4b"/> },
    ],
    about: [
      { id:"about-1",  name:"Story Card",    desc:"Clean typography card",         dark:false, isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="white"/> },
      { id:"about-brutalist",  name:"The Mission",  desc:"Heavy borders bold type",       dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="black"/> },
      { id:"about-editorial",  name:"Editorial Split",  desc:"High-fashion split",       dark:false, isPro:true, icon:<rect x="0" y="0" width="30" height="40" fill="#111"/><rect x="30" y="0" width="30" height="40" fill="#white"/> },
      { id:"about-quote",  name:"Center Quote",  desc:"Massive brand quote",       dark:false, isPro:false, icon:<rect x="10" y="15" width="40" height="10" fill="#eee"/> },
      { id:"about-pillars",  name:"Grid Pillars",  desc:"3 column core values",       dark:false, isPro:true, icon:<rect x="5" y="10" width="15" height="20" fill="#f8f8f8"/><rect x="22.5" y="10" width="15" height="20" fill="#f8f8f8"/><rect x="40" y="10" width="15" height="20" fill="#f8f8f8"/> },
      { id:"about-tech",  name:"Cyber Block",  desc:"Terminal manifesto",       dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="black"/><rect x="5" y="5" width="50" height="1" fill="#10b981"/> },
      { id:"about-industrial",  name:"Build Log",  desc:"Heavy border industrial",       dark:false, isPro:true, icon:<rect x="5" y="5" width="50" height="30" fill="none" stroke="black" strokeWidth="2"/> },
    ],
    footer: [
      { id:"footer-1",  name:"Branded Card",   desc:"Accent branded footer",   dark:false, isPro:false, icon:<rect x="0" y="0" width="60" height="40" fill="#f8f8f8"/> },
      { id:"footer-cinema",  name:"Cinema Wide",   desc:"Massive typography wide",   dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="black"/> },
      { id:"footer-brutalist",  name:"Brutalist Log",   desc:"Heavy black strip",   dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="10" fill="black"/> },
      { id:"footer-glass",  name:"Glass Float",   desc:"Frosted floating bar",   dark:true, isPro:true, icon:<rect x="10" y="25" width="40" height="10" rx="5" fill="white" fillOpacity="0.1"/> },
      { id:"footer-tech",  name:"Telemetry",   desc:"Tech data stream",   dark:true, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#050505"/> },
      { id:"footer-editorial",  name:"Signature",   desc:"Serif editorial signoff",   dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="white"/> },
      { id:"footer-bauhaus",  name:"Bauhaus Bold",   desc:"Heavy block bauhaus",   dark:false, isPro:true, icon:<rect x="0" y="0" width="60" height="40" fill="#e5e5e5"/> },
    ],
  };

  const [previewModal, setPreviewModal] = React.useState<{ type: "hero" | "catalog" | "about" | "footer"; templateId: string } | null>(null);

  const TemplateSelector = ({ type, current, onChange }: { type: "hero" | "catalog" | "about" | "footer"; current: string; onChange: (v: string) => void }) => {
    const templates = TEMPLATE_META[type] || [];
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {templates.map(t => (
          <div key={t.id} className="relative group">
            <button onClick={() => { if (t.isPro && !isProUser) { addSystemNotification("Pro Template", "Upgrade to unlock this design.", "feedback"); return; } onChange(t.id); }} className={cn("relative w-full p-0 rounded-2xl border-2 transition-all overflow-hidden flex flex-col", current === t.id ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-100 dark:border-white/5")}>
              <div className={cn("w-full aspect-[3/2] flex items-center justify-center relative overflow-hidden", t.dark ? "bg-zinc-950" : "bg-slate-50")}>
                <svg viewBox="0 0 60 40" className="w-full h-full">{t.icon}</svg>
                {t.isPro && !isProUser && <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">PRO</div>}
              </div>
              <div className="px-2 py-2 text-left bg-white dark:bg-zinc-900"><p className="text-[9px] font-black uppercase tracking-wider truncate">{t.name}</p></div>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setPreviewModal({ type, templateId: t.id }); }} className="absolute bottom-[2.2rem] right-1.5 w-6 h-6 bg-black/70 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"><Eye size={11} /></button>
          </div>
        ))}
      </div>
    );
  };

  const LivePreviewModal = () => {
    if (!previewModal) return null;
    const { type, templateId } = previewModal;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setPreviewModal(null)}>
        <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-8 py-6 border-b dark:border-white/5">
            <div><p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{type} Preview</p><h3 className="text-xl font-black dark:text-white uppercase italic">{templateId}</h3></div>
            <button onClick={() => setPreviewModal(null)} className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-zinc-900">
            <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-white dark:bg-black">
                <CustomerStorefrontPreview type={type} templateId={templateId} state={localState} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Accordion = ({ id, title, icon: Icon, subtitle, children }: { id: string, title: string, icon: any, subtitle?: string, children: React.ReactNode }) => {
      const isOpen = expandedSection === id;
      return (
          <div className={cn("bg-white dark:bg-black rounded-[2rem] border transition-all duration-300 mb-4 overflow-hidden", isOpen ? "border-slate-200 dark:border-white/10 shadow-lg" : "border-slate-100 dark:border-white/5")}>
              <button className="w-full px-6 py-5 flex items-center justify-between" onClick={() => setExpandedSection(isOpen ? "" : id)}>
                  <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", isOpen ? "bg-slate-900 dark:bg-white text-white dark:text-black" : "bg-slate-100 dark:bg-zinc-900 text-slate-400")}>
                          <Icon size={24} />
                      </div>
                      <div className="text-left"><h3 className="font-black text-sm uppercase dark:text-white">{title}</h3>{subtitle && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>}</div>
                  </div>
                  <Plus className={cn("transition-transform duration-300", isOpen && "rotate-[135deg]")} />
              </button>
              <div className={cn("transition-all duration-300 overflow-hidden", isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0")}>
                  <div className="p-8 pt-0 border-t dark:border-white/5">{children}</div>
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
      const available = templates.filter(t => isProUser || !t.isPro);
      const t = available[Math.floor(Math.random() * available.length)];
      const fieldMap: Record<string, keyof ShopState> = { hero: "heroTemplateId", catalog: "catalogTemplateId", about: "aboutTemplateId", footer: "footerTemplateId" };
      updateLocalState(fieldMap[type], t.id);
      addToast(`Applied ${t.name} template!`, "success");
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
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

  return (
    <div className="pb-32 bg-slate-50/50 dark:bg-black min-h-screen">
      <LivePreviewModal />
      <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: `translateX(-50%) translateY(${isDirty ? "0" : "80px"})`, opacity: isDirty ? 1 : 0, transition: "all 0.3s", zIndex: 100 }} className="flex items-center gap-4 bg-slate-900 text-white rounded-full px-8 py-4 shadow-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest">Unsaved Changes</span>
          <button onClick={saveChanges} className="bg-emerald-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase hover:bg-emerald-400">Save Now</button>
      </div>

      <main className="max-w-7xl mx-auto space-y-10 px-4 pt-10">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm border dark:border-white/5">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xl shadow-emerald-500/20"><Store size={28} /></div>
                <div><h3 className="text-lg font-black uppercase dark:text-white italic">{localState.bizName}</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Business Hub</p></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowStoreDropdown(!showStoreDropdown)} className="px-6 py-3 bg-slate-50 dark:bg-black text-slate-400 rounded-xl text-[10px] font-black uppercase hover:text-emerald-500 transition-all flex items-center gap-2">Switch <ChevronDown size={14} /></button>
                <button onClick={() => window.open(`${window.location.origin}${getShopPath(localState)}`, "_blank")} className="p-4 bg-slate-50 dark:bg-black text-slate-400 rounded-xl hover:text-emerald-500"><ExternalLink size={20} /></button>
            </div>
        </div>

        <div className="flex justify-center">
            <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border dark:border-white/5 shadow-sm">
                {["store", "appearance", "inbox"].map(tab => (
                    <button key={tab} className={cn("px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === tab ? "bg-slate-900 dark:bg-white text-white dark:text-black" : "text-slate-400")} onClick={() => handleTabChange(tab as any)}>{tab}</button>
                ))}
            </div>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === "store" && (
            <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <section className="bg-white dark:bg-black rounded-[3rem] p-10 shadow-sm border dark:border-white/5 space-y-10">
                    <div className="flex flex-col md:flex-row gap-10">
                        <label className="w-40 h-40 rounded-[3rem] bg-slate-50 dark:bg-zinc-900 border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden group transition-all" style={localState.bizImage ? { backgroundImage: `url(${localState.bizImage})`, backgroundSize: 'cover' } : undefined}>
                            {!localState.bizImage && !isUploading && <Plus size={40} className="text-slate-200" />}
                            {isUploading && <RefreshCw size={40} className="text-emerald-500 animate-spin" />}
                            <input type="file" className="hidden" onChange={async (e) => { if(e.target.files?.[0]) { const url = await uploadImageDirect(e.target.files[0], "branding"); if(url) updateLocalState("bizImage", url); } }} />
                        </label>
                        <div className="flex-1 space-y-6">
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand Name</label><StableInput value={localState.bizName || ""} onChange={(v) => updateLocalState("bizName", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 font-black text-2xl uppercase italic outline-none border dark:border-white/5 focus:border-emerald-500" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp</label><StableInput value={localState.phone || ""} onChange={(v) => updateLocalState("phone", v)} className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 font-bold outline-none border dark:border-white/5" /></div>
                        </div>
                    </div>
                </section>
                
                {/* Product Manager */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <h2 className="text-3xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">Products</h2>
                        <button onClick={addProduct} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"><Plus size={16} /> New Entry</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {localState.products.map(p => (
                            <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-white/5 shadow-sm relative group">
                                <button onClick={() => removeProduct(p.id)} className="absolute top-4 right-4 p-3 bg-slate-50 dark:bg-black rounded-xl text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                <div className="flex gap-6">
                                    <label className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-black border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden shrink-0" style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover' } : undefined}>
                                        {!p.image && <Plus size={20} className="text-slate-200" />}
                                        <input type="file" className="hidden" onChange={async (e) => { if(e.target.files?.[0]) { const url = await uploadImageDirect(e.target.files[0], `products/${p.id}`); if(url) updateProductLocal(p.id, "image", url); } }} />
                                    </label>
                                    <div className="flex-1 space-y-4">
                                        <StableInput value={p.name} onChange={(v) => updateProductLocal(p.id, "name", v)} className="w-full font-black uppercase italic dark:text-white bg-transparent outline-none border-b border-transparent focus:border-emerald-500" placeholder="Item Name" />
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black px-4 py-2 rounded-xl border dark:border-white/5"><span className="text-slate-400 font-bold">{localState.currency}</span><input type="number" value={p.price || ''} onChange={(e) => updateProductLocal(p.id, "price", Number(e.target.value))} className="bg-transparent font-black dark:text-white outline-none w-full text-sm" /></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </motion.div>
        )}

        {activeTab === "appearance" && (
            <motion.div key="design" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <Accordion id="themes" title="Elite Themes" subtitle="Full Brand Presets" icon={Sparkles}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => applyTheme("lumina")} className="group relative overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-10 text-left transition-all hover:border-[#C85A3F] bg-black">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C85A3F]/20 blur-3xl group-hover:scale-150 transition-transform" />
                            <h4 className="text-2xl font-serif italic text-white mb-2">Lumina Luxe</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Boutique Architectural Design.</p>
                        </button>
                        <button onClick={() => applyTheme("void")} className="group relative overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-10 text-left transition-all hover:border-white bg-black">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl group-hover:scale-150 transition-transform" />
                            <h4 className="text-2xl font-mono text-white mb-2 uppercase tracking-tighter">Void Cinematic</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Monospaced Glitch Depth.</p>
                        </button>
                    </div>
                </Accordion>
                <Accordion id="hero" title="Store Layout" subtitle="24 Design Templates" icon={LayoutTemplate}>
                    <TemplateSelector type="hero" current={localState.heroTemplateId || "hero-1"} onChange={(v) => updateLocalState("heroTemplateId", v)} />
                </Accordion>
                <Accordion id="catalog" title="Product Grid" subtitle="Immersive Gallery Views" icon={Layout}>
                    <TemplateSelector type="catalog" current={localState.catalogTemplateId || "catalog-1"} onChange={(v) => updateLocalState("catalogTemplateId", v)} />
                </Accordion>
                <Accordion id="about_tpl" title="About Section" subtitle="Brand Story Presets" icon={LayoutTemplate}>
                    <TemplateSelector type="about" current={localState.aboutTemplateId || "about-1"} onChange={(v) => updateLocalState("aboutTemplateId", v)} />
                </Accordion>
                <Accordion id="footer_tpl" title="Footer Section" subtitle="Bottom Area Styles" icon={PanelBottom}>
                    <TemplateSelector type="footer" current={localState.footerTemplateId || "footer-1"} onChange={(v) => updateLocalState("footerTemplateId", v)} />
                </Accordion>
                <Accordion id="visual" title="Design System" subtitle="Global Colors" icon={Palette}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <StableColorPicker label="Accent" value={localState.accentColor || "#10b981"} onChange={(v) => updateLocalState("accentColor", v)} />
                        <StableColorPicker label="Background" value={localState.bgColor || "#f2f2f7"} onChange={(v) => updateLocalState("bgColor", v)} />
                        <StableColorPicker label="Surface" value={localState.surfaceColor || "#ffffff"} onChange={(v) => updateLocalState("surfaceColor", v)} />
                        <StableColorPicker label="Text" value={localState.textColor || "#111827"} onChange={(v) => updateLocalState("textColor", v)} />
                        <div className="flex flex-col items-center justify-center"><DiceButton onClick={randomizePalette} /><span className="text-[8px] font-black uppercase text-slate-400 mt-2">Random</span></div>
                    </div>
                </Accordion>
            </motion.div>
        )}
      </main>
    </div>
  );
}
