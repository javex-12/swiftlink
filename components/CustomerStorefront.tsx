"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { Search, ShoppingCart, Heart, Plus, Home, User, X, ChevronLeft, MapPin, Package, MessageSquare, Send, CheckCircle2, BarChart3, TrendingUp, Zap, LogIn, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "store" | "search" | "profile";

export function CustomerStorefront({ isPreview = false }: { isPreview?: boolean } = {}) {
  const { 
      state, 
      cart, 
      updateCart, 
      toggleCartDrawer, 
      cartItemCount, 
      user, 
      emailSignIn, 
      emailSignUp, 
      currentLocation, 
      startLocationTracking,
      handleSignOut
  } = useSwiftLink();
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState<ViewState>("store");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Product Details Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Theme helper classes
  const themeClasses = useMemo(() => {
    const fontClass = 
        state.fontStyle === "bold" ? "font-black tracking-tight" : 
        state.fontStyle === "playful" ? "italic" : 
        state.fontStyle === "classic" ? "font-medium" : "font-sans";
    
    const shapeClass = 
        state.imageShape === "circle" ? "rounded-full" : 
        state.imageShape === "square" ? "rounded-none" : "rounded-[2.5rem]";
        
    const btnClass = 
        state.buttonRadius === "pill" ? "rounded-full" : 
        state.buttonRadius === "sharp" ? "rounded-none" : "rounded-[1.2rem]";

    return { fontClass, shapeClass, btnClass };
  }, [state.fontStyle, state.imageShape, state.buttonRadius]);

  // Dynamic Categories (use custom ones if available, otherwise collect from products)
  const categories: string[] = useMemo(() => {
      const custom = state.categories || [];
      if (custom.length > 0) return ["All", ...custom];
      
      const collected = Array.from(new Set(state.products.map(p => p.category).filter(Boolean)));
      return ["All", ...(collected as string[])];
  }, [state.categories, state.products]);

  const accentStr = state.accentColor || "#10b981";
  const storeAcceptingOrders = state.isLive !== false;
  const canAddToCart = (outOfStock: boolean) =>
    storeAcceptingOrders &&
    !(outOfStock && state.outOfStockDisplay !== "hide");

  // Filter products
  const visibleProducts = state.products.filter(p => {
      if (state.outOfStockDisplay === "hide" && p.outOfStock) return false;
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (activeView === "search" && searchQuery) {
          return p.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
  });

  // Handle Real Auth
  const handleAuth = async () => {
      setAuthError("");
      setIsAuthLoading(true);
      try {
          if (authMode === "login") {
              await emailSignIn(email, password);
          } else {
              await emailSignUp(email, password);
          }
      } catch (e: any) {
          setAuthError(e.message || "Authentication failed");
      } finally {
          setIsAuthLoading(false);
      }
  };

  // Start location tracking when viewing profile (tracking)
  useEffect(() => {
     if (activeView === "profile" && user && !user.isAnonymous) {
         startLocationTracking();
     }
  }, [activeView, user, startLocationTracking]);

  // Lock body scroll
  useEffect(() => {
     if (!isPreview && selectedProduct && typeof document !== 'undefined') {
         document.body.style.overflow = 'hidden';
     } else if (!isPreview && typeof document !== 'undefined') {
         document.body.style.overflow = 'auto';
     }
     return () => {
         if (!isPreview && typeof document !== 'undefined') {
             document.body.style.overflow = 'auto';
         }
     }
  }, [selectedProduct, isPreview]);

  return (
    <div className={cn(
        "w-full relative flex flex-col transition-colors duration-500",
        state.bgStyle === "light-tint" ? "bg-slate-50" : state.bgStyle === "pattern" ? "bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]" : "bg-[#f8fafc]",
        themeClasses.fontClass,
        isPreview ? "min-h-full" : "min-h-screen"
    )} id={isPreview ? undefined : "customer-view"}>
      
      {!isPreview && !storeAcceptingOrders && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 text-center z-50 sticky top-0">
          <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Ordering is currently paused
          </p>
        </div>
      )}

      {/* ── TOP NAV HEADER ── */}
      <nav className={cn(
          "bg-white/95 backdrop-blur-xl z-[45] sticky border-b border-slate-100 shadow-sm w-full transition-all",
          isPreview ? "top-0" : storeAcceptingOrders ? "top-0 pt-safe" : "top-12 pt-safe"
      )}>
         <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 overflow-hidden ring-1 ring-slate-100" style={{ backgroundColor: accentStr }}>
                     {state.bizImage ? 
                         <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> :
                         <Zap className="text-white" size={24} fill="white" />
                     }
                 </div>
                 <div className="flex flex-col min-w-0">
                     <span className="font-black text-slate-900 text-lg md:text-xl leading-none tracking-tighter truncate uppercase italic">
                         {state.bizName || "My Store"}
                     </span>
                     <div className="flex items-center gap-2 mt-1.5 min-w-0">
                         <div
                           className={cn(
                             "w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                             storeAcceptingOrders
                               ? "bg-emerald-500 animate-pulse"
                               : "bg-amber-500",
                           )}
                         />
                         <span
                           className={cn(
                             "text-[9px] font-black uppercase tracking-widest truncate",
                             storeAcceptingOrders ? "text-slate-500" : "text-amber-700",
                           )}
                         >
                           {storeAcceptingOrders
                             ? "Accepting Orders"
                             : "Viewing Only"}
                         </span>
                     </div>
                 </div>
             </div>

             <div className="flex items-center gap-4 md:gap-6">
                 <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm md:flex hidden" onClick={() => setActiveView("search")}>
                     <Search size={18} strokeWidth={3} />
                 </button>
                 <button className="relative group" onClick={() => toggleCartDrawer(true)}>
                     <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white shadow-xl group-active:scale-95 transition-all">
                        <ShoppingCart size={20} strokeWidth={2.5} />
                     </div>
                     {cartItemCount > 0 && (
                         <div className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-black text-white shadow-lg border-2 border-white animate-bounce-slow">
                             {cartItemCount}
                         </div>
                     )}
                 </button>
             </div>
         </div>
         
         {activeView === "store" && categories.length > 1 && (
             <div className="px-5 py-3 flex items-center gap-2.5 overflow-x-auto snap-x bg-white/50 border-t border-slate-50 no-scrollbar">
                 {categories.map(cat => (
                     <button 
                         key={cat}
                         onClick={() => setActiveCategory(cat)}
                         className={cn(
                             "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap snap-start transition-all border",
                             activeCategory === cat 
                                ? "bg-slate-900 text-white border-slate-900 shadow-lg -translate-y-0.5" 
                                : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-900"
                         )}
                     >
                         {cat}
                     </button>
                 ))}
             </div>
         )}
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full max-w-7xl mx-auto flex-1 pb-32 md:pb-16 flex flex-col min-w-0">
         {/* ── STORE VIEW ── */}
         {activeView === "store" && (
           <div className="px-5 py-6 md:px-10 md:py-10 w-full animate-fade-in-up">
               <div className={cn(
                   "w-full relative rounded-[3rem] overflow-hidden shadow-2xl mb-12 group border-4 border-white",
                   state.heroStyle === "minimal" ? "aspect-[4/1] md:aspect-[6/1]" : state.heroStyle === "split" ? "aspect-[4/5] md:aspect-[2/1]" : "aspect-[4/3] md:aspect-[3/1]"
               )}>
                   <img 
                       src={state.bizImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"} 
                       alt="Banner" 
                       className={cn(
                           "absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110",
                           state.heroStyle === "split" ? "md:w-1/2 md:translate-x-full" : ""
                       )}
                   />
                   <div className={cn(
                       "absolute inset-0 p-8 md:p-16 flex flex-col justify-center items-start",
                       state.heroStyle === "split" ? "bg-slate-900 md:w-1/2" : "bg-gradient-to-r from-black/90 via-black/40 to-transparent"
                   )}>
                       <motion.div 
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 mb-6">
                          <div className="h-0.5 w-8 bg-emerald-500" />
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-emerald-400 drop-shadow">
                            {state.announcement || "QUALITY GUARANTEED"}
                          </span>
                       </motion.div>
                       <motion.h2 
                          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          className={cn(
                              "font-black text-white leading-[1] mb-8 drop-shadow-2xl uppercase italic tracking-tighter",
                              state.heroStyle === "minimal" ? "text-2xl md:text-4xl max-w-xl" : "text-4xl md:text-7xl max-w-[300px] md:max-w-2xl"
                          )}>
                           {state.tagline || "Redefining Your Lifestyle."}
                       </motion.h2>
                       <button 
                         onClick={() => { const el = document.getElementById('product-grid'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                         className={cn(
                             "px-8 py-4 md:px-12 md:py-5 flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-2xl active:scale-95 transition-all hover:brightness-110 group/btn",
                             themeClasses.btnClass
                         )} style={{ backgroundColor: accentStr }}>
                           Browse Catalog <ChevronLeft className="rotate-180 group-hover/btn:translate-x-2 transition-transform" size={16} strokeWidth={3} />
                       </button>
                   </div>
               </div>

               {/* Products Grid */}
               <div id="product-grid" className={cn(
                   state.layoutStyle === "list" ? "flex flex-col gap-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8"
               )}>
                   {visibleProducts.map((p, i) => (
                       <motion.div 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: i * 0.05 }}
                          key={p.id} 
                          onClick={() => setSelectedProduct(p)} 
                          className={cn(
                              "bg-white shadow-sm border border-slate-100 flex relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group hover:shadow-2xl hover:border-emerald-500/20",
                              state.layoutStyle === "list" ? "flex-row items-center p-4 gap-6 rounded-[2rem]" : "flex-col " + themeClasses.shapeClass,
                              themeClasses.fontClass
                          )}
                       >
                           <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                               {p.badge && (
                                   <div className="bg-white/95 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg border border-slate-100">
                                       {p.badge}
                                   </div>
                               )}
                               {p.outOfStock && state.outOfStockDisplay !== "hide" && (
                                   <div className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-red-500/20">
                                       Sold out
                                   </div>
                               )}
                           </div>
                           
                           <button onClick={(e) => { e.stopPropagation(); }} className="absolute top-4 right-4 w-10 h-10 rounded-[1.2rem] bg-white/95 backdrop-blur-md flex items-center justify-center z-10 text-slate-300 hover:text-red-500 transition-all shadow-lg active:scale-90 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 border border-slate-100">
                               <Heart size={18} strokeWidth={3} />
                           </button>

                           <div className={cn(
                               "relative overflow-hidden bg-slate-50",
                               state.layoutStyle === "list" ? "w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl" : "w-full aspect-[4/5] border-b border-slate-50"
                           )}>
                               <img src={p.image} alt="" className={cn("w-full h-full object-cover transition-transform duration-1000 group-hover:scale-115", p.outOfStock ? "grayscale opacity-50" : "")} />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>

                           <div className={cn(
                               "flex flex-col flex-1 bg-white relative",
                               state.layoutStyle === "list" ? "p-0" : "p-5 md:p-6"
                           )}>
                               <h3 className="font-black text-sm md:text-lg text-slate-900 mb-1 leading-tight line-clamp-1 uppercase italic tracking-tight">{p.name}</h3>
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">{p.category || "General"}</p>
                               
                               <div className="mt-auto flex items-center justify-between gap-4">
                                   <span className={cn(
                                       "font-black text-lg md:text-2xl tracking-tighter text-slate-900 italic",
                                       state.priceStyle === "strikethrough" ? "line-through opacity-50" : state.priceStyle === "plain" ? "not-italic" : ""
                                   )}>
                                       {state.currency}{Number(p.price).toLocaleString()}
                                   </span>
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); if (!canAddToCart(p.outOfStock)) return; updateCart(p.id, 1); }}
                                       disabled={!canAddToCart(p.outOfStock)}
                                       className={cn(
                                           "flex items-center justify-center transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-xl",
                                           state.layoutStyle === "list" ? "w-10 h-10" : "w-12 h-12",
                                           themeClasses.btnClass,
                                           cart[p.id] ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-slate-900 text-white shadow-slate-900/30 group-hover:bg-emerald-500 group-hover:shadow-emerald-500/30"
                                       )}
                                   >
                                       {cart[p.id] ? <CheckCircle2 size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                                   </button>
                               </div>
                           </div>
                       </motion.div>
                   ))}
               </div>
           </div>
         )}

         {/* ── SEARCH VIEW ── */}
         {activeView === "search" && (
           <div className="px-5 py-8 md:px-10 md:py-12 w-full max-w-2xl mx-auto animate-fade-in-up">
              <div className="mb-10">
                 <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter italic uppercase">Discover</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Find your next favorite piece</p>
              </div>
              <div className="relative mb-12 group">
                  <Search className="absolute top-1/2 left-7 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={24} strokeWidth={3} />
                  <input 
                      type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for items..." 
                      className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 text-base font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-all shadow-xl shadow-slate-100/50"
                  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {visibleProducts.map(p => (
                      <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white border border-slate-100 shadow-sm flex p-4 gap-6 items-center rounded-[2rem] cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 group">
                          <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-50">
                              <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-base font-black leading-tight truncate uppercase italic">{p.name}</span>
                              <span className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">{p.category}</span>
                              <span className="text-lg font-black mt-3 tracking-tighter italic" style={{ color: accentStr }}>{state.currency}{Number(p.price).toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
                  {visibleProducts.length === 0 && (
                      <div className="col-span-full py-20 text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                             <Search size={32} className="text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No matches found for your search</p>
                      </div>
                  )}
              </div>
           </div>
         )}
         
         {/* ── PROFILE VIEW ── */}
         {activeView === "profile" && (
           <div className="px-5 py-8 md:px-10 md:py-12 w-full max-w-xl mx-auto flex flex-col animate-fade-in-up">
               {(!user || user.isAnonymous) ? (
                   <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                           <LogIn size={120} />
                        </div>
                        <div className="flex justify-center mb-10">
                            <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-3 ring-8 ring-slate-50 relative z-10">
                                <LogIn size={36} strokeWidth={2.5} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tighter uppercase italic">Access Hub</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-12">Track orders & preferences</p>
                        
                        <div className="space-y-5 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Email Address</label>
                                <input 
                                    type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-transparent transition-all shadow-inner" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Password</label>
                                <input 
                                    type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-transparent transition-all shadow-inner" 
                                />
                            </div>
                            
                            {authError && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100">{authError}</div>}
                            
                            <button 
                                onClick={handleAuth} disabled={isAuthLoading}
                                className="w-full mt-6 py-5 rounded-[2rem] text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50" 
                                style={{ backgroundColor: accentStr, boxShadow: `0 20px 40px -10px ${accentStr}66` }}
                            >
                                {isAuthLoading ? "Connecting..." : authMode === "login" ? "Secure Login" : "Join Member Hub"}
                            </button>
                            
                            <button 
                                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                            >
                                {authMode === "login" ? "Create New Profile" : "Already a member? Log In"}
                            </button>
                        </div>
                   </div>
               ) : (
                   <div className="space-y-8">
                        <div className="flex items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white border-4 border-slate-50 shadow-2xl shrink-0 overflow-hidden italic">
                                {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" /> : <span className="font-black text-3xl uppercase">{user.email?.slice(0, 2) || "ME"}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-black text-slate-900 leading-none tracking-tighter uppercase italic truncate">{user.email?.split('@')[0]}</h2>
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Member</div>
                            </div>
                            <button onClick={handleSignOut} className="w-12 h-12 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center shadow-sm border border-slate-100"><X size={20} strokeWidth={3} /></button>
                        </div>

                        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative group">
                            <div className="mb-8 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Active Shipment</span>
                                    <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 mt-1 italic uppercase tracking-tight">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Out for Delivery
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Eta</span>
                                    <div className="text-xl font-black text-emerald-500 italic tracking-tighter">8 Mins</div>
                                </div>
                            </div>

                            <div className="w-full h-64 bg-slate-100 rounded-[2.5rem] mb-8 overflow-hidden relative border-4 border-slate-50 shadow-inner group-hover:border-emerald-50 transition-all">
                                {currentLocation ? (
                                    <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center">
                                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center animate-ping absolute" />
                                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10 ring-4 ring-white">
                                            <MapPin size={32} />
                                        </div>
                                        <p className="text-[11px] font-black text-slate-900 mt-6 uppercase tracking-[0.2em]">Signal Acquired</p>
                                        <p className="text-[9px] font-black text-slate-400 mt-1">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=6.5244,3.3792&zoom=13&size=400x400&maptype=roadmap&style=element:geometry%7Ccolor:0xf5f5f5&key=fake')] bg-cover opacity-60">
                                        <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3">
                                            <Loader2 className="animate-spin text-emerald-500" size={16} strokeWidth={3} />
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Awaiting Rider Ping...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs italic shadow-lg">SR</div>
                                    <div className="flex flex-col">
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rider</span>
                                       <span className="font-black text-sm text-slate-900 italic">SwiftRider-X4</span>
                                    </div>
                                </div>
                                <button className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl active:scale-90 hover:bg-emerald-500 transition-all border-4 border-slate-50">
                                    <MessageSquare size={28} />
                                </button>
                            </div>
                        </div>
                   </div>
               )}
           </div>
         )}
      </main>
      
      {/* ── APP NAVIGATION BAR (Always Fixed) ── */}
      <nav className="fixed bottom-0 w-full md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 pb-safe pt-4 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.06)]">
          <button onClick={() => setActiveView("store")} className={cn("flex flex-col items-center gap-2 p-2 transition-all", activeView === "store" ? "text-slate-900 -translate-y-2" : "text-slate-300")}>
              <div className={cn("w-12 h-10 rounded-2xl flex items-center justify-center transition-all", activeView === "store" ? "bg-slate-900 text-white shadow-lg" : "")}>
                 <Home size={22} strokeWidth={3} />
              </div>
              <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", activeView === "store" ? "opacity-100" : "opacity-0")}>Store</span>
          </button>
          
          <button onClick={() => setActiveView("search")} className={cn("flex flex-col items-center gap-2 p-2 transition-all", activeView === "search" ? "text-slate-900 -translate-y-2" : "text-slate-300")}>
              <div className={cn("w-12 h-10 rounded-2xl flex items-center justify-center transition-all", activeView === "search" ? "bg-slate-900 text-white shadow-lg" : "")}>
                 <Search size={22} strokeWidth={3} />
              </div>
              <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", activeView === "search" ? "opacity-100" : "opacity-0")}>Search</span>
          </button>

          <button onClick={() => setActiveView("profile")} className={cn("flex flex-col items-center gap-2 p-2 transition-all", activeView === "profile" ? "text-slate-900 -translate-y-2" : "text-slate-300")}>
              <div className={cn("w-12 h-10 rounded-2xl flex items-center justify-center transition-all", activeView === "profile" ? "bg-slate-900 text-white shadow-lg" : "")}>
                 <User size={22} strokeWidth={3} />
              </div>
              <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", activeView === "profile" ? "opacity-100" : "opacity-0")}>Me</span>
          </button>
      </nav>

      {/* --- Product Details Modal --- */}
      <AnimatePresence>
          {selectedProduct && (
              <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-10"
              >
                  <motion.div 
                      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      className="w-full h-[90vh] md:h-auto md:max-w-6xl bg-white flex flex-col md:flex-row overflow-hidden md:shadow-[0_40px_100px_rgba(0,0,0,0.25)] md:rounded-[4rem] border border-white/20"
                  >
                      <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-slate-50 shrink-0 border-r border-slate-50 overflow-hidden group">
                          <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain p-8 md:p-16 transition-transform duration-1000 group-hover:scale-110" />
                          <button onClick={() => setSelectedProduct(null)} className="absolute top-safe mt-6 left-6 w-14 h-14 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center text-slate-900 z-10 active:scale-95 transition-all border border-slate-100"><ChevronLeft size={24} strokeWidth={4} /></button>
                          
                          <div className="absolute bottom-8 left-8 flex gap-2">
                             {(selectedProduct.images || [selectedProduct.image]).map((img: any, i: number) => (
                                <div key={i} className="w-3 h-1 bg-slate-200 rounded-full transition-all peer-checked:bg-slate-900" />
                             ))}
                          </div>
                      </div>

                      <div className="flex-1 bg-white p-8 md:p-20 flex flex-col overflow-y-auto">
                          <div className="mb-10">
                             <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">{selectedProduct.category}</span>
                                <div className="h-px flex-1 bg-slate-50" />
                             </div>
                             <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1] tracking-tighter uppercase italic mb-6">{selectedProduct.name}</h2>
                             <div className="text-3xl md:text-5xl font-black italic tracking-tighter" style={{ color: accentStr }}>{state.currency}{Number(selectedProduct.price).toLocaleString()}</div>
                          </div>
                          
                          <div className="mb-12 flex-1">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-6 flex items-center gap-3">
                                 The Detail <div className="h-px flex-1 bg-slate-50" />
                              </h3>
                              <p className="text-slate-500 text-sm md:text-xl font-medium leading-relaxed italic">{selectedProduct.description || "No description provided for this premium item."}</p>
                          </div>
                          
                          <div className="mt-auto pt-8 border-t border-slate-50 flex gap-4 md:gap-6">
                              <button
                                  onClick={() => {
                                      if (!canAddToCart(selectedProduct.outOfStock)) return;
                                      updateCart(selectedProduct.id, 1);
                                      toggleCartDrawer(true);
                                      setSelectedProduct(null);
                                  }}
                                  disabled={!canAddToCart(selectedProduct.outOfStock)}
                                  className="flex-1 py-6 rounded-[2.5rem] text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group/buy"
                                  style={{ backgroundColor: accentStr, boxShadow: `0 20px 40px -10px ${accentStr}66` }}
                              >
                                 {!storeAcceptingOrders
                                   ? "Orders paused"
                                   : canAddToCart(selectedProduct.outOfStock)
                                     ? <div className="flex items-center justify-center gap-3">Add to Bag <ShoppingCart size={18} className="group-hover/buy:translate-x-1 transition-transform" /></div>
                                     : "Sold out"}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}