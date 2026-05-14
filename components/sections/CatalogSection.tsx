"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Star, Plus, Minus, Package } from "lucide-react";
import { motion } from "framer-motion";
import type { PageSection, ShopState, Product } from "@/lib/schema";

interface CatalogSectionProps {
  section: PageSection;
  state: ShopState;
  cart: Record<number, number>;
  updateCart: (id: number, delta: number) => void;
  onProductClick: (p: Product) => void;
  activeCategory: string;
}

export function CatalogSection({ 
  section, 
  state, 
  cart, 
  updateCart, 
  onProductClick,
  activeCategory 
}: CatalogSectionProps) {
  const content = section.content || {};
  const styles = section.styles || {};
  
  const targetCategory = content.category || activeCategory;

  const filteredProducts = useMemo(() => {
    return state.products.filter(p => {
        const matchesCat = targetCategory === "All" || p.category === targetCategory;
        const shouldHide = state.outOfStockDisplay === "hide" && p.outOfStock;
        return matchesCat && !shouldHide;
    });
  }, [state.products, targetCategory, state.outOfStockDisplay]);

  const qty = (id: number) => cart[id] || 0;

  return (
    <div className="space-y-6 mb-12" id="sl-catalog" style={styles}>
      {section.title && (
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-6 bg-slate-900 dark:bg-white rounded-full" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
            {section.title}
          </h2>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
          {filteredProducts.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                onClick={() => onProductClick(p)}
                className={cn(
                    "w-full text-left cursor-pointer group transition-all",
                    p.outOfStock && "opacity-60 grayscale-[0.8]"
                )}
                >
                <div className="bg-white dark:bg-zinc-900 rounded-[1.25rem] md:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 relative border border-black/[0.01] dark:border-white/5">
                    <div className="aspect-square overflow-hidden relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    
                    {p.badge && (
                        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {p.badge}
                        </span>
                    )}

                    {p.outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10">
                        <span className="bg-white/90 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">Sold Out</span>
                        </span>
                    )}
                    </div>

                    <div className="p-3 md:p-6">
                    <p className="text-[11px] md:text-base font-black text-gray-900 dark:text-white truncate leading-none mb-1.5">{p.name}</p>
                    <div className="flex items-center gap-1">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <span className="text-[9px] md:text-[11px] font-bold text-gray-400">4.9</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 md:mt-4">
                        <p className="text-[12px] md:text-xl font-black text-emerald-600">{state.currency}{Number(p.price).toLocaleString()}</p>
                        {qty(p.id) === 0 ? (
                        <button
                            disabled={p.outOfStock}
                            onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }}
                            className="w-7 h-7 md:w-10 md:h-10 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                        </button>
                        ) : (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-full p-1">
                            <button onClick={(e) => { e.stopPropagation(); updateCart(p.id, -1); }} className="w-6 h-6 md:w-8 md:h-8 bg-white dark:bg-zinc-700 shadow-sm rounded-full flex items-center justify-center active:scale-90">
                            <Minus size={10} className="dark:text-white" />
                            </button>
                            <span className="text-[10px] md:text-xs font-black w-4 text-center dark:text-white">{qty(p.id)}</span>
                            <button 
                                disabled={p.outOfStock}
                                onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }} 
                                className="w-6 h-6 md:w-8 md:h-8 bg-emerald-500 text-white shadow-sm rounded-full flex items-center justify-center active:scale-90 disabled:opacity-30"
                            >
                            <Plus size={10} />
                            </button>
                        </div>
                        )}
                    </div>
                    </div>
                </div>
                </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square rounded-[2rem] bg-emerald-50/20 border-2 border-dashed border-emerald-100 dark:bg-emerald-900/5 dark:border-white/5 flex flex-col items-center justify-center gap-3 text-emerald-200 dark:text-emerald-900/20">
                    <Package size={32} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Store Placeholder</span>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}