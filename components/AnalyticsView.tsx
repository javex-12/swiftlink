"use client";

import { useMemo } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { formatMoney } from "@/lib/currency";
import { 
  Users, MousePointer2, MessageSquare, 
  BarChart3, ArrowUpRight, ArrowDownRight, Package, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnalyticsView() {
  const { state } = useSwiftLink();

  // Real aggregate stats (Step 6 wires to store_daily_stats; until then plain 0s with no fake data)
  const totalViews = 0;
  const productViews = 0;
  const totalOrders = 0;
  const totalCheckouts = 0;
  const conversionRate = 0;

  const stats = [
    { label: "Total Store Views", value: totalViews.toLocaleString(), change: "Live", icon: Users, trend: "up", color: "text-[#19C37D]", bg: "bg-[#14231D]" },
    { label: "Product Interest", value: productViews.toLocaleString(), change: "Clicks", icon: MousePointer2, trend: "up", color: "text-[#E8B93A]", bg: "bg-[#14231D]" },
    { label: "WhatsApp Inquiries", value: totalCheckouts.toLocaleString(), change: "Intent", icon: MessageSquare, trend: "up", color: "text-[#19C37D]", bg: "bg-[#14231D]" },
    { label: "Conversion Rate", value: `${conversionRate.toFixed(1)}%`, change: "Goal", icon: Activity, trend: "up", color: "text-[#60A5FA]", bg: "bg-[#14231D]" },
  ];

  const categories = Array.from(new Set(state.products.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      {/* Page Header */}
      <div className="border-b border-[#1E2D27] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">Analytics &amp; Performance</h1>
        <p className="text-xs text-[#9DB3A8] mt-1">Real-time metrics for your store traffic and buyer interest.</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#111C18] p-4 sm:p-5 rounded-[18px] border border-[#1E2D27] shadow-sm flex flex-col justify-between"
          >
             <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-[10px] border border-[#24382F] flex items-center justify-center", stat.bg, stat.color)}>
                   <stat.icon size={18} />
                </div>
                <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", stat.trend === "up" ? "bg-[#14231D] text-[#19C37D]" : "bg-[#2a1414] text-[#FF8A8A]")}>
                   {stat.trend === "up" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                   {stat.change}
                </div>
             </div>
             <div>
                <p className="text-[11px] font-medium text-[#9DB3A8] mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-[#E8F1EC] tracking-tight">{stat.value}</h3>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart Section */}
         <div className="lg:col-span-2 bg-[#111C18] p-5 sm:p-6 rounded-[18px] border border-[#1E2D27] shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-base font-semibold text-[#E8F1EC]">Order Activity</h3>
                  <p className="text-xs text-[#9DB3A8] mt-0.5">Order volume per period</p>
               </div>
               <div className="flex gap-1.5">
                  <span className="px-3 py-1 bg-[#14231D] text-[#19C37D] border border-[#24382F] rounded-[8px] text-xs font-semibold">WEEKS</span>
               </div>
            </div>

            <div className="flex-1 min-h-[220px] flex items-end gap-2 px-2">
               {totalOrders > 0 ? (
                  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, totalOrders].slice(-12).map((h, i) => {
                     const barHeight = totalOrders > 0 ? (h / totalOrders) * 100 : 0;
                     return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                           <div className="w-full relative group">
                              <motion.div 
                                initial={{ height: 0 }} 
                                animate={{ height: `${Math.max(barHeight, 5)}%` }} 
                                transition={{ delay: i * 0.05, duration: 0.5 }} 
                                className={cn("w-full rounded-t-[6px] transition-colors", h > 0 ? "bg-[#19C37D]" : "bg-[#14231D]")}
                              />
                           </div>
                           <span className="text-[10px] text-[#9DB3A8]">P{i+1}</span>
                        </div>
                     );
                  })
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9DB3A8] gap-2 py-12">
                     <BarChart3 size={36} className="opacity-30" />
                     <p className="text-xs">Awaiting sales activity</p>
                  </div>
               )}
            </div>
         </div>

         {/* Secondary Insights Section */}
         <div className="space-y-6">
            <div className="bg-[#111C18] p-5 sm:p-6 rounded-[18px] border border-[#1E2D27] flex flex-col h-full">
               <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9DB3A8] mb-5">Product Categories</h3>
               <div className="space-y-4">
                  {(categories.length > 0 ? categories : ["General"]).slice(0, 4).map((cat) => (
                     <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-[#E8F1EC]">
                           <span>{cat}</span>
                           <span className="text-[#19C37D]">{totalOrders > 0 ? "Active" : "Ready"}</span>
                        </div>
                        <div className="h-1.5 bg-[#0A1210] rounded-full overflow-hidden">
                           <div className="h-full bg-[#19C37D] rounded-full" style={{ width: totalOrders > 0 ? "75%" : "20%" }} />
                        </div>
                     </div>
                  ))}
               </div>
               
               <div className="mt-auto pt-6 border-t border-[#1E2D27]">
                  <div className="flex items-center gap-2 mb-2">
                     <Activity className="text-[#19C37D]" size={16} />
                     <span className="text-xs font-semibold text-[#E8F1EC]">Store Pulse</span>
                  </div>
                  <p className="text-xs text-[#9DB3A8] leading-relaxed">
                     {totalOrders > 0
                       ? `You have ${totalOrders} WhatsApp orders recorded, a ${conversionRate.toFixed(1)}% view-to-order conversion.`
                       : "Share your storefront link on WhatsApp and Instagram to start receiving orders."}
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-[#111C18] p-5 sm:p-6 rounded-[18px] border border-[#1E2D27] shadow-sm overflow-hidden">
         <h3 className="text-base font-semibold text-[#E8F1EC] mb-4">Product Performance</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-[#1E2D27]">
                     <th className="pb-3 text-xs font-medium text-[#9DB3A8]">Product</th>
                     <th className="pb-3 text-xs font-medium text-[#9DB3A8]">Views</th>
                     <th className="pb-3 text-xs font-medium text-[#9DB3A8]">Price</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#1E2D27]">
                  {state.products.length > 0 ? [...state.products].slice(0, 5).map((p) => {
                     const views = 0;
                     return (
                     <tr key={p.id} className="text-xs">
                        <td className="py-3 pr-4">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#14231D] rounded-[8px] overflow-hidden border border-[#1E2D27] shrink-0 flex items-center justify-center">
                                 {p.image ? <img src={p.image} className="w-full h-full object-cover" alt={p.name} /> : <Package className="h-4 w-4 text-[#9DB3A8]" />}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-medium text-[#E8F1EC] truncate">{p.name}</p>
                                 <p className="text-[11px] text-[#9DB3A8]">{p.category || "General"}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-3 pr-4 text-[#9DB3A8]">
                           {views}
                        </td>
                        <td className="py-3 font-medium text-[#E8F1EC]">
                           {formatMoney(Math.round(Number(p.price) * 100), state.currency || "NGN")}
                        </td>
                     </tr>
                  )}) : (
                     <tr>
                        <td colSpan={3} className="py-12 text-center text-xs text-[#9DB3A8]">No products added yet</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
