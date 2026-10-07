"use client";

import { useState, useEffect, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { TemplatePreviewModal } from "@/components/storefront/TemplatePreviewModal";
import { CountrySelector } from "@/components/CountrySelector";
import { formatMoney } from "@/lib/currency";
import { supabase } from "@/lib/supabase-client";
import type { Product, ShopState } from "@/lib/schema";
import { cn } from "@/lib/utils";
import {
  Store,
  Palette,
  Plus,
  Trash2,
  Upload,
  Check,
  ExternalLink,
  Copy,
  Eye,
  X,
  Package,
  Loader2,
  MessageSquare,
} from "lucide-react";

/**
 * Client-side image compressor.
 * Downscales images to max 1200px and compresses to JPEG ~85% quality before upload.
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    // If not an image or SVG, return as is
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function StoreEditorView() {
  const { user, state: globalState, saveFullState, addToast } = useSwiftLink();
  const [activeTab, setActiveTab] = useState<"products" | "design">("products");
  const [localState, setLocalState] = useState<ShopState>(globalState);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Template preview modal state
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Add / Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Category input state
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Country code selector state
  const [countryCode, setCountryCode] = useState("NG");

  // Sync from globalState when loaded
  useEffect(() => {
    if (!isDirty) {
      setLocalState(globalState);
    }
  }, [globalState, isDirty]);

  // Warn before closing tab if unsaved
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

  const updateField = <K extends keyof ShopState>(key: K, val: ShopState[K]) => {
    setLocalState((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveFullState(localState);
      setIsDirty(false);
      addToast("Store settings saved successfully.", "success");
    } catch (err: any) {
      addToast(err?.message || "Failed to save store changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Image uploader
  const uploadImage = async (file: File, pathPrefix: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      if (user) {
        const path = `${user.id}/${pathPrefix}/${Date.now()}_${compressed.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error } = await supabase.storage.from("branding").upload(path, compressed);
        if (!error) {
          const { data } = supabase.storage.from("branding").getPublicUrl(path);
          if (data?.publicUrl) return data.publicUrl;
        }
      }

      // Local fallback to Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressed);
      });
    } catch {
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Category management
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    const currentCats = localState.categories || [];
    if (!currentCats.includes(trimmed)) {
      updateField("categories", [...currentCats, trimmed]);
      setNewCategoryInput("");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const currentCats = localState.categories || [];
    updateField("categories", currentCats.filter((c) => c !== cat));
  };

  // Product CRUD
  const handleOpenAddProduct = () => {
    const newP: Product = {
      id: Date.now(),
      name: "",
      price: 0,
      description: "",
      image: "",
      images: [],
      outOfStock: false,
      category: localState.categories?.[0] || "",
      attributes: [],
    };
    setEditingProduct(newP);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct({
      ...p,
      images: p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
      attributes: p.attributes || [],
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string | number) => {
    const updated = localState.products.filter((p) => p.id !== productId);
    updateField("products", updated);
    addToast("Product removed.", "info");
  };

  const handleToggleProductStock = (productId: string | number) => {
    const updated = localState.products.map((p) =>
      p.id === productId ? { ...p, outOfStock: !p.outOfStock } : p
    );
    updateField("products", updated);
  };

  const handleSaveProductModal = () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      addToast("Please provide a product name.", "error");
      return;
    }

    const primaryImage = editingProduct.images?.[0] || editingProduct.image || "";
    const finalizedProduct: Product = {
      ...editingProduct,
      image: primaryImage,
    };

    const exists = localState.products.some((p) => p.id === finalizedProduct.id);
    let updatedProducts: Product[];
    if (exists) {
      updatedProducts = localState.products.map((p) =>
        p.id === finalizedProduct.id ? finalizedProduct : p
      );
    } else {
      updatedProducts = [finalizedProduct, ...localState.products];
    }

    updateField("products", updatedProducts);
    setIsProductModalOpen(false);
    setEditingProduct(null);
    addToast("Product updated in draft.", "success");
  };

  const storeUrl = `swiftlink.pro/${localState.storeUsername || "your-store"}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 pb-16 sm:pb-24 text-[#E8F1EC]">
      {/* Header with Navigation Tabs and Save Button */}
      <header className="flex flex-col gap-4 border-b border-[#1E2D27] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">Store Editor</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9DB3A8]">
            Manage your catalog, storefront information, and website design.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs font-medium text-[#E8B93A] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E8B93A] animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-[#19C37D] px-6 py-2.5 text-xs font-semibold text-[#04140D] hover:bg-[#15A86B] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#1E2D27] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex min-h-[44px] items-center gap-2 rounded-[12px] px-5 py-2.5 text-xs font-semibold transition-colors",
            activeTab === "products"
              ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
              : "text-[#9DB3A8] hover:bg-[#111C18] hover:text-[#E8F1EC]"
          )}
        >
          <Store className="h-4 w-4" />
          <span>Products &amp; Store</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={cn(
            "flex min-h-[44px] items-center gap-2 rounded-[12px] px-5 py-2.5 text-xs font-semibold transition-colors",
            activeTab === "design"
              ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
              : "text-[#9DB3A8] hover:bg-[#111C18] hover:text-[#E8F1EC]"
          )}
        >
          <Palette className="h-4 w-4" />
          <span>Design &amp; Theme</span>
        </button>
      </div>

      {/* ─────────────────── TAB 1: PRODUCTS & STORE ─────────────────── */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Card 1: Store Profile */}
          <div className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-semibold text-[#E8F1EC] border-b border-[#1E2D27] pb-3">
              Store Profile
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#24382F] bg-[#14231D] flex items-center justify-center">
                  {localState.bizImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={localState.bizImage}
                      alt={localState.bizName || "Store logo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="h-8 w-8 text-[#9DB3A8]" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-[#19C37D]" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-4 py-2 text-xs font-medium text-[#E8F1EC] hover:bg-[#1A2D25] transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file, "profile");
                          if (url) updateField("bizImage", url);
                        }
                      }}
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-[#9DB3A8]">Square photo, recommended 400x400</p>
                </div>
              </div>

              {/* Store Link */}
              <div>
                <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                  Store Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] truncate">
                    {storeUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${storeUrl}`);
                      addToast("Store link copied to clipboard.", "success");
                    }}
                    className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3 text-[#9DB3A8] hover:text-[#E8F1EC] hover:bg-[#1A2D25] transition-colors"
                    aria-label="Copy store link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`https://${storeUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3 text-[#9DB3A8] hover:text-[#E8F1EC] hover:bg-[#1A2D25] transition-colors"
                    aria-label="Visit store"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  value={localState.bizName || ""}
                  onChange={(e) => updateField("bizName", e.target.value)}
                  placeholder="e.g. Kemi Studio"
                  className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                />
              </div>

              {/* WhatsApp Number with Country Picker */}
              <div>
                <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                  WhatsApp Number
                </label>
                <div className="flex gap-2">
                  <CountrySelector
                    value={countryCode}
                    onChange={(_dial, code) => setCountryCode(code)}
                  />
                  <input
                    type="tel"
                    value={localState.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="8012345678"
                    className="flex-1 rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#9DB3A8]">
                  Buyers tap on your store and message this WhatsApp number directly.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: About & Socials */}
          <div className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-semibold text-[#E8F1EC] border-b border-[#1E2D27] pb-3">
              About &amp; Social Links
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                  Store Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={localState.bio || ""}
                  onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="What does your store sell? e.g. Handmade linen apparel and everyday accessories based in Lagos."
                  className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={localState.location || ""}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                    Delivery Areas
                  </label>
                  <input
                    type="text"
                    value={localState.deliveryAreas || ""}
                    onChange={(e) => updateField("deliveryAreas", e.target.value)}
                    placeholder="e.g. Nationwide delivery (Lagos, Abuja, PH)"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={localState.socials?.instagram || ""}
                    onChange={(e) =>
                      updateField("socials", {
                        ...localState.socials,
                        instagram: e.target.value.replace(/^@/, ""),
                      })
                    }
                    placeholder="handle"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                    TikTok Handle
                  </label>
                  <input
                    type="text"
                    value={localState.socials?.tiktok || ""}
                    onChange={(e) =>
                      updateField("socials", {
                        ...localState.socials,
                        tiktok: e.target.value.replace(/^@/, ""),
                      })
                    }
                    placeholder="handle"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9DB3A8] mb-1.5">
                    Twitter / X Handle
                  </label>
                  <input
                    type="text"
                    value={localState.socials?.twitter || ""}
                    onChange={(e) =>
                      updateField("socials", {
                        ...localState.socials,
                        twitter: e.target.value.replace(/^@/, ""),
                      })
                    }
                    placeholder="handle"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Categories */}
          <div className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#E8F1EC] border-b border-[#1E2D27] pb-3">
              Categories
            </h2>

            <div className="flex flex-wrap gap-2">
              {(localState.categories || []).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#24382F] bg-[#14231D] px-3 py-1.5 text-xs text-[#E8F1EC]"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-[#9DB3A8] hover:text-[#E8F1EC]"
                    aria-label={`Remove ${cat}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex max-w-sm gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Add category name"
                className="flex-1 rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="flex min-h-[44px] items-center gap-1 rounded-[10px] bg-[#14231D] border border-[#24382F] px-4 py-2 text-xs font-semibold text-[#19C37D] hover:bg-[#1A2D25] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Card 4: Products List */}
          <div className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1E2D27] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#E8F1EC]">Products List</h2>
                <p className="text-xs text-[#9DB3A8]">
                  {localState.products.length} product{localState.products.length === 1 ? "" : "s"} in your store catalog
                </p>
              </div>

              {/* EXACTLY ONE BUTTON AS REQUIRED */}
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#19C37D] px-5 py-2.5 text-xs font-semibold text-[#04140D] hover:bg-[#15A86B] transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add product</span>
              </button>
            </div>

            {localState.products.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-10 w-10 text-[#9DB3A8] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#E8F1EC]">No products added yet</h3>
                <p className="mt-1 text-xs text-[#9DB3A8] max-w-sm mx-auto">
                  Click &ldquo;Add product&rdquo; above to create your first item with photos, pricing, and options.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1E2D27]">
                {localState.products.map((product) => {
                  const coverImage = product.images?.[0] || product.image;
                  return (
                    <div
                      key={product.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#24382F] bg-[#14231D] flex items-center justify-center">
                          {coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coverImage}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-[#9DB3A8]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#E8F1EC] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#9DB3A8]">
                            {product.category || "General"} &bull;{" "}
                            <span className="text-[#19C37D] font-medium">
                              {formatMoney(
                                Math.round(Number(product.price || 0) * 100),
                                localState.currency || "NGN"
                              )}
                            </span>
                          </p>
                          {product.attributes && product.attributes.length > 0 && (
                            <p className="text-[11px] text-[#9DB3A8]/80 mt-0.5 truncate">
                              Options: {product.attributes.map((a) => `${a.label}: ${a.value}`).join("; ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {/* In-stock toggle */}
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9DB3A8]">
                          <span>{product.outOfStock ? "Sold out" : "In stock"}</span>
                          <input
                            type="checkbox"
                            checked={!product.outOfStock}
                            onChange={() => handleToggleProductStock(product.id)}
                            className="accent-[#19C37D] h-4 w-4 rounded"
                          />
                        </label>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(product)}
                          className="flex min-h-[44px] items-center rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2 text-xs font-medium text-[#E8F1EC] hover:bg-[#1A2D25] transition-colors"
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex min-h-[44px] items-center rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                          aria-label={`Delete ${product.name}`}
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
        </div>
      )}

      {/* ─────────────────── TAB 2: DESIGN & THEME ─────────────────── */}
      {activeTab === "design" && (
        <div className="space-y-6">
          {/* Templates Grid with Live Preview */}
          <div className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1E2D27] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#E8F1EC]">Storefront Templates</h2>
                <p className="text-xs text-[#9DB3A8]">
                  Select the website layout for your store. Each template adapts to your brand.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {websiteTemplates.map((template) => {
                const isSelected = (localState.websiteTemplateId || "editorial") === template.id;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "flex flex-col rounded-2xl border p-4 transition-all",
                      isSelected
                        ? "border-[#19C37D] bg-[#14231D]"
                        : "border-[#1E2D27] bg-[#0A1210] hover:border-[#24382F]"
                    )}
                  >
                    <div className="overflow-hidden rounded-xl border border-[#1E2D27]">
                      <TemplateFrame
                        id={template.id}
                        appearance="dark"
                        currency={localState.currency || "NGN"}
                        size="card"
                      />
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-[#E8F1EC]">{template.name}</h3>
                          {isSelected && (
                            <span className="rounded-full bg-[#19C37D]/20 px-2 py-0.5 text-[10px] font-semibold text-[#19C37D]">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#9DB3A8] line-clamp-2">
                          {template.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateField("websiteTemplateId", template.id)}
                          className={cn(
                            "flex-1 min-h-[44px] rounded-[10px] py-2 text-xs font-semibold transition-colors",
                            isSelected
                              ? "bg-[#19C37D] text-[#04140D]"
                              : "bg-[#14231D] text-[#E8F1EC] border border-[#1E2D27] hover:bg-[#1A2D25]"
                          )}
                        >
                          {isSelected ? "Selected" : "Use template"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTemplateId(template.id)}
                          className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3 text-[#9DB3A8] hover:text-[#E8F1EC]"
                          aria-label={`Preview ${template.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accent Color Customizer */}
          <div className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#E8F1EC] border-b border-[#1E2D27] pb-3">
              Accent Color
            </h2>
            <p className="text-xs text-[#9DB3A8]">
              Your accent color styles buttons, badges, and highlights across the storefront.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: "Emerald", hex: "#19C37D" },
                { label: "Indigo", hex: "#6366F1" },
                { label: "Rose", hex: "#F43F5E" },
                { label: "Amber", hex: "#F59E0B" },
                { label: "Ocean", hex: "#0EA5E9" },
                { label: "Classic Dark", hex: "#E8F1EC" },
              ].map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => updateField("accentColor", swatch.hex)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-2 rounded-[12px] border px-3.5 py-2 text-xs font-medium transition-all",
                    localState.accentColor === swatch.hex
                      ? "border-[#19C37D] bg-[#14231D] text-[#E8F1EC]"
                      : "border-[#1E2D27] bg-[#0A1210] text-[#9DB3A8] hover:border-[#24382F]"
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/20"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span>{swatch.label}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 rounded-[12px] border border-[#1E2D27] bg-[#0A1210] px-3 py-1.5">
                <input
                  type="color"
                  value={localState.accentColor || "#19C37D"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="h-7 w-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={localState.accentColor || "#19C37D"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="w-20 bg-transparent text-xs text-[#E8F1EC] uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── ADD / EDIT PRODUCT MODAL ─────────────────── */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-[20px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 text-[#E8F1EC] shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#1E2D27] pb-4 mb-5">
              <h2 className="text-lg font-bold text-[#E8F1EC]">
                {localState.products.some((p) => p.id === editingProduct.id)
                  ? "Edit product"
                  : "Add product"}
              </h2>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#9DB3A8] hover:text-[#E8F1EC] p-1"
                aria-label="Close product modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Product Photos (First is Cover) */}
              <div>
                <label className="block text-xs font-semibold text-[#E8F1EC] mb-1.5">
                  Photos (First photo is the cover)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {(editingProduct.images || []).map((imgUrl, idx) => (
                    <div
                      key={imgUrl}
                      className="relative h-20 w-20 rounded-xl overflow-hidden border border-[#24382F] bg-[#14231D]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-center text-[9px] font-bold text-[#19C37D] uppercase">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingProduct.images || []).filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, images: updated });
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1E2D27] bg-[#14231D] text-[#9DB3A8] hover:border-[#19C37D] hover:text-[#E8F1EC] transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#19C37D]" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span className="mt-1 text-[10px] font-medium">Add photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file, `product_${editingProduct.id}`);
                          if (url) {
                            const cur = editingProduct.images || [];
                            setEditingProduct({ ...editingProduct, images: [...cur, url] });
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Product Name & Price */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#E8F1EC] mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    placeholder="e.g. Linen Overshirt"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#E8F1EC] mb-1.5">
                    Price ({localState.currency || "NGN"}) *
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="18500"
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Stock Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#E8F1EC] mb-1.5">
                    Category
                  </label>
                  <select
                    value={editingProduct.category || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  >
                    <option value="">General</option>
                    {(localState.categories || []).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#E8F1EC]">
                    <input
                      type="checkbox"
                      checked={!editingProduct.outOfStock}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, outOfStock: !e.target.checked })
                      }
                      className="accent-[#19C37D] h-4 w-4 rounded"
                    />
                    <span>Item is currently in stock</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#E8F1EC] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  placeholder="Material, measurements, and product details."
                  className="w-full rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2.5 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                />
              </div>

              {/* Options (Name + Comma-separated choices) */}
              <div>
                <label className="block text-xs font-semibold text-[#E8F1EC] mb-1.5">
                  Options (e.g. Size, Color)
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={editingProduct.attributes?.[0]?.label || ""}
                    onChange={(e) => {
                      const curVal = editingProduct.attributes?.[0]?.value || "";
                      setEditingProduct({
                        ...editingProduct,
                        attributes: [{ label: e.target.value, value: curVal }],
                      });
                    }}
                    placeholder="Option name (e.g. Size)"
                    className="rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editingProduct.attributes?.[0]?.value || ""}
                    onChange={(e) => {
                      const curLabel = editingProduct.attributes?.[0]?.label || "Option";
                      setEditingProduct({
                        ...editingProduct,
                        attributes: [{ label: curLabel, value: e.target.value }],
                      });
                    }}
                    placeholder="Choices (e.g. Small, Medium, Large)"
                    className="rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-3.5 py-2 text-xs text-[#E8F1EC] focus:border-[#19C37D] focus:outline-none"
                  />
                </div>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="rounded-xl border border-[#24382F] bg-[#14231D] p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#19C37D] mb-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp Message Preview (What buyers will send)</span>
                </div>
                <div className="rounded-lg bg-[#111C18] p-3 text-xs text-[#E8F1EC] font-medium leading-relaxed border border-[#1E2D27]">
                  &ldquo;Hello {localState.bizName || "Store"}, I want to order{" "}
                  <strong>{editingProduct.name || "Product Name"}</strong> (
                  {formatMoney(
                    Math.round(Number(editingProduct.price || 0) * 100),
                    localState.currency || "NGN"
                  )}
                  )
                  {editingProduct.attributes?.[0]?.value
                    ? ` - ${editingProduct.attributes[0].label}: ${editingProduct.attributes[0].value.split(",")[0]?.trim()}`
                    : ""}
                  . Is it available?&rdquo;
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#1E2D27] pt-4">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="flex min-h-[44px] items-center rounded-[10px] border border-[#1E2D27] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#9DB3A8] hover:text-[#E8F1EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProductModal}
                className="flex min-h-[44px] items-center rounded-[10px] bg-[#19C37D] px-6 py-2 text-xs font-semibold text-[#04140D] hover:bg-[#15A86B]"
              >
                Save product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          templateId={previewTemplateId}
          vendorState={localState}
          isOpen={!!previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
          onSelectTemplate={(id: string) => {
            updateField("websiteTemplateId", id as any);
            setPreviewTemplateId(null);
          }}
        />
      )}
    </div>
  );
}
