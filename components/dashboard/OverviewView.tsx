"use client";

import { useState } from "react";
import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { formatMoney } from "@/lib/currency";
import { getSmartFirstName } from "@/lib/utils";
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  Eye,
  MousePointerClick,
  MessageSquare,
  BadgeCheck,
  CheckCircle2,
  Circle,
} from "lucide-react";

export function OverviewView() {
  const { state, user, addToast } = useSwiftLink();
  const [copied, setCopied] = useState(false);
  const [linkShared, setLinkShared] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("swiftlink_link_shared") === "true";
    }
    return false;
  });

  const firstName = getSmartFirstName(state.ownerName, user?.email, state.bizName);
  const storeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/store/${state.storeUsername || ""}`
    : `https://swiftlink.pro/store/${state.storeUsername || ""}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      addToast("Store link copied to clipboard.", "success");
      setTimeout(() => setCopied(false), 2000);
      setLinkShared(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("swiftlink_link_shared", "true");
      }
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: state.bizName || "My Store",
          text: `Check out our products at ${state.bizName || "SwiftLink Store"}!`,
          url: storeUrl,
        });
        setLinkShared(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("swiftlink_link_shared", "true");
        }
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  // Checklist completion states derived from real data
  const hasStore = Boolean(state.bizName && state.storeUsername);
  const hasPhone = Boolean(state.phone && state.phone.length >= 10);
  const hasProducts = Boolean(state.products && state.products.length > 0);
  const hasTemplate = Boolean(state.websiteTemplateId);
  const isLinkShared = linkShared;

  const checklistItems = [
    {
      id: "store",
      label: "Name your store & choose link",
      completed: hasStore,
      href: "/account",
    },
    {
      id: "phone",
      label: "Connect WhatsApp order number",
      completed: hasPhone,
      href: "/account",
    },
    {
      id: "product",
      label: "Add your first product",
      completed: hasProducts,
      href: "/business",
    },
    {
      id: "template",
      label: "Choose a storefront template",
      completed: hasTemplate,
      href: "/business",
    },
    {
      id: "share",
      label: "Share your link with customers",
      completed: isLinkShared,
      action: handleShareLink,
    },
  ];

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const allCompleted = completedCount === checklistItems.length;

  // Real plan display only if non-empty and present
  const planName = state.plan && state.plan !== "free" ? `${state.plan.charAt(0).toUpperCase() + state.plan.slice(1)} Plan` : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 pb-12 sm:px-6 sm:py-8 sm:pb-16">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2D27] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">
              Good day, {firstName}
            </h1>
            {planName && (
              <span className="rounded-full border border-[#24382F] bg-[#14231D] px-2.5 py-0.5 text-[11px] font-medium text-[#19C37D]">
                {planName}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                state.isLive ? "bg-[#19C37D]" : "bg-[#E8B93A]"
              }`}
            />
            <span className="text-xs text-[#9DB3A8]">
              {state.isLive ? "Store is live & receiving orders" : "Store setup in progress"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {state.storeUsername && (
          <div className="flex items-center gap-2">
            <a
              href={`/store/${state.storeUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#111C18] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] hover:bg-[#14231D]"
            >
              <span>View live store</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#9DB3A8]" />
            </a>
          </div>
        )}
      </header>

      {/* ─── Store Link Banner Card ────────────────────────────────────────── */}
      <section
        aria-label="Your store link"
        className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9DB3A8]">
              Public storefront link
            </span>
            <span className="mt-1 block truncate text-sm font-medium text-[#19C37D]">
              {storeUrl}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:bg-[#19C37D] hover:text-[#04140D]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleShareLink}
              className="flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:bg-[#19C37D] hover:text-[#04140D]"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Four Key Stat Cards ─────────────────────────────────────────── */}
      <section aria-label="Store overview stats" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Store Views */}
        <div className="flex flex-col justify-between rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9DB3A8]">Store views</span>
            <Eye className="h-4 w-4 text-[#9DB3A8]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8F1EC]">0</span>
            <p className="mt-1 text-[11px] text-[#9DB3A8]">From direct links &amp; social</p>
          </div>
        </div>

        {/* Product Taps */}
        <div className="flex flex-col justify-between rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9DB3A8]">Product taps</span>
            <MousePointerClick className="h-4 w-4 text-[#9DB3A8]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8F1EC]">0</span>
            <p className="mt-1 text-[11px] text-[#9DB3A8]">Buyers viewing details</p>
          </div>
        </div>

        {/* Chats Started */}
        <div className="flex flex-col justify-between rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9DB3A8]">Chats started</span>
            <MessageSquare className="h-4 w-4 text-[#9DB3A8]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8F1EC]">0</span>
            <p className="mt-1 text-[11px] text-[#9DB3A8]">WhatsApp order inquiries</p>
          </div>
        </div>

        {/* Confirmed Sales */}
        <div className="flex flex-col justify-between rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9DB3A8]">Confirmed sales</span>
            <BadgeCheck className="h-4 w-4 text-[#19C37D]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8F1EC]">
              {formatMoney(0, state.currency || "NGN")}
            </span>
            <p className="mt-1 text-[11px] text-[#9DB3A8]">Recorded through inquiries</p>
          </div>
        </div>
      </section>

      {/* ─── "Get Your Store Ready" Checklist ────────────────────────────── */}
      {!allCompleted && (
        <section
          aria-label="Setup checklist"
          className="rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2D27] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#E8F1EC]">Get your store ready</h2>
              <p className="mt-0.5 text-xs text-[#9DB3A8]">
                Complete these steps to set up your store and start taking orders.
              </p>
            </div>
            <span className="text-xs font-medium text-[#19C37D]">
              {completedCount} of {checklistItems.length} completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#0A1210] overflow-hidden">
            <div
              className="h-full bg-[#19C37D] transition-all duration-500"
              style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
            />
          </div>

          {/* Checklist rows */}
          <div className="mt-4 divide-y divide-[#1E2D27]">
            {checklistItems.map((item) => {
              const content = (
                <div className="flex min-h-[48px] items-center justify-between py-3 transition hover:text-[#19C37D]">
                  <div className="flex items-center gap-3">
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#19C37D]" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-[#9DB3A8]" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        item.completed ? "line-through text-[#9DB3A8]" : "text-[#E8F1EC]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {!item.completed && <ChevronRight className="h-4 w-4 text-[#9DB3A8]" />}
                </div>
              );

              if (item.completed) {
                return (
                  <div key={item.id} className="opacity-75">
                    {content}
                  </div>
                );
              }

              if (item.action) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full text-left cursor-pointer"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link key={item.id} href={item.href || "#"} className="block cursor-pointer">
                  {content}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
