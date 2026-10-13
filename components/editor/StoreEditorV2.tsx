"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { ShopState, Product, ProductAttribute } from "@/lib/schema";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { formatMajorMoney } from "@/lib/currency";
import { normalizePhoneNumber, splitPhoneNumber, cleanPastedNationalNumber } from "@/lib/phone";
import { websiteTemplates, websiteTemplateById, WebsiteTemplateId } from "@/lib/theme/templates";
import {
  effectiveProductLimitFor,
  hiddenProductCount,
  isProductVisible,
  productLimitBlockedMessage,
  visibleProductCount,
  isTemplateAllowedOnPlan,
  templateUpgradeRequiredMessage,
  FREE_TEMPLATE_IDS,
} from "@/lib/plans";
import { themeToCssVars } from "@/lib/theme/derive";
import { DEFAULT_WA_TEMPLATE, renderWhatsAppOrderMessage, ALLOWED_TEMPLATE_VARIABLES, validateWhatsAppTemplate } from "@/lib/whatsapp-template";
import { DiscountCodesSection } from "@/components/editor/DiscountCodesSection";
import { sanitizeDiscountCodes } from "@/lib/discounts";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { TemplatePreviewModal } from "@/components/storefront/TemplatePreviewModal";
import { TemplateSite } from "@/components/storefront/template-sites";
import { CountrySelector } from "@/components/CountrySelector";
import { compressImageBeforeUpload } from "@/lib/image-compress";
import { STOCK_PRODUCT_IDEAS, type StockProductIdea } from "@/lib/stock-ideas";
import { describeDraftAge, hasDraftChanges, readEditorDraft } from "@/lib/draft-store";
import { pickNewestDraft, storeDraftKey } from "@/lib/store-drafts";

/** Idle time before the draft autosaves. Short enough to feel instant, long
 *  enough that typing a product name doesn't fire a write per keystroke. */
const AUTOSAVE_DELAY_MS = 1800;
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
  EyeOff,
  Pause,
  Play,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";

interface OptionRow {
  name: string;
  choices: string;
}

