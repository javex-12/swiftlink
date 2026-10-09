"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Catalog windowing for the storefront templates.
 *
 * Every template used to render the entire filtered catalog in one pass, and
 * every product card mounted its image immediately. A store with a few hundred
 * products therefore had to lay out and decode them all before the customer
 * could scroll — the audit's R-13, and the reason the owner asked for "a
 * preloader if the products are many". Windowing is the better answer than a
 * preloader: it does less work rather than decorating the wait.
 *
 * `CATALOG_PAGE_SIZE` is the number of cards mounted per page. 24 fills the
 * widest grid (4 columns × 6 rows) without a second screenful of offscreen DOM.
 */
export const CATALOG_PAGE_SIZE = 24;

/**
 * Tracks how many products to render.
 *
 * `resetKey` collapses the window whenever the result set changes (category or
 * search). Without it, switching from a 300-product list to a 3-product list
 * while paged deep would keep the old count and silently render nothing new —
 * and switching back would jump the customer far down the page.
 */
export function useCatalogWindow(
  total: number,
  resetKey: string,
  pageSize: number = CATALOG_PAGE_SIZE,
) {
  const [visible, setVisible] = useState(pageSize);

  useEffect(() => {
    setVisible(pageSize);
  }, [resetKey, pageSize]);

  const shown = Math.min(visible, total);

  return {
    shown,
    remaining: Math.max(0, total - shown),
    hasMore: shown < total,
    loadMore: () => setVisible((current) => current + pageSize),
  };
}

/**
 * "Show more" control, rendered under the catalog grid. Announced politely so a
 * screen-reader user knows the list grew.
 */
export function LoadMoreButton({
  remaining,
  onClick,
  pageSize = CATALOG_PAGE_SIZE,
}: {
  remaining: number;
  onClick: () => void;
  pageSize?: number;
}) {
  const step = Math.min(pageSize, remaining);
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Show ${step} more products`}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-t-border bg-t-surface px-5 py-2.5 text-sm font-semibold text-t-text transition",
          "hover:border-t-accent hover:text-t-accent",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t-accent)]",
        )}
      >
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
        <span>Show {step} more</span>
        <span className="text-t-text-muted">({remaining} remaining)</span>
      </button>
    </div>
  );
}
