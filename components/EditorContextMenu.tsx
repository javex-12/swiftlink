"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Type, Palette, Trash2, Layers, 
  ArrowUp, ArrowDown, Plus 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageSection } from "@/lib/schema";

interface EditorContextMenuProps {
  x: number;
  y: number;
  section: PageSection;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
}

export function EditorContextMenu({ x, y, section, onClose, onAction }: EditorContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose]);

  const menuItems = [
    { id: "edit-text", label: "Edit Content", icon: Type },
    { id: "edit-style", label: "Customize Styles", icon: Palette },
    { id: "change-type", label: "Swap Section Type", icon: Layers },
    { id: "move-up", label: "Move Up", icon: ArrowUp },
    { id: "move-down", label: "Move Down", icon: ArrowDown },
    { id: "duplicate", label: "Duplicate", icon: Plus },
    { id: "delete", label: "Delete Section", icon: Trash2, danger: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ top: y, left: x }}
      className="fixed z-[999] w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 p-2 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-slate-50 dark:border-white/5 mb-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Editing {section.type}</p>
      </div>
      <div className="space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onAction(item.id);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group",
              item.danger 
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" 
                : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >
            <item.icon size={16} className={cn("shrink-0", !item.danger && "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
