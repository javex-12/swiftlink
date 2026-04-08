"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show the prompt after a short delay so it doesn't interrupt immediate load
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center gap-4 w-[90%] max-w-sm"
        >
          <img src="/logo.png" alt="SwiftLink" className="w-10 h-10 rounded-xl" />
          <div className="flex-1">
            <h4 className="text-white font-black text-sm">Install SwiftLink Pro</h4>
            <p className="text-slate-400 text-xs font-medium">Add to your home screen for fast, offline access.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl transition-colors"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 p-2 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
