"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { formatMoney } from "@/lib/currency";
import { 
  MousePointer2, MessageSquare, 
  BarChart3, Package, Activity, RefreshCw, BadgeCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Real store analytics.
 *
 * This screen used to render four hard-coded zeros dressed up with a green
 * "▲ Live" badge, which claimed activity no query had produced
 * (docs/05-IMPROVEMENT-PLAN.md R-05). It now reads the tables that the storefront
 * actually writes: every "Order on WhatsApp" tap creates an `inquiries` row and
 * rolls into `store_daily_stats` / `product_daily_stats` via the
 * `rollup_inquiry_into_daily_stats` trigger (migration `20261001170000`).
 *
 * Deliberate omissions, because the data does not exist yet and inventing it is
 * exactly the bug this rewrite removes:
 *   - **Store views** — nothing records a page view. The `views` column is part
 *     of the schema but has no writer, so it is not displayed.
 *   - Trends and deltas — these need a previous period to compare against. A
 *     metric with no baseline shows the metric alone rather than a fake arrow.
 */

const RANGE_DAYS = 30;
const CHART_DAYS = 12;

type InquiryRow = {
  id: string;
  product_id: number;
  product_name: string;
  status: string;
  final_amount_minor: number | null;
  created_at: string;
};

type StatRow = {
  day: string;
  source: string;
  product_taps: number;
};

type TapRow = { product_id: number; taps: number };

type ProductRow = {
  productId: number;
  name: string;
  taps: number;
  inquiries: number;
};

/** Local YYYY-MM-DD, so buckets line up with how the trigger stores `day`. */
function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function AnalyticsView() {
  const { state } = useSwiftLink();
  const storeId = state.id;
  const currency = state.currency || "NGN";

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [statRows, setStatRows] = useState<StatRow[]>([]);
  const [tapRows, setTapRows] = useState<TapRow[]>([]);

  const load = useCallback(async () => {
    // Demo/offline mode has no Supabase project; touching the client throws by
    // design, so bail out to an honest empty state instead.
    if (!storeId || !isSupabaseConfigured()) {
      setInquiries([]);
      setStatRows([]);
      setTapRows([]);
      setNotice(
        !storeId
          ? "No store selected yet."
          : "Connect Supabase to see live analytics.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotice(null);

    const since = new Date(Date.now() - RANGE_DAYS * 86_400_000).toISOString();
    const sinceDay = toDayKey(new Date(Date.now() - RANGE_DAYS * 86_400_000));

    const [inquiryRes, statRes, tapRes] = await Promise.all([
      supabase
        .from("inquiries")
        .select("id, product_id, product_name, status, final_amount_minor, created_at")
        .eq("store_id", storeId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("store_daily_stats")
        .select("day, source, product_taps")
        .eq("store_id", storeId)
        .gte("day", sinceDay),
      supabase
        .from("product_daily_stats")
        .select("product_id, taps")
        .eq("store_id", storeId)
        .gte("day", sinceDay),
    ]);

    if (inquiryRes.error || statRes.error || tapRes.error) {
      const message =
        inquiryRes.error?.message || statRes.error?.message || tapRes.error?.message || "Unknown error";
      console.warn("[analytics] load failed:", message);
      setNotice(`Could not load analytics: ${message}`);
    }

    setInquiries((inquiryRes.data as InquiryRow[] | null) ?? []);
    setStatRows((statRes.data as StatRow[] | null) ?? []);
    setTapRows((tapRes.data as TapRow[] | null) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const sold = inquiries.filter((row) => row.status === "sold");
    const revenueMinor = sold.reduce(
      (sum, row) => sum + (row.final_amount_minor ?? 0),
      0,
    );
    const productTaps = statRows.reduce((sum, row) => sum + (row.product_taps ?? 0), 0);

    // Inquiries per day across the chart window, zero-filled so gaps read as
    // "no orders that day" rather than as missing data.
    const perDay = new Map<string, number>();
    const today = new Date();
    for (let i = CHART_DAYS - 1; i >= 0; i -= 1) {
      const day = new Date(today.getTime() - i * 86_400_000);
      perDay.set(toDayKey(day), 0);
    }
    for (const row of inquiries) {
      const key = toDayKey(new Date(row.created_at));
      if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }

    // Taps come from `product_daily_stats` (owned by the rollup trigger); the
    // product name is resolved from the live catalogue first so the row follows a
    // rename, falling back to the name captured on the inquiry.
    const tapsByProduct = new Map<number, number>();
    for (const row of tapRows) {
      tapsByProduct.set(row.product_id, (tapsByProduct.get(row.product_id) ?? 0) + (row.taps ?? 0));
    }

    const inquiriesByProduct = new Map<number, number>();
    const nameByProduct = new Map<number, string>();
    for (const row of inquiries) {
      inquiriesByProduct.set(row.product_id, (inquiriesByProduct.get(row.product_id) ?? 0) + 1);
      if (row.product_name) nameByProduct.set(row.product_id, row.product_name);
    }

    // A product can appear in either source, so union the keys rather than
    // trusting one table to be the authoritative list.
    const productIds = new Set([...tapsByProduct.keys(), ...inquiriesByProduct.keys()]);
    const topProducts: ProductRow[] = [...productIds]
      .map((productId) => ({
        productId,
        name: nameByProduct.get(productId) || `Product #${productId}`,
        taps: tapsByProduct.get(productId) ?? 0,
        inquiries: inquiriesByProduct.get(productId) ?? 0,
      }))
      .sort((a, b) => b.taps - a.taps || b.inquiries - a.inquiries)
      .slice(0, 5);

    const conversion = inquiries.length > 0 ? (sold.length / inquiries.length) * 100 : 0;

    const bySource = statRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.source] = (acc[row.source] ?? 0) + (row.product_taps ?? 0);
      return acc;
    }, {});

    return {
      inquiryCount: inquiries.length,
      soldCount: sold.length,
      revenueMinor,
      productTaps,
      perDay: [...perDay.entries()],
      topProducts,
      conversion,
      bySource,
      hasData: inquiries.length > 0,
    };
  }, [inquiries, statRows, tapRows]);

  const tiles = [
    {
      label: "WhatsApp Inquiries",
      value: metrics.inquiryCount.toLocaleString(),
      hint: `Last ${RANGE_DAYS} days`,
      icon: MessageSquare,
      color: "text-[#19C37D]",
    },
    {
      label: "Product Taps",
      value: metrics.productTaps.toLocaleString(),
      hint: "Order-intent taps",
      icon: MousePointer2,
      color: "text-[#E8B93A]",
    },
    {
      label: "Confirmed Sales",
      value: metrics.soldCount.toLocaleString(),
      hint: formatMoney(metrics.revenueMinor, currency),
      icon: BadgeCheck,
      color: "text-[#19C37D]",
    },
    {
      label: "Conversion Rate",
      value: `${metrics.conversion.toFixed(1)}%`,
      hint: "Inquiries to sales",
      icon: Activity,
      color: "text-[#60A5FA]",
    },
  ];

  const peak = Math.max(1, ...metrics.perDay.map(([, count]) => count));

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      {/* Page Header */}
      <div className="border-b border-[#1E2D27] pb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">Analytics &amp; Performance</h1>
          <p className="text-xs text-[#9DB3A8] mt-1">
            Buyer activity from your storefront, last {RANGE_DAYS} days.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span>{loading ? "Loading" : "Refresh"}</span>
        </button>
      </div>

      {notice && (
        <div role="status" className="rounded-[14px] border border-[#E8B93A]/30 bg-[#E8B93A]/10 px-4 py-3 text-xs text-[#E8F1EC]">
          {notice}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111C18] p-4 sm:p-5 rounded-[18px] border border-[#1E2D27] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-[10px] border border-[#24382F] flex items-center justify-center bg-[#14231D]", tile.color)}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#9DB3A8] mb-1">{tile.label}</p>
                <h3 className="text-2xl font-bold text-[#E8F1EC] tracking-tight">{tile.value}</h3>
                <p className="mt-1 text-[10px] text-[#9DB3A8]">{tile.hint}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inquiries per day — real buckets, zero-filled */}
        <div className="lg:col-span-2 bg-[#111C18] p-5 sm:p-6 rounded-[18px] border border-[#1E2D27] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-[#E8F1EC]">Inquiry Activity</h3>
              <p className="text-xs text-[#9DB3A8] mt-0.5">Inquiries recorded per day</p>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] flex items-end gap-1.5 px-1">
            {metrics.hasData ? (
              metrics.perDay.map(([day, count]) => {
                const height = (count / peak) * 100;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="w-full relative" title={`${day}: ${count}`}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, count > 0 ? 6 : 2)}%` }}
                        transition={{ duration: 0.4 }}
                        className={cn("w-full rounded-t-[6px]", count > 0 ? "bg-[#19C37D]" : "bg-[#14231D]")}
                        style={{ minHeight: 4 }}
                      />
                    </div>
                    <span className="text-[9px] text-[#9DB3A8] tabular-nums">{day.slice(-2)}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#9DB3A8] gap-2 py-12">
                <BarChart3 size={36} className="opacity-30" />
                <p className="text-xs">No inquiries recorded in this period</p>
                <p className="text-[10px] max-w-xs text-center">
                  Every tap on &ldquo;Order on WhatsApp&rdquo; appears here automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Channel breakdown — derived from the source column the RPC records */}
        <div className="space-y-6">
          <div className="bg-[#111C18] p-5 sm:p-6 rounded-[18px] border border-[#1E2D27] flex flex-col h-full">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9DB3A8] mb-5">
              Where Buyers Came From
            </h3>
            {Object.keys(metrics.bySource).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(metrics.bySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => {
                    const share = metrics.productTaps > 0 ? (count / metrics.productTaps) * 100 : 0;
                    return (
                      <div key={source} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-[#E8F1EC]">
                          <span className="capitalize">{source}</span>
                          <span className="text-[#9DB3A8] tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 bg-[#0A1210] rounded-full overflow-hidden">
                          <div className="h-full bg-[#19C37D] rounded-full" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-[#9DB3A8]">No channel data yet.</p>
            )}

            <div className="mt-auto pt-6 border-t border-[#1E2D27]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-[#19C37D]" size={16} />
                <span className="text-xs font-semibold text-[#E8F1EC]">Store Pulse</span>
              </div>
              <p className="text-xs text-[#9DB3A8] leading-relaxed">
                {metrics.hasData
                  ? `${metrics.inquiryCount} inquiries and ${metrics.soldCount} confirmed sales in the last ${RANGE_DAYS} days.`
                  : "Share your storefront link on WhatsApp and Instagram to start receiving orders."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-[#111C18] p-5 sm:p-6 rounded-[18px] border border-[#1E2D27] shadow-sm overflow-hidden">
        <h3 className="text-base font-semibold text-[#E8F1EC] mb-4">Product Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1E2D27]">
                <th className="pb-3 text-xs font-medium text-[#9DB3A8]">Product</th>
                <th className="pb-3 text-xs font-medium text-[#9DB3A8]">Inquiries</th>
                <th className="pb-3 text-xs font-medium text-[#9DB3A8]">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D27]">
              {metrics.topProducts.length > 0 ? (
                metrics.topProducts.map((row) => {
                  const product = state.products.find((p) => p.id === row.productId);
                  return (
                    <tr key={row.productId} className="text-xs">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#14231D] rounded-[8px] overflow-hidden border border-[#1E2D27] shrink-0 flex items-center justify-center">
                            {product?.image ? (
                              <img src={product.image} className="w-full h-full object-cover" alt={row.name} />
                            ) : (
                              <Package className="h-4 w-4 text-[#9DB3A8]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#E8F1EC] truncate">{product?.name || row.name}</p>
                            <p className="text-[11px] text-[#9DB3A8]">{product?.category || "General"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[#E8F1EC] tabular-nums">
                        {row.inquiries}
                        <span className="text-[#9DB3A8]"> · {row.taps} taps</span>
                      </td>
                      <td className="py-3 font-medium text-[#E8F1EC] tabular-nums">
                        {product ? formatMoney(Math.round(Number(product.price) * 100), currency) : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-[#9DB3A8]">
                    No buyer activity recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
