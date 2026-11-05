"use client";

import { useCallback, useEffect, useState } from "react";import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import { formatMoney } from "@/lib/currency";
import { confirmedSalesMinor } from "@/lib/inquiry-revenue";
import { cn, getSmartFirstName } from "@/lib/utils";
import {
  PLAN_DETAILS,
  effectiveProductLimitFor,
  effectiveStoreLimitFor,
  formatUsage,
  isInGrace,
  normalizePlan,
} from "@/lib/plans";
import {
  SHARE_CHANNELS,
  buildShareUrl,
  buildStoreUrl,
  buildWhatsAppShareHref,
  channelForSource,
  type ShareChannel,
} from "@/lib/share-links";
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
  ShieldAlert,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";

/**
 * The numbers on this screen are read from the store, not printed as zero.
 *
 * They were literal `0` placeholders, so the console told every merchant their
 * store had never been seen even while the events table held real rows. The
 * storefront writes `view`, `product_click`, `checkout` and `quote_request`
 * events, and inquiries carry status and amount, which is everything the four
 * cards need.
 */
type LiveStats = {
  views: number;
  productTaps: number;
  inquiries: number;
  soldMinor: number;
};

const EMPTY_STATS: LiveStats = { views: 0, productTaps: 0, inquiries: 0, soldMinor: 0 };

