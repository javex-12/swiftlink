import { NextRequest, NextResponse } from "next/server";
import {
  accountExists,
  activateSubscription,
  endSubscription,
  markCancelAtPeriodEnd,
  markSubscriptionPastDue,
  ownerForCustomerCode,
  ownerForSubscriptionCode,
  serviceClient,
} from "@/lib/billing-server";
import { isPaidPlan, planForCode, verifyWebhookSignature } from "@/lib/paystack";

/**
 * Paystack webhook — the authority on billing state.
 *
 * Three rules this route follows, each because getting it wrong costs a merchant
 * money or features:
 *
 *   1. **The signature is checked against the raw body.** Re-serialising the JSON
 *      changes the bytes and therefore the HMAC, so the text is read once and
 *      parsed afterwards.
 *   2. **Every delivery is recorded before it is acted on.** Paystack retries,
 *      and `charge.success` genuinely arrives more than once; the primary key on
 *      `payment_events` makes a repeated delivery a no-op instead of a second
 *      upgrade or a duplicate period.
 *   3. **Nothing is inferred from the request.** The tier comes from the plan
 *      code (or the metadata we set when initialising), never from an amount the
 *      caller could choose.
 *
 * A failure to apply is logged and answered with a non-2xx, so Paystack retries
 * rather than the event being silently dropped.
 */

type WebhookPayload = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: { owner_id?: string; plan?: string } | null;
    customer?: { customer_code?: string; email?: string } | null;
    subscription?: { subscription_code?: string; email_token?: string; status?: string } | null;
    subscription_code?: string;
    email_token?: string;
    plan?: { plan_code?: string } | string | null;
  };
};

function planCodeFrom(data: WebhookPayload["data"]): string | null {
  const plan = data?.plan;
  if (!plan) return null;
  return typeof plan === "string" ? plan : (plan.plan_code ?? null);
}

export async function POST(request: NextRequest) {
  // Raw bytes, exactly as signed.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    /*
     * Acknowledged, never applied.
     *
     * Paystack's dashboard decides whether a webhook URL is usable by calling
     * it and accepts nothing but a 2xx — an unverified probe used to answer 401
     * here, and the dashboard reported the URL as invalid, which blocked saving
     * it at all. Every write below is still gated on the signature, and this
     * branch returns before the event is even parsed, so an unverifiable caller
     * can prove the endpoint is reachable and can change no billing state. The
     * body stays terse: it tells an unsigned caller nothing about the account.
     */
    return NextResponse.json({ ok: true, ignored: "unsigned" });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Malformed body." }, { status: 400 });
  }

  const event = payload.event ?? "unknown";
  const data = payload.data ?? {};
  const subscriptionCode = data.subscription?.subscription_code ?? data.subscription_code ?? "";
  const customerCode = data.customer?.customer_code ?? "";
  const eventKey = `${event}:${
    data.reference || subscriptionCode || data.id || customerCode || "unknown"
  }`;

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Billing writes are not configured." }, { status: 503 });
  }

  const { error: logError } = await db.from("payment_events").insert({
    id: eventKey,
    type: event,
    owner_id: data.metadata?.owner_id ?? null,
    payload,
  });

  if (logError) {
    // 23505 = already recorded: this is a retry of something already applied.
    if (logError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  const ownerId =
    data.metadata?.owner_id ||
    (subscriptionCode ? await ownerForSubscriptionCode(subscriptionCode) : null) ||
    (customerCode ? await ownerForCustomerCode(customerCode) : null);

  if (ownerId && !(await accountExists(ownerId))) {
    // Recorded above for the audit trail, but there is no account to change.
    return NextResponse.json({ ok: true, ignored: "account no longer exists" });
  }

  try {
    if (event === "charge.success") {
      if (!ownerId) {
        return NextResponse.json({ ok: true, ignored: "no account on the payment" });
      }
      const plan =
        (isPaidPlan(data.metadata?.plan) ? data.metadata.plan : null) ??
        planForCode(planCodeFrom(data));
      if (!plan) {
        return NextResponse.json({ ok: true, ignored: "payment does not name a plan" });
      }
      const applied = await activateSubscription({
        ownerId,
        plan,
        subscriptionCode: subscriptionCode || null,
        customerCode: customerCode || null,
        emailToken: data.subscription?.email_token ?? data.email_token ?? null,
        amount: typeof data.amount === "number" ? data.amount : null,
        currency: data.currency ?? null,
      });
      if (!applied.ok) throw new Error(applied.message ?? "activation failed");
    }

    if (event === "subscription.create" && ownerId) {
      const plan = planForCode(planCodeFrom(data)) ?? (isPaidPlan(data.metadata?.plan) ? data.metadata.plan : null);
      if (plan) {
        const applied = await activateSubscription({
          ownerId,
          plan,
          subscriptionCode: subscriptionCode || null,
          customerCode: customerCode || null,
          emailToken: data.subscription?.email_token ?? data.email_token ?? null,
        });
        if (!applied.ok) throw new Error(applied.message ?? "subscription create failed");
      }
    }

    if (event === "invoice.payment_failed" && ownerId) {
      const applied = await markSubscriptionPastDue(ownerId);
      if (!applied.ok) throw new Error(applied.message ?? "grace period write failed");
    }

    if (event === "subscription.not_renew" && ownerId) {
      const applied = await markCancelAtPeriodEnd(ownerId);
      if (!applied.ok) throw new Error(applied.message ?? "cancel flag write failed");
    }

    if (event === "subscription.disable" && ownerId) {
      const completed = data.status === "complete" || data.subscription?.status === "complete";
      const applied = await endSubscription(ownerId, completed ? "complete" : "cancelled");
      if (!applied.ok) throw new Error(applied.message ?? "downgrade failed");
    }

    if (event === "subscription.disable" && !ownerId) {
      return NextResponse.json({ ok: true, ignored: "no account for that subscription" });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    /*
     * The event row is deleted so the retry is processed rather than skipped as a
     * duplicate: recording it before acting is what makes a retry safe, and
     * forgetting to un-record it would make a failed upgrade permanent.
     */
    await db.from("payment_events").delete().eq("id", eventKey);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not apply the event." },
      { status: 500 },
    );
  }
}

/**
 * Liveness ack for the URL itself.
 *
 * The Paystack dashboard refuses to save a webhook URL it cannot reach, and it
 * reaches out with a plain request before accepting the address. A 405 there
 * reads as "invalid URL" even though deliveries (POST) work, so GET answers
 * that probe while carrying no data and changing no state. Paystack only ever
 * delivers events by POST, and those stay signature-checked above.
 */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "paystack-webhook" });
}
