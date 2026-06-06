"use client";

import React from "react";
import type { PageSection, ShopState } from "@/lib/schema";
import { HeroTemplates } from "@/lib/store-templates";

export function HeroSection({ section, state }: { section: PageSection; state: ShopState }) {
  const content = section.content || {};
  // Use either the section's specific templateId OR fall back to the state's global preference
  const templateId = content.templateId || state.heroTemplateId || "hero-1";
  
  const Hero = HeroTemplates[templateId] || HeroTemplates["hero-1"];

  return (
    <div id="sl-hero" className="w-full relative overflow-hidden">
        <Hero state={state} onShopClick={() => document.getElementById("sl-catalog")?.scrollIntoView({ behavior: "smooth" })} />
    </div>
  );
}
