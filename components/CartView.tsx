"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { resolveStorefrontTheme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, ShieldCheck, Truck, Zap, CreditCard, MessageSquare, XCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CartView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop");
  
  const {
    state,
    cart,
    updateCart,
    sendWhatsAppOrder,
    cartItemCount,
    addToast,
  } = useSwiftLink();

  const theme = useMemo(() => resolveStorefrontTheme(state), [state]);
  const accentStr = theme.primaryColor || "#10b981";
  const storeAcceptingOrders = state.isLive !== false;

  const cartLines = Object.entries(cart).map(([id, q]) => {
    const p = state.products.find((x) => x.id === Number(id));
    if (!p) return null;
    return { ...p, quantity: q };
  }).filter(Boolean) as any[];

  const total = cartLines.reduce((acc, p) => acc + p.price * p.quantity, 0);

  const returnUrl = useMemo(() => {
    if (shopId) return `/store/default?shop=${shopId}`;
    if (state.id) return `/store/default?shop=${state.id}`;
    return "/";
  }, [shopId, state.id]);

  const clearCart = async () => {
      const ok = await (window as any).customConfirm("Empty Selection?", "Are you sure you want to clear your list?");
      if (ok) {
          cartLines.forEach(p => updateCart(p.id, -p.quantity));
      }
  };

  if (cartItemCount === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in transition-colors duration-500">
         <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-950 rounded-full flex items-center justify-center text-slate-200 dark:text-zinc-800 mb-8">
            <ShoppingBag size={48} strokeWidth={1} />
         </div>
         <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4 uppercase italic">Nothing selected yet</h2>
         <p className="text-slate-400 font-medium mb-10 max-w-xs text-sm">Browse our collection and add items you&apos;re interested in.</p>
         <Link href={returnUrl} className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
            Browse Catalog
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans transition-colors duration-500">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-6 py-6 flex items-center justify-between">
         <Link href={returnUrl} className="flex items-center gap-3 group">
            <ArrowLeft size={18} className="text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors">Catalog</span>
         </Link>
         
         <h1 className="text-xs font-black text-slate-900 dark:text-white tracking-[0.4em] uppercase italic">Your Selection</h1>
         
         <button onClick={clearCart} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:opacity-70 transition-opacity">
            Clear
         </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
         <div className="space-y-12">
            
            {/* List of items */}
            <div className="space-y-6">
               {cartLines.map((p) => (
                  <motion.div 
                     layout
                     key={p.id} 
                     className="flex items-center gap-6 group"
                  >
                     <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 dark:bg-zinc-900 rounded-3xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5">
                        <img src={p.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={p.name} />
                     </div>
                     
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                           <div className="text-left">
                              <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-white truncate uppercase italic tracking-tight">{p.name}</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.category}</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                           <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900 rounded-full px-2 py-1 border border-black/5 dark:border-white/5">
                              <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 rounded-full bg-white dark:bg-black text-slate-900 dark:text-white shadow-sm flex items-center justify-center active:scale-75 transition-all">
                                 <Minus size={12} />
                              </button>
                              <span className="text-[11px] font-black dark:text-white">{p.quantity}</span>
                              <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 rounded-full bg-white dark:bg-black text-slate-900 dark:text-white shadow-sm flex items-center justify-center active:scale-75 transition-all">
                                 <Plus size={12} />
                              </button>
                           </div>
                           <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white italic">
                              {state.currency}{(p.price * p.quantity).toLocaleString()}
                           </span>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>

            {/* Simple Total */}
            <div className="pt-12 border-t border-black/5 dark:border-white/5">
               <div className="flex flex-col items-end gap-6">
                  <div className="text-right">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-2">Estimated Total</span>
                     <span className="text-4xl md:text-6xl font-black italic tracking-tighter dark:text-white">
                        {state.currency}{total.toLocaleString()}
                     </span>
                  </div>

                  <button 
                     onClick={sendWhatsAppOrder}
                     disabled={!storeAcceptingOrders}
                     className={cn(
                        "w-full md:w-auto px-12 py-6 rounded-full font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-3xl transition-all active:scale-95",
                        storeAcceptingOrders ? "bg-black dark:bg-white text-white dark:text-black hover:brightness-110" : "bg-slate-100 dark:bg-zinc-900 text-slate-400 cursor-not-allowed"
                     )}
                  >
                     <MessageSquare size={16} fill="currentColor" />
                     {storeAcceptingOrders ? "Confirm Selection" : "Store Paused"}
                  </button>
                  
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center w-full">
                     Logistics & payment will be finalized on WhatsApp
                  </p>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}