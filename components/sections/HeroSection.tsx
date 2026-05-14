"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import type { PageSection, ShopState } from "@/lib/schema";
import { motion } from "framer-motion";

export function HeroSection({ section, state }: { section: PageSection; state: ShopState }) {
  const content = section.content || {};
  const styles = section.styles || {};
  
  const heroImage = content.image || state.bizImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200";
  const title = section.title || state.tagline || "Welcome";
  const subtitle = section.subtitle || "";
  const buttonText = content.buttonText || "Shop Now";

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden bg-gray-900 rounded-[1.5rem] md:rounded-[2rem] shadow-xl mb-8 min-h-[300px] md:min-h-[450px] flex group"
      style={{ 
        backgroundColor: styles.backgroundColor || undefined,
        ...styles
      }}
    >
      <motion.img
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        src={heroImage}
        className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700 ease-in-out"
        alt={title}
      />
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 bg-gradient-to-r from-black/80 via-black/40 to-transparent">
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-emerald-400"
        >
          {state.bizName}
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-2 max-w-xl font-black leading-tight text-white text-[22px] md:text-5xl drop-shadow-lg"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-3 hidden max-w-md text-xs md:text-sm font-medium leading-relaxed text-white/80 md:block drop-shadow-md"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => document.getElementById("sl-catalog")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-5 flex w-fit items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white hover:text-gray-900 px-6 py-3 text-[10px] md:text-xs font-black uppercase text-white shadow-xl shadow-black/20 transition-all duration-300 md:mt-8 group/btn"
        >
          {buttonText} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.section>
  );
}
