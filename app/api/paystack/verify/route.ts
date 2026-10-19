import { NextRequest, NextResponse } from "next/server";
import { activateSubscription, currentSessionUser } from "@/lib/billing-server";
import { isPaidPlan, verifyTransaction } from "@/lib/paystack";

/**
 * Confirm a checkout on return from Paystack.
 *
 * The reference arrives in the URL, so it proves nothing by itself: the
 * transaction is read back from Paystack and the account it belongs to is
 * compared with the signed-in account. A reference belonging to someone else is
 * refused — otherwise anyone who saw a link could claim the upgrade.
 *
 * This exists as well as the webhook, not instead of it: the webhook is the
 * authority (it also covers renewals and failures), while this makes the return
 * to Settings show the new plan immediately instead of after the next reload.
 */
export async function POST(request: NextRequest) {
  const user = await currentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { reference?: unknown } | null;
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  const result = await verifyTransaction(reference);
  const transaction = result.data;

  if (!result.ok || !transaction) {
    return NextResponse.json(
      { error: result.message || "Could not verify that payment." },
      { status: 502 },
    );
  }

  if (transaction.status !== "success") {
    return NextResponse.json(
      { ok: false, status: transaction.status, error: "That payment was not successful." },
      { status: 402 },
    );
  }

  // The transaction must belong to the caller: metadata is written by our own
  // initialize route, and Paystack returns it unchanged.
  if (transaction.ownerId !== user.id) {
    return NextResponse.json({ error: "That payment belongs to another account." }, { status: 403 });
  }

  const plan = transaction.planName;
  if (!isPaidPlan(plan)) {
    return NextResponse.json({ error: "That payment does not name a plan." }, { status: 400 });
  }

  const applied = await activateSubscription({
    ownerId: user.id,
    plan,
    subscriptionCode: transaction.subscriptionCode ?? null,
    customerCode: transaction.customerCode ?? null,
    emailToken: transaction.emailToken ?? null,
    amount: transaction.amount,
    currency: transaction.currency,
  });

  if (!applied.ok) {
    return NextResponse.json({ error: applied.message ?? "Could not apply the plan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan });
}
