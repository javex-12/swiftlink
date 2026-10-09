"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProLayout } from "@/components/ProLayout";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { formatMoney } from "@/lib/currency";
import { toMinorUnits } from "@/lib/inquiry-write";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Phone,
  X,
  Banknote,
} from "lucide-react";

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
  final_amount_minor: number | null;
  sold_at: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  status: InquiryStatus;
  source: string;
  created_at: string;
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

  const [activeTab, setActiveTab] = useState<"all" | "sales" | "customers">("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saleTarget, setSaleTarget] = useState<Inquiry | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

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
          "id, product_id, product_name, currency, product_price_minor, selected_option, final_amount_minor, sold_at, buyer_name, buyer_phone, status, source, created_at",
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

  const visibleInquiries = useMemo(
    () => (activeTab === "sales" ? inquiries.filter((row) => row.status === "sold") : inquiries),
    [activeTab, inquiries],
  );

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
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">{loading ? "Loading" : "Refresh"}</span>
          </button>
        </header>

        {notice && (
          <div role="status" className="rounded-[14px] border border-[#E8B93A]/30 bg-[#E8B93A]/10 px-4 py-3 text-xs text-[#E8F1EC]">
            {notice}
          </div>
        )}

        {inquiries.length > 0 && (
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

        {/* Customers list */}
        {activeTab === "customers" ? (
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
                      <p className="mt-1 text-[11px] text-[#9DB3A8]">
                        {formatDate(inquiry.created_at)} · via {inquiry.source}
                        {inquiry.selected_option ? ` · ${inquiry.selected_option}` : ""}
                        {inquiry.buyer_phone ? ` · ${inquiry.buyer_phone}` : ""}
                      </p>
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
