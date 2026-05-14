"use client";

import React, { useState, useRef } from "react";
import { HeroSection } from "./HeroSection";
import { CatalogSection } from "./CatalogSection";
import { EditorContextMenu } from "../EditorContextMenu";
import { AnimatePresence } from "framer-motion";
import type { PageSection, ShopState, Product } from "@/lib/schema";

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
        // Find center of screen roughly for touch
        setContextMenu({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 150, section });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

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
                    switch (section.type) {
                        case "hero":
                            return <HeroSection section={section} state={state} />;
                        case "catalog":
                            return <CatalogSection section={section} state={state} cart={cart} updateCart={updateCart} onProductClick={onProductClick} activeCategory={activeCategory} />;
                        case "about":
                            return (
                              <section className="mb-10 rounded-[1.5rem] bg-white p-8 shadow-sm dark:bg-zinc-900" style={section.styles}>
                                <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white">{section.title || "About Us"}</h2>
                                <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-500 dark:text-zinc-400">{section.content?.text || state.aboutUs}</p>
                              </section>
                            );
                        case "testimonials":
                            return (
                              <section className="mb-10 space-y-4" style={section.styles}>
                                <h2 className="px-2 text-2xl font-black uppercase italic text-slate-900 dark:text-white">{section.title || "Testimonials"}</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                  {(section.content?.items || state.testimonials || []).map((item: any, index: number) => (
                                    <blockquote key={item.id || index} className="rounded-[1.5rem] bg-white p-6 shadow-sm dark:bg-zinc-900">
                                      <p className="text-sm font-bold leading-7 text-slate-600 dark:text-zinc-300">&ldquo;{item.quote}&rdquo;</p>
                                      <footer className="mt-4 text-[10px] font-black uppercase tracking-widest text-emerald-500">{item.author || "Customer"}</footer>
                                    </blockquote>
                                  ))}
                                </div>
                              </section>
                            );
                        default:
                            if (isEditable && section.type === "custom_code") {
                              return (
                                <section className="mb-10 rounded-[1.5rem] border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-500/20 dark:bg-amber-500/10">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                    Custom code sections are disabled
                                  </p>
                                </section>
                              );
                            }
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

import { cn } from "@/lib/utils";
