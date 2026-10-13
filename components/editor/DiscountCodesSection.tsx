"use client";

/**
 * Discount codes, as the merchant manages them.
 *
 * Lives in its own file rather than inside the 3,000-line editor so the rules it
 * enforces are readable in one place. It does not own the codes: the editor keeps
 * them in `state_json` (`state.discountCodes`) and passes them down, because a
 * code is part of the store, published with it, and read back by the storefront
 * cart. Nothing here is stored server-side on its own.
 *
 * Redemption counts are read from `inquiries`, not counted locally: an order is
 * recorded once per product line with the code attached, so counting *distinct
 * `order_ref`s* is what answers "how many orders used this?" — a client-side
 * counter would count taps, and would not survive a cleared browser.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, TicketPercent, Trash2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";
import {
  describeDiscount,
  newDiscountCodeId,
  normalizeDiscountCode,
  validateDiscountCodeInput,
  type DiscountCode,
  type DiscountKind,
} from "@/lib/discounts";
import { toMinorUnits } from "@/lib/inquiry-write";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]";

interface DraftDiscount {
  id: string | null;
  code: string;
  kind: DiscountKind;
  /** Percent as typed, or the major-unit amount as typed. */
  value: string;
  minOrder: string;
  expiresAt: string;
}

const EMPTY_DRAFT: DraftDiscount = {
  id: null,
  code: "",
  kind: "percent",
  value: "",
  minOrder: "",
  expiresAt: "",
};

