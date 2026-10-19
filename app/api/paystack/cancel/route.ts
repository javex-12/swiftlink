import { NextRequest, NextResponse } from "next/server";
import {
  currentSessionUser,
  markCancelAtPeriodEnd,
  readSubscription,
} from "@/lib/billing-server";
import { disableSubscription } from "@/lib/paystack";

/**
 * Cancel at the end of the paid period.
 *
 * Paystack is told first, and only if it accepts is the intent recorded — a
 * cancelled status in the database that the provider never received would take
 * the merchant's features away and keep charging them, which is the worst of
 * both outcomes.
 *
 * The plan itself is not touched here: paid time is paid for. `subscription.disable`
 * (when the period actually ends) is what downgrades the account.
 */
export async function POST(_request: NextRequest) {
  const user = await currentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const subscription = await readSubscription(user.id);
  if (!subscription || subscription.status === "cancelled" || subscription.status === "complete") {
    return NextResponse.json({ error: "There is no active subscription to cancel." }, { status: 400 });
  }
  if (subscription.cancel_at_period_end) {
    return NextResponse.json({ ok: true, alreadyScheduled: true });
  }

  if (!subscription.provider_subscription_code || !subscription.provider_email_token) {
    // Nothing to tell Paystack: it has no subscription linked to this account
    // (possible only for a plan granted by hand). Say so instead of pretending.
    return NextResponse.json(
      { error: "This plan was not started from Paystack, so it cannot be cancelled here." },
      { status: 409 },
    );
  }

  const result = await disableSubscription(
    subscription.provider_subscription_code,
    subscription.provider_email_token,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message || "Paystack could not cancel that subscription." },
      { status: 502 },
    );
  }

  const recorded = await markCancelAtPeriodEnd(user.id);
  if (!recorded.ok) {
    return NextResponse.json({ error: recorded.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
