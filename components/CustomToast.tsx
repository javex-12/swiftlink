"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

export function CustomToast({ id, message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-rose-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-100",
    error: "bg-rose-50 border-rose-100",
    info: "bg-blue-50 border-blue-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 px-5 py-4 rounded-[1.5rem] border shadow-2xl min-w-[280px] max-w-sm ${bgColors[type]}`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-900 leading-tight">
        {message}
      </p>
      <button 
        onClick={() => onClose(id)}
        className="shrink-0 text-slate-400 hover:text-slate-900 transition-colors"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, removeToast }: { toasts: any[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <CustomToast {...toast} onClose={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
