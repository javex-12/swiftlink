"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, CreditCard, Loader2, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import {
  PLAN_DETAILS,
  PLAN_PRICE_NGN,
  PLAN_PRICE_YEARLY_NGN,
  type BillingInterval,
  type Plan,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Subscription controls in Settings.
 *
 * The money flow is entirely server-side: this panel asks
 * `/api/paystack/initialize` for a checkout URL and leaves the browser there.
 * No amount, plan code or key is decided here, so nothing on this screen can be
 * tampered with to buy a cheaper tier.
 *
 * **Business is the highest tier and never sees an upgrade.** It has no tier to
 * move up to, so the only action it can take is to stop renewing. Offering it a
 * "compare and upgrade" link (as this panel used to) was a dead end.
 *
 * On return, the `reference` in the URL is verified server-side before anything
 * is shown as paid — a query string is not proof of payment — and the page is
 * reloaded so the console re-reads the plan from the database rather than from a
 * guess.
 */

type PaidPlan = Exclude<Plan, "free">;

type Subscription = {
  plan: PaidPlan;
  status: "active" | "past_due" | "cancelled" | "complete";
  cancel_at_period_end: boolean;
  current_period_end: string | null;
};

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 };
const PAID_PLANS: PaidPlan[] = ["pro", "business"];

