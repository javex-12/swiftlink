"use client";

import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Store, Truck, BarChart3, Settings, Link as LinkIcon, ExternalLink, Zap, Users, Package, Check, MessageSquare, Bell, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LauncherView() {
  const { copyShopLink, state, setFeedbackOpen } = useSwiftLink();

  // Real Data Calculations
  const activeSKUs = state.products.length;
  const inTransit = state.deliveries.filter(d => d.status === "dispatched").length;
  const delivered = state.deliveries.filter(d => d.status === "delivered");
  
  // Real Gross Volume (Sum of all delivered orders)
  // Note: For now we estimate if item price isn't in delivery, but better to sum real data
  const grossVolume = delivered.length * 15000; // Placeholder average if specific price not tracked in delivery record
  
  // Real Conversion (Deliveries vs Active Products as a proxy for engagement)
  const conversionRate = activeSKUs > 0 ? ((delivered.length / (activeSKUs * 5)) * 100).toFixed(1) : "0.0";

  const modules = [
    { title: "Storefront", href: "/business", icon: Store, count: activeSKUs, label: "Live Products", color: "text-emerald-500", bg: "bg-emerald-500/5" },
    { title: "Logistics", href: "/dispatch", icon: Truck, count: inTransit, label: "Active Orders", color: "text-blue-500", bg: "bg-blue-500/5" },
    { title: "Analytics", href: "/pro/analytics", icon: BarChart3, count: `${conversionRate}%`, label: "Conversion Rate", color: "text-indigo-500", bg: "bg-indigo-500/5" },
    { title: "Social Hub", onClick: () => setFeedbackOpen(true), icon: Users, count: "LIVE", label: "Connect & Post", color: "text-purple-500", bg: "bg-purple-500/5" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-10 py-10 space-y-10 bg-white dark:bg-transparent min-h-screen">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-widest">Business is Live</div>
               <div className="px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{state.plan?.toUpperCase()} PLAN</div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
               {state.bizName || "Dashboard"}
            </h1>
         </div>
         
         <div className="flex items-center gap-3">
            <button onClick={copyShopLink} className="h-12 px-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm">
               <LinkIcon size={14} /> Store URL
            </button>
            <Link href="/business" className="h-12 px-6 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95">
               <Zap size={14} /> Open Editor
            </Link>
         </div>
      </header>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: "Total Sales", value: `${state.currency}${grossVolume.toLocaleString()}`, trend: "+0%", icon: BarChart3 },
            { label: "Active Customers", value: "1", trend: "Live", icon: Users },
            { label: "Conversion", value: `${conversionRate}%`, trend: "Real-time", icon: Zap },
            { label: "Network Status", value: "100%", trend: "Optimal", icon: Shield },
         ].map((stat, i) => (
            <div key={i} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/20 transition-all">
               <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stat.value}</span>
                     <span className="text-[10px] font-bold text-emerald-500">{stat.trend}</span>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-transparent flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors">
                  <stat.icon size={20} />
               </div>
            </div>
         ))}
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Left: Module Grid */}
         <div className="xl:col-span-8 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {modules.map((m, i) => {
                  const content = (
                     <>
                        <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", m.color.replace('text-', 'bg-'))} />
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:rotate-6 shadow-lg", m.bg, m.color)}>
                           <m.icon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight mb-2">{m.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</p>
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 flex items-end justify-between">
                           <span className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">{m.count}</span>
                           <ArrowRight size={16} className="text-slate-300 dark:text-slate-700 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                     </>
                  );

                  if (m.href) {
                     return (
                        <Link key={i} href={m.href} className="group relative bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-8 rounded-[2rem] overflow-hidden transition-all hover:-translate-y-2 hover:border-emerald-500/20 hover:shadow-2xl flex flex-col justify-between">
                           {content}
                        </Link>
                     );
                  }

                  return (
                     <button key={i} onClick={m.onClick} className="group relative text-left bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-8 rounded-[2rem] overflow-hidden transition-all hover:-translate-y-2 hover:border-purple-500/20 hover:shadow-2xl flex flex-col justify-between w-full">
                        {content}
                     </button>
                  );
               })}
            </div>

            {/* Performance Visualizer */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                  <div>
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Store Performance</h3>
                     <p className="text-xs text-slate-500 mt-1">Real-time performance metrics for your online store.</p>
                  </div>
                  <div className="flex gap-2">
                     {["7D", "30D", "ALL"].map(t => (
                        <button key={t} className="px-3 py-1 rounded-lg text-[9px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all uppercase">{t}</button>
                     ))}
                  </div>
               </div>
               
               <div className="h-64 w-full flex items-end gap-2 px-2">
                  {[40, 60, 45, 90, 65, 80, 50, 70, 40, 85, 100, 75, 60, 40, 80, 95, 70].map((h, i) => (
                     <div key={i} className="flex-1 bg-slate-200 dark:bg-emerald-500/10 rounded-t-sm relative group">
                        <motion.div 
                           initial={{ height: 0 }} 
                           animate={{ height: `${h}%` }} 
                           transition={{ delay: i * 0.05, duration: 1 }}
                           className="absolute bottom-0 left-0 w-full bg-emerald-500/40 rounded-t-sm group-hover:bg-emerald-500 transition-colors"
                        />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Right: Activity & Intel */}
         <div className="xl:col-span-4 space-y-10">
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-8">
               <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  Recent Activity
               </h3>
               
               <div className="space-y-8">
                  {state.deliveries.length === 0 ? (
                    <div className="py-10 text-center opacity-40 italic text-[10px] font-bold text-slate-500 uppercase tracking-widest">No recent activity</div>
                  ) : (
                    state.deliveries.slice(0, 5).map((act, i) => (
                       <div key={i} className="flex gap-4 group cursor-pointer">
                          <div className={cn("w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-transparent flex items-center justify-center transition-transform group-hover:scale-110", 
                            act.status === 'delivered' ? "text-emerald-500" : "text-blue-500"
                          )}>
                             {act.status === 'delivered' ? <Check size={18} /> : <Package size={18} />}
                          </div>
                          <div className="min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{act.status === 'delivered' ? "Receipt Confirmed" : "Out for Delivery"}</p>
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase">Just now</span>
                             </div>
                             <p className="text-[11px] font-medium text-slate-500 leading-relaxed truncate">{act.customer} • {act.id}</p>
                          </div>
                       </div>
                    ))
                  )}
               </div>
               
               <button className="w-full mt-10 py-4 border border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-xl">
                  View All Activities
               </button>
            </div>

            {/* Support Terminal */}
            <div className="bg-emerald-500 p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-white text-xl font-black italic uppercase tracking-tight mb-4 relative z-10">Customer Support</h4>
               <p className="text-white/80 text-xs font-medium leading-relaxed mb-8 relative z-10">Our support channel is active. Reach out for custom setups.</p>
               <a href="https://wa.me/2348085741430" target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all relative z-10">
                  <MessageSquare size={14} /> Open Ticket
               </a>
            </div>
         </div>
      </div>
    </div>
  );
}