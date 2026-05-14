"use client";

import { useState } from "react";
import { ChevronDown, Plus, Store } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";

export function StoreSwitcher() {
  const { state, stores, switchStore, createNewStore } = useSwiftLink();
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    const name = await (window as any).customPrompt("New Store", "Enter a store name:");
    if (name) {
      await createNewStore(String(name));
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-[9px] font-black uppercase text-slate-500 transition-all hover:text-slate-900 dark:bg-black dark:text-zinc-400 dark:hover:text-white"
      >
        Switch Store <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
          <div className="max-h-72 overflow-y-auto">
            {(stores.length > 0 ? stores : [state]).map((store) => (
              <button
                key={store.id || "local"}
                type="button"
                onClick={() => {
                  if (store.id) void switchStore(store.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5",
                  store.id === state.id && "bg-emerald-50 dark:bg-emerald-500/10",
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black">
                  {store.bizImage ? <img src={store.bizImage} alt="" className="h-full w-full object-cover" /> : <Store size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase text-slate-900 dark:text-white">{store.bizName || "Untitled Store"}</p>
                  <p className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-400">{store.id || "Local draft"}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-black"
          >
            <Plus size={14} /> New Store
          </button>
        </div>
      )}
    </div>
  );
}
