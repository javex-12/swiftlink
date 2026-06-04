"use client";

import React, { useMemo } from "react";
import type { PageSection, ShopState, Product } from "@/lib/schema";
import { CatalogTemplates } from "@/lib/store-templates";

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
  const templateId = content.templateId || state.catalogTemplateId || "catalog-1";
  
  const targetCategory = content.category || activeCategory;

  const filteredProducts = useMemo(() => {
    return state.products.filter(p => {
        const matchesCat = targetCategory === "All" || p.category === targetCategory;
        const shouldHide = state.outOfStockDisplay === "hide" && p.outOfStock;
        return matchesCat && !shouldHide;
    });
  }, [state.products, targetCategory, state.outOfStockDisplay]);

  const Catalog = CatalogTemplates[templateId] || CatalogTemplates["catalog-1"];

  return (
    <div className="space-y-6 mb-12" id="sl-catalog">
        <Catalog state={state} products={filteredProducts} onProductClick={onProductClick} />
    </div>
  );
}
