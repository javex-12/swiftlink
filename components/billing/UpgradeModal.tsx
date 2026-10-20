"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import {
  PLAN_DETAILS,
  PLAN_PRICE_NGN,
  PLAN_PRICE_YEARLY_NGN,
  type BillingInterval,
  type Plan,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

type PaidPlan = Exclude<Plan, "free">;

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: PaidPlan;
}

export function UpgradeModal({
  isOpen,
  onClose,
  initialPlan = "pro",
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan>(initialPlan);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialPlan when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(initialPlan);
      setError(null);
    }
  }, [isOpen, initialPlan]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startCheckout = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, interval }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        authorizationUrl?: string;
        authorization_url?: string;
        error?: string;
      };
      const redirectUrl = payload.authorizationUrl || payload.authorization_url;
      if (response.ok && redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      setError(payload.error || "Could not start checkout. Please try again.");
    } catch {
      setError("Could not connect to payment gateway. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const proPriceMonthly = PLAN_PRICE_NGN.pro.toLocaleString();
  const proPriceYearly = PLAN_PRICE_YEARLY_NGN.pro.toLocaleString();
  const bizPriceMonthly = PLAN_PRICE_NGN.business.toLocaleString();
  const bizPriceYearly = PLAN_PRICE_YEARLY_NGN.business.toLocaleString();

  const selectedPrice =
    interval === "yearly"
      ? `₦${(selectedPlan === "pro" ? PLAN_PRICE_YEARLY_NGN.pro : PLAN_PRICE_YEARLY_NGN.business).toLocaleString()}/year`
      : `₦${(selectedPlan === "pro" ? PLAN_PRICE_NGN.pro : PLAN_PRICE_NGN.business).toLocaleString()}/month`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl rounded-[22px] border border-[#1E2D27] bg-[#0E1714] p-5 sm:p-7 text-[#E8F1EC] shadow-2xl transition-all my-auto max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-[#1E2D27] bg-[#14231D] text-[#9DB3A8] transition hover:bg-[#1A2D25] hover:text-[#E8F1EC]"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/15 text-[#19C37D] border border-[#19C37D]/30">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 id="upgrade-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
              Upgrade Your Store
            </h2>
            <p className="text-xs text-[#9DB3A8] mt-0.5">
              Unlock higher limits, advanced tools, and scale your commerce.
            </p>
          </div>
        </div>

        {/* Interval Selector Toggle */}
        <div className="mt-5 flex justify-center">
          <div className="inline-flex rounded-[14px] border border-[#24382F] bg-[#111C18] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "rounded-[10px] px-4 py-1.5 text-xs font-bold transition",
                interval === "monthly"
                  ? "bg-[#19C37D] text-[#04140D] shadow"
                  : "text-[#9DB3A8] hover:text-[#E8F1EC]",
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "flex items-center gap-2 rounded-[10px] px-4 py-1.5 text-xs font-bold transition",
                interval === "yearly"
                  ? "bg-[#19C37D] text-[#04140D] shadow"
                  : "text-[#9DB3A8] hover:text-[#E8F1EC]",
              )}
            >
              <span>Yearly</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide",
                  interval === "yearly"
                    ? "bg-[#04140D]/20 text-[#04140D]"
                    : "bg-[#19C37D]/20 text-[#19C37D]",
                )}
              >
                Pay for 10 mos, get 12
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pro Plan Card */}
          <div
            onClick={() => setSelectedPlan("pro")}
            className={cn(
              "relative cursor-pointer rounded-[16px] border p-4 sm:p-5 transition-all text-left",
              selectedPlan === "pro"
                ? "border-[#19C37D] bg-[#19C37D]/10 ring-1 ring-[#19C37D]/50 shadow-lg shadow-[#19C37D]/5"
                : "border-[#1E2D27] bg-[#111C18]/80 hover:border-[#2A3F36]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-[#E8F1EC]">
                {PLAN_DETAILS.pro.name}
              </span>
              <span className="rounded-full bg-[#E8B93A]/20 border border-[#E8B93A]/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#E8B93A]">
                MOST POPULAR
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-2xl font-black text-[#E8F1EC]">
                ₦{interval === "yearly" ? proPriceYearly : proPriceMonthly}
              </span>
              <span className="text-xs text-[#9DB3A8] ml-1">
                /{interval === "yearly" ? "yr" : "mo"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#9DB3A8]">
              {interval === "yearly" ? "Save ₦10,000 yearly (pay for 10 mos)" : "Billed monthly, cancel anytime"}
            </p>

            <div className="mt-4 border-t border-[#1E2D27] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#19C37D] mb-2">
                Everything in Free, plus:
              </p>
              <ul className="space-y-2 text-xs text-[#9DB3A8]">
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Up to <strong className="text-[#E8F1EC]">500 products</strong> (account-wide)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Run up to <strong className="text-[#E8F1EC]">3 active stores</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>All storefront templates unlocked</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Discount codes & customer promotions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Detailed analytics & CSV data export</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Business Plan Card */}
          <div
            onClick={() => setSelectedPlan("business")}
            className={cn(
              "relative cursor-pointer rounded-[16px] border p-4 sm:p-5 transition-all text-left",
              selectedPlan === "business"
                ? "border-[#19C37D] bg-[#19C37D]/10 ring-1 ring-[#19C37D]/50 shadow-lg shadow-[#19C37D]/5"
                : "border-[#1E2D27] bg-[#111C18]/80 hover:border-[#2A3F36]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wide text-[#E8F1EC]">
                {PLAN_DETAILS.business.name}
              </span>
              <span className="rounded-full bg-[#19C37D]/20 border border-[#19C37D]/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#19C37D]">
                VIP SCALE
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-2xl font-black text-[#E8F1EC]">
                ₦{interval === "yearly" ? bizPriceYearly : bizPriceMonthly}
              </span>
              <span className="text-xs text-[#9DB3A8] ml-1">
                /{interval === "yearly" ? "yr" : "mo"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#9DB3A8]">
              {interval === "yearly" ? "Save ₦24,000 yearly (pay for 10 mos)" : "Billed monthly, cancel anytime"}
            </p>

            <div className="mt-4 border-t border-[#1E2D27] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#19C37D] mb-2">
                Everything in Pro, plus:
              </p>
              <ul className="space-y-2 text-xs text-[#9DB3A8]">
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Up to <strong className="text-[#E8F1EC]">1,000 products</strong> (account-wide)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Run up to <strong className="text-[#E8F1EC]">10 active stores</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Connect your custom domain</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>No SwiftLink branding + Custom preloader</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#19C37D]" />
                  <span>Priority VIP WhatsApp support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-[#FF8A8A]/30 bg-[#FF8A8A]/10 p-3 text-xs text-[#FF8A8A]">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer & Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1E2D27] pt-4">
          <p className="text-[11px] text-[#9DB3A8] text-center sm:text-left flex items-center gap-1.5">
            <CreditCard size={13} className="text-[#19C37D]" />
            Secure payment processed by Paystack. Instant activation.
          </p>

          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={busy}
            className="w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] bg-[#19C37D] px-6 text-sm font-bold text-[#04140D] transition hover:bg-[#16B070] disabled:opacity-60 shadow-lg shadow-[#19C37D]/20 active:scale-[0.98]"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Redirecting to Checkout…</span>
              </>
            ) : (
              <>
                <Zap size={16} className="fill-current" />
                <span>Upgrade to {PLAN_DETAILS[selectedPlan].name} ({selectedPrice})</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
