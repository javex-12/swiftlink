"use client";

import { useState } from "react";
import { ChevronDown, Plus, Store } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import {
  MAX_STORES_PER_USER,
  effectiveStoreLimitFor,
  formatLimit,
  storeLimitMessage,
} from "@/lib/plans";
import { PromptDialog } from "@/components/ui/dialog";

/**
 * Store switcher + "new store", mounted in the console shell (sidebar and
 * mobile header) — not just inside one editor screen, which is where it used to
 * live and why a multi-store owner could not reach it.
 *
 * Creating a store used to go through `window.customPrompt`, a monkey-patched
 * global; it uses the real `PromptDialog` now, and the button names the plan's
 * store limit instead of failing silently at the cap.
 */
export function StoreSwitcher() {
  const { state, stores, switchStore, createNewStore } = useSwiftLink();
  const [open, setOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const allStores = stores.length > 0 ? stores : [state];
  // Entitlements are per account; `state.plan` is already the account's plan.
  const storeLimit = effectiveStoreLimitFor(state.plan);
  const atLimit = allStores.length >= storeLimit;
  const limitMessage = storeLimitMessage(state.plan, allStores.length);

  const handleCreate = async (name: string) => {
    setCreating(true);
    try {
      await createNewStore(name);
      setPromptOpen(false);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-[44px] w-full min-w-0 items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-3.5 py-2 text-xs font-semibold text-[#E8F1EC] transition-all hover:border-[#19C37D]"
      >
        <Store size={14} className="shrink-0 text-[#19C37D]" />
        <span className="truncate">{state.bizName || "Switch Store"}</span>
        <span className="ml-auto shrink-0 text-[10px] font-medium tabular-nums text-[#9DB3A8]">
          {allStores.length}/{formatLimit(storeLimit)}
        </span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-[#9DB3A8] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          {/* Click-away so the menu does not need a modal to be dismissed. */}
          <button
            type="button"
            aria-label="Close store list"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-0 right-0 top-12 z-50 rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-2 shadow-2xl md:left-0 md:right-auto md:w-72"
          >
            <div className="max-h-72 overflow-y-auto">
              {allStores.map((store) => (
                <button
                  key={store.id || "local"}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (store.id && store.id !== state.id) void switchStore(store.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors hover:bg-[#14231D]",
                    store.id === state.id && "bg-[#14231D] text-[#19C37D]",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#24382F] bg-[#0A1210] text-[#19C37D]">
                    {store.bizImage ? (
                      <img src={store.bizImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#E8F1EC]">
                      {store.bizName || "Untitled Store"}
                    </p>
                    <p className="truncate text-[10px] text-[#9DB3A8]">
                      {store.currency || "NGN"} • {store.storeUsername ? `@${store.storeUsername}` : "Workspace"}
                    </p>
                  </div>
                  {store.id === state.id && (
                    <span className="shrink-0 rounded-full bg-[#19C37D]/15 px-2 py-0.5 text-[10px] font-semibold text-[#19C37D]">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (atLimit) return;
                setOpen(false);
                setPromptOpen(true);
              }}
              disabled={atLimit}
              title={atLimit ? limitMessage : "Create another store"}
              className={cn(
                "mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] py-2.5 text-xs font-semibold transition",
                atLimit
                  ? "cursor-not-allowed bg-[#14231D] text-[#9DB3A8]"
                  : "bg-[#19C37D] text-[#04140D] hover:bg-[#16B070]",
              )}
            >
              <Plus size={14} /> New Store
            </button>

            {atLimit && (
              <p className="px-1 pt-2 text-[10px] leading-relaxed text-[#9DB3A8]">
                {storeLimit === MAX_STORES_PER_USER
                  ? `You have reached the ${MAX_STORES_PER_USER}-store limit for one account.`
                  : limitMessage}
              </p>
            )}
          </div>
        </>
      )}

      <PromptDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        title="New store"
        description="It starts on your account's current plan, so your products and features carry over."
        label="Store name"
        placeholder="e.g. Lagos Sneakers"
        confirmLabel="Create store"
        loading={creating}
        onConfirm={handleCreate}
      />
    </div>
  );
}
