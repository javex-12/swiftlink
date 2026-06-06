"use client";

import React, { useState, useRef } from "react";
import { HeroSection } from "./HeroSection";
import { CatalogSection } from "./CatalogSection";
import { EditorContextMenu } from "../EditorContextMenu";
import { AnimatePresence } from "framer-motion";
import type { PageSection, ShopState, Product } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { AboutTemplates } from "@/lib/store-templates";

interface SectionRendererProps {
  sections: PageSection[];
  state: ShopState;
  cart: Record<number, number>;
  updateCart: (id: number, delta: number) => void;
  onProductClick: (p: Product) => void;
  activeCategory: string;
  isEditable?: boolean;
  selectedSectionId?: string | null;
  onSectionAction?: (sectionId: string, action: string) => void;
}

export function SectionRenderer({
  sections,
  state,
  cart,
  updateCart,
  onProductClick,
  activeCategory,
  isEditable = false,
  selectedSectionId,
  onSectionAction
}: SectionRendererProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, section: PageSection } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleContextMenu = (e: React.MouseEvent, section: PageSection) => {
    if (!isEditable) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, section });
  };

  const handleTouchStart = (section: PageSection) => {
    if (!isEditable) return;
    longPressTimer.current = setTimeout(() => {
        setContextMenu({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 150, section });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const sortedSections = [...(sections || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {contextMenu && (
          <EditorContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            section={contextMenu.section} 
            onClose={() => setContextMenu(null)}
            onAction={(action) => {
                onSectionAction?.(contextMenu.section.id, action);
                setContextMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      {sortedSections.map((section) => {
        if (!section.isVisible && !isEditable) return null;

        const content = (
            <div 
              key={section.id}
              onContextMenu={(e) => handleContextMenu(e, section)}
              onTouchStart={() => handleTouchStart(section)}
              onTouchEnd={handleTouchEnd}
              className={cn(
                "relative group/section transition-all",
                isEditable && "cursor-context-menu hover:ring-4 hover:ring-emerald-500/30 rounded-[1.5rem]",
                isEditable && selectedSectionId === section.id && "ring-4 ring-emerald-500/60 rounded-[1.5rem]",
                !section.isVisible && "opacity-40 grayscale"
              )}
            >
                {isEditable && (
                    <div className="absolute top-4 left-4 z-40 opacity-0 group-hover/section:opacity-100 transition-opacity bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg pointer-events-none">
                        Right-Click to Edit {section.type}
                    </div>
                )}
                
                {(() => {
                    const bgColor = state.bgColor || "#ffffff";
                    const textColor = state.textColor || "#111827";
                    
                    const getContrastColor = (hex: string) => {
                        if (!hex) return "#ffffff";
                        const cleanHex = hex.replace('#', '');
                        const r = parseInt(cleanHex.slice(0, 2), 16);
                        const g = parseInt(cleanHex.slice(2, 4), 16);
                        const b = parseInt(cleanHex.slice(4, 6), 16);
                        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                        return (yiq >= 128) ? "#000000" : "#ffffff";
                    };
                    const contrast = getContrastColor(bgColor);

                    switch (section.type) {
                        case "hero":
                            return <HeroSection section={section} state={state} />;
                        case "catalog":
                            return <CatalogSection section={section} state={state} cart={cart} updateCart={updateCart} onProductClick={onProductClick} activeCategory={activeCategory} />;
                        case "about":
                            const About = AboutTemplates[section.content?.templateId || state.aboutTemplateId || "about-1"] || AboutTemplates["about-1"];
                            return <About state={state} section={section} />;
                        case "testimonials":
                            return (
                              <section className="mb-10 space-y-4" style={{ ...section.styles, color: contrast }}>
                                <h2 className="px-2 text-2xl font-black uppercase italic tracking-tight" style={{ color: contrast }}>{section.title || "Testimonials"}</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                  {(section.content?.items || state.testimonials || []).map((item: any, index: number) => (
                                    <blockquote key={item.id || index} className="rounded-[1.5rem] bg-white dark:bg-zinc-900 p-6 shadow-sm border border-black/[0.03] dark:border-white/5" style={{ color: textColor }}>
                                      <p className="text-sm font-bold leading-7 opacity-80">&ldquo;{item.quote}&rdquo;</p>
                                      <footer className="mt-4 text-[10px] font-black uppercase tracking-widest text-emerald-500">{item.author || "Customer"}</footer>
                                    </blockquote>
                                  ))}
                                </div>
                              </section>
                            );
                        default:
                            return null;
                    }
                })()}
            </div>
        );

        return content;
      })}
    </div>
  );
}