"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Search, ShoppingCart, Heart, Plus, Home, User, X, ChevronLeft, MapPin, Package, MessageSquare, Send, CheckCircle2, BarChart3, TrendingUp, Zap, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "store" | "search" | "chart" | "profile";

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
      startLocationTracking 
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
  const [selectedProduct, setSelectedProduct] = useState<typeof state.products[0] | null>(null);

  // Dynamic Categories
  const categories: string[] = ["All", ...Array.from(new Set(state.products.map(p => p.category).filter((c): c is string => Boolean(c))))];

  const accentStr = state.accentColor || "#10b981";
  const canAddToCart = (outOfStock: boolean) =>
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
        "w-full bg-[#f8fafc] font-sans relative flex flex-col",
        isPreview ? "min-h-[100%]" : "min-h-screen"
    )} id={isPreview ? undefined : "customer-view"}>
      
      {/* ── TOP NAV HEADER ── */}
      <nav className={cn(
          "bg-white z-40 sticky top-0 border-b border-slate-100 shadow-sm w-full",
          isPreview ? "" : "pt-safe"
      )}>
         <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden" style={{ backgroundColor: accentStr }}>
                     {state.bizImage ? 
                         <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> :
                         <Zap className="text-white" size={20} />
                     }
                 </div>
                 <div className="flex flex-col">
                     <span className="font-black text-slate-900 text-base md:text-lg leading-tight tracking-tight">
                         {state.bizName || "My Store"}
                     </span>
                     <div className="flex items-center gap-1 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Store</span>
                     </div>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <button className="text-slate-500 hover:text-slate-900 transition-colors hidden md:block" onClick={() => setActiveView("search")}>
                     <Search size={22} strokeWidth={2.5} />
                 </button>
                 <button className="text-slate-500 hover:text-slate-900 transition-colors relative" onClick={() => toggleCartDrawer(true)}>
                     <ShoppingCart size={22} strokeWidth={2.5} />
                     {cartItemCount > 0 && (
                         <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 p-1 min-w-[18px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm border border-white">
                             {cartItemCount}
                         </div>
                     )}
                 </button>
             </div>
         </div>
         
         {activeView === "store" && categories.length > 1 && (
             <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto snap-x bg-white border-t border-slate-50/50" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                 {categories.map(cat => (
                     <button 
                         key={cat}
                         onClick={() => setActiveCategory(cat)}
                         className={cn(
                             "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-colors border",
                             activeCategory === cat 
                                ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                                : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100"
                         )}
                     >
                         {cat}
                     </button>
                 ))}
             </div>
         )}
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full max-w-7xl mx-auto flex-1 pb-24 md:pb-10 flex flex-col">
         {/* ── STORE VIEW ── */}
         {activeView === "store" && (
           <div className="px-4 py-4 md:px-6 md:py-8 w-full animate-fade-in-up">
               <div className="w-full relative rounded-[2.5rem] overflow-hidden shadow-lg aspect-[16/9] md:aspect-[3/1] mb-8 group cursor-default">
                   <img 
                       src={state.bizImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"} 
                       alt="Banner" 
                       className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                   <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-6 md:p-12 flex flex-col justify-center items-start">
                       <motion.span 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="text-[11px] md:text-sm font-black uppercase tracking-[0.3em] mb-3 drop-shadow" style={{ color: accentStr }}>
                          {state.announcement || "QUALITY GUARANTEED"}
                       </motion.span>
                       <motion.h2 
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          className="text-3xl md:text-6xl font-black text-white leading-[1.1] mb-6 md:mb-8 max-w-[280px] md:max-w-2xl drop-shadow-2xl">
                           {state.tagline || "Redefining Your Lifestyle."}
                       </motion.h2>
                       <button className="px-6 py-2.5 md:px-10 md:py-4 rounded-full flex items-center gap-3 text-xs md:text-sm font-black text-white shadow-2xl active:scale-95 transition-all hover:brightness-110" style={{ backgroundColor: accentStr }}>
                           Browse Catalog <i className="fas fa-chevron-right text-[10px]" />
                       </button>
                   </div>
               </div>

               {/* Products Grid */}
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                   {visibleProducts.map(p => (
                       <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group hover:shadow-xl hover:border-slate-200">
                           <div className="absolute top-4 left-4 z-10">
                               {p.badge && (
                                   <div className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black underline uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                                       {p.badge}
                                   </div>
                               )}
                               {p.outOfStock && state.outOfStockDisplay !== "hide" && (
                                   <div className="mt-2 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                                       Sold out
                                   </div>
                               )}
                           </div>
                           
                           <button onClick={(e) => { e.stopPropagation(); }} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center z-10 text-slate-300 hover:text-red-500 transition-colors shadow-sm active:scale-90 opacity-0 group-hover:opacity-100">
                               <Heart size={18} strokeWidth={2.5} />
                           </button>

                           <div className="relative w-full aspect-square overflow-hidden bg-slate-50 border-b border-slate-50">
                               <img src={p.image} alt="" className={cn("w-full h-full object-cover transition-transform duration-500 group-hover:scale-110", p.outOfStock ? "grayscale opacity-50" : "")} />
                           </div>

                           <div className="p-4 md:p-5 flex flex-col flex-1">
                               <h3 className="font-black text-sm md:text-base text-slate-900 mb-1 leading-tight line-clamp-1">{p.name}</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{p.category || "General"}</p>
                               
                               <div className="mt-auto flex items-center justify-between">
                                   <span className="font-black text-base md:text-xl tracking-tight text-slate-900">
                                       {state.currency}{Number(p.price).toLocaleString()}
                                   </span>
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); if (!canAddToCart(p.outOfStock)) return; updateCart(p.id, 1); }}
                                       disabled={!canAddToCart(p.outOfStock)}
                                       className={cn(
                                           "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50",
                                           cart[p.id] ? "bg-emerald-500 text-white" : "bg-slate-900 text-white shadow-lg"
                                       )}
                                   >
                                       {cart[p.id] ? <CheckCircle2 size={18} /> : <Plus size={18} strokeWidth={3} />}
                                   </button>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
         )}

         {/* ── SEARCH VIEW ── */}
         {activeView === "search" && (
           <div className="px-4 py-8 md:px-6 md:py-12 w-full max-w-2xl mx-auto animate-fade-in-up">
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter italic">DISCOVER</h2>
              <div className="relative mb-10 group">
                  <Search className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={24} />
                  <input 
                      type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find your vibe..." 
                      className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 md:py-6 pl-16 pr-8 text-base font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-all shadow-sm"
                  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibleProducts.map(p => (
                      <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white border border-slate-100 shadow-sm flex p-3 gap-5 items-center rounded-3xl cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
                          <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                              <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                          </div>
                          <div className="flex flex-col flex-1">
                              <span className="text-base font-black leading-tight">{p.name}</span>
                              <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{p.category}</span>
                              <span className="text-sm font-black mt-2" style={{ color: accentStr }}>{state.currency}{Number(p.price).toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
         )}
         
         {/* ── CHART VIEW (Analytics/Trends) ── */}
         {activeView === "chart" && (
             <div className="flex-1 px-4 py-8 md:px-6 md:py-12 max-w-3xl mx-auto w-full animate-fade-in-up">
                 <div className="mb-10 text-center">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 italic">SHOP INSIGHTS</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Live Trends & Market Popularity</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-black">
                                <TrendingUp size={20} />
                            </div>
                            <span className="font-black text-sm uppercase tracking-widest">Growth rate</span>
                        </div>
                        <div className="h-32 flex items-end gap-1.5 px-2">
                            {[40, 65, 30, 85, 55, 95, 75].map((h, i) => (
                                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1, duration: 0.8 }} className="flex-1 rounded-t-lg bg-emerald-500 shadow-sm" />
                            ))}
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase mt-2">
                            <span>Mon</span><span>Wed</span><span>Sun</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                        <div>
                             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6">Top Performing Categories</h3>
                             <div className="space-y-4">
                                {categories.slice(1, 4).map((cat, i) => (
                                    <div key={cat} className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>{cat}</span>
                                            <span style={{ color: accentStr }}>{94 - i * 15}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${94 - i * 15}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-white" />
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5 border-dashed flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400 italic">Data updated 2m ago</span>
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px]">👤</div>)}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Popularity Ranking List */}
                 <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 ml-2">Trending Products</h3>
                 <div className="space-y-3">
                     {state.products.slice(0, 4).map((p, i) => (
                         <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-5 group hover:border-slate-300 transition-colors">
                            <span className="font-black text-2xl text-slate-100 group-hover:text-slate-200 transition-colors italic">0{i+1}</span>
                            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner shrink-0 border border-slate-50">
                                <img src={p.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-sm text-slate-900">{p.name}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <BarChart3 className="text-emerald-500" size={12} />
                                    <span className="text-[10px] font-bold text-slate-400">High Demand (+42%)</span>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">View</button>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {/* ── PROFILE VIEW ── */}
         {activeView === "profile" && (
           <div className="px-4 py-8 md:px-6 md:py-12 w-full max-w-xl mx-auto flex flex-col animate-fade-in-up">
               {(!user || user.isAnonymous) ? (
                   // REAL Firebase Auth Flow
                   <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100">
                        <div className="flex justify-center mb-10">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-xl rotate-3">
                                <LogIn size={32} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">Access Hub</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-10">Track your orders & profile</p>
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-transparent transition-all" 
                                />
                            </div>
                            <div className="relative">
                                <input 
                                    type="password" placeholder="Key Phrase" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-transparent transition-all" 
                                />
                            </div>
                            
                            {authError && <p className="text-[10px] font-bold text-red-500 px-2 uppercase">{authError}</p>}
                            
                            <button 
                                onClick={handleAuth} disabled={isAuthLoading}
                                className="w-full mt-6 py-5 rounded-[2rem] text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50" 
                                style={{ backgroundColor: accentStr }}
                            >
                                {isAuthLoading ? "Processing..." : authMode === "login" ? "Secure Login" : "Join Member Hub"}
                            </button>
                            
                            <button 
                                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                                className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                            >
                                {authMode === "login" ? "Create New Profile" : "Back to Login"}
                            </button>
                        </div>
                   </div>
               ) : (
                   // Authenticated Tracking Dashboard with REAL location data
                   <div className="space-y-8">
                        <div className="flex items-center gap-5 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white border-4 border-slate-50 shadow-inner">
                                <span className="font-black text-2xl uppercase">{user.email?.slice(0, 2) || "ME"}</span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-black text-slate-900 leading-tight">{user.email?.split('@')[0]}</h2>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Verified Member</p>
                            </div>
                            <button onClick={() => { /* Real logout logic if needed */ }} className="bg-slate-50 p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative">
                            {/* Live Tracking Status */}
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Order ID: SL-7729</span>
                                    <h4 className="font-black text-slate-900 flex items-center gap-2 mt-1 italic">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ON THE WAY
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estimate</span>
                                    <div className="font-black text-emerald-500">8 Mins</div>
                                </div>
                            </div>

                            {/* Map Box */}
                            <div className="w-full h-56 bg-slate-100 rounded-[2rem] mb-6 overflow-hidden relative border border-slate-200">
                                {currentLocation ? (
                                    <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center animate-ping absolute" />
                                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl relative z-10">
                                            <MapPin size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-900 mt-4 uppercase tracking-widest">Live Coordinate</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1">{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=6.5244,3.3792&zoom=13&size=400x400&maptype=roadmap&style=element:geometry%7Ccolor:0xf5f5f5&key=fake')] bg-cover opacity-60">
                                        <div className="bg-white/90 backdrop-blur px-5 py-3 rounded-2xl shadow-lg border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Searching Signal...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Carrier</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-900" />
                                        <span className="font-bold text-xs text-slate-900">SwiftRider-B4</span>
                                    </div>
                                </div>
                                <button className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
                                    <MessageSquare size={24} />
                                </button>
                            </div>
                        </div>
                   </div>
               )}
           </div>
         )}
      </main>
      
      {/* ── APP NAVIGATION BAR (Always Fixed) ── */}
      <nav className="fixed bottom-0 w-full md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 pb-safe pt-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          <button onClick={() => setActiveView("store")} className={cn("flex flex-col items-center gap-1.5 p-2 transition-all", activeView === "store" ? "text-slate-900 -translate-y-1" : "text-slate-300")}>
              <Home size={22} strokeWidth={activeView === "store" ? 3 : 2} />
              <span className={cn("text-[8px] font-black uppercase tracking-widest", activeView === "store" ? "opacity-100" : "opacity-0")}>Store</span>
          </button>
          
          <button onClick={() => setActiveView("search")} className={cn("flex flex-col items-center gap-1.5 p-2 transition-all", activeView === "search" ? "text-slate-900 -translate-y-1" : "text-slate-300")}>
              <Search size={22} strokeWidth={activeView === "search" ? 3 : 2} />
              <span className={cn("text-[8px] font-black uppercase tracking-widest", activeView === "search" ? "opacity-100" : "opacity-0")}>Search</span>
          </button>
          
          <button onClick={() => setActiveView("chart")} className={cn("flex flex-col items-center gap-1.5 p-2 transition-all", activeView === "chart" ? "text-slate-900 -translate-y-1" : "text-slate-300")}>
              <BarChart3 size={22} strokeWidth={activeView === "chart" ? 3 : 2} />
              <span className={cn("text-[8px] font-black uppercase tracking-widest", activeView === "chart" ? "opacity-100" : "opacity-0")}>Trends</span>
          </button>

          <button onClick={() => setActiveView("profile")} className={cn("flex flex-col items-center gap-1.5 p-2 transition-all", activeView === "profile" ? "text-slate-900 -translate-y-1" : "text-slate-300")}>
              <User size={22} strokeWidth={activeView === "profile" ? 3 : 2} />
              <span className={cn("text-[8px] font-black uppercase tracking-widest", activeView === "profile" ? "opacity-100" : "opacity-0")}>Profile</span>
          </button>
      </nav>

      {/* --- Product Details Modal --- */}
      <AnimatePresence>
          {selectedProduct && (
              <motion.div 
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row overflow-hidden md:max-w-7xl md:max-h-[90vh] md:m-auto md:shadow-2xl md:rounded-[4rem] border border-slate-100"
              >
                  <div className="relative w-full md:w-1/2 h-[50%] md:h-full bg-slate-50 shrink-0 border-r border-slate-50">
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain p-8" />
                      <button onClick={() => setSelectedProduct(null)} className="absolute top-safe mt-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-slate-900 z-10 active:scale-95 transition-all"><ChevronLeft size={24} strokeWidth={3} /></button>
                  </div>

                  <div className="flex-1 bg-white p-8 md:p-16 flex flex-col overflow-y-auto">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedProduct.category}</p>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">{selectedProduct.name}</h2>
                         </div>
                         <div className="text-2xl md:text-4xl font-black italic" style={{ color: accentStr }}>{state.currency}{Number(selectedProduct.price).toLocaleString()}</div>
                      </div>
                      
                      <div className="mb-10">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">The Detail</h3>
                          <p className="text-slate-500 text-sm md:text-lg leading-relaxed">{selectedProduct.description || "No description provided for this premium item."}</p>
                      </div>
                      
                      <div className="mt-auto flex gap-4">
                          <button
                              onClick={() => {
                                  if (!canAddToCart(selectedProduct.outOfStock)) return;
                                  updateCart(selectedProduct.id, 1);
                                  toggleCartDrawer(true);
                                  setSelectedProduct(null);
                              }}
                              disabled={!canAddToCart(selectedProduct.outOfStock)}
                              className="flex-1 py-5 rounded-[2rem] text-white font-black text-sm uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              style={{ backgroundColor: accentStr }}
                          >
                             {canAddToCart(selectedProduct.outOfStock) ? "Add to Collection" : "Sold out"}
                          </button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
