"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  Globe,
  Layout,
  MessageSquareQuote,
  Palette,
  Plus,
  ShoppingCart,
  Sparkles,
  Type,
  X,
  Smartphone,
  Monitor,
  Tablet,
  Code2,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  type LucideIcon,
} from "lucide-react";
import { CustomerStorefront } from "./CustomerStorefront";
import type { PageSection, SectionType } from "@/lib/schema";

type GalleryType = Extract<SectionType, "hero" | "catalog" | "about" | "testimonials">;

type SectionTemplate = {
  id: string;
  name: string;
  type: GalleryType;
  title: string;
  subtitle?: string;
  content?: Record<string, any>;
  styles?: React.CSSProperties;
  preview?: string;
};

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
  "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600",
  "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=600",
  "https://images.unsplash.com/photo-1506629905607-d9c297d0a8a6?w=600",
];

const HERO_TEMPLATES: SectionTemplate[] = [
  {
    id: "hero-3d",
    type: "hero",
    name: "3D Ambient",
    title: "The New Standard",
    subtitle: "Experience the world's most powerful WhatsApp storefront.",
    content: { buttonText: "Explore Now", templateId: "hero-3d" },
    preview: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80", // Placeholder, we'll use a CSS-based icon later
  },
  {
    id: "hero-warp",
    type: "hero",
    name: "Warp Grid",
    title: "Scale at Speed",
    subtitle: "High-velocity commerce for the modern brand.",
    content: { buttonText: "Start Shopping", templateId: "hero-warp" },
    preview: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&q=80",
  },
  {
    id: "hero-1",
    type: "hero",
    name: "Spotlight",
    title: "The New Collection",
    subtitle: "Curated products selected for quality without the wait.",
    content: { buttonText: "Shop Now", image: HERO_IMAGES[0], templateId: "hero-1" },
    preview: HERO_IMAGES[0],
  },
  {
    id: "hero-2",
    type: "hero",
    name: "Editorial",
    title: "Built for Style",
    content: { buttonText: "Browse", image: HERO_IMAGES[1], templateId: "hero-2" },
    preview: HERO_IMAGES[1],
  },
];

