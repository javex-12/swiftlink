"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState, Product, ProductAttribute } from "@/lib/schema";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { formatMajorMoney } from "@/lib/currency";
import { normalizePhoneNumber } from "@/lib/phone";
import { websiteTemplates, websiteTemplateById, WebsiteTemplateId } from "@/lib/theme/templates";
import { themeToCssVars } from "@/lib/theme/derive";
import { DEFAULT_WA_TEMPLATE, renderWhatsAppOrderMessage, ALLOWED_TEMPLATE_VARIABLES, validateWhatsAppTemplate } from "@/lib/whatsapp-template";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { TemplatePreviewModal } from "@/components/storefront/TemplatePreviewModal";
import { TemplateSite } from "@/components/storefront/template-sites";
import { CountrySelector } from "@/components/CountrySelector";
import { compressImageBeforeUpload } from "@/lib/image-compress";
import { STOCK_PRODUCT_IDEAS, type StockProductIdea } from "@/lib/stock-ideas";
import {
  Store,
  Plus,
  Trash2,
  Check,
  Eye,
  ExternalLink,
  Upload,
  Smartphone,
  Tablet,
  Monitor,
  X,
  MessageSquare,
  Tag,
  FolderPlus,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ShoppingBag,
  Share2,
  Image as ImageIcon,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

interface OptionRow {
  name: string;
  choices: string;
}

export function StoreEditorV2() {
  const { state: globalState, saveFullState, addToast, user } = useSwiftLink();

  // Local working copy of store state
  const [localState, setLocalState] = useState<ShopState>(() => JSON.parse(JSON.stringify(globalState)));
  const [activeTab, setActiveTab] = useState<"products" | "design" | "preview">("products");
  const [isSaving, setIsSaving] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [designViewport, setDesignViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("dark");
  const [previewCartCount, setPreviewCartCount] = useState<number>(1);

  // Quick populate 4 stock ideas for instant zero-to-one store launch
  const handlePopulateStockIdeas = () => {
    const isNgn = localState.currency === "NGN";
    const mult = isNgn ? 1 : 0.001;
    const initialProducts: Product[] = STOCK_PRODUCT_IDEAS.slice(0, 4).map((idea, idx) => ({
      id: Date.now() + idx,
      name: idea.name,
      price: Math.round(idea.price * mult),
      description: idea.description,
      category: idea.category,
      image: idea.url,
      images: [idea.url, ...idea.gallery],
      badge: idea.badge,
      outOfStock: false,
      attributes: idea.attributes?.map((a) => ({ label: a.label, value: a.value })),
    }));
    updateField("products", initialProducts);
    addToast("Added 4 ready-to-sell products with photos, descriptions and prices!", "success");
  };

  // Compile active theme variables so live preview always renders correct contrast colors
  const currentTemplate = useMemo(() => {
    const templateId = localState.websiteTemplateId || "editorial";
    return websiteTemplateById(templateId) || websiteTemplateById("editorial");
  }, [localState.websiteTemplateId]);

  const previewThemeVars = useMemo(() => {
    if (!currentTemplate) return {};
    const tenantTheme =
      previewMode === "dark"
        ? currentTemplate.dark || currentTemplate.light
        : currentTemplate.light || currentTemplate.dark;
    return themeToCssVars(tenantTheme) as React.CSSProperties;
  }, [currentTemplate, previewMode]);

  // Dirty state tracking
  const initialSerialized = useRef<string>(JSON.stringify(globalState));
  const isDirty = useMemo(() => {
    return JSON.stringify(localState) !== initialSerialized.current;
  }, [localState]);

  // Sync if globalState is updated externally
  useEffect(() => {
    if (!isDirty) {
      setLocalState(JSON.parse(JSON.stringify(globalState)));
      initialSerialized.current = JSON.stringify(globalState);
    }
  }, [globalState, isDirty]);

  // Warn on unmount or navigation if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Helper updater
  const updateField = useCallback(<K extends keyof ShopState>(field: K, value: ShopState[K]) => {
    setLocalState((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Save changes handler
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveFullState(localState);
      initialSerialized.current = JSON.stringify(localState);
      addToast("Store changes saved successfully.", "success");
    } catch (err: any) {
      addToast(`Failed to save: ${err?.message || "Please try again."}`, "error");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, localState, saveFullState, addToast]);

  // Keyboard shortcut Cmd/Ctrl + S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDirty, handleSave]);

  // Store profile image upload
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setIsUploadingLogo(true);
    try {
      const { file: compressedFile } = await compressImageBeforeUpload(file, 800, 0.85);
      const path = `${user.id}/branding/logo_${Date.now()}_${compressedFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("branding").upload(path, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      updateField("bizImage", data.publicUrl);
      addToast("Logo uploaded successfully.", "success");
    } catch (err: any) {
      addToast(`Logo upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Categories management
  const [newCategoryName, setNewCategoryName] = useState("");
  const categories = localState.categories || ["All"];

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      addToast("Category already exists.", "info");
      return;
    }
    updateField("categories", [...categories, trimmed]);
    setNewCategoryName("");
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (catToRemove === "All") {
      addToast("The 'All' category cannot be removed.", "info");
      return;
    }
    updateField("categories", categories.filter((c) => c !== catToRemove));
  };

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductModalOpen(true);
  };

  const openEditProductModal = (id: number) => {
    setEditingProductId(id);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      updateField("products", localState.products.filter((p) => p.id !== id));
      addToast("Product removed.", "info");
    }
  };

  const handleToggleStock = (id: number) => {
    updateField(
      "products",
      localState.products.map((p) => (p.id === id ? { ...p, outOfStock: !p.outOfStock } : p))
    );
  };

  // Smart Add (bulk upload preserved in code as a utility)
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const handleBulkAdd = async (files: FileList | null) => {
    if (!files || !files.length || !user) return;
    setIsBulkUploading(true);
    const newItems: Product[] = [];
    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const { file: compressed } = await compressImageBeforeUpload(file, 1200, 0.82);
        const tempId = Date.now() + i;
        const path = `${user.id}/products/${tempId}_${compressed.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error } = await supabase.storage.from("branding").upload(path, compressed);
        if (!error) {
          const { data } = supabase.storage.from("branding").getPublicUrl(path);
          let name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          name = name.replace(/\b\w/g, (c) => c.toUpperCase());
          newItems.push({
            id: tempId,
            name,
            price: 0,
            description: "",
            image: data.publicUrl,
            images: [data.publicUrl],
            outOfStock: false,
            category: categories[1] || "",
          });
        }
      }
      if (newItems.length > 0) {
        updateField("products", [...newItems, ...localState.products]);
        addToast(`Added ${newItems.length} products from photos.`, "success");
      }
    } catch (err: any) {
      addToast(`Bulk upload error: ${err.message}`, "error");
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1210] pb-24 text-[#E8F1EC]">
      {/* ─── Sticky Header with Tabs & Save ─── */}
      <header className="sticky top-0 z-30 border-b border-[#1E2D27] bg-[#0A1210]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Top Row: Store info on left, Save on right, desktop center tabs */}
          <div className="flex items-center justify-between gap-3">
            {/* Store status and link */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E2D27] bg-[#14231D] text-[#19C37D]">
                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="truncate text-xs sm:text-sm font-semibold text-[#E8F1EC] max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-none">
                    {localState.bizName || "My Store"}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-medium",
                      localState.isLive
                        ? "bg-[#14231D] text-[#19C37D] border border-[#19C37D]/30"
                        : "bg-[#14231D] text-[#9DB3A8] border border-[#1E2D27]"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        localState.isLive ? "bg-[#19C37D]" : "bg-[#9DB3A8]"
                      )}
                    />
                    {localState.isLive ? "Live" : "Draft"}
                  </span>
                </div>
                {localState.storeUsername && (
                  <a
                    href={`/store/${localState.storeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#9DB3A8] hover:text-[#19C37D] truncate max-w-[160px] sm:max-w-none"
                  >
                    <span className="truncate">swiftlink.pro/store/{localState.storeUsername}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* Desktop Center Tabs: Products, Design & Live Preview */}
            <div className="hidden sm:flex rounded-xl border border-[#1E2D27] bg-[#111C18] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={cn(
                  "flex min-h-[36px] items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition",
                  activeTab === "products"
                    ? "bg-[#19C37D] text-[#04140D] font-semibold shadow-xs"
                    : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                )}
              >
                <span>Products</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums",
                    activeTab === "products" ? "bg-[#04140D]/20 text-[#04140D]" : "bg-[#14231D] text-[#9DB3A8]"
                  )}
                >
                  {localState.products.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("design")}
                className={cn(
                  "flex min-h-[36px] items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition",
                  activeTab === "design"
                    ? "bg-[#19C37D] text-[#04140D] font-semibold shadow-xs"
                    : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                )}
              >
                <span>Design</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition",
                  activeTab === "preview"
                    ? "bg-[#19C37D] text-[#04140D] font-semibold shadow-xs"
                    : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            {/* Right Action: Save changes */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className={cn(
                  "flex min-h-[38px] sm:min-h-[42px] items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-semibold transition active:scale-98",
                  isDirty
                    ? "bg-[#19C37D] text-[#04140D] hover:bg-[#16B070] shadow-md shadow-[#19C37D]/20"
                    : "border border-[#1E2D27] bg-[#14231D] text-[#9DB3A8] opacity-60 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden xs:inline">Saving…</span>
                  </>
                ) : isDirty ? (
                  <>
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Save</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#04140D]" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#19C37D]" />
                    <span>Saved</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Tabs: Full-width responsive 3-column tabs */}
          <div className="mt-2.5 flex sm:hidden rounded-xl border border-[#1E2D27] bg-[#111C18] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={cn(
                "flex flex-1 min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition",
                activeTab === "products"
                  ? "bg-[#19C37D] text-[#04140D] font-semibold shadow-xs"
                  : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              )}
            >
              <span>Products</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums",
                  activeTab === "products" ? "bg-[#04140D]/20 text-[#04140D]" : "bg-[#14231D] text-[#9DB3A8]"
                )}
              >
                {localState.products.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={cn(
                "flex flex-1 min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition",
                activeTab === "design"
                  ? "bg-[#19C37D] text-[#04140D] font-semibold shadow-xs"
                  : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              )}
            >
              <span>Design</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex flex-1 min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition",
                activeTab === "preview"
                  ? "bg-[#19C37D] text-[#04140D] font-semibold shadow-xs"
                  : "text-[#9DB3A8] hover:text-[#E8F1EC]"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Canvas ─── */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* ============================================================== */}
        {/* TAB 1: PRODUCTS TAB                                            */}
        {/* ============================================================== */}
        {activeTab === "products" && (
          <div className="space-y-8">
            {/* Section 1: Store Profile */}
            <section
              aria-labelledby="store-profile-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="store-profile-heading" className="text-base font-semibold text-[#E8F1EC]">
                  Store profile
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Basic information buyers see when visiting your store.
                </p>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-12">
                {/* Photo / Avatar */}
                <div className="md:col-span-4 lg:col-span-3">
                  <label className="block text-xs font-medium text-[#E8F1EC]">Store Logo or Photo</label>
                  <div className="mt-2 flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#5C7C6D]/40 bg-[#0A1210] p-4 text-center">
                    <div className="relative flex h-24 w-24 overflow-hidden rounded-xl border border-[#1E2D27] bg-[#14231D]">
                      {localState.bizImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={localState.bizImage}
                          alt={localState.bizName || "Store logo"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#19C37D]">
                          {(localState.bizName || "S").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="h-5 w-5 animate-spin text-[#19C37D]" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <label className="flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#24382F] bg-[#14231D] px-3 py-1.5 text-xs font-medium text-[#E8F1EC] transition hover:bg-[#1E2D27]">
                        <Upload className="h-3.5 w-3.5 text-[#19C37D]" />
                        <span>Upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingLogo}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleLogoUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {localState.bizImage && (
                        <button
                          type="button"
                          onClick={() => updateField("bizImage", "")}
                          className="text-xs text-[#9DB3A8] hover:text-[#FF8A8A]"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name, Phone, and Link */}
                <div className="space-y-4 md:col-span-8 lg:col-span-9">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#E8F1EC]">Business Name</label>
                      <input
                        type="text"
                        value={localState.bizName || ""}
                        onChange={(e) => updateField("bizName", e.target.value)}
                        placeholder="e.g. Modern Craft Co"
                        className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#E8F1EC]">Store Currency</label>
                      <select
                        value={localState.currency || "NGN"}
                        onChange={(e) => updateField("currency", e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                      >
                        <option value="NGN">NGN (₦) - Nigerian Naira</option>
                        <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                        <option value="KES">KES (KSh) - Kenyan Shilling</option>
                        <option value="ZAR">ZAR (R) - South African Rand</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="EUR">EUR (€) - Euro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#E8F1EC]">WhatsApp Number</label>
                      <div className="mt-1.5 flex gap-2">
                        <CountrySelector
                          value="NG"
                          onChange={(code) => {
                            // Update country prefix if needed
                          }}
                        />
                        <input
                          type="tel"
                          value={localState.phone || ""}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="+234 808 123 4567"
                          className="w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#9DB3A8]">
                        Where customer order messages arrive on WhatsApp.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#E8F1EC]">Store Link Handle</label>
                      <div className="mt-1.5 flex items-center rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                        <span className="select-none text-xs text-[#9DB3A8]">swiftlink.pro/store/</span>
                        <input
                          type="text"
                          value={localState.storeUsername || ""}
                          onChange={(e) => {
                            const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            updateField("storeUsername", clean);
                          }}
                          placeholder="your-store"
                          className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#9DB3A8]">
                        Your unique shareable link for bio and status.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: About & Socials */}
            <section
              aria-labelledby="about-socials-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="about-socials-heading" className="text-base font-semibold text-[#E8F1EC]">
                  About and socials
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Help customers know who you are and where else to find you.
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#E8F1EC]">About the Store / Bio</label>
                  <textarea
                    rows={3}
                    value={localState.bio || localState.aboutUs || ""}
                    onChange={(e) => {
                      updateField("bio", e.target.value);
                      updateField("aboutUs", e.target.value);
                    }}
                    placeholder="We sell handmade leather shoes and bags from Lagos, Nigeria."
                    className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">Instagram Handle</label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={localState.socials?.instagram || ""}
                      onChange={(e) =>
                        updateField("socials", {
                          ...localState.socials,
                          instagram: e.target.value.replace(/^@/, ""),
                        })
                      }
                      placeholder="yourbrand"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">TikTok Handle</label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={localState.socials?.tiktok || ""}
                      onChange={(e) =>
                        updateField("socials", {
                          ...localState.socials,
                          tiktok: e.target.value.replace(/^@/, ""),
                        })
                      }
                      placeholder="yourbrand"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">X / Twitter Handle</label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={localState.socials?.twitter || ""}
                      onChange={(e) =>
                        updateField("socials", {
                          ...localState.socials,
                          twitter: e.target.value.replace(/^@/, ""),
                        })
                      }
                      placeholder="yourbrand"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">Location / Delivery Areas</label>
                  <input
                    type="text"
                    value={localState.deliveryAreas || localState.location || ""}
                    onChange={(e) => {
                      updateField("deliveryAreas", e.target.value);
                      updateField("location", e.target.value);
                    }}
                    placeholder="Lagos and nationwide delivery"
                    className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                  />
                </div>
              </div>
            </section>

            {/* Section: WhatsApp Checkout Message Template */}
            <section
              aria-labelledby="whatsapp-message-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#19C37D]" />
                  <h2 id="whatsapp-message-heading" className="text-base font-semibold text-[#E8F1EC]">
                    WhatsApp Order Message Template
                  </h2>
                </div>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Customize the default message customers send when clicking &quot;Order on WhatsApp&quot;.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">
                    Insert Variables (tap to add):
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ALLOWED_TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          const current = localState.waTemplate || DEFAULT_WA_TEMPLATE;
                          const separator = current.endsWith(" ") || current.endsWith("\n") || !current ? "" : " ";
                          updateField("waTemplate", `${current}${separator}${v}`);
                        }}
                        className="rounded-lg border border-[#24382F] bg-[#14231D] px-2.5 py-1 text-xs font-medium text-[#19C37D] transition hover:border-[#19C37D] hover:bg-[#19C37D]/10"
                      >
                        + {v}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateField("waTemplate", DEFAULT_WA_TEMPLATE)}
                      className="flex items-center gap-1 rounded-lg border border-[#24382F] bg-[#14231D] px-2.5 py-1 text-xs font-medium text-[#9DB3A8] transition hover:text-[#E8F1EC]"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset default</span>
                    </button>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={localState.waTemplate || DEFAULT_WA_TEMPLATE}
                    onChange={(e) => updateField("waTemplate", e.target.value)}
                    placeholder={DEFAULT_WA_TEMPLATE}
                    className="w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] p-3 text-xs sm:text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#9DB3A8]">
                    <span>Allowed: &#123;product&#125;, &#123;price&#125;, &#123;option&#125;, &#123;store&#125;</span>
                    <span>{(localState.waTemplate || DEFAULT_WA_TEMPLATE).length}/500 chars</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#24382F] bg-[#0A1210] p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9DB3A8]">
                    Buyer WhatsApp Message Preview
                  </span>
                  <div className="mt-2 rounded-lg border border-[#1E2D27] bg-[#14231D] p-3 text-xs text-[#E8F1EC]/90 whitespace-pre-line leading-relaxed">
                    {renderWhatsAppOrderMessage(localState.waTemplate || DEFAULT_WA_TEMPLATE, {
                      product: localState.products[0]?.name || "Sample Product",
                      price: formatMajorMoney(localState.products[0]?.price || 15000, localState.currency || "NGN"),
                      store: localState.bizName || "My Store",
                      option: "Size: Medium",
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Categories */}
            <section
              aria-labelledby="categories-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="categories-heading" className="text-base font-semibold text-[#E8F1EC]">
                  Categories
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Group your products so buyers can filter quickly on your storefront.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {/* Active categories tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#24382F] bg-[#14231D] px-3 py-1.5 text-xs font-medium text-[#E8F1EC]"
                    >
                      <span>{cat}</span>
                      {cat !== "All" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="text-[#9DB3A8] hover:text-[#FF8A8A]"
                          title={`Remove ${cat}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add category input */}
                <div className="flex max-w-md items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="New category name (e.g. Bags)"
                    className="flex-1 rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="flex min-h-[40px] items-center gap-1 rounded-xl border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Section 4: Products List */}
            <section
              aria-labelledby="products-list-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2D27] pb-4">
                <div>
                  <h2 id="products-list-heading" className="text-base font-semibold text-[#E8F1EC]">
                    Products
                  </h2>
                  <p className="mt-1 text-xs text-[#9DB3A8]">
                    {localState.products.length} {localState.products.length === 1 ? "item" : "items"} in your store
                  </p>
                </div>

                {/* Primary buttons: 1-tap Live preview & Add product */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#19C37D]/40 bg-[#19C37D]/10 px-4 py-2.5 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/20 active:scale-98"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Live preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={openAddProductModal}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#19C37D] px-5 py-2.5 text-xs font-semibold text-[#04140D] transition hover:bg-[#16B070] active:scale-98 shadow-md shadow-[#19C37D]/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add product</span>
                  </button>
                </div>
              </div>

              {/* Products Table / Cards */}
              <div className="mt-6">
                {localState.products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#1E2D27] py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14231D] text-[#19C37D]">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#E8F1EC]">No products yet</p>
                    <p className="mt-1 text-xs text-[#9DB3A8] max-w-sm">
                      Add a product to start sharing your store and receiving orders on WhatsApp, or start instantly with ready-to-sell stock ideas.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={openAddProductModal}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#19C37D] px-5 py-2.5 text-xs font-semibold text-[#04140D] transition hover:bg-[#16B070] shadow-md shadow-[#19C37D]/20"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add product</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePopulateStockIdeas}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#19C37D]/40 bg-[#14231D] px-5 py-2.5 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/10"
                      >
                        <Tag className="h-4 w-4" />
                        <span>Add 4 Stock Ideas (1-Tap)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1E2D27]">
                    {localState.products.map((product) => {
                      const cover = product.images?.[0] || product.image;
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-[#14231D]/40 rounded-xl px-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Product Cover Thumbnail */}
                            <div className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#1E2D27] bg-[#0A1210]">
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#9DB3A8]">
                                  No photo
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-sm font-semibold text-[#E8F1EC]">
                                  {product.name}
                                </h3>
                                {product.category && (
                                  <span className="shrink-0 rounded-md bg-[#14231D] px-2 py-0.5 text-[10px] font-medium text-[#9DB3A8]">
                                    {product.category}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs font-semibold tabular-nums text-[#19C37D]">
                                {formatMajorMoney(product.price, localState.currency)}
                              </p>
                            </div>
                          </div>

                          {/* Status and Action Buttons */}
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleToggleStock(product.id)}
                              className={cn(
                                "flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition",
                                product.outOfStock
                                  ? "border border-[#FF8A8A]/30 bg-[#FF8A8A]/10 text-[#FF8A8A]"
                                  : "border border-[#19C37D]/30 bg-[#14231D] text-[#19C37D]"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  product.outOfStock ? "bg-[#FF8A8A]" : "bg-[#19C37D]"
                                )}
                              />
                              <span>{product.outOfStock ? "Sold out" : "In stock"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditProductModal(product.id)}
                              className="flex min-h-[36px] items-center rounded-lg border border-[#24382F] bg-[#14231D] px-3.5 py-1 text-xs font-medium text-[#E8F1EC] transition hover:bg-[#1E2D27]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex min-h-[36px] items-center rounded-lg p-2 text-[#9DB3A8] transition hover:text-[#FF8A8A]"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DESIGN TAB                                              */}
        {/* ============================================================== */}
        {activeTab === "design" && (
          <div className="space-y-8">
            {/* Section 1: Template selection */}
            <section
              aria-labelledby="template-selection-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="template-selection-heading" className="text-base font-semibold text-[#E8F1EC]">
                  Store templates
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Pick a look for your store. Each template works in light and dark mode.
                </p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {websiteTemplates.map((template) => {
                  const isSelected = (localState.websiteTemplateId || "editorial") === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => updateField("websiteTemplateId", template.id)}
                      className={cn(
                        "group flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition",
                        isSelected
                          ? "border-[#19C37D] bg-[#14231D] shadow-md shadow-[#19C37D]/10"
                          : "border-[#1E2D27] bg-[#0A1210] hover:border-[#5C7C6D]"
                      )}
                    >
                      <div>
                        {/* Miniature visual layout representation */}
                        <div className="overflow-hidden rounded-lg border border-[#1E2D27] bg-[#0A1210]">
                          <TemplateFrame
                            id={template.id}
                            appearance={previewMode}
                            currency={localState.currency}
                            size="card"
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#E8F1EC]">{template.name}</h3>
                          {isSelected && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#19C37D] text-[#04140D]">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-[#9DB3A8]">
                          {template.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#1E2D27] pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplateId(template.id);
                          }}
                          className="flex min-h-[36px] items-center gap-1 text-xs font-medium text-[#9DB3A8] hover:text-[#19C37D]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Full preview</span>
                        </button>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isSelected ? "text-[#19C37D]" : "text-[#9DB3A8] group-hover:text-[#E8F1EC]"
                          )}
                        >
                          {isSelected ? "Active template" : "Select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 2: Accent color */}
            <section
              aria-labelledby="accent-color-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="accent-color-heading" className="text-base font-semibold text-[#E8F1EC]">
                  Accent color
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Used on primary buttons, price highlights, and order triggers.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {[
                  { name: "Emerald", hex: "#19C37D" },
                  { name: "Forest", hex: "#15803d" },
                  { name: "Crimson", hex: "#be123c" },
                  { name: "Coral", hex: "#f43f5e" },
                  { name: "Amber", hex: "#f59e0b" },
                  { name: "Blue", hex: "#2563eb" },
                  { name: "Violet", hex: "#7c3aed" },
                  { name: "Charcoal", hex: "#111827" },
                ].map((color) => {
                  const isActive = (localState.accentColor || "#19C37D").toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => updateField("accentColor", color.hex)}
                      className={cn(
                        "flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition",
                        isActive
                          ? "border-[#19C37D] bg-[#14231D] text-[#E8F1EC]"
                          : "border-[#1E2D27] bg-[#0A1210] text-[#9DB3A8] hover:border-[#5C7C6D]"
                      )}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-[#19C37D]" />}
                    </button>
                  );
                })}

                {/* Custom Hex Input */}
                <div className="flex items-center gap-2 rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-1.5">
                  <span className="text-xs text-[#9DB3A8]">#</span>
                  <input
                    type="text"
                    value={(localState.accentColor || "19C37D").replace(/^#/, "")}
                    onChange={(e) => updateField("accentColor", `#${e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 6)}`)}
                    className="w-20 bg-transparent text-xs font-mono uppercase text-[#E8F1EC] outline-none"
                    placeholder="19C37D"
                  />
                  <input
                    type="color"
                    value={localState.accentColor || "#19C37D"}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Live Storefront Preview */}
            <section
              aria-labelledby="storefront-preview-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2D27] pb-4">
                <div>
                  <h2 id="storefront-preview-heading" className="text-base font-semibold text-[#E8F1EC]">
                    Live storefront preview
                  </h2>
                  <p className="mt-1 text-xs text-[#9DB3A8]">
                    This is how your storefront looks right now with your draft products and settings.
                  </p>
                </div>

                {/* Viewport switch and Light/Dark toggle */}
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg border border-[#1E2D27] bg-[#0A1210] p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("dark")}
                      className={cn(
                        "rounded px-2.5 py-1 text-xs font-medium transition",
                        previewMode === "dark" ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8]"
                      )}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("light")}
                      className={cn(
                        "rounded px-2.5 py-1 text-xs font-medium transition",
                        previewMode === "light" ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8]"
                      )}
                    >
                      Light
                    </button>
                  </div>

                  <div className="flex rounded-lg border border-[#1E2D27] bg-[#0A1210] p-0.5">
                    <button
                      type="button"
                      onClick={() => setDesignViewport("desktop")}
                      className={cn(
                        "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition",
                        designViewport === "desktop"
                          ? "bg-[#14231D] text-[#19C37D]"
                          : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                      )}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignViewport("mobile")}
                      className={cn(
                        "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition",
                        designViewport === "mobile"
                          ? "bg-[#14231D] text-[#19C37D]"
                          : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                      )}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendered Live Storefront */}
              <div className="mt-6 flex justify-center overflow-hidden rounded-xl border border-[#1E2D27] bg-[#0A1210] p-4 sm:p-8">
                <div
                  className={cn(
                    "overflow-hidden rounded-xl border border-[#1E2D27] shadow-2xl transition-all duration-300",
                    designViewport === "mobile" ? "w-[375px]" : "w-full max-w-4xl"
                  )}
                >
                  <div data-theme-scope="storefront" style={previewThemeVars} className="w-full">
                    <TemplateSite
                      state={localState}
                      products={localState.products}
                      categories={localState.categories || ["All"]}
                      activeCategory="All"
                      cartCount={0}
                      onProduct={() => {}}
                      onCategory={() => {}}
                      onSearch={() => {}}
                      onCart={() => {}}
                      onReviews={() => {}}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LIVE PREVIEW TAB (1-TAP AWAY)                          */}
        {/* ============================================================== */}
        {activeTab === "preview" && (
          <div className="space-y-6 pb-16">
            {/* Live Preview Controls Header */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#1E2D27] bg-[#111C18] p-3.5 sm:p-5 lg:flex-row lg:items-center lg:justify-between shadow-xs">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("products")}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#24382F] bg-[#14231D] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-[#E8F1EC] transition hover:bg-[#19C37D]/10 hover:text-[#19C37D]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Products</span>
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#19C37D] animate-pulse" />
                      <h2 className="truncate text-xs sm:text-sm font-semibold text-[#E8F1EC]">
                        Live Preview
                      </h2>
                    </div>
                    <p className="truncate text-[10px] sm:text-[11px] text-[#9DB3A8]">
                      {localState.bizName || "Store"} ({localState.products.length} products)
                    </p>
                  </div>
                </div>

                {localState.storeUsername && (
                  <a
                    href={`/store/${localState.storeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex lg:hidden shrink-0 items-center gap-1 rounded-xl border border-[#24382F] bg-[#14231D] px-2.5 py-1.5 text-[11px] font-medium text-[#9DB3A8] transition hover:text-[#E8F1EC]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </a>
                )}
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 pt-2 border-t border-[#1E2D27] lg:border-t-0 lg:pt-0">
                {/* Template Quick Switcher */}
                <div className="flex items-center rounded-xl border border-[#24382F] bg-[#0A1210] p-0.5 sm:p-1">
                  {websiteTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => updateField("websiteTemplateId", tmpl.id)}
                      className={cn(
                        "rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition",
                        (localState.websiteTemplateId || "editorial") === tmpl.id
                          ? "bg-[#19C37D] text-[#04140D]"
                          : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                      )}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>

                {/* Device Viewport Toggle */}
                <div className="flex items-center rounded-xl border border-[#24382F] bg-[#0A1210] p-0.5 sm:p-1">
                  <button
                    type="button"
                    aria-label="Desktop viewport"
                    onClick={() => setDesignViewport("desktop")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition",
                      designViewport === "desktop"
                        ? "bg-[#14231D] text-[#19C37D]"
                        : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                    )}
                  >
                    <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Tablet viewport"
                    onClick={() => setDesignViewport("tablet")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition",
                      designViewport === "tablet"
                        ? "bg-[#14231D] text-[#19C37D]"
                        : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                    )}
                  >
                    <Tablet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Tablet</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Mobile viewport"
                    onClick={() => setDesignViewport("mobile")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition",
                      designViewport === "mobile"
                        ? "bg-[#14231D] text-[#19C37D]"
                        : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                    )}
                  >
                    <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Mobile</span>
                  </button>
                </div>

                {/* Open in new tab (desktop) */}
                {localState.storeUsername && (
                  <a
                    href={`/store/${localState.storeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#24382F] bg-[#14231D] px-3 py-1.5 text-[11px] font-medium text-[#9DB3A8] transition hover:text-[#E8F1EC]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Store</span>
                  </a>
                )}
              </div>
            </div>

            {/* Zero-product prompt banner */}
            {localState.products.length === 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div>
                  <p className="text-xs font-bold text-emerald-400">
                    Store has 0 products · Ready to populate!
                  </p>
                  <p className="text-[11px] text-[#9DB3A8]">
                    Add 4 high-resolution ready-to-sell stock ideas in 1 tap to see your store come alive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePopulateStockIdeas}
                  className="rounded-xl bg-[#19C37D] px-4 py-2 text-xs font-bold text-[#04140D] hover:bg-[#16B070] transition shrink-0"
                >
                  + Add 4 Stock Ideas
                </button>
              </div>
            )}

            {/* Live Storefront Canvas */}
            <div className="flex justify-center overflow-x-auto rounded-2xl border border-[#1E2D27] bg-[#0A1210] p-1.5 sm:p-6 md:p-8">
              {designViewport === "mobile" ? (
                <div className="w-full max-w-[390px] mx-auto overflow-hidden rounded-2xl sm:rounded-[36px] border-2 sm:border-[8px] border-[#1E2D27] bg-[#111C18] shadow-2xl">
                  {/* Phone Notch */}
                  <div className="flex h-5 w-full items-center justify-center bg-[#111C18]">
                    <div className="h-1 w-16 rounded-full bg-[#1E2D27]" />
                  </div>
                  <div
                    data-theme-scope="storefront"
                    style={previewThemeVars}
                    className="max-h-[750px] overflow-y-auto overscroll-contain"
                  >
                    <TemplateSite
                      state={localState}
                      products={localState.products}
                      categories={localState.categories || ["All"]}
                      activeCategory="All"
                      cartCount={previewCartCount}
                      onProduct={(p) => {
                        setPreviewCartCount((c) => c + 1);
                        addToast(`Added "${p.name}" to cart in preview!`, "info");
                      }}
                      onCategory={() => {}}
                      onSearch={() => addToast("Search filter is active in catalog!", "info")}
                      onCart={() => addToast(`Preview Cart: ${previewCartCount} item(s)`, "info")}
                      onReviews={() => {}}
                    />
                  </div>
                </div>
              ) : designViewport === "tablet" ? (
                <div
                  data-theme-scope="storefront"
                  style={previewThemeVars}
                  className="w-full max-w-[768px] mx-auto overflow-hidden rounded-2xl border-4 border-[#1E2D27] bg-[#111C18] shadow-2xl"
                >
                  <TemplateSite
                    state={localState}
                    products={localState.products}
                    categories={localState.categories || ["All"]}
                    activeCategory="All"
                    cartCount={previewCartCount}
                    onProduct={(p) => {
                      setPreviewCartCount((c) => c + 1);
                      addToast(`Added "${p.name}" to cart in preview!`, "info");
                    }}
                    onCategory={() => {}}
                    onSearch={() => addToast("Search filter is active in catalog!", "info")}
                    onCart={() => addToast(`Preview Cart: ${previewCartCount} item(s)`, "info")}
                    onReviews={() => {}}
                  />
                </div>
              ) : (
                <div
                  data-theme-scope="storefront"
                  style={previewThemeVars}
                  className="w-full max-w-5xl mx-auto overflow-hidden rounded-2xl border border-[#1E2D27] bg-[#111C18] shadow-2xl"
                >
                  <TemplateSite
                    state={localState}
                    products={localState.products}
                    categories={localState.categories || ["All"]}
                    activeCategory="All"
                    cartCount={previewCartCount}
                    onProduct={(p) => {
                      setPreviewCartCount((c) => c + 1);
                      addToast(`Added "${p.name}" to cart in preview!`, "info");
                    }}
                    onCategory={() => {}}
                    onSearch={() => addToast("Search filter is active in catalog!", "info")}
                    onCart={() => addToast(`Preview Cart: ${previewCartCount} item(s)`, "info")}
                    onReviews={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── ADD / EDIT PRODUCT MODAL ─── */}
      {productModalOpen && (
        <ProductEditModal
          productId={editingProductId}
          currentProducts={localState.products}
          categories={localState.categories || ["All"]}
          currency={localState.currency || "NGN"}
          bizName={localState.bizName || "My Store"}
          currentWaTemplate={localState.waTemplate || DEFAULT_WA_TEMPLATE}
          user={user}
          onClose={() => setProductModalOpen(false)}
          onSave={(updatedProduct, updatedWaTemplate) => {
            if (updatedWaTemplate !== undefined) {
              updateField("waTemplate", updatedWaTemplate);
            }
            if (editingProductId !== null) {
              updateField(
                "products",
                localState.products.map((p) => (p.id === editingProductId ? updatedProduct : p))
              );
              addToast("Product updated.", "success");
            } else {
              updateField("products", [updatedProduct, ...localState.products]);
              addToast("Product added.", "success");
            }
            setProductModalOpen(false);
          }}
        />
      )}

      {/* ─── TEMPLATE FULL-SCREEN PREVIEW MODAL ─── */}
      {previewTemplateId && (
        <TemplatePreviewModal
          templateId={previewTemplateId}
          vendorState={localState}
          isOpen={Boolean(previewTemplateId)}
          onClose={() => setPreviewTemplateId(null)}
          onSelectTemplate={(id) => {
            updateField("websiteTemplateId", id as WebsiteTemplateId);
            setPreviewTemplateId(null);
            addToast(`Selected ${id} template.`, "success");
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT EDIT MODAL COMPONENT (RESPONSIVE WITH MEDIA & WHATSAPP BUILDER)
// ─────────────────────────────────────────────────────────────────────────────

interface ProductEditModalProps {
  productId: number | null;
  currentProducts: Product[];
  categories: string[];
  currency: string;
  bizName: string;
  currentWaTemplate: string;
  user: any;
  onClose: () => void;
  onSave: (product: Product, updatedWaTemplate?: string) => void;
}

function ProductEditModal({
  productId,
  currentProducts,
  categories,
  currency,
  bizName,
  currentWaTemplate,
  user,
  onClose,
  onSave,
}: ProductEditModalProps) {
  const existing = useMemo(
    () => (productId !== null ? currentProducts.find((p) => p.id === productId) : null),
    [productId, currentProducts]
  );

  // Complete background scroll lock: locks body position fixed and restores scroll on unmount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalTop = document.body.style.top;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = originalTop;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [price, setPrice] = useState<number | string>(existing?.price ?? "");
  const [category, setCategory] = useState(existing?.category || categories[1] || "");
  const [outOfStock, setOutOfStock] = useState(existing?.outOfStock || false);
  const [stockToast, setStockToast] = useState<string | null>(null);

  // Photos: array of image URLs, first is cover
  const initialImages: string[] = useMemo(() => {
    if (existing?.images && existing.images.length > 0) return existing.images;
    if (existing?.image) return [existing.image];
    return [];
  }, [existing]);

  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // Default to stock presets if no existing photo, making adding photos immediate
  const [photoMode, setPhotoMode] = useState<"upload" | "url" | "presets">(
    initialImages.length === 0 ? "presets" : "upload"
  );
  const [imageUrlInput, setImageUrlInput] = useState("");

  // WhatsApp template message customization
  const [waTemplateMessage, setWaTemplateMessage] = useState(currentWaTemplate || DEFAULT_WA_TEMPLATE);

  // Options (e.g. Size -> S, M, L)
  const initialOptions: OptionRow[] = useMemo(() => {
    if (existing?.attributes && existing.attributes.length > 0) {
      return existing.attributes.map((attr) => ({
        name: attr.label,
        choices: attr.value,
      }));
    }
    return [];
  }, [existing]);

  const [options, setOptions] = useState<OptionRow[]>(initialOptions);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Upload photo handler with client-side compression and offline fallback
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploadingPhoto(true);
    const files = Array.from(e.target.files);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const { file: compressed, dataUrl } = await compressImageBeforeUpload(file, 1200, 0.85);
        let finalUrl = dataUrl;
        if (user?.id) {
          try {
            const path = `${user.id}/products/${Date.now()}_${compressed.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
            const { error } = await supabase.storage.from("branding").upload(path, compressed);
            if (!error) {
              const { data } = supabase.storage.from("branding").getPublicUrl(path);
              if (data?.publicUrl) finalUrl = data.publicUrl;
            }
          } catch {
            // Keep compressed dataUrl fallback so user is never blocked
          }
        }
        uploadedUrls.push(finalUrl);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error("Upload error:", err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
      alert("Please enter a valid image URL starting with https://");
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setImageUrlInput("");
  };

  // One-click apply stock idea with full attributes or image only
  const handleApplyStockIdea = (idea: StockProductIdea, full: boolean = true) => {
    const newImages = [idea.url, ...(idea.gallery || [])];
    setImages(newImages);

    if (full) {
      const isNgn = currency === "NGN";
      const mult = isNgn ? 1 : 0.001;
      setName(idea.name);
      setDescription(idea.description);
      setPrice(Math.round(idea.price * mult));
      setCategory(idea.category);
      if (idea.attributes && idea.attributes.length > 0) {
        setOptions(idea.attributes.map((a) => ({ name: a.label, choices: a.value })));
      }
      setStockToast(`Applied "${idea.name}" with photo, description & price!`);
      setTimeout(() => setStockToast(null), 3500);
    } else {
      setStockToast(`Photo added from "${idea.name}"`);
      setTimeout(() => setStockToast(null), 3000);
    }
  };

  const setCoverPhoto = (idx: number) => {
    if (idx === 0) return;
    const reordered = [...images];
    const [selected] = reordered.splice(idx, 1);
    reordered.unshift(selected);
    setImages(reordered);
  };

  const removePhoto = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  // Options helpers
  const addOptionRow = () => {
    setOptions((prev) => [...prev, { name: "", choices: "" }]);
  };

  const updateOptionRow = (idx: number, field: keyof OptionRow, val: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? { ...opt, [field]: val } : opt)));
  };

  const removeOptionRow = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // WhatsApp variable insert
  const insertWaVariable = (variable: string) => {
    setWaTemplateMessage((prev) => {
      const sep = prev.endsWith(" ") || prev.endsWith("\n") || !prev ? "" : " ";
      return `${prev}${sep}${variable}`;
    });
  };

  // Live WhatsApp buyer message preview
  const sampleOptionsString = useMemo(() => {
    return options
      .filter((o) => o.name && o.choices)
      .map((o) => `${o.name}: ${o.choices.split(",")[0]?.trim()}`)
      .join(", ");
  }, [options]);

  const liveWhatsAppPreview = useMemo(() => {
    const formatted = formatMajorMoney(typeof price === "number" ? price : parseFloat(price) || 0, currency);
    return renderWhatsAppOrderMessage(waTemplateMessage, {
      product: name.trim() || "Sample Product",
      price: formatted,
      store: bizName || "Store",
      option: sampleOptionsString,
    });
  }, [bizName, currency, name, price, sampleOptionsString, waTemplateMessage]);

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please provide a product name.");
      return;
    }

    const numericPrice = typeof price === "string" ? parseFloat(price) || 0 : price;

    const attributes: ProductAttribute[] = options
      .filter((opt) => opt.name.trim() && opt.choices.trim())
      .map((opt) => ({
        label: opt.name.trim(),
        value: opt.choices.trim(),
      }));

    const updated: Product = {
      id: existing ? existing.id : Date.now(),
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      image: images[0] || "",
      images: images,
      outOfStock,
      category: category || undefined,
      attributes: attributes.length > 0 ? attributes : undefined,
    };

    onSave(updated, waTemplateMessage);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="relative flex w-full h-[100dvh] sm:h-[88vh] max-h-[100dvh] sm:max-h-[850px] sm:max-w-2xl flex-col rounded-none sm:rounded-2xl border-0 sm:border border-[#1E2D27] bg-[#111C18] text-[#E8F1EC] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1E2D27] px-4 sm:px-6 py-3.5 bg-[#111C18]">
          <div>
            <h2 id="product-modal-title" className="text-base sm:text-lg font-bold text-[#E8F1EC]">
              {existing ? "Edit Product" : "Add Product"}
            </h2>
            <p className="text-[11px] text-[#9DB3A8]">
              Manage product media, details, pricing, and WhatsApp order message.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9DB3A8] transition hover:bg-[#14231D] hover:text-[#E8F1EC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Quick Jump Bar */}
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-[#1E2D27] bg-[#0A1210] px-4 sm:px-6 py-2 text-[11px] font-semibold text-[#9DB3A8] scrollbar-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#19C37D] shrink-0">Jump:</span>
          <button
            type="button"
            onClick={() => scrollToSection("modal-media")}
            className="shrink-0 rounded-lg px-2.5 py-1 transition hover:bg-[#14231D] hover:text-[#E8F1EC]"
          >
            1. Media & Ideas
          </button>
          <span className="text-[#24382F]">·</span>
          <button
            type="button"
            onClick={() => scrollToSection("modal-details")}
            className="shrink-0 rounded-lg px-2.5 py-1 transition hover:bg-[#14231D] hover:text-[#E8F1EC]"
          >
            2. Details & Price
          </button>
          <span className="text-[#24382F]">·</span>
          <button
            type="button"
            onClick={() => scrollToSection("modal-options")}
            className="shrink-0 rounded-lg px-2.5 py-1 transition hover:bg-[#14231D] hover:text-[#E8F1EC]"
          >
            3. Options
          </button>
          <span className="text-[#24382F]">·</span>
          <button
            type="button"
            onClick={() => scrollToSection("modal-whatsapp")}
            className="shrink-0 rounded-lg px-2.5 py-1 transition hover:bg-[#14231D] hover:text-[#E8F1EC]"
          >
            4. WhatsApp Order
          </button>
        </div>

        {/* Scrollable Form Body with contained scroll */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div ref={modalScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 overscroll-contain">
            {/* Feedback notification toast */}
            {stockToast && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 flex items-center justify-between">
                <span>{stockToast}</span>
                <button type="button" onClick={() => setStockToast(null)} className="text-emerald-400 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* 1. PRODUCT PICTURE & MEDIA */}
            <div id="modal-media" className="scroll-mt-4 rounded-xl border border-[#1E2D27] bg-[#0A1210] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E2D27] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#19C37D]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8F1EC]">
                      Product Picture & Stock Ideas
                    </h3>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#9DB3A8]">
                    Pick a ready-to-sell stock idea, upload photos, or paste an image URL.
                  </p>
                </div>

                {/* Picture input mode switcher */}
                <div className="flex items-center rounded-xl border border-[#24382F] bg-[#14231D] p-1">
                  <button
                    type="button"
                    onClick={() => setPhotoMode("presets")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
                      photoMode === "presets" ? "bg-[#19C37D] text-[#04140D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                    )}
                  >
                    Stock Ideas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode("upload")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
                      photoMode === "upload" ? "bg-[#19C37D] text-[#04140D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                    )}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode("url")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
                      photoMode === "url" ? "bg-[#19C37D] text-[#04140D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                    )}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {/* Cover & Gallery Strip */}
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {/* Active Cover Display */}
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-[#24382F] bg-[#14231D]">
                  {images[0] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[0]} alt={name || "Product"} className="h-full w-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#19C37D] px-2 py-0.5 text-[9px] font-bold text-[#04140D]">
                        Cover
                      </span>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-[#9DB3A8]">
                      <ImageIcon className="h-6 w-6 opacity-40" />
                      <span className="mt-1 text-[10px]">No image yet</span>
                    </div>
                  )}
                </div>

                {/* Input area based on mode */}
                <div className="flex-1 space-y-3">
                  {photoMode === "presets" && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-medium text-[#19C37D]">
                        One-click to populate photo, title, description, category and price:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                        {STOCK_PRODUCT_IDEAS.map((idea) => (
                          <div
                            key={idea.id}
                            className="flex items-start gap-2.5 rounded-xl border border-[#24382F] bg-[#14231D] p-2.5 transition hover:border-[#19C37D]/60"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={idea.url}
                              alt={idea.name}
                              className="h-14 w-14 shrink-0 rounded-lg object-cover border border-[#24382F]"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#19C37D]">
                                {idea.category}
                              </span>
                              <h4 className="text-xs font-bold text-[#E8F1EC] truncate">
                                {idea.name}
                              </h4>
                              <p className="text-[10px] text-[#9DB3A8] line-clamp-1 mt-0.5">
                                {idea.description}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApplyStockIdea(idea, true)}
                                  className="rounded-lg bg-[#19C37D] px-2.5 py-1 text-[10px] font-bold text-[#04140D] hover:bg-[#16B070] transition"
                                >
                                  + Use Full Idea
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyStockIdea(idea, false)}
                                  className="text-[10px] text-[#9DB3A8] hover:text-[#E8F1EC] underline"
                                >
                                  Photo only
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {photoMode === "upload" && (
                    <div>
                      <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#5C7C6D]/60 bg-[#14231D] p-4 text-center cursor-pointer transition hover:border-[#19C37D]">
                        {isUploadingPhoto ? (
                          <div className="flex items-center gap-2 text-xs text-[#19C37D]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing photo...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-[#19C37D]" />
                            <p className="mt-1.5 text-xs font-medium text-[#E8F1EC]">
                              Click to select photos or drop files here
                            </p>
                            <p className="text-[10px] text-[#9DB3A8]">
                              JPEG, PNG, WebP up to 10MB (automatically compressed)
                            </p>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingPhoto}
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                  )}

                  {photoMode === "url" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-1 rounded-xl border border-[#5C7C6D] bg-[#14231D] px-3.5 py-2 text-xs text-[#E8F1EC] outline-none focus:border-[#19C37D]"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="rounded-xl bg-[#19C37D] px-4 py-2 text-xs font-semibold text-[#04140D] transition hover:bg-[#16B070]"
                        >
                          Add URL
                        </button>
                      </div>
                      <p className="text-[10px] text-[#9DB3A8]">
                        Paste any public image link from Instagram, Shopify, Unsplash, or Cloudinary.
                      </p>
                    </div>
                  )}

                  {/* Additional photos gallery */}
                  {images.length > 1 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-semibold text-[#9DB3A8]">
                        Gallery Photos ({images.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group h-14 w-14 overflow-hidden rounded-lg border border-[#24382F] bg-[#14231D]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className="h-full w-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-0.5 left-0.5 rounded bg-[#19C37D] px-1 py-0.2 text-[8px] font-bold text-[#04140D]">
                                Cover
                              </span>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/70 opacity-0 transition group-hover:opacity-100">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => setCoverPhoto(idx)}
                                  className="rounded bg-[#14231D] px-1 text-[9px] text-[#19C37D]"
                                  title="Make cover"
                                >
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removePhoto(idx)}
                                className="rounded bg-[#14231D] p-1 text-[9px] text-[#FF8A8A]"
                                title="Remove photo"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. PRODUCT NAME & PRICE */}
            <div id="modal-details" className="scroll-mt-4 grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#E8F1EC]">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Signature Oxford Cotton Shirt"
                  className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#E8F1EC]">Price ({currency}) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="18500"
                  className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm font-semibold tabular-nums text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                />
              </div>
            </div>

            {/* 3. CATEGORY & STOCK */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#E8F1EC]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                >
                  <option value="">No category</option>
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#E8F1EC]">Inventory Availability</label>
                <div className="mt-1.5 flex h-[44px] items-center gap-3 rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5">
                  <input
                    type="checkbox"
                    id="out-of-stock-toggle"
                    checked={outOfStock}
                    onChange={(e) => setOutOfStock(e.target.checked)}
                    className="h-4 w-4 rounded border-[#1E2D27] text-[#19C37D] focus:ring-[#19C37D]"
                  />
                  <label htmlFor="out-of-stock-toggle" className="text-xs font-medium text-[#E8F1EC] cursor-pointer">
                    Mark as Sold Out (shown with Sold Out badge)
                  </label>
                </div>
              </div>
            </div>

            {/* 4. DESCRIPTION */}
            <div>
              <label className="block text-xs font-semibold text-[#E8F1EC]">Product Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe material, fit, sizing notes or care instructions..."
                className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
              />
            </div>

            {/* 5. OPTIONS (VARIANTS) */}
            <div id="modal-options" className="scroll-mt-4 rounded-xl border border-[#1E2D27] bg-[#0A1210] p-4">
              <div className="flex items-center justify-between border-b border-[#1E2D27] pb-2.5">
                <div>
                  <span className="text-xs font-bold text-[#E8F1EC]">Product Options & Sizes</span>
                  <p className="text-[11px] text-[#9DB3A8]">
                    e.g. Size (Small, Medium, Large) or Color (Black, Tan)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOptionRow}
                  className="flex min-h-[34px] items-center gap-1 rounded-xl border border-[#24382F] bg-[#14231D] px-3 py-1.5 text-xs font-medium text-[#19C37D] hover:bg-[#19C37D]/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add option</span>
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {options.length === 0 ? (
                  <p className="py-2 text-center text-xs text-[#9DB3A8]">
                    No custom options added yet. Click &quot;Add option&quot; if this item comes in different sizes or colors.
                  </p>
                ) : (
                  options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => updateOptionRow(idx, "name", e.target.value)}
                        placeholder="Option name (e.g. Size)"
                        className="w-1/3 rounded-xl border border-[#5C7C6D] bg-[#14231D] px-3 py-2 text-xs text-[#E8F1EC] outline-none focus:border-[#19C37D]"
                      />
                      <input
                        type="text"
                        value={opt.choices}
                        onChange={(e) => updateOptionRow(idx, "choices", e.target.value)}
                        placeholder="Choices separated by commas (e.g. Small, Medium, Large)"
                        className="flex-1 rounded-xl border border-[#5C7C6D] bg-[#14231D] px-3 py-2 text-xs text-[#E8F1EC] outline-none focus:border-[#19C37D]"
                      />
                      <button
                        type="button"
                        onClick={() => removeOptionRow(idx)}
                        className="p-2 text-[#9DB3A8] hover:text-[#FF8A8A]"
                        title="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6. WHATSAPP ORDER MESSAGE (EDITABLE & LIVE PREVIEW) */}
            <div id="modal-whatsapp" className="scroll-mt-4 rounded-xl border border-[#1E2D27] bg-[#0A1210] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2D27] pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#19C37D]" />
                  <span className="text-xs font-bold text-[#E8F1EC]">
                    WhatsApp Order Message Customization
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaTemplateMessage(DEFAULT_WA_TEMPLATE)}
                  className="flex items-center gap-1 text-[11px] text-[#9DB3A8] hover:text-[#E8F1EC]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset default</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#9DB3A8] mb-1.5">
                  Insert Variables into WhatsApp Message:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALLOWED_TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertWaVariable(v)}
                      className="rounded-lg border border-[#24382F] bg-[#14231D] px-2.5 py-1 text-[11px] font-medium text-[#19C37D] hover:border-[#19C37D]"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={waTemplateMessage}
                  onChange={(e) => setWaTemplateMessage(e.target.value)}
                  placeholder={DEFAULT_WA_TEMPLATE}
                  className="w-full rounded-xl border border-[#5C7C6D] bg-[#14231D] p-3 text-xs text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                />
              </div>

              {/* Rendered Live WhatsApp Message Preview */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9DB3A8]">
                  Buyer WhatsApp Message Preview
                </span>
                <div className="mt-1.5 rounded-xl border border-[#24382F] bg-[#14231D] p-3.5 text-xs text-[#E8F1EC]">
                  <p className="whitespace-pre-line leading-relaxed text-[#E8F1EC]/90 font-mono">
                    {liveWhatsAppPreview}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer Actions - Always visible across mobile, tablet, and desktop */}
          <div className="sticky bottom-0 z-30 flex shrink-0 items-center justify-between sm:justify-end gap-3 border-t border-[#1E2D27] bg-[#0E1714] px-4 sm:px-6 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-2xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial flex items-center justify-center min-h-[44px] rounded-xl border border-[#24382F] bg-[#14231D] sm:border-transparent sm:bg-transparent px-5 py-2.5 text-xs font-semibold text-[#9DB3A8] transition hover:text-[#E8F1EC] hover:bg-[#1C2E26] active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial flex items-center justify-center min-h-[44px] gap-2 rounded-xl bg-[#19C37D] px-6 py-2.5 text-xs font-bold text-[#04140D] transition hover:bg-[#16B070] active:scale-95 shadow-md shadow-[#19C37D]/25"
            >
              <Check className="h-4 w-4" />
              <span>{existing ? "Save changes" : "Add product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