export function SubscriptionPanel({ currentPlan }: { currentPlan: Plan }) {
  const { user, addToast } = useSwiftLink();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<PaidPlan | "cancel" | "verify" | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const loadSubscription = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("account_subscriptions")
      .select("plan, status, cancel_at_period_end, current_period_end")
      .eq("owner_id", user.id)
      .maybeSingle();
    setSubscription((data as Subscription | null) ?? null);
  }, [user?.id]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  // Returning from checkout: trust the server's verification, not the URL.
  useEffect(() => {
    if (searchParams.get("billing") !== "return") return;
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference) return;

    let cancelled = false;
    setBusy("verify");
    void (async () => {
      try {
        const response = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; plan?: string; error?: string };
        if (cancelled) return;
        if (response.ok && payload.ok) {
          addToast(`Payment confirmed — you are on ${PLAN_DETAILS[(payload.plan as Plan) ?? "pro"].name}.`, "success");
          // Reload so every screen reads the new plan from the database.
          window.location.replace("/account?billing=done#plans");
          return;
        }
        setError(payload.error || "That payment could not be confirmed.");
      } catch {
        if (!cancelled) setError("Could not confirm the payment. Try refreshing.");
      } finally {
        if (!cancelled) setBusy(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, addToast]);

  const startCheckout = async (plan: PaidPlan) => {
    setError(null);
    setBusy(plan);
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
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
      setError(payload.error || "Could not start checkout.");
    } catch {
      setError("Could not start checkout. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Stop renewing? You keep every feature until the end of the period you already paid for.")) {
      return;
    }
    setError(null);
    setBusy("cancel");
    try {
      const response = await fetch("/api/paystack/cancel", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && payload.ok) {
        addToast("Renewal stopped. Your plan stays active until the end of the period.", "success");
        await loadSubscription();
        return;
      }
      setError(payload.error || "Could not stop the renewal.");
    } catch {
      setError("Could not stop the renewal. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const isTopPlan = currentPlan === "business";
  const upgradeTargets = PAID_PLANS.filter((plan) => PLAN_RANK[plan] > PLAN_RANK[currentPlan]);
  const activeSubscription =
    subscription && subscription.status !== "cancelled" && subscription.status !== "complete"
      ? subscription
      : null;
  const canCancel = Boolean(activeSubscription && !activeSubscription.cancel_at_period_end);
  const renewsOn = activeSubscription?.current_period_end
    ? new Date(activeSubscription.current_period_end).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mt-5 rounded-[14px] border border-[#1E2D27] bg-[#0E1714] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#24382F] bg-[#14231D] text-[#19C37D]">
          <CreditCard size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#E8F1EC]">
            {isTopPlan
              ? "Business — the highest plan"
              : upgradeTargets.length > 0
                ? `Upgrade from ${PLAN_DETAILS[currentPlan].name}`
                : PLAN_DETAILS[currentPlan].name}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[#9DB3A8]">
            {activeSubscription?.cancel_at_period_end
              ? `Renewal stopped. ${PLAN_DETAILS[activeSubscription.plan].name} stays active until ${renewsOn ?? "the end of the period"}.`
              : renewsOn
                ? `Renews ${renewsOn}.`
                : isTopPlan
                  ? "Every feature is included. Nothing to upgrade."
                  : "Change plan any time. Your store stays live through the switch."}
          </p>

          {error && (
            <p role="alert" className="mt-2 flex items-start gap-1.5 text-[11px] text-[#FF8A8A]">
              <TriangleAlert size={12} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          {upgradeTargets.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#9DB3A8]">Billing:</span>
              <div className="inline-flex rounded-[10px] border border-[#24382F] bg-[#111C18] p-0.5">
                <button
                  type="button"
                  onClick={() => setInterval("monthly")}
                  className={cn(
                    "rounded-[8px] px-2.5 py-1 text-[10px] font-semibold transition",
                    interval === "monthly"
                      ? "bg-[#19C37D] text-[#04140D]"
                      : "text-[#9DB3A8] hover:text-[#E8F1EC]",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("yearly")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[10px] font-semibold transition",
                    interval === "yearly"
                      ? "bg-[#19C37D] text-[#04140D]"
                      : "text-[#9DB3A8] hover:text-[#E8F1EC]",
                  )}
                >
                  <span>Yearly</span>
                  <span className={cn(
                    "rounded-full px-1.5 py-0.2 text-[9px] font-extrabold",
                    interval === "yearly"
                      ? "bg-[#04140D]/20 text-[#04140D]"
                      : "bg-[#19C37D]/20 text-[#19C37D]",
                  )}>
                    Pay for 10 mos, get 12
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-3.5 flex flex-col sm:flex-row flex-wrap sm:items-center gap-2.5">
            {upgradeTargets.map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => void startCheckout(plan)}
                disabled={busy !== null}
                className={cn(
                  "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center sm:justify-start gap-2 rounded-[12px] px-4 py-2 text-xs font-bold transition disabled:opacity-60",
                  plan === "business"
                    ? "bg-[#19C37D] text-[#04140D] hover:bg-[#16B070] shadow-md shadow-[#19C37D]/10"
                    : "border border-[#24382F] bg-[#14231D] text-[#E8F1EC] hover:border-[#19C37D]",
                )}
              >
                {busy === plan ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ArrowUpRight size={13} />
                )}
                <span>Upgrade to {PLAN_DETAILS[plan].name}</span>
                {plan === "pro" && (
                  <span className="rounded-full bg-[#E8B93A]/25 border border-[#E8B93A]/40 px-1.5 py-0.5 text-[9px] font-extrabold text-[#E8B93A] whitespace-nowrap">
                    MOST POPULAR
                  </span>
                )}
                <span className="opacity-80 font-medium">
                  — ₦{interval === "yearly"
                    ? `${PLAN_PRICE_YEARLY_NGN[plan].toLocaleString()}/yr`
                    : `${PLAN_PRICE_NGN[plan].toLocaleString()}/mo`}
                </span>
              </button>
            ))}

            {canCancel && (
              <button
                type="button"
                onClick={() => void cancel()}
                disabled={busy !== null}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[12px] border border-[#24382F] px-4 text-[11px] font-semibold text-[#9DB3A8] transition hover:border-[#FF8A8A]/60 hover:text-[#FF8A8A] disabled:opacity-60"
              >
                {busy === "cancel" ? <Loader2 size={12} className="animate-spin" /> : null}
                Stop renewing
              </button>
            )}

            {busy === "verify" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#9DB3A8]">
                <Loader2 size={12} className="animate-spin" /> Confirming your payment…
              </span>
            )}

            {activeSubscription?.cancel_at_period_end && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#9DB3A8]">
                <CheckCircle2 size={12} className="text-[#19C37D]" /> Renewal stopped
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
