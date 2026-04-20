"use client";

import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { Store, Truck, BarChart3, Settings, Link as LinkIcon, ExternalLink, Zap, Users, Package, MessageSquare, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LauncherView() {
  const { copyShopLink, copyTrackingPortalLink, state } = useSwiftLink();

  const cards = [
    {
      title: "Storefront",
      description: "Manage your products, themes, and ordering rules.",
      href: "/business",
      icon: Store,
      color: "bg-emerald-500",
      accent: "emerald",
      badge: "LIVE",
    },
    {
      title: "Logistics",
      description: "Generate tracking links and manage active deliveries.",
      href: "/dispatch",
      icon: Truck,
      color: "bg-blue-500",
      accent: "blue",
      badge: state.deliveries.length.toString(),
    },
    {
      title: "Analytics",
      description: "Deep dive into your sales, traffic, and growth.",
      href: "/pro/analytics",
      icon: BarChart3,
      color: "bg-slate-900",
      accent: "slate",
      badge: "NEW",
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto w-full">
      {/* Welcome Section */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
               <motion.span 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-4 block"
               >
                 Powering Your Vision
               </motion.span>
               <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="text-3xl md:text-5xl font-black italic tracking-tight leading-[1.1] mb-6"
               >
                 Ready to scale?<br />
                 {state.bizName?.toUpperCase() || "SWIFTLINK"}
               </motion.h2>
               <div className="flex flex-wrap gap-4">
                  <button onClick={copyShopLink} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg">
                     <LinkIcon size={14} /> Copy Shop Link
                  </button>
                  <Link href="/business" className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                     <Zap size={14} /> Open Store Editor
                  </Link>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
               <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black italic mb-1">{state.products.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Products</span>
               </div>
               <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black italic mb-1">
                    {state.deliveries.filter((d) => d.status === "dispatched").length}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Active Deliveries</span>
               </div>
            </div>
         </div>
      </section>

      {/* Management Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {cards.map((card, i) => (
            <Link key={card.title} href={card.href} className="group relative block bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all hover:-translate-y-2 flex flex-col h-full overflow-hidden">
               <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:opacity-10", card.color)} />
               
               <div className="flex justify-between items-start mb-10">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", card.color)}>
                     <card.icon size={24} />
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase", 
                     card.accent === "emerald" ? "bg-emerald-50 text-emerald-600" : 
                     card.accent === "blue" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                  )}>
                     {card.badge}
                  </div>
               </div>
               
               <div className="mt-auto">
                  <h3 className="text-xl font-black text-slate-900 mb-3 uppercase italic tracking-tight">{card.title}</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{card.description}</p>
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Launch Module</span>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
               </div>
            </Link>
         ))}
      </section>

      {/* Quick Stats / Feedback Section */}
      <section className="bg-emerald-50 rounded-[3rem] p-8 md:p-12 border border-emerald-100 flex flex-col md:flex-row items-center gap-8 justify-between">
         <div className="max-w-md text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-900 italic mb-2 tracking-tight">NEED A CUSTOM FEATURE?</h3>
            <p className="text-sm font-medium text-emerald-800/70">Our dev team is live. Send us a message on WhatsApp and we&apos;ll help you scale your operations.</p>
         </div>
         <a 
           href="https://wa.me/2348085741430?text=Hi, I want to request a feature for SwiftLink..."
           target="_blank"
           rel="noopener noreferrer"
           className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
         >
            <MessageSquare size={16} /> Contact Support
         </a>
      </section>
    </div>
  );
}