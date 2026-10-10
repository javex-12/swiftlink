"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { X, Smartphone, Tablet, Monitor, Check, Moon, Sun } from "lucide-react";
import type { ShopState } from "@/lib/schema";
import { getSampleShopState } from "@/lib/sample-store";
import { DEFAULT_WEBSITE_TEMPLATE_ID, themeForTemplate, websiteTemplateById } from "@/lib/theme/templates";
import { themeToCssVars } from "@/lib/theme/derive";
import { cn } from "@/lib/utils";

/**
 * The preview renders the *real* storefront, lazily, so the template markup and
 * the shopper screens (product page, reviews, bag, footer) only load when a
 * merchant actually opens a preview. Anything hand-built here would eventually
 * disagree with the live site, which is exactly the bug this replaces.
 */
const CustomerStorefront = dynamic(
  () => import("@/components/CustomerStorefront").then((mod) => mod.CustomerStorefront),
  {
    ssr: false,
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

type Appearance = "light" | "dark";
type Device = "desktop" | "tablet" | "phone";

/**
 * Full-screen preview of a storefront template.
 *
 * Two rules drive the layout:
 *
 * 1. **On a phone, this is just the page.** A device frame inside a real phone
 *    wastes the width it is pretending to simulate, so below 640px the
 *    storefront renders full-bleed and the viewport switcher is hidden.
 * 2. **Above that, the frame is a frame.** The desktop option is deliberately
 *    *not* clamped to a mock width — it renders at the modal's real width, so
 *    what you see is what a desktop visitor gets, navigation included.
 *
 * Light/dark is a toggle rather than two previews: it is the same template, and
 * the merchant's own products are what they are deciding about.
 */
export function TemplatePreviewModal({
  templateId,
  vendorState,
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatePreviewModalProps) {
  const hasVendorProducts = (vendorState.products?.length || 0) > 0;
  const [device, setDevice] = useState<Device>("desktop");
  const [useSampleData, setUseSampleData] = useState<boolean>(!hasVendorProducts);
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  // A real phone cannot show a phone mockup. Track the viewport rather than
  // guessing from a CSS breakpoint, because the frame markup itself must change.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsNarrowViewport(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const template = useMemo(
    () => websiteTemplateById(templateId) ?? websiteTemplateById(DEFAULT_WEBSITE_TEMPLATE_ID)!,
    [templateId],
  );

  // Active state to render in the template. The storefront theme decides the
  // appearance in the real storefront, so the preview sets the same field rather
  // than passing a separate flag — otherwise the two can disagree.
  const activeState = useMemo<ShopState>(() => {
    const base = useSampleData || !hasVendorProducts
      ? getSampleShopState(templateId, vendorState.currency || "NGN")
      : vendorState;

    return {
      ...base,
      websiteTemplateId: templateId as any,
      storefrontTheme: { ...(base.storefrontTheme ?? {}), background: appearance },
    };
  }, [useSampleData, hasVendorProducts, templateId, vendorState, appearance]);

  const themeVars = useMemo(
    () => themeToCssVars(themeForTemplate(template, appearance)) as React.CSSProperties,
    [template, appearance],
  );

  if (!isOpen || !template) return null;

  /**
   * The preview *is* the storefront: the same component the live store renders,
   * pointed at the template being tried on. `preview` keeps it inert (no
   * history entries, no analytics, no writes) while leaving it fully navigable —
   * product pages, reviews, the bag and the footer all behave as they will once
   * the template is applied.
   */
  const storefront = (
    <CustomerStorefront preview overrideState={activeState} />
  );

  const sourceLabel = useSampleData
    ? "Sample products"
    : `Your products (${vendorState.products.length})`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${template.name} preview`}
      className="fixed inset-0 z-[1500] flex flex-col bg-[#0A1210] text-[#E8F1EC]"
    >
      {/*
        Header. One row on desktop; two stacked rows on a phone, so the template
        name gets its own line instead of fighting the controls for width and
        squeezing the action button out of view.
      */}
      <header className="shrink-0 border-b border-[#1E2D27] bg-[#111C18]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3">
          {/* Row 1: identity */}
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", useSampleData ? "bg-[#E8B93A]" : "bg-[#19C37D]")}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-[#E8F1EC]">{template.name}</p>
              <p className="truncate text-[11px] leading-tight text-[#9DB3A8]">
                {sourceLabel}
                {!useSampleData && vendorState.bizName ? ` · ${vendorState.bizName}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[#24382F] text-[#9DB3A8] transition hover:bg-[#14231D] hover:text-[#E8F1EC] sm:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Row 2: controls */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {appearanceToggle(appearance, setAppearance)}

            {!isNarrowViewport && deviceToggle(device, setDevice)}

            {hasVendorProducts && (
              <button
                type="button"
                onClick={() => setUseSampleData((value) => !value)}
                className="min-h-[36px] rounded-lg border border-[#24382F] bg-[#0A1210] px-3 text-[11px] font-semibold text-[#9DB3A8] transition hover:text-[#E8F1EC]"
              >
                {useSampleData ? "Use my products" : "Use sample products"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectTemplate(templateId);
                onClose();
              }}
              className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-[#19C37D] px-4 text-xs font-semibold text-[#04140D] transition hover:bg-[#16B070] sm:flex-initial"
            >
              <Check className="h-3.5 w-3.5" />
              Use this template
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[#24382F] text-[#9DB3A8] transition hover:bg-[#14231D] hover:text-[#E8F1EC] sm:flex"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/*
        Preview area.

        Every frame is its own scroll container with a definite height, and it
        carries a `transform`. The transform is load-bearing, not decoration: it
        makes the frame the containing block for the storefront's `position:
        fixed` bottom navigation bar and screen overlays, so the bag bar pins to
        the bottom of the *device* instead of the bottom of the browser window.
        Without it a phone preview would show the nav floating outside the phone.
      */}
      <main className="flex-1 overflow-hidden bg-[#0A1210] p-0 sm:p-5">
        {isNarrowViewport ? (
          // A phone shows the page, not a picture of a phone.
          <div
            data-theme-scope="storefront"
            style={{ ...themeVars, transform: "translateZ(0)" }}
            className="h-full w-full overflow-y-auto overscroll-contain"
          >
            {storefront}
          </div>
        ) : device === "phone" ? (
          <div className="mx-auto flex h-full w-full max-w-[390px] flex-col overflow-hidden rounded-[40px] border-[8px] border-[#1E2D27] bg-[#111C18] shadow-2xl">
            <div className="flex h-5 w-full shrink-0 items-center justify-center bg-[#111C18]">
              <div className="h-1 w-16 rounded-full bg-[#1E2D27]" />
            </div>
            <div
              data-theme-scope="storefront"
              style={{ ...themeVars, transform: "translateZ(0)" }}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {storefront}
            </div>
          </div>
        ) : device === "tablet" ? (
          <div
            data-theme-scope="storefront"
            style={{ ...themeVars, transform: "translateZ(0)" }}
            className="mx-auto h-full w-full max-w-[768px] overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#1E2D27] shadow-2xl"
          >
            {storefront}
          </div>
        ) : (
          // Full modal width on purpose: this is what a desktop visitor sees.
          <div
            data-theme-scope="storefront"
            style={{ ...themeVars, transform: "translateZ(0)" }}
            className="mx-auto h-full w-full overflow-y-auto overscroll-contain rounded-xl shadow-2xl"
          >
            {storefront}
          </div>
        )}
      </main>
    </div>
  );
}

/** Presentational helpers kept out of the render body for readability. */

function appearanceToggle(appearance: Appearance, setAppearance: (value: Appearance) => void) {
  const options: Array<{ value: Appearance; label: string; Icon: typeof Sun }> = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Preview appearance"
      className="flex items-center rounded-lg border border-[#24382F] bg-[#0A1210] p-0.5"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={appearance === value}
          onClick={() => setAppearance(value)}
          className={cn(
            "flex min-h-[26px] items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition",
            appearance === value ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function deviceToggle(device: Device, setDevice: (value: Device) => void) {
  const options: Array<{ value: Device; label: string; Icon: typeof Monitor }> = [
    { value: "phone", label: "Phone viewport", Icon: Smartphone },
    { value: "tablet", label: "Tablet viewport", Icon: Tablet },
    { value: "desktop", label: "Desktop viewport", Icon: Monitor },
  ];

  return (
    <div className="flex items-center rounded-lg border border-[#24382F] bg-[#0A1210] p-0.5">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={device === value}
          onClick={() => setDevice(value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded transition",
            device === value ? "bg-[#14231D] text-[#19C37D]" : "text-[#9DB3A8] hover:text-[#E8F1EC]",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
