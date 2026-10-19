import { NextRequest, NextResponse } from "next/server";
import { currentSessionUser } from "@/lib/billing-server";
import { initializePlanCheckout, isPaidPlan, paystackSecretKey } from "@/lib/paystack";

/**
 * Start a subscription checkout.
 *
 * The plan is taken from the body, but only ever from the two plans the app
 * sells — a request for `plan: "free"`, or for anything else, is refused rather
 * than forwarded. The amount is not client-controlled at all: Paystack charges
 * the amount on the plan code, so a tampered body cannot buy Business for ₦1.
 */
export async function POST(request: NextRequest) {
  const user = await currentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to change your plan." }, { status: 401 });
  }

  if (!paystackSecretKey()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { plan?: unknown } | null;
  const plan = body?.plan;
  if (!isPaidPlan(plan)) {
    return NextResponse.json({ error: "Choose Pro or Business." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const result = await initializePlanCheckout({
    email: user.email,
    plan,
    ownerId: user.id,
    callbackUrl: `${origin}/account?billing=return`,
  });

  if (!result.ok || !result.data?.authorizationUrl) {
    return NextResponse.json(
      { error: result.message || "Could not start checkout." },
      { status: result.status === 200 ? 502 : result.status },
    );
  }

  return NextResponse.json({
    authorizationUrl: result.data.authorizationUrl,
    authorization_url: result.data.authorizationUrl,
    reference: result.data.reference,
  });
}