const templates: Record<GalleryType, SectionTemplate[]> = {
  hero: HERO_TEMPLATES,
  catalog: Array.from({ length: 10 }, (_, i) => ({
    id: `catalog-${i + 1}`,
    type: "catalog",
    name: [
      "Clean Grid",
      "Featured Collection",
      "Compact Shop",
      "Luxury Cards",
      "Sale Rack",
      "Category Focus",
      "New In",
      "Best Sellers",
      "Wide Browse",
      "Simple Shelf",
    ][i],
    title: [
      "Our Collection",
      "Featured Products",
      "Quick Shop",
      "Premium Picks",
      "Sale Items",
      "Category Highlights",
      "New In Store",
      "Best Sellers",
      "Browse Everything",
      "Product Shelf",
    ][i],
    content: { templateId: `catalog-${i + 1}` },
    styles: {
      backgroundColor: ["#ffffff", "#f8fafc", "#f5f5f4", "#fafaf9", "#fff7ed", "#f0fdf4", "#f8fafc", "#fefce8", "#f5f3ff", "#ffffff"][i],
      borderRadius: ["24px", "18px", "10px", "30px", "16px", "22px", "14px", "28px", "20px", "8px"][i],
      padding: ["0px", "20px", "14px", "24px", "18px", "20px", "16px", "24px", "18px", "12px"][i],
    },
  })),
  about: Array.from({ length: 10 }, (_, i) => ({
    id: `about-${i + 1}`,
    type: "about",
    name: [
      "Brand Story",
      "Founder Note",
      "Quality Promise",
      "Local Store",
      "Fast Delivery",
      "Why Us",
      "Materials",
      "Customer Care",
      "Mission",
      "Trust Block",
    ][i],
    title: [
      "About Our Store",
      "A Note From Us",
      "Our Quality Promise",
      "Local, Reliable, Ready",
      "Delivery You Can Count On",
      "Why Customers Choose Us",
      "Made With Care",
      "Support That Responds",
      "Our Mission",
      "Shop With Confidence",
    ][i],
    content: {
      text: [
        "We curate practical, stylish products and keep the shopping experience direct, clear, and fast.",
        "This store was built around real customer conversations, quick response times, and products we can stand behind.",
        "Every product is selected with attention to finish, usability, and value.",
        "We serve our customers with simple ordering, clear communication, and dependable fulfillment.",
        "From checkout to dispatch, we keep your order moving and your updates easy to follow.",
        "Customers come back because the process is simple, the catalog is clear, and support is human.",
        "We pay attention to materials, fit, texture, and details that matter in daily use.",
        "Questions, sizing, availability, and delivery updates are handled quickly through WhatsApp.",
        "Our goal is to make online shopping feel as direct as buying from someone you trust.",
        "Clear products, clear prices, and clear delivery updates. That is the standard.",
      ][i],
    },
    styles: {
      backgroundColor: ["#ffffff", "#f8fafc", "#111827", "#ecfdf5", "#fef3c7", "#f5f3ff", "#f7fee7", "#f0f9ff", "#fff1f2", "#fafaf9"][i],
      color: i === 2 ? "#ffffff" : undefined,
      borderRadius: ["24px", "16px", "30px", "18px", "12px", "28px", "20px", "22px", "14px", "8px"][i],
    },
  })),
  testimonials: Array.from({ length: 10 }, (_, i) => ({
    id: `testimonials-${i + 1}`,
    type: "testimonials",
    name: [
      "Social Proof",
      "Happy Buyers",
      "Review Grid",
      "Premium Quotes",
      "Trust Notes",
      "Repeat Buyers",
      "Delivery Reviews",
      "Style Feedback",
      "Short Praise",
      "Community Picks",
    ][i],
    title: [
      "What Customers Say",
      "Happy Buyers",
      "Real Reviews",
      "Customer Notes",
      "Trusted By Shoppers",
      "Why They Return",
      "Delivery Feedback",
      "Style Reviews",
      "Quick Praise",
      "Community Favorites",
    ][i],
    content: {
      items: [
        { quote: "Ordering was easy and the product looked exactly like the photos.", author: "Ada" },
        { quote: "Fast response, clear updates, and smooth delivery.", author: "Timi" },
        { quote: "The quality is solid. I came back for another order.", author: "Mariam" },
        { quote: "Simple checkout and no confusing back and forth.", author: "David" },
      ],
      templateId: `testimonials-${i + 1}`,
    },
    styles: {
      backgroundColor: ["transparent", "#f8fafc", "#f0fdf4", "#111827", "#fefce8", "#f5f3ff", "#fff7ed", "#eff6ff", "#fdf2f8", "#ffffff"][i],
      color: i === 3 ? "#ffffff" : undefined,
      borderRadius: ["0px", "20px", "24px", "30px", "16px", "28px", "18px", "12px", "22px", "8px"][i],
      padding: i === 0 ? undefined : "24px",
    },
  })),
};

