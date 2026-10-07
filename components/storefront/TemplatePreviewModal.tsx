"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Smartphone, Tablet, Monitor, Check } from "lucide-react";
import type { Product, ShopState } from "@/lib/schema";
import { getSampleShopState } from "@/lib/sample-store";
import { websiteTemplateById } from "@/lib/theme/templates";
import { themeToCssVars } from "@/lib/theme/derive";

// Lazy-load the real TemplateSite component so preview code only loads on demand
const TemplateSite = dynamic(
  () => import("@/components/storefront/template-sites").then((mod) => mod.TemplateSite),
  {
    loading: () => (
      <div className="flex min-h-[500px] items-center justify-center text-sm text-[#9DB3A8]">
        Loading template preview…
      </div>
    ),
  },
);

export interface TemplatePreviewModalProps {
  templateId: string;
  vendorState: ShopState;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplatePreviewModal({
  templateId,
  vendorState,
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatePreviewModalProps) {
  const hasVendorProducts = (vendorState.products?.length || 0) > 0;
  const [device, setDevice] = useState<"desktop" | "tablet" | "phone">("phone");
  const [useSampleData, setUseSampleData] = useState<boolean>(!hasVendorProducts);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const template = useMemo(() => {
    return websiteTemplateById(templateId) || websiteTemplateById("editorial");
  }, [templateId]);

  // Active state to render in the template
  const activeState = useMemo<ShopState>(() => {
    if (useSampleData || !hasVendorProducts) {
      const sample = getSampleShopState(templateId, vendorState.currency || "NGN");
      return {
        ...sample,
        websiteTemplateId: templateId as any,
      };
    }

    return {
      ...vendorState,
      websiteTemplateId: templateId as any,
    };
  }, [useSampleData, hasVendorProducts, templateId, vendorState]);

  const activeProducts = useMemo<Product[]>(() => {
    return activeState.products || [];
  }, [activeState.products]);

  const categories = useMemo<string[]>(() => {
    const list = ["All"];
    for (const p of activeProducts) {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    }
    return list;
  }, [activeProducts]);

  const filteredProducts = useMemo<Product[]>(() => {
    if (activeCategory === "All") return activeProducts;
    return activeProducts.filter((p) => p.category === activeCategory);
  }, [activeProducts, activeCategory]);

  // Scoped theme variables compiled from active template theme
  const themeVars = useMemo(() => {
    if (!template) return {};
    const tenantTheme = template.light || template.dark;
    return themeToCssVars(tenantTheme) as React.CSSProperties;
  }, [template]);

  if (!isOpen || !template) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Template Preview"
      className="fixed inset-0 z-[1500] flex flex-col bg-[#0A1210] text-[#E8F1EC]"
    >
      {/* Persistent Warning Banner & Controls */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#1E2D27] bg-[#111C18] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                !useSampleData ? "bg-[#19C37D]" : "bg-[#E8B93A]"
              }`}
            />
            <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none text-xs font-medium text-[#E8F1EC]">
              {!useSampleData
                ? `Live preview: ${vendorState.bizName || "Your store"} (${vendorState.products.length} products)`
                : "Sample template preview"}
            </span>
          </div>

          {/* Toggle between sample and merchant's real products if available */}
          {hasVendorProducts && (
            <div className="hidden items-center rounded-lg border border-[#24382F] bg-[#0A1210] p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setUseSampleData(true)}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  useSampleData ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                }`}
              >
                Sample products
              </button>
              <button
                type="button"
                onClick={() => setUseSampleData(false)}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  !useSampleData ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                }`}
              >
                My products ({vendorState.products.length})
              </button>
            </div>
          )}
        </div>

        {/* Viewport Toggles & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-[#24382F] bg-[#0A1210] p-0.5">
            <button
              type="button"
              aria-label="Mobile viewport"
              onClick={() => setDevice("phone")}
              className={`flex h-7 w-7 items-center justify-center rounded transition ${
                device === "phone" ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              }`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tablet viewport"
              onClick={() => setDevice("tablet")}
              className={`flex h-7 w-7 items-center justify-center rounded transition ${
                device === "tablet" ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              }`}
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Desktop viewport"
              onClick={() => setDevice("desktop")}
              className={`flex h-7 w-7 items-center justify-center rounded transition ${
                device === "desktop" ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              }`}
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectTemplate(templateId);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-[12px] bg-[#19C37D] px-4 py-2 text-xs font-semibold text-[#04140D] transition hover:bg-[#16B070]"
          >
            <Check className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Use this template</span>
            <span className="xs:hidden">Use</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[#24382F] text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Preview Content Area */}
      <main className="flex-1 overflow-auto bg-[#0A1210] p-2 sm:p-6">
        {device === "phone" ? (
          <div className="mx-auto my-4 w-full max-w-[390px] overflow-hidden rounded-2xl sm:rounded-[40px] border-2 sm:border-[8px] border-[#1E2D27] bg-[#111C18] shadow-2xl">
            {/* Phone Speaker Notch */}
            <div className="flex h-5 w-full items-center justify-center bg-[#111C18]">
              <div className="h-1 w-16 rounded-full bg-[#1E2D27]" />
            </div>

            <div
              data-theme-scope="storefront"
              style={themeVars}
              className="max-h-[750px] overflow-y-auto overscroll-contain"
            >
              <TemplateSite
                state={activeState}
                products={filteredProducts}
                categories={categories}
                activeCategory={activeCategory}
                cartCount={0}
                onCategory={setActiveCategory}
                onProduct={() => {}}
                onSearch={() => {}}
                onCart={() => {}}
                onReviews={() => {}}
              />
            </div>
          </div>
        ) : device === "tablet" ? (
          <div
            data-theme-scope="storefront"
            style={themeVars}
            className="mx-auto min-h-full max-w-[768px] overflow-hidden rounded-2xl border-4 border-[#1E2D27] bg-[#111C18] shadow-2xl"
          >
            <TemplateSite
              state={activeState}
              products={filteredProducts}
              categories={categories}
              activeCategory={activeCategory}
              cartCount={0}
              onCategory={setActiveCategory}
              onProduct={() => {}}
              onSearch={() => {}}
              onCart={() => {}}
              onReviews={() => {}}
            />
          </div>
        ) : (
          <div
            data-theme-scope="storefront"
            style={themeVars}
            className="mx-auto min-h-full max-w-6xl overflow-hidden rounded-[18px] border border-[#1E2D27] bg-white shadow-2xl"
          >
            <TemplateSite
              state={activeState}
              products={filteredProducts}
              categories={categories}
              activeCategory={activeCategory}
              cartCount={0}
              onCategory={setActiveCategory}
              onProduct={() => {}}
              onSearch={() => {}}
              onCart={() => {}}
              onReviews={() => {}}
            />
          </div>
        )}
      </main>
    </div>
  );
}
