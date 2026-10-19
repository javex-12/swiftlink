"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProLayout } from "@/components/ProLayout";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { formatMoney } from "@/lib/currency";
import { toMinorUnits } from "@/lib/inquiry-write";
import { cn } from "@/lib/utils";
import { inquirySourceLabel } from "@/lib/checkout-channels";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Phone,
  X,
  Banknote,
  TicketPercent,
  Download,
  Lock,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { csvFilename, downloadCsv, toCsv, type CsvColumn } from "@/lib/csv";
import { normalizePlan } from "@/lib/plans";
import { ProGate } from "@/components/billing/ProGate";
import {
  groupVisitors,
  visitorLabel,
  visitorTotals,
  type VisitorEventRow,
} from "@/lib/visitors";

/**
 * How far back the visitor list looks.
 *
 * Thirty days matches the analytics window, so "400 views this month" on the
 * dashboard and the sessions listed here describe the same period.
 */
const VISITOR_WINDOW_DAYS = 30;

/** Short, human age for a timestamp — this column is read at a glance. */
function describeWhen(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days <= 1 ? "yesterday" : `${days}d ago`;
}

/**
 * Inquiries & Orders.
 *
 * Previously a static "No inquiries recorded yet" card whose three tabs all
 * rendered the same empty panel (docs/05-IMPROVEMENT-PLAN.md R-06). It now reads
 * the `inquiries` and `customers` tables that the storefront populates when a
 * buyer taps "Order on WhatsApp", and it can move an inquiry through
 * `new → chatting → sold / lost`.
 *
 * Marking a sale requires an amount and a timestamp: the database enforces this
 * with `chk_inquiries_sold_requires_amount_and_date`, and `validateInquiryStatusTransition`
 * implements the same rule in the UI so the constraint is never hit by surprise.
 * Status changes also feed `customers.sold_count` through the sync trigger.
 */

type InquiryStatus = "new" | "chatting" | "sold" | "lost";

