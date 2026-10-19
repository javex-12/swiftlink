"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One collapsible block on a product view.
 *
 * Shared by the storefront's product screen and the Bloom template's product
 * sheet because both had the same problem: every field the store holds —
 * description, delivery areas, fee, returns, attributes — printed in the open in
 * a single column, so on a phone the buyer scrolled past paragraphs to reach Add
 * to cart. Closed content is not rendered at all, which is what actually makes
 * the sheet shorter; `max-h` alone would just hide it behind more scrolling.
 *
 * A native `<button aria-expanded>` rather than a library: keyboard and
 * screen-reader support come for free, and no dependency is added for four
 * headings.
 */
export function ProductDisclosure({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-black/10 dark:border-white/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
      >
        <span className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest">
          <Icon size={15} />
          {title}
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && <div className="pb-5 text-xs leading-relaxed">{children}</div>}
    </div>
  );
}

/** The fields a product view can describe, in the order they are useful. */
export type ProductDisclosureSource = {
  description?: string;
  category?: string;
  attributes?: { label: string; value: string }[];
  deliveryAreas?: string;
  deliveryFee?: string;
  minOrder?: number;
  returnPolicy?: string;
  currency?: string;
};

/**
 * Whether the store has anything to say under Delivery. Exported so a caller can
 * skip the heading entirely instead of offering an empty section.
 */
export function hasDeliveryDetails(state: ProductDisclosureSource): boolean {
  return Boolean(state.deliveryAreas) || Boolean(state.deliveryFee) || Number(state.minOrder) > 0;
}
