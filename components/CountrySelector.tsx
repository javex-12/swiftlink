"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Small subset for prototype, usually you'd import a full JSON
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

export function CountrySelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];
  const filtered = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.includes(search)
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
        className="h-full bg-white/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-400 text-xs font-black px-4 py-4 rounded-xl flex items-center gap-3 transition-all hover:border-emerald-500/30"
      >
        <span>{selected.flag}</span>
        <span>{selected.code}</span>
        <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                  />
               </div>
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
               {filtered.length === 0 ? (
                 <p className="text-[10px] font-bold text-slate-500 text-center py-4 uppercase">No results</p>
               ) : (
                 filtered.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { onChange(c.code); setOpen(false); }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                         <span className="text-base">{c.flag}</span>
                         <div className="text-left">
                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none mb-1">{c.name}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{c.code}</p>
                         </div>
                      </div>
                      {value === c.code && <Check size={14} className="text-emerald-500" />}
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