const galleryTypes: { type: GalleryType; label: string; icon: LucideIcon }[] = [
  { type: "hero", label: "Hero", icon: Layout },
  { type: "catalog", label: "Catalog", icon: ShoppingCart },
  { type: "about", label: "About", icon: BookOpen },
  { type: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
];

function sectionIcon(type: SectionType) {
  if (type === "hero") return Layout;
  if (type === "catalog") return ShoppingCart;
  if (type === "about") return BookOpen;
  if (type === "testimonials") return MessageSquareQuote;
  return Layout;
}

function isGalleryType(type: SectionType): type is GalleryType {
  return type === "hero" || type === "catalog" || type === "about" || type === "testimonials";
}

export function VisualEditor({ onClose }: { onClose: () => void }) {
  const { state, updateState, saveFullState, addToast } = useSwiftLink();
  const [history, setHistory] = useState<typeof state.sections[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const pushHistory = (sections: typeof state.sections) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), sections].slice(-10));
    setHistoryIdx(prev => Math.min(prev + 1, 9));
  };

  const handlePublish = () => {
    saveFullState(state);
    addToast('Store published successfully!', 'success');
  };
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState<GalleryType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const canvasRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleResize = () => {
          if (previewDevice === "mobile") {
              const availableHeight = window.innerHeight - 200; // Account for toolbar and padding
              const scale = Math.min(availableHeight / 850, 1);
              setCanvasScale(scale);
          } else {
              setCanvasScale(1);
          }
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [previewDevice]);
  

  const sections = [...(state.sections || [])].sort((a, b) => a.order - b.order);
  const selected = sections.find((section) => section.id === selectedSection) || null;

  const applyTemplate = (template: SectionTemplate) => {
    const nextSection: PageSection = {
      id: selectedSection || `section-${Date.now()}`,
      type: template.type,
      title: template.title,
      subtitle: template.subtitle,
      isVisible: true,
      order: selectedSection ? (selected?.order ?? sections.length) : sections.length,
      content: template.content || {},
      styles: template.styles || {},
    };

    if (selectedSection) {
      updateState("sections", sections.map((section) => (section.id === selectedSection ? nextSection : section)));
    } else {
      updateState("sections", [...sections, nextSection]);
      setSelectedSection(nextSection.id);
    }
    setShowGallery(null);
  };

  const moveSection = (id: string, dir: "up" | "down") => {
    const idx = sections.findIndex((section) => section.id === id);
    if (idx === -1) return;
    const nextIdx = dir === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= sections.length) return;
    const nextSections = [...sections];
    const currentOrder = nextSections[idx].order;
    nextSections[idx].order = nextSections[nextIdx].order;
    nextSections[nextIdx].order = currentOrder;
    updateState("sections", nextSections);
  };

  const patchSection = (id: string, patch: Record<string, any>) => {
    updateState("sections", sections.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const duplicateSection = (id: string) => {
    const source = sections.find((section) => section.id === id);
    if (!source || source.type === "custom_code") return;
    updateState("sections", [
      ...sections,
      { ...source, id: `section-${Date.now()}`, title: `${source.title || source.type} Copy`, order: sections.length },
    ]);
  };

  const deleteSection = async (id: string) => {
    const ok = await (window as any).customConfirm("Delete section?", "This removes the section from the visual canvas.");
    if (ok) updateState("sections", sections.filter((section) => section.id !== id).map((section, order) => ({ ...section, order })));
  };

  const handleSectionAction = (id: string, action: string) => {
    const section = sections.find((item) => item.id === id);
    setSelectedSection(id);
    if (action === "move-up") moveSection(id, "up");
    if (action === "move-down") moveSection(id, "down");
    if (action === "duplicate") duplicateSection(id);
    if (action === "delete") void deleteSection(id);
    if (action === "change-type") setShowGallery(section && isGalleryType(section.type) ? section.type : "hero");
  };

  const [mobileTab, setMobileTab] = useState<"layers" | "edit" | "gallery">("layers");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-black"
    >
      {/* TOP TOOLBAR — always visible */}
      <div className="h-14 w-full flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex p-2 bg-slate-50 dark:bg-black rounded-lg text-slate-400 hover:text-emerald-500 transition-all">
                  <Layout size={16} />
              </button>
              <div className="flex bg-slate-50 dark:bg-black p-1 rounded-lg border border-slate-100 dark:border-white/10">
                  <button onClick={() => setPreviewDevice("mobile")} className={cn("p-1.5 rounded-md transition-all", previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-400")} title="Mobile"><Smartphone size={14} /></button>
                  <button onClick={() => setPreviewDevice("desktop")} className={cn("p-1.5 rounded-md transition-all", previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-400")} title="Desktop"><Monitor size={14} /></button>
              </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:block">Visual Editor</span>
          <div className="flex items-center gap-2">
              <button onClick={handlePublish} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">Publish</button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
          </div>
      </div>

      {/* DESKTOP LAYOUT: left layers | canvas | right properties */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left: Layers Panel */}
        <motion.div animate={{ width: isSidebarOpen ? 260 : 0 }} className="h-full flex-col border-r border-slate-100 bg-white shadow-xl dark:border-white/5 dark:bg-zinc-900 overflow-hidden flex-shrink-0">
          <div className="w-[260px] flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Layers</p>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto no-scrollbar">
              {sections.map((section) => {
                const Icon = sectionIcon(section.type);
                const isSelected = selectedSection === section.id;
                return (
                  <div key={section.id} onClick={() => setSelectedSection(section.id)}
                    className={cn("rounded-2xl border-2 p-3 cursor-pointer transition-all group",
                      isSelected ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5" : "border-transparent bg-slate-50 dark:bg-black/40 hover:border-slate-200 dark:hover:border-zinc-700"
                    )}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400")}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase truncate dark:text-white">{section.title || section.type}</p>
                        <p className="text-[9px] text-slate-400 uppercase">{section.type}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400"><ChevronUp size={11} /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400"><ChevronDownIcon size={11} /></button>
                        {isGalleryType(section.type) && (
                          <button onClick={(e) => { e.stopPropagation(); setShowGallery(section.type as GalleryType); setSelectedSection(section.id); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-emerald-500"><Sparkles size={11} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => { setSelectedSection(null); setShowGallery("hero"); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-800 transition-all">
                <Plus size={14} /><span className="text-[10px] font-black uppercase">Add Section</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Center: Canvas */}
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-100 dark:bg-zinc-950 overflow-auto">
          <motion.div animate={{ width: previewDevice === "mobile" ? 390 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn("overflow-hidden bg-white dark:bg-black shadow-2xl flex-shrink-0",
              previewDevice === "mobile" ? "rounded-[3rem] border-[10px] border-slate-900 h-[750px]" : "rounded-2xl border-2 border-slate-200 dark:border-white/5 h-full min-h-[500px]"
            )}>
            {previewDevice === "mobile" && <div className="absolute left-1/2 top-0 z-50 flex h-6 w-32 -translate-x-1/2 items-center justify-center rounded-b-3xl bg-slate-900"><div className="h-2 w-2 rounded-full bg-zinc-700" /></div>}
            <div className="no-scrollbar h-full w-full overflow-y-auto pt-8">
              <CustomerStorefront isEditable selectedSectionId={selectedSection} onSectionAction={handleSectionAction} />
            </div>
          </motion.div>
        </div>

        {/* Right: Properties Panel — always visible */}
        <div className="w-[280px] h-full flex-shrink-0 border-l border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Properties</p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {selected && selected.type !== "custom_code" ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Selected</p>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mt-0.5">{selected.type}</h3>
                </div>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400"><Type size={11} /> Title</span>
                  <input value={selected.title || ""} onChange={(e) => patchSection(selected.id, { title: e.target.value })} className="w-full rounded-xl bg-slate-50 dark:bg-black p-3 text-xs font-bold outline-none dark:text-white border-2 border-transparent focus:border-emerald-500/30 transition-all" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">Subtitle / Text</span>
                  <textarea value={selected.subtitle || selected.content?.text || ""} onChange={(e) => patchSection(selected.id, selected.type === "about" ? { content: { ...selected.content, text: e.target.value } } : { subtitle: e.target.value })} className="min-h-[80px] w-full rounded-xl bg-slate-50 dark:bg-black p-3 text-xs font-bold outline-none dark:text-white border-2 border-transparent focus:border-emerald-500/30 transition-all" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-1.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400"><Palette size={9} /> BG</span>
                    <input type="color" value={(selected.styles?.backgroundColor as string) || "#ffffff"} onChange={(e) => patchSection(selected.id, { styles: { ...selected.styles, backgroundColor: e.target.value } })} className="h-10 w-full rounded-xl cursor-pointer" />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">Radius</span>
                    <input value={(selected.styles?.borderRadius as string) || ""} placeholder="24px" onChange={(e) => patchSection(selected.id, { styles: { ...selected.styles, borderRadius: e.target.value } })} className="h-10 w-full rounded-xl bg-slate-50 dark:bg-black px-3 text-[10px] font-bold outline-none dark:text-white border-2 border-transparent focus:border-emerald-500/30 transition-all" />
                  </label>
                </div>
                <label>
                  <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">Font Size</span>
                  <input value={(selected.styles?.fontSize as string) || ""} placeholder="16px" onChange={(e) => patchSection(selected.id, { styles: { ...selected.styles, fontSize: e.target.value } })} className="h-10 w-full rounded-xl bg-slate-50 dark:bg-black px-3 text-[10px] font-bold outline-none dark:text-white border-2 border-transparent focus:border-emerald-500/30 transition-all" />
                </label>
                <div className="flex gap-2 pt-2">
                  {isGalleryType(selected.type) && (
                    <button onClick={() => setShowGallery(selected.type as GalleryType)} className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all">
                      <Sparkles size={12} /> Template
                    </button>
                  )}
                  <button onClick={() => deleteSection(selected.id)} className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-40">
                <Globe size={32} strokeWidth={1} className="text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select a section<br/>to edit properties</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT: canvas on top, bottom sheet tabs */}
      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        {/* Mobile Canvas - scrollable preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-zinc-950">
          <CustomerStorefront isEditable selectedSectionId={selectedSection} onSectionAction={handleSectionAction} />
        </div>

        {/* Mobile Bottom Sheet */}
        <div className="flex-shrink-0 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-white/10 shadow-2xl" style={{ maxHeight: "55vh" }}>
          {/* Tab Bar */}
          <div className="flex border-b border-slate-50 dark:border-white/5">
            {(["layers", "edit", "gallery"] as const).map(tab => (
              <button key={tab} onClick={() => setMobileTab(tab)}
                className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                  mobileTab === tab ? "text-emerald-500 border-b-2 border-emerald-500" : "text-slate-400"
                )}>{tab}</button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto no-scrollbar p-4 space-y-3" style={{ maxHeight: "calc(55vh - 44px)" }}>
            {mobileTab === "layers" && (
              <>
                {sections.map(section => {
                  const Icon = sectionIcon(section.type);
                  return (
                    <div key={section.id} onClick={() => { setSelectedSection(section.id); setMobileTab("edit"); }}
                      className={cn("flex items-center gap-3 p-3 rounded-2xl border-2 transition-all",
                        selectedSection === section.id ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-100 dark:border-white/5"
                      )}>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><Icon size={14} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase truncate dark:text-white">{section.title || section.type}</p>
                        <p className="text-[9px] text-slate-400">{section.type}</p>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { setSelectedSection(null); setShowGallery("hero"); setMobileTab("gallery"); }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">
                  <Plus size={16} /><span className="text-[10px] font-black uppercase">Add Section</span>
                </button>
              </>
            )}

            {mobileTab === "edit" && selected && (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Title</p>
                  <input value={selected.title || ""} onChange={(e) => patchSection(selected.id, { title: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 dark:bg-black p-3 text-xs font-bold outline-none dark:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Text / Subtitle</p>
                  <textarea value={selected.subtitle || selected.content?.text || ""} onChange={(e) => patchSection(selected.id, selected.type === "about" ? { content: { ...selected.content, text: e.target.value } } : { subtitle: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 dark:bg-black p-3 text-xs font-bold outline-none dark:text-white min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">BG Color</p>
                    <input type="color" value={(selected.styles?.backgroundColor as string) || "#ffffff"} onChange={(e) => patchSection(selected.id, { styles: { ...selected.styles, backgroundColor: e.target.value } })}
                      className="h-10 w-full rounded-xl" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Corner Radius</p>
                    <input value={(selected.styles?.borderRadius as string) || ""} placeholder="24px" onChange={(e) => patchSection(selected.id, { styles: { ...selected.styles, borderRadius: e.target.value } })}
                      className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-bold outline-none dark:bg-black dark:text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowGallery(isGalleryType(selected.type) ? selected.type : "hero"); setMobileTab("gallery"); }}
                    className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Sparkles size={14} /> Change Template
                  </button>
                  <button onClick={() => deleteSection(selected.id)} className="p-3 bg-red-50 text-red-500 rounded-xl">
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {mobileTab === "gallery" && showGallery && (
              <>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {galleryTypes.map(({ type, label, icon: Icon }) => (
                    <button key={type} onClick={() => setShowGallery(type)}
                      className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-[8px] font-black uppercase transition-all",
                        showGallery === type ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-100 text-slate-400 dark:border-white/5"
                      )}>
                      <Icon size={16} />{label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {templates[showGallery].map(template => (
                    <button key={template.id} onClick={() => { applyTemplate(template); setMobileTab("layers"); }}
                      className="relative rounded-2xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all aspect-video bg-slate-100">
                      {template.preview && <img src={template.preview} className="w-full h-full object-cover opacity-60" alt="" />}
                      <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-[9px] font-black text-white uppercase">{template.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute bottom-0 right-0 top-0 z-[100] w-full md:w-[28rem] border-l border-slate-100 bg-white/95 backdrop-blur-xl shadow-[-50px_0_100px_rgba(0,0,0,0.1)] dark:border-white/5 dark:bg-zinc-900/95"
          >
            <div className="flex h-full flex-col p-6 md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight dark:text-white">Section Gallery</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Pick a blueprint to start</p>
                </div>
                <button onClick={() => setShowGallery(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="mb-8 grid grid-cols-4 gap-2">
                {galleryTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setShowGallery(type)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-[9px] font-black uppercase tracking-tight transition-all",
                      showGallery === type
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "border-slate-100 text-slate-400 hover:border-slate-300 dark:border-white/5 dark:hover:border-white/10 dark:hover:text-white",
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="no-scrollbar grid flex-1 gap-4 overflow-y-auto pr-1 pb-20">
                {templates[showGallery].map((template) => {
                  const isProTemplate = template.id === 'hero-3d' || template.id === 'hero-warp' || template.id === 'hero-industrial';
                  const isProUser = state.plan === 'pro' || state.plan === 'business';
                  const isLocked = isProTemplate && !isProUser;

                  return (
                  <button
                    key={template.id}
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    onClick={() => !isLocked && applyTemplate(template)}
                    className={cn(
                        "group relative min-h-32 overflow-hidden rounded-[1.5rem] border-2 text-left transition-all hover:shadow-2xl dark:bg-black/40",
                        isLocked ? "opacity-50 cursor-not-allowed border-white/5" : "border-transparent hover:border-emerald-500 hover:scale-[1.02]"
                    )}
                  >
                    {/* SVG THUMBNAIL FOR SPECIAL TEMPLATES */}
                    {template.id === 'hero-3d' ? (
                        <div className="absolute inset-0 bg-[#020617] flex items-center justify-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg rotate-12 flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                        </div>
                    ) : template.id === 'hero-warp' ? (
                        <div className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px]" />
                            <Zap size={24} className="text-emerald-500 relative z-10" />
                        </div>
                    ) : template.preview ? (
                      <img src={template.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 opacity-50" />
                    )}

                    <div className="relative z-10 flex h-full min-h-32 flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6">
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{template.type}</span>
                         {isProTemplate && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded uppercase">Pro</span>}
                      </div>
                      <span className="text-base font-black uppercase text-white tracking-tight">{template.name}</span>
                      <span className="mt-1 text-[10px] font-bold text-white/60 leading-tight line-clamp-1">{template.title}</span>
                    </div>

                    {isLocked && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <Shield size={24} className="text-white/40 mb-2" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Upgrade Required</span>
                        </div>
                    )}

                    {/* LOUPE / ZOOM PREVIEW ON HOVER */}
                    <AnimatePresence>
                        {hoveredTemplate === template.id && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{ opacity: 1, x: -350, scale: 1 }}
                                className="absolute top-0 right-full mr-4 w-[300px] h-[400px] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border-4 border-emerald-500 hidden xl:flex flex-col overflow-hidden pointer-events-none z-[110]"
                            >
                                <div className="p-4 border-b border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-black flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Preview</span>
                                    <Sparkles size={14} className="text-emerald-500" />
                                </div>
                                <div className="flex-1 bg-white dark:bg-black relative overflow-hidden p-4">
                                    {template.preview && <img src={template.preview} className="w-full rounded-xl shadow-lg mb-4" />}
                                    <h4 className="font-black text-sm dark:text-white uppercase mb-1">{template.title}</h4>
                                    <p className="text-[9px] text-slate-400 dark:text-zinc-500 leading-relaxed">{template.subtitle || 'Premium layout optimized for high conversions and clean aesthetic.'}</p>
                                    <div className="mt-6 space-y-2">
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full" />
                                        <div className="h-1.5 w-2/3 bg-slate-100 dark:bg-zinc-800 rounded-full" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </button>
                ))}
                
                {/* Community / Code Hook */}
                <button 
                  onClick={() => setShowGallery(null)}
                  className="w-full h-32 rounded-[1.5rem] border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500 transition-all group"
                >
                  <Code2 className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Browse More Templates</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating panel removed — properties now live in the right sidebar */}
    </motion.div>
  );
}