export function DiscountCodesSection({
  codes,
  currency,
  storeId,
  onChange,
}: {
  codes: DiscountCode[];
  currency: string;
  storeId: string | null;
  onChange: (next: DiscountCode[]) => void;
}) {
  const [draft, setDraft] = useState<DraftDiscount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, number> | null>(null);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  const loadRedemptions = useCallback(async () => {
    if (!storeId || !isSupabaseConfigured()) {
      setRedemptions({});
      return;
    }
    setLoadingRedemptions(true);
    const { data, error: queryError } = await supabase
      .from("inquiries")
      .select("order_ref, discount_code")
      .eq("store_id", storeId)
      .not("discount_code", "is", null)
      .limit(2000);

    if (queryError) {
      setRedemptions(null);
      setLoadingRedemptions(false);
      return;
    }

    const byOrder = new Map<string, string>();
    for (const row of (data ?? []) as { order_ref: string | null; discount_code: string | null }[]) {
      const code = normalizeDiscountCode(row.discount_code);
      if (!code) continue;
      // Rows written before `order_ref` existed have none: each is its own order.
      const key = row.order_ref || `legacy:${code}:${byOrder.size}`;
      byOrder.set(key, code);
    }

    const counts: Record<string, number> = {};
    byOrder.forEach((code) => {
      counts[code] = (counts[code] ?? 0) + 1;
    });
    setRedemptions(counts);
    setLoadingRedemptions(false);
  }, [storeId]);

  useEffect(() => {
    void loadRedemptions();
  }, [loadRedemptions]);

  const activeCount = useMemo(() => codes.filter((entry) => entry.active !== false).length, [codes]);

  const openNew = () => {
    setError(null);
    setDraft({ ...EMPTY_DRAFT });
  };

  const openEdit = (entry: DiscountCode) => {
    setError(null);
    setDraft({
      id: entry.id,
      code: entry.code,
      kind: entry.kind,
      value:
        entry.kind === "percent" ? String(entry.value) : String(entry.value / 100),
      minOrder: entry.minSubtotalMinor ? String(entry.minSubtotalMinor / 100) : "",
      expiresAt: entry.expiresAt ? entry.expiresAt.slice(0, 10) : "",
    });
  };

  const saveDraft = () => {
    if (!draft) return;

    const normalized = normalizeDiscountCode(draft.code);
    const rawValue = Number(draft.value);
    const value =
      draft.kind === "percent"
        ? Math.round(rawValue)
        : toMinorUnits(Number.isFinite(rawValue) ? rawValue : 0);
    const minSubtotalMinor = draft.minOrder.trim() ? toMinorUnits(Number(draft.minOrder)) : null;

    const check = validateDiscountCodeInput(
      { code: normalized, kind: draft.kind, value, minSubtotalMinor, expiresAt: draft.expiresAt || null },
      codes,
      draft.id ?? undefined,
    );
    if (!check.isValid) {
      setError(check.error ?? "That code is not valid.");
      return;
    }

    const existing = draft.id ? codes.find((entry) => entry.id === draft.id) : null;
    const saved: DiscountCode = {
      id: existing?.id ?? newDiscountCodeId(),
      code: normalized,
      kind: draft.kind,
      value,
      minSubtotalMinor,
      expiresAt: draft.expiresAt || null,
      active: existing?.active ?? true,
      maxRedemptions: existing?.maxRedemptions ?? null,
      note: existing?.note,
    };

    onChange(
      existing
        ? codes.map((entry) => (entry.id === existing.id ? saved : entry))
        : [saved, ...codes],
    );
    setDraft(null);
    setError(null);
  };

  const toggleActive = (entry: DiscountCode) => {
    onChange(
      codes.map((item) => (item.id === entry.id ? { ...item, active: item.active === false } : item)),
    );
  };

  const remove = (entry: DiscountCode) => {
    onChange(codes.filter((item) => item.id !== entry.id));
    if (draft?.id === entry.id) setDraft(null);
  };

  return (
    <section
      aria-labelledby="discount-codes-heading"
      className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-5 sm:p-7 shadow-xs"
    >
      <div className="flex flex-col gap-3 border-b border-[#1E2D27] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="discount-codes-heading" className="text-base font-semibold text-[#E8F1EC]">
            Discount codes
          </h2>
          <p className="mt-1 text-xs text-[#9DB3A8]">
            Give repeat customers a reason to come back. Buyers apply the code in their bag, it rides
            along in the order message, and every order that uses it is counted here.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void loadRedemptions()}
            disabled={loadingRedemptions}
            className="flex min-h-[38px] items-center gap-2 rounded-xl border border-[#24382F] bg-[#14231D] px-3 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loadingRedemptions && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={openNew}
            className="flex min-h-[38px] items-center gap-2 rounded-xl bg-[#19C37D] px-4 text-xs font-bold text-[#04140D] transition hover:bg-[#16B070]"
          >
            <Plus className="h-3.5 w-3.5" />
            New code
          </button>
        </div>
      </div>

      {codes.length > 0 && (
        <p className="mt-3 text-[11px] text-[#9DB3A8]">
          {codes.length} code{codes.length === 1 ? "" : "s"} ·{" "}
          {activeCount} live · {codes.length - activeCount} switched off
        </p>
      )}

      {draft && (
        <div className="mt-5 rounded-2xl border border-[#24382F] bg-[#0A1210] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#E8F1EC]" htmlFor="discount-code-input">
                Code
              </label>
              <input
                id="discount-code-input"
                type="text"
                value={draft.code}
                onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                placeholder="WELCOME10"
                className={cn(inputClass, "font-mono uppercase tracking-wide")}
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-[#E8F1EC]">Type</span>
              <div className="mt-1.5 flex gap-2">
                {(["percent", "amount"] as DiscountKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setDraft({ ...draft, kind })}
                    className={cn(
                      "min-h-[42px] flex-1 rounded-xl border px-3 text-xs font-semibold transition",
                      draft.kind === kind
                        ? "border-[#19C37D] bg-[#14231D] text-[#19C37D]"
                        : "border-[#5C7C6D] bg-[#0A1210] text-[#9DB3A8] hover:text-[#E8F1EC]",
                    )}
                  >
                    {kind === "percent" ? "Percent off" : `${currency} amount off`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#E8F1EC]" htmlFor="discount-value-input">
                {draft.kind === "percent" ? "Percent off (1–90)" : `Amount off (${currency})`}
              </label>
              <input
                id="discount-value-input"
                type="number"
                min="1"
                step={draft.kind === "percent" ? "1" : "any"}
                inputMode="decimal"
                value={draft.value}
                onChange={(event) => setDraft({ ...draft, value: event.target.value })}
                placeholder={draft.kind === "percent" ? "10" : "500"}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#E8F1EC]" htmlFor="discount-min-input">
                Minimum order ({currency}, optional)
              </label>
              <input
                id="discount-min-input"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={draft.minOrder}
                onChange={(event) => setDraft({ ...draft, minOrder: event.target.value })}
                placeholder="No minimum"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#E8F1EC]" htmlFor="discount-expiry-input">
                Expires (optional)
              </label>
              <input
                id="discount-expiry-input"
                type="date"
                value={draft.expiresAt}
                onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-[#9DB3A8]">
                The code works until the end of that day.
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-[11px] font-medium text-rose-400">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
              className="min-h-[40px] rounded-xl border border-[#24382F] bg-[#14231D] px-4 text-xs font-semibold text-[#9DB3A8] hover:text-[#E8F1EC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="min-h-[40px] rounded-xl bg-[#19C37D] px-4 text-xs font-bold text-[#04140D] hover:bg-[#16B070]"
            >
              {draft.id ? "Save changes" : "Create code"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {codes.length === 0 && !draft && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#24382F] px-6 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#24382F] bg-[#14231D] text-[#19C37D]">
              <TicketPercent className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#E8F1EC]">No discount codes yet</p>
            <p className="mt-1 max-w-sm text-xs text-[#9DB3A8]">
              A code like WELCOME10 is the simplest way to turn a one-off buyer into a repeat one.
            </p>
          </div>
        )}

        {codes.map((entry) => {
          const used = redemptions?.[normalizeDiscountCode(entry.code)];
          return (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2D27] bg-[#0A1210] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold tracking-wide text-[#E8F1EC]">
                    {entry.code}
                  </span>
                  <span className="rounded-full border border-[#24382F] bg-[#14231D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#9DB3A8]">
                    {describeDiscount(entry, currency)}
                  </span>
                  {entry.active === false && (
                    <span className="rounded-full border border-[#E8B93A]/40 bg-[#E8B93A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8B93A]">
                      Off
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#9DB3A8]">
                  {entry.minSubtotalMinor
                    ? `Min order ${currency}${(entry.minSubtotalMinor / 100).toLocaleString()}`
                    : "No minimum order"}
                  {entry.expiresAt ? ` · expires ${entry.expiresAt.slice(0, 10)}` : ""}
                  {redemptions === null
                    ? ""
                    : ` · ${used ?? 0} order${used === 1 ? "" : "s"} used it`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(entry)}
                  className={cn(
                    "min-h-[36px] rounded-xl border px-3 text-[11px] font-semibold transition",
                    entry.active === false
                      ? "border-[#24382F] bg-[#14231D] text-[#9DB3A8] hover:text-[#E8F1EC]"
                      : "border-[#19C37D]/40 bg-[#19C37D]/15 text-[#19C37D] hover:bg-[#19C37D]/25",
                  )}
                >
                  {entry.active === false ? "Switch on" : "Live"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  aria-label={`Edit ${entry.code}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#24382F] bg-[#14231D] text-[#9DB3A8] hover:text-[#E8F1EC]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  aria-label={`Delete ${entry.code}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#24382F] bg-[#14231D] text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {loadingRedemptions && codes.length > 0 && (
          <p className="flex items-center gap-2 text-[11px] text-[#9DB3A8]">
            <Loader2 className="h-3 w-3 animate-spin" /> Counting redemptions…
          </p>
        )}
      </div>
    </section>
  );
}
