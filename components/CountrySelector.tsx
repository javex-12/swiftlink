"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SUPPORTED_COUNTRIES, type SupportedCountry } from "@/lib/phone";

export function CountrySelector({
  value,
  onChange,
  className,
}: {
  value: string; // Calling code (+234) or ISO code (NG)
  onChange: (callingCode: string, countryCode: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Match either by callingCode ("+234") or ISO code ("NG")
  const selected =
    SUPPORTED_COUNTRIES.find((c) => c.callingCode === value || c.code === value) ||
    SUPPORTED_COUNTRIES[0];

  const filtered = SUPPORTED_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.callingCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className={cn("relative shrink-0", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Country calling code"
        className={cn(
          "flex h-11 min-h-[44px] items-center gap-2 rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3",
          "text-sm font-medium text-[#E8F1EC] transition-colors hover:border-[#19C37D]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19C37D]",
        )}
      >
        <span className="rounded bg-[#14231D] px-1.5 py-0.5 text-[11px] font-bold text-[#19C37D] border border-[#24382F]">
          {selected.code}
        </span>
        <span className="tabular-nums font-semibold text-xs text-[#E8F1EC]">{selected.callingCode}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn("text-[#9DB3A8] transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute left-0 z-50 mt-1.5 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#1E2D27] bg-[#111C18] text-[#E8F1EC] shadow-2xl"
          >
            <div className="border-b border-[#1E2D27] p-2.5">
              <div className="relative">
                <Search
                  size={14}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9DB3A8]"
                />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search countries..."
                  className="h-9 w-full rounded-lg border border-[#5C7C6D] bg-[#0A1210] pl-9 pr-3 text-xs text-[#E8F1EC] placeholder:text-[#9DB3A8] focus-visible:outline-none focus-visible:border-[#19C37D]"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-[#9DB3A8]">No results</p>
              ) : (
                filtered.map((c) => {
                  const isCurrent = c.code === selected.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => {
                        onChange(c.callingCode, c.code);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-left text-xs transition-colors",
                        isCurrent
                          ? "bg-[#14231D] text-[#19C37D] font-semibold"
                          : "text-[#E8F1EC] hover:bg-[#14231D]"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="rounded bg-[#0A1210] px-1 py-0.5 text-[10px] font-bold text-[#9DB3A8] border border-[#1E2D27]">
                          {c.code}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="tabular-nums text-[#9DB3A8] shrink-0 font-medium">
                        {c.callingCode}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
