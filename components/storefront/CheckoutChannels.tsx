"use client";

/**
 * The checkout block: a discount field, the money, and one button per channel.
 *
 * Shared by all three places a buyer can check out — the cart drawer, the full
 * cart page and the storefront's own bag screen — so a buyer on Instagram is
 * offered the same choice wherever they are, and a discount behaves identically
 * in each. The *logic* lives in the context (`placeOrder`, `cartTotals`,
 * `applyDiscountCode`); this file is markup plus the two visual tones the app
 * needs: `console` (the light/neutral admin chrome) and `storefront` (the
 * template's own tokens, via the `sf-*` classes).
 */

import { useId, useState } from "react";
import { Camera, Check, MessageCircle, Music2, ThumbsUp, TicketPercent, X } from "lucide-react";
import type { CheckoutChannel, CheckoutChannelId } from "@/lib/checkout-channels";
import type { CartTotals } from "@/lib/discounts";
import { cn, isDarkColor } from "@/lib/utils";

const CHANNEL_ICONS: Record<CheckoutChannelId, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook: ThumbsUp,
  tiktok: Music2,
};

/** Minor units → `₦1,500` (or `₦1,500.50` when the amount is not whole). */
export function formatMinor(amountMinor: number, currency: string): string {
  const major = (Math.round(amountMinor || 0) || 0) / 100;
  return `${currency}${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

type Tone = "console" | "storefront";

const TONES: Record<
  Tone,
  {
    label: string;
    field: string;
    input: string;
    chip: string;
    hint: string;
    error: string;
    outline: string;
    divider: string;
    muted: string;
  }
> = {
  console: {
    label: "text-[10px] font-black uppercase tracking-widest text-slate-400",
    field: "border-slate-200 bg-white",
    input: "bg-transparent text-slate-900 placeholder:text-slate-300",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    hint: "text-[10px] font-bold uppercase tracking-widest text-slate-400",
    error: "text-[11px] font-bold text-red-500",
    outline:
      "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/5",
    divider: "border-slate-200/70 dark:border-white/10",
    muted: "text-slate-400",
  },
  storefront: {
    label: "text-[10px] font-black uppercase tracking-widest sf-muted",
    field: "border-black/10 sf-surface-alt",
    input: "bg-transparent sf-ink placeholder:opacity-40",
    chip: "border-black/10 sf-surface-alt sf-accent-text",
    hint: "text-[10px] font-black uppercase tracking-widest sf-muted",
    error: "text-[11px] font-bold text-red-500",
    outline: "border border-black/10 sf-surface sf-ink hover:opacity-80",
    divider: "border-black/[0.08]",
    muted: "sf-muted",
  },
};

export function CheckoutChannels({
  channels,
  totals,
  currency,
  acceptingOrders,
  accent,
  tone = "console",
  onSelect,
  onApplyCode,
  onClearCode,
}: {
  channels: CheckoutChannel[];
  totals: CartTotals;
  currency: string;
  acceptingOrders: boolean;
  /** Brand colour for the primary button and the applied-code chip. */
  accent: string;
  tone?: Tone;
  onSelect: (channelId: CheckoutChannelId) => void;
  onApplyCode: (raw: string) => { ok: boolean; error?: string };
  onClearCode: () => void;
}) {
  const styles = TONES[tone];
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  // This block is mounted more than once per page (the cart drawer is in the
  // global chrome and stays in the DOM while closed), so the field id has to be
  // unique or the label points at whichever input the browser finds first.
  const codeFieldId = useId();

  const submitCode = () => {
    const result = onApplyCode(typed);
    setError(result.ok ? null : result.error ?? "That code did not work.");
    if (result.ok) setTyped("");
  };

  const primary = acceptingOrders
    ? { backgroundColor: accent, color: isDarkColor(accent) ? "#ffffff" : "#04140D" }
    : undefined;

  return (
    <div className="space-y-4 text-left">
      {/* Discount */}
      {totals.appliedCode ? (
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide",
              styles.chip,
            )}
          >
            <TicketPercent size={13} />
            {totals.appliedCode}
            <Check size={13} />
          </span>
          <span className="flex items-center gap-3">
            <span className="text-xs font-black text-emerald-500">
              −{formatMinor(totals.discountMinor, currency)}
            </span>
            <button
              type="button"
              onClick={() => {
                onClearCode();
                setError(null);
              }}
              aria-label={`Remove discount ${totals.appliedCode}`}
              className={cn("h-7 w-7 rounded-full flex items-center justify-center", styles.muted)}
            >
              <X size={14} />
            </button>
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className={styles.label} htmlFor={codeFieldId}>
            Discount code
          </label>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5",
                styles.field,
              )}
            >
              <TicketPercent size={15} className={styles.muted} />
              <input
                id={codeFieldId}
                type="text"
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitCode();
                  }
                }}
                placeholder="Enter code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className={cn("w-full text-sm font-bold uppercase outline-none", styles.input)}
              />
            </div>
            <button
              type="button"
              onClick={submitCode}
              disabled={!typed.trim()}
              className={cn(
                "min-h-[42px] rounded-2xl px-4 text-xs font-black uppercase tracking-widest disabled:opacity-40",
                styles.outline,
              )}
            >
              Apply
            </button>
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Money */}
      <div className={cn("space-y-1.5 border-t pt-3", styles.divider)}>
        {totals.discountMinor > 0 && (
          <>
            <div className="flex justify-between text-[11px] font-bold">
              <span className={styles.muted}>Subtotal</span>
              <span className={styles.muted}>{formatMinor(totals.subtotalMinor, currency)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-emerald-500">Discount</span>
              <span className="text-emerald-500">
                −{formatMinor(totals.discountMinor, currency)}
              </span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <span className={styles.label}>Total</span>
          <span className="text-2xl font-black tabular-nums">
            {formatMinor(totals.totalMinor, currency)}
          </span>
        </div>
      </div>

      {/* Channels */}
      <div className="flex flex-col gap-2.5">
        {channels.length === 0 ? (
          <p className={styles.hint}>
            This store has not added a contact channel yet — check back soon.
          </p>
        ) : (
          channels.map((channel, index) => {
            const Icon = CHANNEL_ICONS[channel.id] ?? MessageCircle;
            const isPrimary = index === 0;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelect(channel.id)}
                disabled={!acceptingOrders}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  isPrimary ? "text-white hover:brightness-105" : styles.outline,
                )}
                style={isPrimary ? primary : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <span>
                  {acceptingOrders ? `Order on ${channel.label}` : "Orders paused"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
