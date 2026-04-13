"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { resolveStorefrontTheme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, ShieldCheck, Truck, Zap, CreditCard, MessageSquare } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

export function CartView() {
  const {
    state,
    cart,
    updateCart,
    sendWhatsAppOrder,
    cartItemCount,
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
  const deliveryFee = 1500; // Placeholder
  const grandTotal = total + (total > 0 ? deliveryFee : 0);

  if (cartItemCount === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
         <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 mb-8">
            <ShoppingBag size={64} strokeWidth={1.5} />
         </div>
         <h2 className="text-3xl font-black text-slate-900 italic tracking-tight mb-4 uppercase">Your bag is empty</h2>
         <p className="text-slate-500 font-medium mb-10 max-w-xs">Looks like you haven&apos;t added anything to your collection yet.</p>
         <Link href="/store/default" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
            Return to Store
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-5 flex items-center justify-between">
         <Link href="/store/default" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-all border border-slate-100">
               <ArrowLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors">Continue Shopping</span>
         </Link>
         
         <div className="flex flex-col items-center">
            <h1 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Checkout</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1 h-1 rounded-full bg-emerald-500" />
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secure Protocol</span>
            </div>
         </div>
         
         <div className="w-10 md:w-32" />
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-7 space-y-8">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Your Selection</h2>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{cartItemCount} Items</span>
               </div>

               <div className="space-y-4">
                  {cartLines.map((p) => (
                     <motion.div 
                        layout
                        key={p.id} 
                        className="bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all"
                     >
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-50 shrink-0">
                           <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                        </div>
                        
                        <div className="flex-1 min-w-0 py-2">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h3 className="text-base md:text-xl font-black text-slate-900 truncate leading-tight uppercase italic">{p.name}</h3>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.category}</p>
                              </div>
                              <button onClick={() => updateCart(p.id, -p.quantity)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                 <Trash2 size={18} />
                              </button>
                           </div>
                           
                           <div className="flex items-center justify-between mt-6 md:mt-8">
                              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1 border border-slate-100">
                                 <button onClick={() => updateCart(p.id, -1)} className="w-8 h-8 rounded-xl bg-white text-slate-900 shadow-sm flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all active:scale-90">
                                    <Minus size={14} />
                                 </button>
                                 <span className="w-10 text-center text-xs font-black">{p.quantity}</span>
                                 <button onClick={() => updateCart(p.id, 1)} className="w-8 h-8 rounded-xl bg-white text-slate-900 shadow-sm flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all active:scale-90">
                                    <Plus size={14} />
                                 </button>
                              </div>
                              <span className="text-lg md:text-2xl font-black text-slate-900 italic">
                                 {state.currency}{(p.price * p.quantity).toLocaleString()}
                              </span>
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </div>

               {/* Quality Badges */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  {[
                     { icon: ShieldCheck, text: "Authentic Product", sub: "100% Guaranteed" },
                     { icon: Truck, text: "Swift Delivery", sub: "Same Day Possible" },
                     { icon: Zap, text: "Best Price", sub: "Value Selection" },
                  ].map((item, i) => (
                     <div key={i} className="bg-white/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                        <item.icon className="text-slate-900 mb-3" size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{item.text}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.sub}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
               <div className="sticky top-32 space-y-8">
                  <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-3xl" />
                     
                     <h3 className="text-xl font-black italic tracking-tight mb-8 uppercase">Order Summary</h3>
                     
                     <div className="space-y-4 mb-10">
                        <div className="flex justify-between items-center text-sm">
                           <span className="font-bold text-slate-500">Subtotal</span>
                           <span className="font-black italic">{state.currency}{total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="font-bold text-slate-500">Estimated Delivery</span>
                           <span className="font-black italic text-emerald-400">{state.currency}{deliveryFee.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-black uppercase tracking-[0.2em]">Grand Total</span>
                           <span className="text-4xl font-black italic tracking-tighter" style={{ color: accentStr }}>
                              {state.currency}{grandTotal.toLocaleString()}
                           </span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {(state.orderMethod === "whatsapp" || state.orderMethod === "both" || !state.orderMethod) && (
                            <button 
                               onClick={sendWhatsAppOrder}
                               disabled={!storeAcceptingOrders}
                               className={cn(
                                  "w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95",
                                  storeAcceptingOrders ? "bg-emerald-500 text-white hover:brightness-110" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                               )}
                               style={storeAcceptingOrders ? { boxShadow: `0 20px 40px -10px ${accentStr}66` } : {}}
                            >
                               <MessageSquare size={18} />
                               {storeAcceptingOrders ? "Confirm via WhatsApp" : "Store Paused"}
                            </button>
                        )}

                        {(state.orderMethod === "paystack" || state.orderMethod === "both") && (
                            <button 
                               onClick={() => alert("Paystack Integration Coming Soon (Pro Module Required)")}
                               disabled={!storeAcceptingOrders}
                               className={cn(
                                  "w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95",
                                  storeAcceptingOrders ? "bg-white text-slate-900 hover:bg-slate-50" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                               )}
                            >
                               <CreditCard size={18} />
                               {storeAcceptingOrders ? "Secure Paystack Pay" : "Store Paused"}
                            </button>
                        )}
                        
                        <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">
                           By confirming, you agree to our <Link href="/terms" className="underline hover:text-white">Terms of Service</Link>
                        </p>
                     </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-3 mb-6">
                        <CreditCard className="text-slate-400" size={18} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supported Methods</h4>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {["VISA", "MASTERCARD", "BANK", "CASH"].map(m => (
                           <div key={m} className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 border border-slate-100 uppercase tracking-widest">{m}</div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </main>
    </div>
  );
}