interface Inquiry {
  id: string;
  product_id: number;
  product_name: string;
  currency: string;
  product_price_minor: number;
  selected_option: string | null;
  /** The anonymous browser id, which is how a visitor row finds its order. */
  device_hash?: string | null;
  final_amount_minor: number | null;
  sold_at: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  status: InquiryStatus;
  source: string;
  created_at: string;
  /** Reference shown to the buyer; one per cart order. */
  order_ref: string | null;
  discount_code: string | null;
  discount_minor: number | null;
  /** The order text the buyer was handed — the order as they wrote it. */
  message: string | null;
}

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  chats_count: number;
  sold_count: number;
  last_chat_at: string;
}

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-[#14231D] text-[#19C37D] border-[#24382F]",
  chatting: "bg-[#1B2333] text-[#60A5FA] border-[#24382F]",
  sold: "bg-[#14231D] text-[#19C37D] border-[#19C37D]/40",
  lost: "bg-[#241A1A] text-[#FF8A8A] border-[#FF8A8A]/30",
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function InquiriesPage() {
  const { state, addToast } = useSwiftLink();
  const storeId = state.id;
  const currency = state.currency || "NGN";
  const plan = normalizePlan(state.plan);

  const [activeTab, setActiveTab] = useState<"all" | "sales" | "customers" | "visitors">("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saleTarget, setSaleTarget] = useState<Inquiry | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  /** Which channel is being viewed; `all` is the default. */
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  /** The order text is collapsed by default: most rows the merchant reads are not it. */
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);

  /*
   * Visitors are loaded on demand, when their tab is actually opened. A free
   * account never reaches the tab (it shows the upgrade panel), so it never pays
   * for the query either.
   */
  const [events, setEvents] = useState<VisitorEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsNotice, setEventsNotice] = useState<string | null>(null);
  const [eventsLoadedFor, setEventsLoadedFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId || !isSupabaseConfigured()) {
      setInquiries([]);
      setCustomers([]);
      setNotice(
        !storeId ? "No store selected yet." : "Connect Supabase to see live inquiries.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotice(null);

    const [inquiryRes, customerRes] = await Promise.all([
      supabase
        .from("inquiries")
        .select(
          "id, product_id, product_name, currency, product_price_minor, selected_option, final_amount_minor, sold_at, buyer_name, buyer_phone, device_hash, status, source, created_at, order_ref, discount_code, discount_minor, message",
        )
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("customers")
        .select("id, phone, name, chats_count, sold_count, last_chat_at")
        .eq("store_id", storeId)
        .order("last_chat_at", { ascending: false })
        .limit(200),
    ]);

    if (inquiryRes.error || customerRes.error) {
      const message =
        inquiryRes.error?.message || customerRes.error?.message || "Unknown error";
      console.warn("[inquiries] load failed:", message);
      setNotice(`Could not load inquiries: ${message}`);
    }

    setInquiries((inquiryRes.data as Inquiry[] | null) ?? []);
    setCustomers((customerRes.data as Customer[] | null) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadVisitors = useCallback(async () => {
    if (!storeId || !isSupabaseConfigured()) {
      setEvents([]);
      setEventsNotice(!storeId ? "No store selected yet." : "Connect Supabase to see live visitors.");
      setEventsLoadedFor(storeId ?? null);
      return;
    }

    setEventsLoading(true);
    setEventsNotice(null);

    const since = new Date(Date.now() - VISITOR_WINDOW_DAYS * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from("store_events")
      .select("event_type, created_at, product_id, metadata")
      .eq("store_id", storeId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      console.warn("[visitors] load failed:", error.message);
      setEventsNotice(`Could not load visitors: ${error.message}`);
    }

    setEvents((data as VisitorEventRow[] | null) ?? []);
    setEventsLoading(false);
    setEventsLoadedFor(storeId);
  }, [storeId]);

  useEffect(() => {
    if (activeTab !== "visitors" || plan === "free") return;
    if (!storeId || eventsLoadedFor === storeId) return;
    void loadVisitors();
  }, [activeTab, plan, storeId, eventsLoadedFor, loadVisitors]);

  const setStatus = useCallback(
    async (inquiry: Inquiry, status: InquiryStatus, amountMajor?: number) => {
      if (!isSupabaseConfigured()) return;

      // Mirror the database invariant before the round trip, so the user gets a
      // readable message instead of a constraint violation.
      const payload: Record<string, unknown> = { status };
      if (status === "sold") {
        if (!amountMajor || amountMajor <= 0) {
          addToast("Enter the amount this item actually sold for.", "error");
          return;
        }
        payload.final_amount_minor = toMinorUnits(amountMajor);
        payload.sold_at = new Date().toISOString();
      } else {
        // Leaving 'sold' must clear the sale fields or the check constraint fails.
        payload.final_amount_minor = null;
        payload.sold_at = null;
      }

      setSavingId(inquiry.id);
      const { error } = await supabase.from("inquiries").update(payload).eq("id", inquiry.id);
      setSavingId(null);

      if (error) {
        addToast(`Could not update: ${error.message}`, "error");
        return;
      }

      setInquiries((prev) =>
        prev.map((row) =>
          row.id === inquiry.id
            ? {
                ...row,
                status,
                final_amount_minor: (payload.final_amount_minor as number | null) ?? null,
                sold_at: (payload.sold_at as string | null) ?? null,
              }
            : row,
        ),
      );
      addToast(
        status === "sold" ? "Sale recorded." : `Marked as ${status}.`,
        "success",
      );
      // sold_count lives on `customers` and is maintained by a trigger, so pull
      // the fresh figures rather than trying to recompute them here.
      void load();
    },
    [addToast, load],
  );

  const openSaleDialog = (inquiry: Inquiry) => {
    setSaleTarget(inquiry);
    // Pre-fill with the listed price; the merchant edits it to what was agreed.
    setSaleAmount(String(inquiry.product_price_minor / 100));
  };

  const confirmSale = async () => {
    if (!saleTarget) return;
    const parsed = Number(saleAmount);
    const target = saleTarget;
    setSaleTarget(null);
    await setStatus(target, "sold", parsed);
  };

  /** Channels present in the loaded rows, so the filter never offers a dead tab. */
  const sources = useMemo(() => {
    const seen = new Map<string, number>();
    for (const row of inquiries) {
      const key = row.source || "direct";
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [inquiries]);

  const visibleInquiries = useMemo(() => {
    const byTab = activeTab === "sales" ? inquiries.filter((row) => row.status === "sold") : inquiries;
    if (sourceFilter === "all") return byTab;
    return byTab.filter((row) => (row.source || "direct") === sourceFilter);
  }, [activeTab, inquiries, sourceFilter]);

  /**
   * Export what is on screen, not the whole table.
   *
   * The merchant has already filtered by tab and channel to answer a question
   * ("what sold on Instagram this week?"); exporting the unfiltered rows would
   * answer a different one. Amounts are written in major units so a spreadsheet
   * can total them, with the currency in its own column — the minor-unit values
   * the database stores would read as 100× too large.
   */
  const exportCsv = () => {
    if (!visibleInquiries.length) {
      addToast("There is nothing to export in this view.", "info");
      return;
    }
    const major = (minor: number | null | undefined) =>
      typeof minor === "number" ? (minor / 100).toFixed(2) : "";

    const columns: CsvColumn<Inquiry>[] = [
      { header: "Order ref", value: (row) => row.order_ref ?? "" },
      { header: "Date", value: (row) => row.created_at },
      { header: "Customer", value: (row) => row.buyer_name ?? "" },
      { header: "Phone", value: (row) => row.buyer_phone ?? "" },
      { header: "Product", value: (row) => row.product_name },
      { header: "Option", value: (row) => row.selected_option ?? "" },
      { header: "Channel", value: (row) => inquirySourceLabel(row.source) },
      { header: "Status", value: (row) => row.status },
      { header: "Listed price", value: (row) => major(row.product_price_minor) },
      { header: "Discount code", value: (row) => row.discount_code ?? "" },
      { header: "Discount", value: (row) => major(row.discount_minor) },
      { header: "Amount paid", value: (row) => major(row.final_amount_minor) },
      { header: "Currency", value: (row) => row.currency || currency },
      { header: "Sold at", value: (row) => row.sold_at ?? "" },
      { header: "Order message", value: (row) => row.message ?? "" },
    ];

    downloadCsv(csvFilename("orders"), toCsv(visibleInquiries, columns));
    addToast(`Exported ${visibleInquiries.length} row${visibleInquiries.length === 1 ? "" : "s"}.`, "success");
  };

  /*
   * One row per anonymous browser, newest activity first. The order list is what
   * turns a session into a person — and only for a visitor who actually ordered,
   * because the name and phone come from the order they typed themselves.
   */
  const visitorSessions = useMemo(
    () =>
      groupVisitors(events, {
        productName: (id) =>
          id === null ? null : state.products.find((product) => product.id === id)?.name ?? null,
        orders: inquiries.map((row) => ({
          device_hash: row.device_hash ?? null,
          buyer_name: row.buyer_name ?? null,
          buyer_phone: row.buyer_phone ?? null,
          created_at: row.created_at,
          status: row.status,
        })),
      }),
    [events, inquiries, state.products],
  );
  const visitorSummary = useMemo(() => visitorTotals(visitorSessions), [visitorSessions]);

  const soldRevenueMinor = useMemo(
    () =>
      inquiries
        .filter((row) => row.status === "sold")
        .reduce((sum, row) => sum + (row.final_amount_minor ?? 0), 0),
    [inquiries],
  );

  const tabs = [
    { key: "all" as const, label: "All Inquiries", icon: Clock, count: inquiries.length },
    { key: "sales" as const, label: "Confirmed Sales", icon: CheckCircle2, count: inquiries.filter((r) => r.status === "sold").length },
    { key: "customers" as const, label: "Customers", icon: UserCheck, count: customers.length },
    { key: "visitors" as const, label: "Visitors", icon: Eye, count: visitorSummary.visitors },
  ];

  return (
    <ProLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 pb-12 sm:pb-16">
        <header className="border-b border-[#1E2D27] pb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">Inquiries &amp; Orders</h1>
            <p className="mt-1 text-xs sm:text-sm text-[#9DB3A8]">
              Every tap on &ldquo;Order on WhatsApp&rdquo; in {state.bizName || "your store"}, and the sales you confirmed.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/*
              Export is a Pro feature on the pricing page, so a free account gets
              a link to the plans section instead of a working button. Rendering
              it disabled without saying why would look like a broken build.
            */}
            {plan === "free" ? (
              <Link
                href="/account#plans"
                title="Exporting orders is a Pro feature"
                className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#E8B93A]/40 bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8B93A] transition hover:border-[#E8B93A]"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV · Pro</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={exportCsv}
                disabled={loading || visibleInquiries.length === 0}
                className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">{loading ? "Loading" : "Refresh"}</span>
            </button>
          </div>
        </header>

        {notice && (
          <div role="status" className="rounded-[14px] border border-[#E8B93A]/30 bg-[#E8B93A]/10 px-4 py-3 text-xs text-[#E8F1EC]">
            {notice}
          </div>
        )}

        {inquiries.length > 0 && activeTab !== "visitors" && (
          <div className="rounded-[16px] border border-[#1E2D27] bg-[#111C18] px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="text-xs text-[#9DB3A8]">
              <strong className="text-[#E8F1EC] tabular-nums">{inquiries.length}</strong> inquiries
            </span>
            <span className="text-xs text-[#9DB3A8]">
              <strong className="text-[#19C37D] tabular-nums">{inquiries.filter((r) => r.status === "sold").length}</strong> sold
            </span>
            <span className="text-xs text-[#9DB3A8]">
              <strong className="text-[#E8F1EC] tabular-nums">{formatMoney(soldRevenueMinor, currency)}</strong> confirmed
            </span>
          </div>
        )}

        {/* Filter controls with 44px+ touch targets */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#1E2D27] pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
                    : "text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="rounded-full bg-[#0A1210] px-1.5 py-0.5 text-[10px] tabular-nums">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/*
          Channel filter. Only channels that actually have orders are offered, so
          the merchant never taps a tab that cannot have anything in it.
        */}
        {activeTab !== "visitors" && inquiries.length > 0 && sources.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSourceFilter("all")}
              className={cn(
                "min-h-[32px] rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                sourceFilter === "all"
                  ? "border-[#19C37D]/40 bg-[#19C37D]/15 text-[#19C37D]"
                  : "border-[#24382F] bg-[#14231D] text-[#9DB3A8] hover:text-[#E8F1EC]",
              )}
            >
              All channels
            </button>
            {sources.map(([source, count]) => (
              <button
                key={source}
                type="button"
                onClick={() => setSourceFilter(source)}
                className={cn(
                  "min-h-[32px] rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                  sourceFilter === source
                    ? "border-[#19C37D]/40 bg-[#19C37D]/15 text-[#19C37D]"
                    : "border-[#24382F] bg-[#14231D] text-[#9DB3A8] hover:text-[#E8F1EC]",
                )}
              >
                {inquirySourceLabel(source)} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Customers list */}
        {activeTab === "visitors" ? (
          <section className="space-y-4">
            {plan === "free" ? (
              <ProGate
                feature="Store visitors"
                description="See who came to your store, which products they tapped, and who reached checkout or placed an order — one row per anonymous visitor, for the last 30 days."
              />
            ) : (
              <>
                <div className="rounded-[16px] border border-[#1E2D27] bg-[#111C18] px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span className="text-xs text-[#9DB3A8]">
                    <strong className="text-[#E8F1EC] tabular-nums">{visitorSummary.visitors}</strong> visitors
                  </span>
                  <span className="text-xs text-[#9DB3A8]">
                    <strong className="text-[#E8F1EC] tabular-nums">{visitorSummary.views}</strong> store views
                  </span>
                  <span className="text-xs text-[#9DB3A8]">
                    <strong className="text-[#E8F1EC] tabular-nums">{visitorSummary.productClicks}</strong> product taps
                  </span>
                  <span className="text-xs text-[#9DB3A8]">
                    <strong className="text-[#E8F1EC] tabular-nums">{visitorSummary.checkouts}</strong> checkouts
                  </span>
                  <span className="text-xs text-[#9DB3A8]">
                    <strong className="text-[#19C37D] tabular-nums">{visitorSummary.ordered}</strong> ordered
                  </span>
                </div>

                {eventsNotice && (
                  <div role="status" className="rounded-[14px] border border-[#E8B93A]/30 bg-[#E8B93A]/10 px-4 py-3 text-xs text-[#E8F1EC]">
                    {eventsNotice}
                  </div>
                )}

                {eventsLoading && visitorSessions.length === 0 && (
                  <p className="rounded-[16px] border border-[#1E2D27] bg-[#111C18] px-4 py-6 text-center text-xs text-[#9DB3A8]">
                    Loading visitor activity…
                  </p>
                )}

                {!eventsLoading && visitorSessions.length === 0 && (
                  <div className="rounded-[16px] border border-[#1E2D27] bg-[#111C18] px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-[#E8F1EC]">No visitors in the last {VISITOR_WINDOW_DAYS} days</p>
                    <p className="mx-auto mt-2 max-w-md text-xs text-[#9DB3A8]">
                      Activity appears here as soon as someone opens your storefront link — shares on
                      WhatsApp, Instagram or anywhere else all count.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {visitorSessions.map((session) => (
                    <article
                      key={session.id}
                      className="rounded-[16px] border border-[#1E2D27] bg-[#111C18] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-semibold text-[#E8F1EC]">
                            <Eye className="h-4 w-4 shrink-0 text-[#9DB3A8]" />
                            {visitorLabel(session.id)}
                            {session.ordered && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#19C37D]/40 bg-[#19C37D]/10 px-2 py-0.5 text-[10px] font-semibold text-[#19C37D]">
                                <CheckCircle2 className="h-3 w-3" />
                                {session.orders === 1 ? "Ordered" : `${session.orders} orders`}
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-[11px] text-[#9DB3A8]">
                            {session.lastAction} · {describeWhen(session.lastSeen)}
                            {session.firstSeen !== session.lastSeen && (
                              <> · first seen {describeWhen(session.firstSeen)}</>
                            )}
                          </p>
                          {session.ordered && (session.name || session.phone) && (
                            <p className="mt-1 text-[11px] text-[#E8F1EC]">
                              {session.name || "Name not given"}
                              {session.phone ? ` · ${session.phone}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full border border-[#24382F] bg-[#14231D] px-2 py-0.5 text-[#9DB3A8]">
                            {session.views} view{session.views === 1 ? "" : "s"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#24382F] bg-[#14231D] px-2 py-0.5 text-[#9DB3A8]">
                            <MousePointerClick className="h-3 w-3" />
                            {session.productClicks}
                          </span>
                          <span className="rounded-full border border-[#24382F] bg-[#14231D] px-2 py-0.5 text-[#9DB3A8]">
                            {session.checkouts} checkout{session.checkouts === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      {session.products.length > 0 && (
                        <p className="mt-3 text-[11px]">
                          <span className="text-[#9DB3A8]">Tapped: </span>
                          {session.products.map((product, index) => (
                            <span key={`${product.id}-${index}`} className="text-[#E8F1EC]">
                              {index > 0 ? ", " : ""}
                              {product.name ?? (product.id === null ? "Unknown product" : `Product #${product.id}`)}
                              {product.clicks > 1 ? ` ×${product.clicks}` : ""}
                            </span>
                          ))}
                        </p>
                      )}

                      {session.channels.length > 0 && (
                        <p className="mt-1 text-[11px] text-[#9DB3A8]">
                          Checkout via {session.channels.join(", ")}
                        </p>
                      )}
                    </article>
                  ))}
                </div>

                <p className="text-[11px] leading-relaxed text-[#9DB3A8]">
                  Visitors are anonymous browser ids — no IP address, device or location is stored.
                  A name and phone appear only for someone who placed an order and typed them in.
                </p>
              </>
            )}
          </section>
        ) : activeTab === "customers" ? (
          customers.length > 0 ? (
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#1E2D27] bg-[#111C18] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#E8F1EC]">
                      {customer.name || customer.phone}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9DB3A8]">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#9DB3A8]">
                    <span>
                      <strong className="text-[#E8F1EC] tabular-nums">{customer.chats_count}</strong> chats
                    </span>
                    <span>
                      <strong className="text-[#19C37D] tabular-nums">{customer.sold_count}</strong> bought
                    </span>
                    <span className="hidden sm:inline">{formatDate(customer.last_chat_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No customers yet"
              body="A customer is created automatically the first time a buyer contacts you with a phone number attached."
            />
          )
        ) : visibleInquiries.length > 0 ? (
          <div className="space-y-2">
            {visibleInquiries.map((inquiry) => {
              const busy = savingId === inquiry.id;
              return (
                <div
                  key={inquiry.id}
                  className="rounded-[14px] border border-[#1E2D27] bg-[#111C18] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#E8F1EC]">
                          {inquiry.product_name}
                        </p>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            STATUS_STYLES[inquiry.status],
                          )}
                        >
                          {inquiry.status}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#9DB3A8]">
                        <span>
                          {formatDate(inquiry.created_at)} · via {
                            inquirySourceLabel(inquiry.source)
                          }
                          {inquiry.order_ref ? ` · ${inquiry.order_ref}` : ""}
                          {inquiry.selected_option ? ` · ${inquiry.selected_option}` : ""}
                          {inquiry.buyer_phone ? ` · ${inquiry.buyer_phone}` : ""}
                        </span>
                        {inquiry.discount_code && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#19C37D]/40 bg-[#19C37D]/10 px-2 py-0.5 font-semibold text-[#19C37D]">
                            <TicketPercent className="h-3 w-3" />
                            {inquiry.discount_code}
                            {inquiry.discount_minor
                              ? ` −${formatMoney(inquiry.discount_minor, inquiry.currency || currency)}`
                              : ""}
                          </span>
                        )}
                      </p>

                      {/*
                        The prefilled order text, stored verbatim when the order was
                        placed. This is what makes the dashboard independent of the
                        messaging app: the merchant reads the order here, not by
                        scrolling a chat thread they may not own.
                      */}
                      {inquiry.message && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMessageId(openMessageId === inquiry.id ? null : inquiry.id)
                            }
                            aria-expanded={openMessageId === inquiry.id}
                            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-[10px] border border-[#24382F] bg-[#14231D] px-2.5 py-1 text-[11px] font-semibold text-[#9DB3A8] hover:text-[#E8F1EC]"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {openMessageId === inquiry.id ? "Hide order message" : "View order message"}
                          </button>
                          {openMessageId === inquiry.id && (
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-[12px] border border-[#24382F] bg-[#0A1210] p-3 text-[11px] leading-relaxed text-[#E8F1EC]">
                              {inquiry.message}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#E8F1EC] tabular-nums">
                        {formatMoney(inquiry.product_price_minor, inquiry.currency || currency)}
                      </p>
                      {inquiry.status === "sold" && inquiry.final_amount_minor !== null && (
                        <p className="text-[11px] text-[#19C37D] tabular-nums">
                          sold for {formatMoney(inquiry.final_amount_minor, inquiry.currency || currency)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[#1E2D27] pt-3">
                    {inquiry.status !== "chatting" && inquiry.status !== "sold" && (
                      <ActionButton
                        label="Chatting"
                        disabled={busy}
                        onClick={() => void setStatus(inquiry, "chatting")}
                      />
                    )}
                    {inquiry.status !== "sold" && (
                      <ActionButton
                        label="Mark sold"
                        primary
                        disabled={busy}
                        onClick={() => openSaleDialog(inquiry)}
                      />
                    )}
                    {inquiry.status !== "lost" && (
                      <ActionButton
                        label="Lost"
                        disabled={busy}
                        onClick={() => void setStatus(inquiry, "lost")}
                      />
                    )}
                    {inquiry.status !== "new" && (
                      <ActionButton
                        label="Reset to new"
                        disabled={busy}
                        onClick={() => void setStatus(inquiry, "new")}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={
              activeTab === "sales" ? "No confirmed sales yet" : "No inquiries recorded yet"
            }
            body={
              activeTab === "sales"
                ? "Mark an inquiry as sold and it will appear here with its final amount."
                : `When customers tap "Order on WhatsApp" on your store (${
                    state.bizName || "your store"
                  }), their inquiries appear here automatically.`
            }
          />
        )}
      </div>

      {/* Sale amount dialog */}
      {saleTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sale-dialog-title"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSaleTarget(null);
          }}
        >
          <div className="w-full max-w-sm rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="sale-dialog-title" className="text-base font-semibold text-[#E8F1EC]">
                  Confirm sale
                </h2>
                <p className="mt-0.5 text-[11px] text-[#9DB3A8]">{saleTarget.product_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSaleTarget(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#9DB3A8] hover:bg-[#14231D] hover:text-[#E8F1EC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block text-xs font-medium text-[#9DB3A8]">
              Final amount ({currency})
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-3 py-2.5 focus-within:border-[#19C37D]">
              <Banknote className="h-4 w-4 shrink-0 text-[#9DB3A8]" />
              <input
                autoFocus
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={saleAmount}
                onChange={(event) => setSaleAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void confirmSale();
                }}
                className="w-full bg-transparent text-sm font-semibold tabular-nums text-[#E8F1EC] outline-none"
              />
            </div>
            <p className="mt-2 text-[11px] text-[#9DB3A8]">
              Editing the amount is expected — record what the buyer actually paid.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setSaleTarget(null)}
                className="min-h-[44px] flex-1 rounded-[12px] border border-[#24382F] bg-[#14231D] text-xs font-semibold text-[#9DB3A8] hover:text-[#E8F1EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSale()}
                className="min-h-[44px] flex-1 rounded-[12px] bg-[#19C37D] text-xs font-bold text-[#04140D] hover:bg-[#16B070]"
              >
                Record sale
              </button>
            </div>
          </div>
        </div>
      )}
    </ProLayout>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-[36px] rounded-[10px] border px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-50",
        primary
          ? "border-[#19C37D]/40 bg-[#19C37D]/15 text-[#19C37D] hover:bg-[#19C37D]/25"
          : "border-[#24382F] bg-[#14231D] text-[#9DB3A8] hover:text-[#E8F1EC]",
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14231D] text-[#19C37D] border border-[#24382F]">
        <MessageSquare className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[#E8F1EC]">{title}</h2>
      <p className="mt-1.5 max-w-sm text-xs text-[#9DB3A8] leading-relaxed">{body}</p>
    </div>
  );
}
