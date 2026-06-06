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
    { title: "Storefront", href: "/business", icon: Store, count: activeSKUs, label: "Live Products", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Logistics", href: "/dispatch", icon: Truck, count: inTransit, label: "Active Orders", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Analytics", href: "/pro/analytics", icon: BarChart3, count: `${conversionRate}%`, label: "Sales Insights", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Social Hub", onClick: () => setFeedbackOpen(true), icon: Globe, count: "LIVE", label: "Community", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-8 sm:space-y-12 animate-fade-in-up pb-20 px-4 sm:px-0">
      {/* Friendly Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 pt-4 sm:pt-6">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Your Business is Live</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
               {state.bizName || "Dashboard"}
            </h1>
         </div>
         
         <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={copyShopLink} className="btn-minimal-secondary flex items-center gap-3 flex-1 sm:flex-none justify-center">
               <LinkIcon size={14} /> Store Link
            </button>
            <Link href="/business" className="btn-minimal-primary flex items-center gap-3 flex-1 sm:flex-none justify-center">
               <Zap size={14} /> Open Editor
            </Link>
         </div>
      </header>

      {/* Stats Bento Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
            { label: "Total Sales", value: `${state.currency}${grossVolume.toLocaleString()}`, trend: "Live", icon: BarChart3 },
            { label: "Customers", value: "01", trend: "Active", icon: Users },
            { label: "Order Sync", value: `${conversionRate}%`, trend: "Optimal", icon: Zap },
            { label: "Uptime", value: "99.9%", trend: "100%", icon: Shield },
         ].map((stat, i) => (
            <div key={i} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] p-6 sm:p-8 rounded-[2rem] group hover:border-emerald-500/20 transition-all cursor-pointer">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors">
                     <stat.icon size={18} />
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-md">{stat.trend}</span>
               </div>
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stat.value}</h2>
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
                 className="group relative bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] p-8 sm:p-10 rounded-[2.5rem] overflow-hidden transition-all hover:-translate-y-2 hover:border-emerald-500/20 hover:shadow-xl cursor-pointer"
               >
                  <div className={cn("absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700", m.color.replace('text-', 'bg-'))} />
                  
                  <div className="relative z-10">
                     <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-10 sm:mb-12 transition-transform group-hover:scale-110 shadow-lg", m.bg, m.color)}>
                        <m.icon size={24} />
                     </div>
                     <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight mb-2">{m.title}</h3>
                     <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{m.label}</p>
                     
                     <div className="mt-10 sm:mt-12 flex items-end justify-between border-t border-slate-200 dark:border-white/[0.05] pt-8">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{m.count}</span>
                        <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all">
                           <ArrowRight size={16} />
                        </div>
                     </div>
                  </div>
               </div>
            ))}

            {/* Performance Strip */}
            <div className="sm:col-span-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-8 sm:p-10 overflow-hidden group">
               <div className="flex items-center justify-between mb-10 sm:mb-12">
                  <div className="space-y-1">
                     <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Business Growth</h3>
                     <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Real-time store activity</p>
                  </div>
                  <TrendingUp size={16} className="text-emerald-500 animate-pulse" />
               </div>
               
               <div className="h-32 w-full flex items-end gap-1 px-2">
                  {[30, 50, 40, 70, 55, 60, 45, 90, 35, 80, 100, 65, 40, 50, 75, 85, 60, 40, 90, 50, 30].map((h, i) => (
                     <div key={i} className="flex-1 bg-slate-200 dark:bg-white/[0.05] rounded-full relative group/bar overflow-hidden">
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

         {/* Sidebar Activity */}
         <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-8 overflow-hidden">
               <div className="flex items-center justify-between mb-8 sm:mb-10">
                  <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Recent Activity</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               
               <div className="space-y-6 sm:space-y-8">
                  {state.deliveries.length === 0 ? (
                    <div className="py-20 text-center text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">No activity yet</div>
                  ) : (
                    state.deliveries.slice(0, 4).map((act, i) => (
                       <div key={i} className="flex gap-4 sm:gap-5 group cursor-pointer items-center">
                          <div className={cn("w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-100 dark:border-white/10 flex items-center justify-center transition-all group-hover:scale-110", 
                            act.status === 'delivered' ? "text-emerald-500" : "text-blue-500"
                          )}>
                             {act.status === 'delivered' ? <Check size={18} /> : <Package size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                             <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{act.status === 'delivered' ? "Order Delivered" : "Order Sent"}</p>
                                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Today</span>
                             </div>
                             <p className="text-[10px] font-medium text-slate-500 dark:text-slate-500 truncate">{act.customer} • {act.id.substring(0, 8)}</p>
                          </div>
                       </div>
                    ))
                  )}
               </div>
               
               <button className="w-full mt-10 sm:mt-12 py-4 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-emerald-500 hover:border-emerald-500/20 transition-all rounded-2xl cursor-pointer">
                  See All Activity
               </button>
            </div>

            {/* Support Terminal */}
            <div className="bg-emerald-500 p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-emerald-500/20 cursor-pointer" onClick={() => window.open("https://wa.me/2348085741430", "_blank")}>
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
               <div className="relative z-10">
                  <h4 className="text-white text-xl sm:text-2xl font-black italic uppercase tracking-tight mb-4">Help & Support</h4>
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest leading-loose mb-8 sm:mb-10">Talk directly to our team. We are here to help you grow.</p>
                  <div className="inline-flex items-center gap-3 px-6 py-4 bg-white text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:px-8 transition-all">
                     <MessageSquare size={14} /> Send Message
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}