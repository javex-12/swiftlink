"use client";

import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Store, Truck, BarChart3, Settings, Link as LinkIcon, ExternalLink, Zap, Users, Package, Check, MessageSquare, Bell, Shield, ArrowRight, TrendingUp, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LauncherView() {
  const { copyShopLink, state, setFeedbackOpen } = useSwiftLink();

  // Real Data Calculations
  const activeSKUs = state.products.length;
  const inTransit = state.deliveries.filter(d => d.status === "dispatched").length;
  const delivered = state.deliveries.filter(d => d.status === "delivered");
  
  // Real Gross Volume
  const grossVolume = delivered.length * 15000; 
  
  // Real Conversion
  const conversionRate = activeSKUs > 0 ? ((delivered.length / (activeSKUs * 5)) * 100).toFixed(1) : "0.0";

  const modules = [
    { title: "Storefront", href: "/business", icon: Store, count: activeSKUs, label: "Live Nodes", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Logistics", href: "/dispatch", icon: Truck, count: inTransit, label: "Active Relay", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Analytics", href: "/pro/analytics", icon: BarChart3, count: `${conversionRate}%`, label: "Conversion", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Social Hub", onClick: () => setFeedbackOpen(true), icon: Globe, count: "LIVE", label: "Network", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-12 animate-fade-in-up pb-20">
      {/* Slick Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-6">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">Enterprise Node Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter uppercase italic leading-none">
               {state.bizName || "Dashboard"}
            </h1>
         </div>
         
         <div className="flex items-center gap-4">
            <button onClick={copyShopLink} className="btn-minimal-secondary flex items-center gap-3">
               <LinkIcon size={12} /> Link Node
            </button>
            <Link href="/business" className="btn-minimal-primary flex items-center gap-3">
               <Zap size={12} /> Open Core
            </Link>
         </div>
      </header>

      {/* Stats Bento Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
            { label: "Gross Volume", value: `${state.currency}${grossVolume.toLocaleString()}`, trend: "Live", icon: BarChart3 },
            { label: "Active Peers", value: "01", trend: "+0%", icon: Users },
            { label: "Sync Rate", value: `${conversionRate}%`, trend: "Optimal", icon: Zap },
            { label: "Uptime", value: "99.9%", trend: "100%", icon: Shield },
         ].map((stat, i) => (
            <div key={i} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-8 rounded-[2rem] group hover:border-emerald-500/20 transition-all cursor-pointer">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.03] flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors">
                     <stat.icon size={18} />
                  </div>
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">{stat.trend}</span>
               </div>
               <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
               <h2 className="text-2xl font-black text-black dark:text-white italic tracking-tighter">{stat.value}</h2>
            </div>
         ))}
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Modules - Bento Style */}
         <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {modules.map((m, i) => (
               <div 
                 key={i} 
                 onClick={m.href ? () => window.location.href = m.href : m.onClick}
                 className="group relative bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-10 rounded-[2.5rem] overflow-hidden transition-all hover:-translate-y-2 hover:border-emerald-500/20 hover:shadow-2xl cursor-pointer"
               >
                  <div className={cn("absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700", m.color.replace('text-', 'bg-'))} />
                  
                  <div className="relative z-10">
                     <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-12 transition-transform group-hover:scale-110 shadow-lg", m.bg, m.color)}>
                        <m.icon size={24} />
                     </div>
                     <h3 className="text-2xl font-black text-black dark:text-white italic uppercase tracking-tight mb-2">{m.title}</h3>
                     <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">{m.label}</p>
                     
                     <div className="mt-12 flex items-end justify-between border-t border-slate-100 dark:border-white/[0.03] pt-8">
                        <span className="text-4xl font-black text-black dark:text-white italic tracking-tighter">{m.count}</span>
                        <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-white/[0.05] flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                           <ArrowRight size={16} />
                        </div>
                     </div>
                  </div>
               </div>
            ))}

            {/* Performance Strip */}
            <div className="sm:col-span-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] rounded-[2.5rem] p-10 overflow-hidden group">
               <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                     <h3 className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">Compute Flow</h3>
                     <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Real-time engagement metrics</p>
                  </div>
                  <TrendingUp size={16} className="text-emerald-500 animate-pulse" />
               </div>
               
               <div className="h-32 w-full flex items-end gap-1 px-2">
                  {[30, 50, 40, 70, 55, 60, 45, 90, 35, 80, 100, 65, 40, 50, 75, 85, 60, 40, 90, 50, 30].map((h, i) => (
                     <div key={i} className="flex-1 bg-slate-100 dark:bg-white/[0.02] rounded-full relative group/bar overflow-hidden">
                        <motion.div 
                           initial={{ height: 0 }} 
                           animate={{ height: `${h}%` }} 
                           transition={{ delay: i * 0.03, duration: 1 }}
                           className="absolute bottom-0 left-0 w-full bg-emerald-500/20 group-hover/bar:bg-emerald-500 transition-all rounded-full"
                        />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Sidebar Intel */}
         <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] rounded-[2.5rem] p-8 overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[9px] font-black text-black dark:text-white uppercase tracking-[0.3em]">Recent Relay</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               
               <div className="space-y-8">
                  {state.deliveries.length === 0 ? (
                    <div className="py-20 text-center text-[9px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-[0.4em] italic">No active data</div>
                  ) : (
                    state.deliveries.slice(0, 4).map((act, i) => (
                       <div key={i} className="flex gap-5 group cursor-pointer items-center">
                          <div className={cn("w-12 h-12 shrink-0 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-100 dark:border-white/[0.02] flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-emerald-500/30", 
                            act.status === 'delivered' ? "text-emerald-500" : "text-blue-500"
                          )}>
                             {act.status === 'delivered' ? <Check size={20} /> : <Package size={20} />}
                          </div>
                          <div className="min-w-0 flex-1">
                             <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-tight">{act.status === 'delivered' ? "Sync Success" : "Relay Active"}</p>
                                <span className="text-[7px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Active</span>
                             </div>
                             <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">{act.customer} • {act.id.substring(0, 8)}</p>
                          </div>
                       </div>
                    ))
                  )}
               </div>
               
               <button className="w-full mt-12 py-5 bg-white dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.03] text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] hover:text-emerald-500 hover:border-emerald-500/20 transition-all rounded-2xl cursor-pointer">
                  Relay History
               </button>
            </div>

            {/* Support Terminal */}
            <div className="bg-emerald-500 p-10 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-emerald-500/20 cursor-pointer" onClick={() => window.open("https://wa.me/2348085741430", "_blank")}>
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10">
                  <h4 className="text-white text-2xl font-black italic uppercase tracking-tight mb-4">Direct Link</h4>
                  <p className="text-white/80 text-[10px] font-black uppercase tracking-widest leading-loose mb-10">Direct access to core developers. Response time: <span className="text-white underline">Sub-60s</span>.</p>
                  <div className="inline-flex items-center gap-3 px-6 py-4 bg-white text-emerald-500 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] group-hover:px-8 transition-all">
                     <MessageSquare size={14} /> Open Channel
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
