"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProSidebar } from "./ProSidebar";
import { Menu, X, Bell, User, Search, Zap, Package, MessageSquare, TrendingUp } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ProLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = usePathname();
  const { state, updateState } = useSwiftLink();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const markAllRead = () => {
    const next = (state.notifications || []).map(n => ({ ...n, read: true }));
    updateState("notifications", next);
  };

  const getPageTitle = () => {
    if (pathname === "/pro") return "Command Center";
    if (pathname === "/business") return "Store Editor";
    if (pathname === "/dispatch") return "Logistics Console";
    if (pathname === "/pro/analytics") return "Business Insights";
    return "Pro Hub";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col lg:flex-row font-sans selection:bg-emerald-500/30">
      {/* Sidebar Navigation */}
      <ProSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        
        {/* Unified Top Header - Slick Minimalist */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.03] px-6 md:px-10 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
             <button
               type="button"
               onClick={() => setMobileOpen(true)}
               className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-all cursor-pointer"
             >
               <Menu className="h-5 w-5" />
             </button>
             <div className="flex flex-col">
               <h1 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">
                  {getPageTitle()}
               </h1>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Status</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
             <div className="hidden md:flex items-center bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-full px-5 py-2 text-slate-400 focus-within:border-emerald-500/30 transition-all focus-within:bg-white dark:focus-within:bg-white/10">
                <Search size={14} className="opacity-50" />
                <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-[10px] font-bold px-3 w-32 text-slate-900 dark:text-white placeholder:text-slate-500" />
             </div>
             
             <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center relative cursor-pointer"
                >
                   <Bell size={18} />
                   {(state.notifications || []).some(n => !n.read) && (
                      <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                   )}
                </button>

                <AnimatePresence>
                   {notificationsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
                      >
                         <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-black/20">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Updates</h3>
                            <button onClick={markAllRead} className="text-[8px] font-black text-emerald-500 uppercase hover:underline cursor-pointer">Mark all read</button>
                         </div>
                         <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {(state.notifications || []).length === 0 ? (
                               <div className="p-12 text-center">
                                  <Bell className="mx-auto text-slate-200 dark:text-white/5 mb-4" size={32} />
                                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">No updates yet</p>
                               </div>
                            ) : (
                               state.notifications.map((n) => (
                                  <div key={n.id} className={cn("p-5 border-b border-slate-50 dark:border-white/5 flex gap-4 transition-all cursor-pointer", !n.read ? "bg-emerald-500/[0.03]" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]")}>
                                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                                        n.type === "order" ? "bg-blue-500/10 text-blue-500" : 
                                        n.type === "message" ? "bg-emerald-500/10 text-emerald-500" : "bg-purple-500/10 text-purple-500"
                                     )}>
                                        {n.type === "order" ? <Package size={16} /> : n.type === "message" ? <MessageSquare size={16} /> : <TrendingUp size={16} />}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight italic">{n.title}</p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                        <p className="text-[8px] font-bold text-slate-300 dark:text-slate-600 mt-2 uppercase tracking-widest">{n.timestamp}</p>
                                     </div>
                                  </div>
                               ))
                            )}
                         </div>
                         <div className="p-5 text-center border-t border-slate-100 dark:border-white/10">
                            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">See All Activity</button>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

             <Link
               href="/account"
               className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
             >
               {state.bizImage ? <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> : <User size={16} />}
             </Link>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 flex flex-col p-6 md:p-10 animate-fade-in-up">
           {children}
        </main>
      </div>
    </div>
  );
}
