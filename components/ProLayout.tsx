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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Sidebar Navigation */}
      <ProSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Unified Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <button
               type="button"
               onClick={() => setMobileOpen(true)}
               className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
             >
               <Menu className="h-5 w-5" />
             </button>
             <div className="flex flex-col">
               <h1 className="text-base md:text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">
                  {getPageTitle()}
               </h1>
               <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">System Live</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-full px-4 py-2 text-slate-400 focus-within:border-slate-300 transition-all focus-within:bg-white shadow-inner">
                <Search size={16} />
                <input type="text" placeholder="Global search..." className="bg-transparent border-none outline-none text-xs font-bold px-3 w-40" />
             </div>
             
             <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center relative shadow-sm border border-slate-100"
                >
                   <Bell size={18} />
                   {(state.notifications || []).some(n => !n.read) && (
                      <div className="absolute top-2 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   )}
                </button>

                <AnimatePresence>
                   {notificationsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-12 right-0 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                         <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</h3>
                            <button onClick={markAllRead} className="text-[9px] font-black text-emerald-500 uppercase hover:underline">Mark all read</button>
                         </div>
                         <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {(state.notifications || []).length === 0 ? (
                               <div className="p-10 text-center">
                                  <Bell className="mx-auto text-slate-100 mb-3" size={32} />
                                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No alerts yet</p>
                               </div>
                            ) : (
                               state.notifications.map((n) => (
                                  <div key={n.id} className={cn("p-4 border-b border-slate-50 flex gap-4 transition-colors", !n.read ? "bg-emerald-50/30" : "hover:bg-slate-50")}>
                                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                                        n.type === "order" ? "bg-blue-50 text-blue-500" : 
                                        n.type === "message" ? "bg-emerald-50 text-emerald-500" : "bg-purple-50 text-purple-500"
                                     )}>
                                        {n.type === "order" ? <Package size={18} /> : n.type === "message" ? <MessageSquare size={18} /> : <TrendingUp size={18} />}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-900 truncate leading-tight uppercase italic">{n.title}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                        <p className="text-[8px] font-bold text-slate-300 mt-2 uppercase tracking-widest">{n.timestamp}</p>
                                     </div>
                                  </div>
                               ))
                            )}
                         </div>
                         <div className="p-4 text-center border-t border-slate-50">
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">View All Activity</button>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

             <Link
               href="/account"
               className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-lg overflow-hidden border-2 border-slate-100"
               aria-label="Account"
               title="Account"
             >
               {state.bizImage ? <img src={state.bizImage} className="w-full h-full object-cover" alt="" /> : <User size={16} />}
             </Link>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 flex flex-col p-4 md:p-8 animate-fade-in">
           {children}
        </main>
      </div>
    </div>
  );
}
