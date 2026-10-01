"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/** Dial codes offered at signup. A curated shortlist, not the full ITU table. */
const COUNTRIES = [
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
];

/**
 * Dial-code picker for the phone field.
 *
 * Rebuilt on tokens so it sits level with the `Field`/`Input` kit: the trigger is
 * `h-11` like every other control (it used to be `h-full … py-4`, which let it
 * dictate the row height and made the phone field taller than the rest of the
 * form). The menu is width-clamped so it never overflows a 320px viewport.
 */
export function CountrySelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];
  const filtered = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search),
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
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Country calling code"
        className={cn(
          "flex h-11 items-center gap-2 rounded-lg border border-app-border-strong bg-app-surface px-3",
          "text-sm text-app-text transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface",
        )}
      >
        <span aria-hidden="true">{selected.flag}</span>
        <span className="tabular-nums">{selected.code}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn("text-app-text-subtle transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute left-0 z-dropdown mt-2 w-64 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-lg"
          >
            <div className="border-b border-app-border p-2.5">
              <div className="relative">
                <Search
                  size={14}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-subtle"
                />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search countries…"
                  className="h-9 w-full rounded-lg border border-app-border bg-app-surface-2 pl-9 pr-3 text-sm text-app-text placeholder:text-app-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
                />
              </div>
            </div>

            <div className="custom-scrollbar max-h-60 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-app-text-subtle">No results</p>
              ) : (
                filtered.map((c, i) => (
                  <button
                    key={`${c.code}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={value === c.code}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-app-surface-2"
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true">{c.flag}</span>
                      <span>
                        <span className="block text-sm font-medium text-app-text">{c.name}</span>
                        <span className="block text-xs tabular-nums text-app-text-subtle">{c.code}</span>
                      </span>
                    </span>
                    {value === c.code && (
                      <Check size={14} className="shrink-0 text-app-accent-text" aria-hidden="true" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