export function StoreEditorV2() {
  const { state: globalState, saveFullState, saveDraft, discardDraft, drafts, addToast, user } = useSwiftLink();

  // Local working copy of store state
  const [localState, setLocalState] = useState<ShopState>(() => JSON.parse(JSON.stringify(globalState)));
  const [activeTab, setActiveTab] = useState<"products" | "design">("products");
  const [isSaving, setIsSaving] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [designViewport, setDesignViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [previewMode, setPreviewMode] = useState<"light" | "dark">(() => (globalState.storefrontTheme?.background === "light" ? "light" : "dark"));
  const [previewCartCount, setPreviewCartCount] = useState<number>(1);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Debounced store handle uniqueness check against Supabase
  useEffect(() => {
    const handle = (localState.storeUsername || "").trim().toLowerCase();
    const currentGlobal = (globalState.storeUsername || "").trim().toLowerCase();
    if (!handle || handle === currentGlobal) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("stores")
          .select("id")
          .ilike("store_username", handle)
          .maybeSingle();

        const currentStoreId = localState.id || globalState.id || user?.id;
        if (data && data.id !== currentStoreId) {
          setHandleStatus("taken");
        } else {
          setHandleStatus("available");
        }
      } catch {
        setHandleStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localState.storeUsername, localState.id, globalState.storeUsername, globalState.id, user?.id]);

  // Quick populate 4 stock ideas for instant zero-to-one store launch
  const handlePopulateStockIdeas = () => {
    if (visibleProductCount(localState.products) >= effectiveProductLimitFor(localState.plan)) {
      addToast(productLimitBlockedMessage(localState.plan), "error");
      return;
    }
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
    const baseTheme =
      previewMode === "dark"
        ? currentTemplate.dark || currentTemplate.light
        : currentTemplate.light || currentTemplate.dark;
    const tenantTheme = localState.accentColor
      ? { ...baseTheme, brandColor: localState.accentColor }
      : baseTheme;
    const rawVars = themeToCssVars(tenantTheme) as Record<string, string>;
    if (localState.accentColor) {
      rawVars["--t-accent"] = localState.accentColor;
      rawVars["--theme-color"] = localState.accentColor;
    }
    return rawVars as React.CSSProperties;
  }, [currentTemplate, previewMode, localState.accentColor]);

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

  // ─── Autosave (item 5.2) ──────────────────────────────────────────────────
  // The draft is the merchant's working copy. It is written to this device and
  // (when possible) to their private `store_drafts` row — never to the live
  // store, so customers never see unpublished work.
  const storeKey = useMemo(() => storeDraftKey(localState), [localState.id, localState.ownerId]);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftSynced, setDraftSynced] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const restoreAppliedRef = useRef(false);
  const [, setDraftClock] = useState(0);

  // Offer back whatever unsaved work survived the last visit. Auto-applied — the
  // whole point is that nothing is lost — with a visible banner and a Discard.
  //
  // Deliberately re-runs while nothing has been applied: the local copy is read
  // synchronously, but the server copy only arrives with the context's store
  // fetch, and the case we care about most (edited on another device, or after
  // clearing browser storage) is exactly the one with no local copy. The guard
  // is `isDirty`, not a "ran once" flag, so typing always wins over a late draft.
  useEffect(() => {
    if (restoreAppliedRef.current || isDirty) return;
    const candidate = pickNewestDraft(readEditorDraft(storeKey), storeKey ? drafts[storeKey] : null);
    if (!candidate || !hasDraftChanges(candidate, globalState)) return;
    restoreAppliedRef.current = true;
    setLocalState(JSON.parse(JSON.stringify(candidate.state)));
    // `initialSerialized` keeps tracking the *live* store, so the restore shows
    // up as unsaved work and the Save button stays armed.
    setRestoredFrom(candidate.savedAt);
  }, [storeKey, drafts, isDirty, globalState]);

  useEffect(() => {
    if (!isDirty || isSaving) return;
    const timer = setTimeout(async () => {
      setDraftSaving(true);
      const result = await saveDraft(localState);
      setDraftSaving(false);
      if (result.savedAt) {
        setDraftSavedAt(result.savedAt);
        setDraftSynced(result.synced);
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [localState, isDirty, isSaving, saveDraft]);

  // Keep the "saved N min ago" label honest without re-rendering on every edit.
  useEffect(() => {
    if (!draftSavedAt || !isDirty) return;
    const interval = setInterval(() => setDraftClock((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, [draftSavedAt, isDirty]);

  // Save changes handler
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    if (handleStatus === "taken") {
      addToast(`Handle "@${localState.storeUsername}" is already taken by another store. Store handles must be unique, like a domain name.`, "error");
      return;
    }
    setIsSaving(true);
    try {
      await saveFullState(localState);
      initialSerialized.current = JSON.stringify(localState);
      // The draft is dropped by `persistState` only once the live write actually
      // succeeds, so a failed publish leaves the safety net in place.
      setDraftSavedAt(null);
      setRestoredFrom(null);
      addToast("Store changes saved successfully.", "success");
    } catch (err: any) {
      addToast(`Failed to save: ${err?.message || "Please try again."}`, "error");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, localState, saveFullState, addToast, handleStatus]);

  // Direct auto-save action whenever a merchant selects a template
  const handleAutoSaveTemplate = useCallback(
    async (templateId: WebsiteTemplateId) => {
      const templateName = websiteTemplateById(templateId)?.name || templateId;
      if (!isTemplateAllowedOnPlan(templateId, localState.plan)) {
        addToast(templateUpgradeRequiredMessage(templateName), "error");
        return;
      }
      const next = { ...localState, websiteTemplateId: templateId };
      setLocalState(next);
      try {
        await saveFullState(next);
        await saveDraft(next);
        initialSerialized.current = JSON.stringify(next);
        addToast(`Applied & saved "${templateName}" template live!`, "success");
      } catch {
        addToast(`Template applied to store.`, "info");
      }
    },
    [localState, saveFullState, saveDraft, addToast]
  );

  // Direct auto-save action whenever a merchant toggles light / dark mode
  const handleAutoSaveThemeMode = useCallback(
    async (mode: "light" | "dark") => {
      setPreviewMode(mode);
      const next: ShopState = {
        ...localState,
        storefrontTheme: {
          ...(localState.storefrontTheme || {}),
          background: mode,
        },
        bgColor: mode === "dark" ? "#09090b" : "#ffffff",
        textColor: mode === "dark" ? "#f4f4f5" : "#111827",
        surfaceColor: mode === "dark" ? "#141416" : "#ffffff",
      };
      setLocalState(next);
      try {
        await saveFullState(next);
        await saveDraft(next);
        initialSerialized.current = JSON.stringify(next);
        addToast(`Switched to ${mode === "dark" ? "Dark" : "Light"} mode & saved live!`, "success");
      } catch {
        addToast(`Theme mode updated.`, "info");
      }
    },
    [localState, saveFullState, saveDraft, addToast]
  );

  // Direct auto-save action whenever an accent color is clicked
  const handleAutoSaveAccentColor = useCallback(
    async (color: string) => {
      const next: ShopState = {
        ...localState,
        accentColor: color,
        buttonColor: color,
      };
      setLocalState(next);
      try {
        await saveFullState(next);
        initialSerialized.current = JSON.stringify(next);
        addToast(`Saved brand accent color live!`, "success");
      } catch {
        addToast(`Accent color updated.`, "info");
      }
    },
    [localState, saveFullState, addToast]
  );

  const handleDiscardDraft = useCallback(async () => {
    await discardDraft(storeKey);
    setLocalState(JSON.parse(JSON.stringify(globalState)));
    initialSerialized.current = JSON.stringify(globalState);
    setRestoredFrom(null);
    setDraftSavedAt(null);
    addToast("Unsaved changes discarded. Showing your live store.", "info");
  }, [discardDraft, storeKey, globalState, addToast]);

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

  // Social share / OG image upload
  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const handleOgImageUpload = async (file: File) => {
    if (!user) {
      addToast("Please sign in to upload images.", "error");
      return;
    }
    setIsUploadingOg(true);
    try {
      const { file: compressedFile } = await compressImageBeforeUpload(file, 1200, 0.85);
      const path = `${user.id}/branding/og_${Date.now()}_${compressedFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("branding").upload(path, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      updateField("ogImage", data.publicUrl);
      addToast("Social share image updated.", "success");
    } catch (err: any) {
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingOg(false);
    }
  };

  // FAQ management
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      addToast("Both question and answer are required.", "error");
      return;
    }
    const currentFaqs = localState.faqItems || [
      {
        q: "How does ordering on WhatsApp work?",
        a: "Browse the catalog, add what you want to your cart, then tap Order on WhatsApp. Your items and quantities are formatted into a message and sent straight to the store.",
      },
      {
        q: "How do I arrange payment and delivery?",
        a: "Payment and delivery are agreed directly with the store on WhatsApp.",
      },
      {
        q: "Can I ask about an item before ordering?",
        a: "Yes. Message the store on WhatsApp with any question about sizing, stock or condition.",
      },
    ];
    updateField("faqItems", [...currentFaqs, { q: newFaqQuestion.trim(), a: newFaqAnswer.trim() }]);
    setNewFaqQuestion("");
    setNewFaqAnswer("");
    setIsAddingFaq(false);
    addToast("FAQ added.", "success");
  };

  const handleRemoveFaq = (index: number) => {
    const currentFaqs = localState.faqItems || [
      {
        q: "How does ordering on WhatsApp work?",
        a: "Browse the catalog, add what you want to your cart, then tap Order on WhatsApp. Your items and quantities are formatted into a message and sent straight to the store.",
      },
      {
        q: "How do I arrange payment and delivery?",
        a: "Payment and delivery are agreed directly with the store on WhatsApp.",
      },
      {
        q: "Can I ask about an item before ordering?",
        a: "Yes. Message the store on WhatsApp with any question about sizing, stock or condition.",
      },
    ];
    updateField("faqItems", currentFaqs.filter((_, i) => i !== index));
    addToast("FAQ removed.", "info");
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
    // Only *visible* products count against the plan, so hidden ones left by a
    // downgrade never block an upgrade back into the catalogue (lib/plans.ts).
    if (visibleProductCount(localState.products) >= effectiveProductLimitFor(localState.plan)) {
      addToast(productLimitBlockedMessage(localState.plan), "error");
      return;
    }
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

  /**
   * Show/hide a product without deleting it. This is the "vendor chooses which
   * products stay visible" half of the downgrade policy: nothing is ever
   * removed, and re-showing is only blocked when the plan's visible cap is full.
   */
  const handleToggleVisibility = (id: number) => {
    const product = localState.products.find((p) => p.id === id);
    if (!product) return;
    const turningVisible = !isProductVisible(product);
    if (
      turningVisible &&
      visibleProductCount(localState.products) >= effectiveProductLimitFor(localState.plan)
    ) {
      addToast(productLimitBlockedMessage(localState.plan), "error");
      return;
    }
    updateField(
      "products",
      localState.products.map((p) => (p.id === id ? { ...p, visible: turningVisible } : p))
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
            {/* Store status and link. Wraps, so the status badge and the
                Stop / Go live button drop below the store name on a narrow
                phone instead of being squeezed off the row. */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E2D27] bg-[#14231D] text-[#19C37D]">
                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="truncate text-xs sm:text-sm font-semibold text-[#E8F1EC] max-w-[120px] xs:max-w-[160px] sm:max-w-[180px] md:max-w-[150px] lg:max-w-[220px]">
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

                  {/*
                    Stop / go live. `isLive` gates checkout (`sendWhatsAppOrder`
                    refuses when it is false), so this is the merchant's "close
                    the shop" switch — it was previously only reachable by
                    finishing onboarding, which meant nobody who already had a
                    store could ever find it.
                  */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !localState.isLive;
                      setLocalState((prev) => ({ ...prev, isLive: next }));
                      addToast(
                        next
                          ? "Store is live. Press Save to publish it."
                          : "Store paused — customers can no longer order. Press Save to publish it.",
                        "info",
                      );
                    }}
                    title={
                      localState.isLive
                        ? "Stop this store from accepting new orders"
                        : "Open this store to customers"
                    }
                    className={cn(
                      "inline-flex min-h-[26px] shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                      localState.isLive
                        ? "border-[#24382F] bg-[#0A1210] text-[#9DB3A8] hover:border-[#FF8A8A]/60 hover:text-[#FF8A8A]"
                        : "border-[#19C37D] bg-[#19C37D] text-[#04140D] hover:bg-[#16B070]",
                    )}
                  >
                    {localState.isLive ? (
                      <Pause className="h-2.5 w-2.5" />
                    ) : (
                      <Play className="h-2.5 w-2.5" />
                    )}
                    {localState.isLive ? "Stop store" : "Go live"}
                  </button>
                </div>
                {localState.storeUsername && (
                  <a
                    href={`/${localState.storeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#9DB3A8] hover:text-[#19C37D] truncate max-w-[160px] sm:max-w-none"
                  >
                    <span className="truncate">swiftlink.pro/{localState.storeUsername}</span>
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
                onClick={() => setPreviewTemplateId(localState.websiteTemplateId || "editorial")}
                className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-[#19C37D] hover:bg-[#19C37D]/10 transition"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Template Preview</span>
              </button>
            </div>

            {/* Right Action: autosave status + Save changes */}
            <div className="flex shrink-0 items-center gap-2">
              {isDirty && (
                <span
                  className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[#9DB3A8] max-w-[130px] lg:max-w-none truncate"
                  aria-live="polite"
                >
                  {(draftSaving || !draftSavedAt) && !restoredFrom ? (
                    <>
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                      <span className="truncate">Autosaving…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-[#19C37D]" />
                      <span className="truncate">
                        Draft saved
                        {draftSavedAt ? ` · ${describeDraftAge(draftSavedAt)}` : ""}
                      </span>
                    </>
                  )}
                </span>
              )}
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

          {/* Restored unsaved work — visible, reversible, never live */}
          {restoredFrom && (
            <div className="mt-2.5 flex flex-col gap-2 rounded-xl border border-[#24382F] bg-[#141C18] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-2 text-[11px] text-[#9DB3A8] sm:items-center">
                <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#19C37D] sm:mt-0" />
                <span>
                  Restored unsaved changes from {describeDraftAge(restoredFrom)}. Your customers still
                  see the live store until you press Save.
                </span>
              </span>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="min-h-[32px] shrink-0 self-start rounded-lg border border-[#24382F] bg-[#0A1210] px-3 py-1 text-[11px] font-medium text-[#E8F1EC] transition hover:border-[#5C7C6D] sm:self-auto"
              >
                Discard draft
              </button>
            </div>
          )}

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
              onClick={() => setPreviewTemplateId(localState.websiteTemplateId || "editorial")}
              className="flex flex-1 min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/10"
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
                      {(() => {
                        const parsed = splitPhoneNumber(localState.phone || "");
                        const callingCode = parsed.callingCode || "+234";
                        const nationalNum = parsed.nationalNumber || "";
                        return (
                          <>
                            <div className="mt-1.5 flex gap-2">
                              <CountrySelector
                                value={parsed.countryCode || "NG"}
                                onChange={(newCallingCode) => {
                                  const rawDigits = nationalNum.replace(/^0+/, "");
                                  updateField("phone", `${newCallingCode}${rawDigits}`);
                                }}
                              />
                              <input
                                type="tel"
                                value={nationalNum}
                                onChange={(e) => {
                                  const cleaned = cleanPastedNationalNumber(e.target.value, callingCode);
                                  updateField("phone", `${callingCode}${cleaned.nationalNumber}`);
                                }}
                                placeholder="808 123 4567"
                                className="w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-[#9DB3A8]">
                              Where customer orders arrive on WhatsApp. {localState.phone ? `Format: ${localState.phone}` : "e.g. +234 808 123 4567"}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-[#E8F1EC]">Store Link Handle</label>
                        {handleStatus === "checking" && (
                          <span className="flex items-center gap-1 text-[10px] text-[#9DB3A8]">
                            <Loader2 className="h-3 w-3 animate-spin text-[#19C37D]" /> Checking...
                          </span>
                        )}
                        {handleStatus === "available" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#19C37D]">
                            <Check className="h-3 w-3" /> Available
                          </span>
                        )}
                        {handleStatus === "taken" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                            <X className="h-3 w-3" /> Already Taken
                          </span>
                        )}
                      </div>
                      <div className={cn(
                        "mt-1.5 flex items-center rounded-xl border bg-[#0A1210] px-3 py-2 text-sm transition focus-within:border-[#19C37D]",
                        handleStatus === "taken" ? "border-rose-500/80" : handleStatus === "available" ? "border-[#19C37D]" : "border-[#5C7C6D]"
                      )}>
                        <span className="select-none text-xs text-[#9DB3A8]">swiftlink.pro/</span>
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
                      {handleStatus === "taken" ? (
                        <p className="mt-1 text-[11px] font-medium text-rose-400">
                          Handle &quot;@{localState.storeUsername}&quot; is already owned by another store. Store links are unique like domain names.
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#9DB3A8]">
                          Your unique shareable link for bio and status.
                        </p>
                      )}
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
                  <label className="block text-xs font-medium text-[#E8F1EC]">Facebook Handle</label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={localState.socials?.facebook || ""}
                      onChange={(e) =>
                        updateField("socials", {
                          ...localState.socials,
                          facebook: e.target.value.replace(/^@/, ""),
                        })
                      }
                      placeholder="yourbrand or facebook.com/yourbrand"
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

            {/* Section: Discount codes */}
            <DiscountCodesSection
              codes={sanitizeDiscountCodes(localState.discountCodes)}
              currency={localState.currency || "₦"}
              storeId={localState.id ?? null}
              onChange={(next) => updateField("discountCodes", next)}
            />

            {/* Section: Frequently Asked Questions (FAQ) */}
            <section
              aria-labelledby="faq-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2D27] pb-4">
                <div>
                  <h2 id="faq-heading" className="text-base font-semibold text-[#E8F1EC]">
                    Frequently Asked Questions (FAQ)
                  </h2>
                  <p className="mt-1 text-xs text-[#9DB3A8]">
                    Customize assistance questions customers see on your storefront.
                  </p>
                </div>
                {!isAddingFaq && (
                  <button
                    type="button"
                    onClick={() => setIsAddingFaq(true)}
                    className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#19C37D]/30 bg-[#14231D] px-3.5 py-1.5 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                )}
              </div>

              {/* FAQ items list */}
              <div className="mt-6 space-y-3">
                {((localState.faqItems && localState.faqItems.length > 0)
                  ? localState.faqItems
                  : [
                      {
                        q: "How does ordering on WhatsApp work?",
                        a: "Browse the catalog, add what you want to your cart, then tap Order on WhatsApp. Your items and quantities are formatted into a message and sent straight to the store.",
                      },
                      {
                        q: "How do I arrange payment and delivery?",
                        a: "Payment and delivery are agreed directly with the store on WhatsApp.",
                      },
                      {
                        q: "Can I ask about an item before ordering?",
                        a: "Yes. Message the store on WhatsApp with any question about sizing, stock or condition.",
                      },
                    ]
                ).map((faq, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[#24382F] bg-[#0A1210] p-3.5 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-[#E8F1EC]">{faq.q}</p>
                      <p className="mt-1 text-xs text-[#9DB3A8] leading-relaxed">{faq.a}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="text-[#9DB3A8] hover:text-[#FF8A8A] p-1 transition"
                      title="Remove question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Add new FAQ card */}
                {isAddingFaq && (
                  <div className="mt-4 rounded-xl border border-[#19C37D]/40 bg-[#14231D]/40 p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#19C37D]">New FAQ Question</p>
                    <input
                      type="text"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      placeholder="e.g. Do you ship outside Lagos?"
                      className="w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2 text-xs sm:text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                    />
                    <textarea
                      rows={2}
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      placeholder="e.g. Yes, we deliver nationwide within 2-4 business days."
                      className="w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2 text-xs sm:text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingFaq(false);
                          setNewFaqQuestion("");
                          setNewFaqAnswer("");
                        }}
                        className="rounded-xl border border-[#24382F] bg-[#0A1210] px-3 py-1.5 text-xs font-medium text-[#9DB3A8] hover:text-[#E8F1EC]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="rounded-xl bg-[#19C37D] px-4 py-1.5 text-xs font-semibold text-[#04140D] hover:bg-[#16B070]"
                      >
                        Save FAQ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Section: Social Share & SEO (Link Preview) */}
            <section
              aria-labelledby="seo-og-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="seo-og-heading" className="text-base font-semibold text-[#E8F1EC]">
                  Social Share & Link Preview
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Control what image and description appear when you share your store link on WhatsApp, X, or iMessage.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#E8F1EC]">Store Share Description</label>
                    <span className="text-[11px] text-[#9DB3A8]">
                      {(localState.ogDescription || "").length}/160 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={160}
                    value={localState.ogDescription || ""}
                    onChange={(e) => updateField("ogDescription", e.target.value)}
                    placeholder={localState.tagline || "Discover handcrafted fashion and lifestyle products. Shop and order directly on WhatsApp."}
                    className="mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                  />
                  <p className="mt-1 text-[11px] text-[#9DB3A8]">
                    Recommended length: 50–160 characters. Appears as the snippet under your store link.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">Social Preview Image (OG Image)</label>
                  <p className="mt-0.5 text-[11px] text-[#9DB3A8]">
                    Displayed on social card previews. Recommended size: 1200 × 630px.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-[#1E2D27] bg-[#0A1210] flex items-center justify-center">
                      {(localState.ogImage || localState.bizImage) ? (
                        <img
                          src={localState.ogImage || localState.bizImage}
                          alt="Social preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-[#9DB3A8]">No preview image</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-[#19C37D]/30 bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/20">
                        {isUploadingOg ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{isUploadingOg ? "Uploading…" : "Upload Social Image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingOg}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOgImageUpload(file);
                          }}
                        />
                      </label>
                      {localState.ogImage && (
                        <button
                          type="button"
                          onClick={() => updateField("ogImage", undefined)}
                          className="text-left text-[11px] text-[#FF8A8A] hover:underline"
                        >
                          Reset to store logo
                        </button>
                      )}
                    </div>
                  </div>
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
                    {visibleProductCount(localState.products)} visible · {localState.products.length}{" "}
                    {localState.products.length === 1 ? "item" : "items"} in your store
                  </p>
                </div>

                {/* Primary buttons: 1-tap Live preview & Add product */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplateId(localState.websiteTemplateId || "editorial")}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#19C37D]/40 bg-[#19C37D]/10 px-4 py-2.5 text-xs font-semibold text-[#19C37D] transition hover:bg-[#19C37D]/20 active:scale-98"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Template preview</span>
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

              {hiddenProductCount(localState.products) > 0 && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#E8B93A]/30 bg-[#E8B93A]/10 p-4">
                  <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-[#E8B93A]" />
                  <div className="text-xs text-[#E8F1EC]">
                    <p className="font-semibold">
                      {hiddenProductCount(localState.products)} hidden{" "}
                      {hiddenProductCount(localState.products) === 1 ? "product" : "products"}
                    </p>
                    <p className="mt-0.5 text-[#9DB3A8]">
                      Hidden products are kept — nothing is deleted — but they do not appear on your
                      storefront. Show a hidden product to bring it back (your plan allows up to{" "}
                      {effectiveProductLimitFor(localState.plan)} visible products).
                    </p>
                  </div>
                </div>
              )}

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
                          className={cn(
                            "flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-[#14231D]/40 rounded-xl px-2",
                            !isProductVisible(product) && "opacity-55"
                          )}
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
                                {!isProductVisible(product) && (
                                  <span className="shrink-0 rounded-md bg-[#E8B93A]/15 px-2 py-0.5 text-[10px] font-semibold text-[#E8B93A]">
                                    Hidden
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
                              onClick={() => handleToggleVisibility(product.id)}
                              title={isProductVisible(product) ? "Hide from storefront" : "Show on storefront"}
                              aria-label={isProductVisible(product) ? "Hide from storefront" : "Show on storefront"}
                              className="flex min-h-[36px] items-center rounded-lg border border-[#24382F] bg-[#14231D] p-2 text-[#9DB3A8] transition hover:text-[#E8F1EC]"
                            >
                              {isProductVisible(product) ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
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
                      onClick={() => handleAutoSaveTemplate(template.id)}
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

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <h3 className="min-w-0 truncate text-sm font-semibold text-[#E8F1EC]">{template.name}</h3>
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

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#1E2D27] pt-3">
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

            {/* Section 2: Appearance & Colors */}
            <section
              aria-labelledby="accent-color-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="border-b border-[#1E2D27] pb-4">
                <h2 id="accent-color-heading" className="text-base font-semibold text-[#E8F1EC]">
                  Appearance & colors
                </h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Choose your store theme mode and primary brand accent color.
                </p>
              </div>

              {/* Light / Dark Mode selector */}
              <div className="mt-6 border-b border-[#1E2D27] pb-6">
                <label className="block text-xs font-medium text-[#E8F1EC]">Storefront Theme Mode</label>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAutoSaveThemeMode("light")}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition",
                      (localState.storefrontTheme?.background === "light")
                        ? "border-[#19C37D] bg-[#14231D] text-[#19C37D] shadow-xs"
                        : "border-[#1E2D27] bg-[#0A1210] text-[#9DB3A8] hover:border-[#5C7C6D]"
                    )}
                  >
                    <Sun className="h-4 w-4" />
                    <span>Light Mode</span>
                    {localState.storefrontTheme?.background === "light" && (
                      <Check className="h-3.5 w-3.5 text-[#19C37D]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoSaveThemeMode("dark")}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition",
                      (localState.storefrontTheme?.background !== "light")
                        ? "border-[#19C37D] bg-[#14231D] text-[#19C37D] shadow-xs"
                        : "border-[#1E2D27] bg-[#0A1210] text-[#9DB3A8] hover:border-[#5C7C6D]"
                    )}
                  >
                    <Moon className="h-4 w-4" />
                    <span>Dark Mode</span>
                    {localState.storefrontTheme?.background !== "light" && (
                      <Check className="h-3.5 w-3.5 text-[#19C37D]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="mt-6">
                <label className="block text-xs font-medium text-[#E8F1EC]">Primary Accent Color</label>
                <p className="mt-0.5 text-[11px] text-[#9DB3A8]">
                  Used for buttons, badges, price highlights, and order triggers across your storefront.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
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
              </div>
            </section>

            {/* Section 3: Live Storefront Simulator Card */}
            <section
              aria-labelledby="storefront-preview-heading"
              className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#19C37D]" />
                    <h2 id="storefront-preview-heading" className="text-base font-semibold text-[#E8F1EC]">
                      Interactive Store Simulator
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#9DB3A8] max-w-xl">
                    Experience your live storefront in our full-screen device simulator. Test Phone, Tablet, and Desktop viewports, light and dark modes, and WhatsApp order messages in real time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewTemplateId(localState.websiteTemplateId || "editorial")}
                  className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#19C37D] px-5 py-2.5 text-xs font-bold text-[#04140D] transition hover:bg-[#16B070] shadow-md shadow-[#19C37D]/20 active:scale-98"
                >
                  <Eye className="h-4 w-4" />
                  <span>Launch Template Preview</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Tab 3 Live Preview is retired in favor of the full device simulator modal */}
        {false && (
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
                    href={`/${localState.storeUsername}`}
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
                  {websiteTemplates.map((tmpl) => {
                    const isPro = !(FREE_TEMPLATE_IDS as readonly string[]).includes(tmpl.id);
                    const isSelected = (localState.websiteTemplateId || "editorial") === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleAutoSaveTemplate(tmpl.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition",
                          isSelected
                            ? "bg-[#19C37D] text-[#04140D]"
                            : "text-[#9DB3A8] hover:text-[#E8F1EC]"
                        )}
                      >
                        <span>{tmpl.name}</span>
                        {isPro && (
                          <span className={cn(
                            "rounded px-1 py-0.2 text-[8px] font-black uppercase tracking-wider",
                            isSelected ? "bg-[#04140D]/20 text-[#04140D]" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          )}>
                            PRO
                          </span>
                        )}
                      </button>
                    );
                  })}
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
                    href={`/${localState.storeUsername}`}
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
                    className={cn(
                      "max-h-[750px] overflow-y-auto overscroll-contain",
                      (localState.storefrontTheme?.background === "dark" || previewMode === "dark") && "dark"
                    )}
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
                  className={cn(
                    "w-full max-w-[768px] mx-auto overflow-hidden rounded-2xl border-4 border-[#1E2D27] bg-[#111C18] shadow-2xl",
                    (localState.storefrontTheme?.background === "dark" || previewMode === "dark") && "dark"
                  )}
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
                  className={cn(
                    "w-full max-w-5xl mx-auto overflow-hidden rounded-2xl border border-[#1E2D27] bg-[#111C18] shadow-2xl",
                    (localState.storefrontTheme?.background === "dark" || previewMode === "dark") && "dark"
                  )}
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
            handleAutoSaveTemplate(id as WebsiteTemplateId);
            setPreviewTemplateId(null);
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

  /*
   * Save is a deliberate act, so it only lights up when there is something to
   * save: a new product needs a name, an existing one needs an actual change.
   * A permanently-green button that does nothing is worse than a grey one that
   * explains itself, and "did that stick?" is the question the colour answers.
   */
  const formSignature = useMemo(
    () => JSON.stringify({ name, description, price, category, outOfStock, images, options, waTemplateMessage }),
    [name, description, price, category, outOfStock, images, options, waTemplateMessage],
  );
  const initialSignature = useRef(formSignature);
  const isDirty = formSignature !== initialSignature.current;
  const canSave = existing ? isDirty : Boolean(name.trim());

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
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
      // Preserve hiding across an edit — otherwise opening a hidden product
      // and saving would silently publish it again.
      visible: existing?.visible,
    };

    onSave(updated, waTemplateMessage);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      // z-[1200], not z-50: the console's mobile bottom tab bar is `fixed z-50`
      // and later in the DOM, so at equal z-index it painted *over* this modal's
      // Save/Cancel footer on a phone — the buttons existed but sat underneath
      // the tab bar, which is why they could not be seen or tapped.
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md overscroll-contain"
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
              disabled={!canSave}
              title={
                canSave
                  ? undefined
                  : existing
                  ? "No changes yet"
                  : "Add a product name to save"
              }
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center min-h-[44px] gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition active:scale-95",
                canSave
                  ? "bg-[#19C37D] text-[#04140D] hover:bg-[#16B070] shadow-md shadow-[#19C37D]/25"
                  : "cursor-not-allowed border border-[#1E2D27] bg-[#14231D] text-[#5C7C6D]"
              )}
            >
              <Check className="h-4 w-4" />
              <span>{existing ? (isDirty ? "Save changes" : "Saved") : "Add product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