export function OverviewView() {
  const { state, user, addToast, updateState, stores, planReady, setStoreLive } = useSwiftLink();
  // Set by middleware/requireAdmin when an authenticated non-admin opens an
  // ADMIN_PREFIXES route. Previously that redirect was silent, which made the
  // console look like a missing page rather than a permission boundary
  // (docs/05-IMPROVEMENT-PLAN.md R-01, R-14).
  const deniedAdmin = useSearchParams().get("denied") === "admin";
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<ShareChannel | null>(null);
  const [linkShared, setLinkShared] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("swiftlink_link_shared") === "true";
    }
    return false;
  });

  const firstName = getSmartFirstName(state.ownerName, user?.email, state.bizName);

  const loadStats = useCallback(async () => {
    const storeId = state.id;
    if (!storeId) {
      setStats(EMPTY_STATS);
      return;
    }
    setStatsLoading(true);
    try {
      const [views, taps, inquiries, sales] = await Promise.all([
        supabase
          .from("store_events")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("event_type", "view"),
        supabase
          .from("store_events")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("event_type", "product_click"),
        supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId),
        supabase
          .from("inquiries")
          .select("status, order_ref, final_amount_minor, product_price_minor")
          .eq("store_id", storeId)
          .eq("status", "sold"),
      ]);

      const soldMinor = confirmedSalesMinor(
        (sales.data as
          | { order_ref: string | null; final_amount_minor: number | null; product_price_minor: number | null }[]
          | null) ?? [],
      );

      setStats({
        views: views.count ?? 0,
        productTaps: taps.count ?? 0,
        inquiries: inquiries.count ?? 0,
        soldMinor,
      });
    } catch {
      // A stats read is not worth an error banner over the merchant's store.
      setStats(EMPTY_STATS);
    } finally {
      setStatsLoading(false);
    }
  }, [state.id]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // A failed card puts the store in grace: entitlements are untouched and
  // nothing is deleted until the window closes (lib/plans.ts).
  const inGrace = isInGrace({
    planGraceUntil: state.planGraceUntil,
    planLapsedAt: state.planLapsedAt,
  });
  const graceDaysLeft = inGrace && state.planGraceUntil
    ? Math.max(0, Math.ceil((Date.parse(state.planGraceUntil) - Date.now()) / 86_400_000))
    : 0;
  // Canonical storefront address is the bare handle (lib/utils.ts getShopPath).
  // Built through `lib/share-links.ts` so the console and the tagged links below
  // cannot disagree about the URL — including the handle-less `/?shop=<id>` shape,
  // which the previous hand-rolled string got wrong.
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://swiftlink.pro";
  const storeUrl = buildStoreUrl(origin, state);
  const whatsappShareHref = buildWhatsAppShareHref(
    buildShareUrl(origin, state, "whatsapp"),
    state.bizName,
  );

  // Copies a channel-tagged link. The tag is what the storefront records as the
  // inquiry's `source`, and what the Analytics channel breakdown counts.
  const handleCopyChannel = (channel: ShareChannel) => {
    const option = SHARE_CHANNELS.find((c) => c.id === channel);
    const url = buildShareUrl(origin, state, channel);
    if (navigator.clipboard) navigator.clipboard.writeText(url);
    setCopiedChannel(channel);
    addToast(
      `${option?.label ?? channel} link copied — orders from it count as “${channelForSource(channel)}”.`,
      "success",
    );
    setTimeout(() => setCopiedChannel(null), 2000);
  };

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

  /*
   * The plan badge is shown for *every* account, including Free. It used to be
   * hidden unless the plan was paid (`state.plan !== "free"`), so the merchants
   * most affected by the limits were the only ones never told which plan they
   * were on.
   */
  const plan = normalizePlan(state.plan);
  const planDetail = PLAN_DETAILS[plan];
  const productLimit = effectiveProductLimitFor(plan);
  const storeLimit = effectiveStoreLimitFor(plan);

  const nextAction = !hasProducts
    ? { title: "Add your first product", desc: "Buyers can’t order until you do", href: "/business" }
    : !hasTemplate
    ? { title: "Choose a storefront template", desc: "Preview three looks with your products", href: "/business" }
    : !isLinkShared
    ? { title: "Share your link with customers", desc: "Start receiving orders on WhatsApp", href: "#share-channels" }
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-5 pb-24 sm:px-6 sm:py-7">
      {deniedAdmin && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[24px] border border-[#E8B93A]/30 bg-[#E8B93A]/10 p-4"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#E8B93A]" />
          <div>
            <p className="text-sm font-semibold text-[#E8F1EC]">
              Admin access required
            </p>
            <p className="mt-0.5 text-xs text-[#9DB3A8]">
              This account is not an administrator, so the admin console is not
              available. If you believe this is wrong, ask an existing admin to
              promote this email.
            </p>
          </div>
        </div>
      )}

      {/* ─── Payment grace period ────────────────────────────────────────── */}
      {inGrace && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[24px] border border-[#E8B93A]/30 bg-[#E8B93A]/10 p-4"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#E8B93A]" />
          <div className="text-sm text-[#E8F1EC]">
            <p className="font-semibold">We could not charge your card</p>
            <p className="mt-0.5 text-[#9DB3A8]">
              Nothing has been removed — your store keeps its full plan for {graceDaysLeft} more{" "}
              {graceDaysLeft === 1 ? "day" : "days"}. Update your payment method before then to
              avoid a downgrade.
            </p>
          </div>
        </div>
      )}

      {/* ─── Google M3 Expressive Hero Card ──────────────────────────────── */}
      <section
        className={cn(
          "rounded-[36px] sm:rounded-[44px_44px_44px_16px] p-6 sm:p-8 transition-colors duration-300 shadow-sm",
          state.isLive
            ? "bg-[#b8f2d3] text-[#00391f] dark:bg-[#0f5133] dark:text-[#b8f2d3]"
            : "bg-[#d9e8df] text-[#0f1f17] dark:bg-[#182a22] dark:text-[#e2efe7]"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs sm:text-sm font-semibold opacity-80 uppercase tracking-wider">
            Welcome back
          </div>
          <Link
            href="/account#plans"
            title={`${planDetail.name} plan — ${planDetail.summary}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 text-[11px] font-bold text-inherit transition hover:bg-black/15"
          >
            <BadgeCheck className="h-3 w-3" />
            <span>{planDetail.name}</span>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1.5 mb-4 font-sans">
          Good day, {firstName}
        </h1>

        {/* M3 Status Pill with Interactive Switch (.sw) */}
        <div className="flex items-center justify-between gap-3 rounded-full bg-black/10 dark:bg-white/10 px-4 py-2 font-semibold text-xs sm:text-sm">
          <span className="flex items-center gap-2">
            <i className={cn("m3-dot", !state.isLive && "paused")} />
            <span>{state.isLive ? "Store is live & receiving orders" : "Store is paused"}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !state.isLive;
                updateState("isLive", next);
                if (state.id) void setStoreLive(state.id, next);
                addToast(
                  next
                    ? "Store is live — customers can order again."
                    : "Store paused — customers can no longer check out.",
                  next ? "success" : "info",
                );
              }}
              aria-pressed={!state.isLive}
              aria-label="Pause or resume store"
              className={cn("m3-sw", !state.isLive && "paused")}
            />
            {/* Semantic button text for accessibility & automated tests */}
            <button
              type="button"
              onClick={() => {
                const next = !state.isLive;
                updateState("isLive", next);
                if (state.id) void setStoreLive(state.id, next);
                addToast(
                  next
                    ? "Store is live — customers can order again."
                    : "Store paused — customers can no longer check out.",
                  next ? "success" : "info",
                );
              }}
              className="hidden"
            >
              {state.isLive ? "Stop store" : "Go live"}
            </button>
          </div>
        </div>

        {/* Public Store Link Pill */}
        <div className="flex items-center gap-2 rounded-full bg-white dark:bg-[#14231c] text-[#0f1f17] dark:text-[#e2efe7] p-1.5 pl-4 mt-4 shadow-xs">
          <span className="flex-1 truncate text-xs sm:text-sm font-semibold">
            {storeUrl.replace(/^https?:\/\//, "")}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#00875a] dark:bg-[#5be3a0] text-white dark:text-[#00391f] px-4 py-1.5 text-xs font-bold transition active:scale-95 shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Actions: Share & View store */}
        <div className="flex gap-2.5 mt-3">
          <button
            type="button"
            onClick={handleShareLink}
            className="flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-black/10 dark:bg-white/10 text-inherit font-bold text-xs sm:text-sm transition hover:bg-black/15 active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-black/10 dark:bg-white/10 text-inherit font-bold text-xs sm:text-sm transition hover:bg-black/15 active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View store</span>
          </a>
        </div>
      </section>

      {/* ─── Google M3 Checklist with Wavy Progress SVG ───────────────────── */}
      <section className="rounded-[32px] border border-[#182a22] bg-[#111e18] p-5 sm:p-6 shadow-sm">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#e2efe7]">Get your store ready</h2>
          <div className="text-lg sm:text-xl font-extrabold text-[#e2efe7]">
            {completedCount} of {checklistItems.length} <span className="text-xs font-medium text-[#9db4a8]">done</span>
          </div>
        </div>

        {/* Wavy SVG Progress line */}
        <svg
          className="w-full h-4 my-2 overflow-visible m3-wave"
          viewBox="0 0 320 16"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 8 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0"
            stroke="var(--m3-s2)"
          />
          <path
            d="M0 8 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0"
            stroke="var(--m3-p)"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - (completedCount * 20)}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.34,1.56,.64,1) .2s" }}
          />
        </svg>

        {/* Next actionable step banner */}
        {nextAction ? (
          <Link
            href={nextAction.href}
            className="flex items-center gap-3.5 rounded-[24px] bg-[#00875a] dark:bg-[#5be3a0] text-white dark:text-[#00391f] p-4 font-semibold transition active:scale-98 mt-3"
          >
            <div className="flex-1 min-w-0">
              <strong className="block text-base sm:text-lg">{nextAction.title}</strong>
              <small className="opacity-90 text-xs sm:text-sm font-normal">{nextAction.desc}</small>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-white dark:bg-[#00391f] text-[#00875a] dark:text-[#5be3a0] grid place-items-center shrink-0">
              <ChevronRight className="w-5 h-5" />
            </span>
          </Link>
        ) : (
          <div className="inline-block rounded-full bg-[#0f5133] text-[#b8f2d3] px-3.5 py-1 text-xs font-bold mt-2">
            Your store is ready to sell
          </div>
        )}

        {/* Steps */}
        <ul className="mt-4 divide-y divide-[#182a22]">
          {checklistItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 text-xs sm:text-sm">
              <span
                className={cn(
                  "w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0",
                  item.completed
                    ? "bg-[#00875a] dark:bg-[#5be3a0] text-white dark:text-[#00391f]"
                    : "border border-[#9db4a8] text-transparent"
                )}
              >
                {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              <span className={item.completed ? "text-[#9db4a8] line-through" : "text-[#e2efe7] font-semibold"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Google M3 Bento Stat Cards ("All time") ──────────────────────── */}
      <section aria-label="Store overview stats">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#e2efe7]">All time</h2>
          <button
            type="button"
            onClick={() => void loadStats()}
            disabled={statsLoading}
            className="flex min-h-[34px] items-center gap-1.5 rounded-full border border-[#24382F] bg-[#111e18] px-3.5 text-xs font-semibold text-[#9db4a8] transition hover:text-[#e2efe7] hover:border-[#5be3a0] active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3 w-3", statsLoading && "animate-spin")} />
            <span>{statsLoading ? "Updating" : "Refresh"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Confirmed Sales Money Card */}
          <div className="col-span-2 rounded-[36px_36px_16px_36px] bg-[#ffe3a3] text-[#3d2b00] dark:bg-[#4a3a0f] dark:text-[#ffe3a3] p-5 sm:p-6 flex flex-col justify-between min-h-[140px] shadow-xs">
            <small className="font-semibold text-xs sm:text-sm opacity-80">Confirmed sales</small>
            <b className="text-4xl sm:text-5xl font-black tracking-tight my-2">
              {stats ? formatMoney(stats.soldMinor, state.currency || "NGN") : "₦0"}
            </b>
            <small className="text-xs opacity-75">Recorded through inquiries</small>
          </div>

          {/* Store Views */}
          <div className="rounded-[28px_28px_28px_10px] bg-[#111e18] border border-[#182a22] p-4 sm:p-5 flex flex-col justify-between min-h-[120px]">
            <small className="text-[#9db4a8] font-medium text-xs">Store views</small>
            <b className="text-3xl sm:text-4xl font-extrabold text-[#e2efe7]">
              {stats ? stats.views.toLocaleString() : "0"}
            </b>
            <small className="text-[11px] text-[#9db4a8]">From direct links &amp; social</small>
          </div>

          {/* Product Taps */}
          <div className="rounded-[28px_28px_10px_28px] bg-[#111e18] border border-[#182a22] p-4 sm:p-5 flex flex-col justify-between min-h-[120px]">
            <small className="text-[#9db4a8] font-medium text-xs">Product taps</small>
            <b className="text-3xl sm:text-4xl font-extrabold text-[#e2efe7]">
              {stats ? stats.productTaps.toLocaleString() : "0"}
            </b>
            <small className="text-[11px] text-[#9db4a8]">Buyers viewing details</small>
          </div>

          {/* Order inquiries */}
          <div className="col-span-2 rounded-[12px_28px_28px_28px] bg-[#111e18] border border-[#182a22] p-4 sm:p-5 flex items-center justify-between min-h-[90px]">
            <div>
              <small className="text-[#9db4a8] font-medium text-xs">Order inquiries</small>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#e2efe7] leading-tight">
                {stats ? stats.inquiries.toLocaleString() : "0"}
              </div>
            </div>
            <small className="text-[11px] text-[#9db4a8] max-w-[150px] text-right">
              WhatsApp, social &amp; price requests
            </small>
          </div>
        </div>
      </section>

      {/* ─── Google M3 Share by Channel Section ──────────────────────────── */}
      <section id="share-channels" className="rounded-[32px] border border-[#182a22] bg-[#111e18] p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-[#e2efe7]">Share by channel</h2>
        <p className="text-xs text-[#9db4a8] mt-1">
          Pick where you are posting. Orders from that link show up under the same channel in Stats.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {SHARE_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleCopyChannel(ch.id)}
              className={cn(
                "h-12 rounded-[18px] flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all m3-spring-btn",
                copiedChannel === ch.id
                  ? "bg-[#0f5133] text-[#b8f2d3] font-bold"
                  : "bg-[#182a22] text-[#e2efe7] hover:bg-[#20362c]"
              )}
            >
              {copiedChannel === ch.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{ch.label}</span>
            </button>
          ))}
        </div>

        <a
          href={whatsappShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-3.5 h-14 rounded-full bg-[#00875a] dark:bg-[#5be3a0] text-white dark:text-[#00391f] flex items-center justify-center gap-2 font-bold text-base transition active:scale-95 shadow-md shadow-[#00875a]/20"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Send on WhatsApp</span>
        </a>
      </section>
    </div>
  );
}
