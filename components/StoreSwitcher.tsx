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
        className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-3.5 py-2 text-xs font-semibold text-[#E8F1EC] transition-all hover:border-[#19C37D]"
      >
        <span className="truncate max-w-[120px]">{state.bizName || "Switch Store"}</span>
        <ChevronDown size={14} className="text-[#9DB3A8]" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-2 shadow-2xl">
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
                  "flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors hover:bg-[#14231D]",
                  store.id === state.id && "bg-[#14231D] text-[#19C37D]",
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[8px] bg-[#0A1210] border border-[#24382F] text-[#19C37D]">
                  {store.bizImage ? <img src={store.bizImage} alt="" className="h-full w-full object-cover" /> : <Store size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#E8F1EC]">{store.bizName || "Untitled Store"}</p>
                  <p className="truncate text-[10px] text-[#9DB3A8]">{store.currency || "NGN"} • {store.storeUsername ? `@${store.storeUsername}` : "Workspace"}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-[#19C37D] py-2.5 text-xs font-semibold text-[#04140D] transition hover:bg-[#16B070]"
          >
            <Plus size={14} /> New Store
          </button>
        </div>
      )}
    </div>
  );
}
