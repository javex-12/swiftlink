"use client";

import { useState } from "react";
import { ProLayout } from "@/components/ProLayout";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { MessageSquare, Clock, CheckCircle2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InquiriesPage() {
  const { state } = useSwiftLink();
  const [activeTab, setActiveTab] = useState<"all" | "sales" | "customers">("all");

  return (
    <ProLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 pb-12 sm:pb-16">
        <header className="border-b border-[#1E2D27] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">Inquiries &amp; Orders</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9DB3A8]">
            Track buyer orders from WhatsApp, record sales, and view customer purchase history.
          </p>
        </header>

        {/* Filter controls with 44px+ touch targets */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#1E2D27] pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex min-h-[44px] items-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-semibold transition-colors",
              activeTab === "all"
                ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
                : "text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]"
            )}
          >
            <Clock className="h-4 w-4" />
            <span>All Inquiries</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className={cn(
              "flex min-h-[44px] items-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-semibold transition-colors",
              activeTab === "sales"
                ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
                : "text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirmed Sales</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={cn(
              "flex min-h-[44px] items-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-semibold transition-colors",
              activeTab === "customers"
                ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
                : "text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]"
            )}
          >
            <UserCheck className="h-4 w-4" />
            <span>Customers</span>
          </button>
        </div>

        {/* Empty state (structured for Step 5 database wiring) */}
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14231D] text-[#19C37D] border border-[#24382F]">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-[#E8F1EC]">No inquiries recorded yet</h2>
          <p className="mt-1.5 max-w-sm text-xs text-[#9DB3A8] leading-relaxed">
            When customers tap &ldquo;Order on WhatsApp&rdquo; on your store ({state.bizName || "your store"}), their inquiries and contacts will appear here automatically.
          </p>
        </div>
      </div>
    </ProLayout>
  );
}
