"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { BarChart3, Users, Package, ArrowUpRight, ArrowDownRight, Activity, MousePointer2, MessageSquare, TrendingUp, ShieldCheck } from "lucide-react";

export function AnalyticsView() {
  const { state, user } = useSwiftLink();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchAnalytics = async () => {
        const { data, error } = await supabase
            .from('store_events')
            .select('*')
            .eq('store_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1000);
            
        if (data) setEvents(data);
        setLoading(false);
    };

    fetchAnalytics();
  }, [user?.id]);

  // Real calculations from events
  const totalViews = events.filter(e => e.event_type === 'view').length;
  const productViews = events.filter(e => e.event_type === 'product_click' || e.event_type === 'product_view').length;
  const totalCheckouts = events.filter(e => e.event_type === 'whatsapp_checkout' || e.event_type === 'checkout').length;
  const totalOrders = totalCheckouts;
  const dispatchRate = state.deliveries.length > 0
    ? (state.deliveries.filter((d) => d.status === "delivered").length / state.deliveries.length) * 100
    : 0;
  
  const conversionRate = totalViews > 0 ? (totalCheckouts / totalViews) * 100 : 0;
  
  const stats = [
    { label: "Network Peers", value: totalViews.toLocaleString(), change: "Active", icon: Users, trend: "up", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Interest Flow", value: productViews.toLocaleString(), change: "Sync", icon: MousePointer2, trend: "up", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Inquiry Relay", value: totalCheckouts.toLocaleString(), change: "Direct", icon: MessageSquare, trend: "up", color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Sync Velocity", value: `${conversionRate.toFixed(1)}%`, change: "Stable", icon: Activity, trend: "up", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  const categories = Array.from(new Set(state.products.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto w-full animate-fade-in-up pb-20">
      
      {/* Overview Stats - Slick Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-8 rounded-[2rem] flex flex-col justify-between group hover:border-emerald-500/20 transition-all cursor-pointer"
          >
             <div className="flex items-center justify-between mb-8">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                   <stat.icon size={22} />
                </div>
                <div className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg text-slate-400 dark:text-slate-600">
                   {stat.change}
                </div>
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-black dark:text-white italic tracking-tighter">{stat.value}</h3>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Trajectory Engine */}
         <div className="lg:col-span-8 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-10 rounded-[2.5rem] flex flex-col">
            <div className="flex items-center justify-between mb-12">
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.3em]">Trajectory Engine</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Relay volume per period</p>
               </div>
               <div className="flex gap-2">
                  <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[8px] font-black uppercase tracking-widest cursor-pointer">Live Relay</button>
                  <button className="px-4 py-2 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-700 rounded-xl text-[8px] font-black uppercase tracking-widest hover:text-black dark:hover:text-white transition-all cursor-pointer">Archive</button>
               </div>
            </div>

            <div className="flex-1 min-h-[300px] flex items-end gap-2 px-2">
               {[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, totalOrders].slice(-16).map((h, i) => {
                  const barHeight = totalOrders > 0 ? (h / totalOrders) * 100 : 0;
                  return (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                        <div className="w-full relative h-[250px] flex items-end">
                           <motion.div 
                             initial={{ height: 0 }} 
                             animate={{ height: `${Math.max(barHeight, 5)}%` }} 
                             transition={{ delay: i * 0.03, duration: 1 }} 
                             className={cn("w-full rounded-full transition-all duration-500 relative overflow-hidden cursor-pointer", h > 0 ? "bg-emerald-500/30 group-hover/bar:bg-emerald-500" : "bg-slate-100 dark:bg-white/[0.01]")}
                           />
                           {h > 0 && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[8px] font-black px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                 {h} PKT
                              </div>
                           )}
                        </div>
                        <span className="text-[7px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-widest">N{i+1}</span>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Meta Insights */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/5 group">
               <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-10">Network Pulse</h3>
                  <div className="space-y-8">
                     {(categories.length > 0 ? categories : ["Standard Node"]).slice(0, 4).map((cat, i) => (
                        <div key={cat} className="space-y-3">
                           <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white">
                              <span>{cat}</span>
                              <span className="text-emerald-500">{totalOrders > 0 ? "Active" : "Ready"}</span>
                           </div>
                           <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: totalOrders > 0 ? `${90 - i * 12}%` : "0%" }} 
                                transition={{ duration: 1.5, ease: "circOut" }} 
                                className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                              />
                           </div>
                        </div>
                     ))}
                  </div>
                  
                  <div className="mt-12 p-8 bg-white/[0.02] border border-white/5 rounded-3xl group-hover:border-emerald-500/20 transition-colors">
                     <div className="flex items-center gap-3 mb-4 text-emerald-500">
                        <ShieldCheck size={18} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">System Health</span>
                     </div>
                     <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                        Secure connection established. All relay nodes optimal. Sync rate: {dispatchRate.toFixed(1)}%.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Product Node Matrix */}
      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-10 rounded-[2.5rem] overflow-hidden">
         <h3 className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.3em] mb-10 px-2 flex items-center gap-3">
            <TrendingUp size={14} className="text-emerald-500" />
            Node Performance Matrix
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.03]">
                     <th className="pb-6 px-4 text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.4em]">Node ID</th>
                     <th className="pb-6 px-4 text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.4em]">Sync Flow</th>
                     <th className="pb-6 px-4 text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.4em]">Volume (NGN)</th>
                     <th className="pb-6 px-4 text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.4em]">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
                  {state.products.length > 0 ? [...state.products].sort((a,b) => (totalOrders > 0 ? 1 : 0)).slice(0, 6).map((p, i) => (
                     <tr key={p.id} className="group hover:bg-white dark:hover:bg-white/[0.01] transition-all cursor-pointer">
                        <td className="py-6 px-4">
                           <div className="flex items-center gap-6">
                              <span className="text-xl font-black text-slate-100 dark:text-white/[0.03] italic group-hover:text-emerald-500/20 transition-colors">{i+1 < 10 ? `0${i+1}` : i+1}</span>
                              <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                                 {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <Package className="w-full h-full p-3 text-slate-200 dark:text-slate-800" />}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[11px] font-black text-black dark:text-white uppercase tracking-tight">{p.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">{p.category || "General Node"}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 px-4">
                           <div className="flex items-center gap-2">
                              <Activity size={12} className="text-slate-300 dark:text-slate-800 group-hover:text-emerald-500 transition-colors" />
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase">Synchronized</span>
                           </div>
                        </td>
                        <td className="py-6 px-4">
                           <span className="text-[11px] font-black text-black dark:text-white italic">{state.currency}{Number(p.price).toLocaleString()}</span>
                        </td>
                        <td className="py-6 px-4">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Active</span>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={4} className="py-32 text-center text-slate-200 dark:text-slate-900 font-black uppercase text-[10px] tracking-[0.5em] italic">Awaiting node population</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}