/**
 * Billing writes, server side.
 *
 * `account_subscriptions` has no insert/update policy on purpose: a browser that
 * could write it could grant itself Business. Everything that changes a plan
 * goes through here, with the service-role key, after a signature or a verified
 * transaction has proved the change is real.
 *
 * The entitlement and the store rows are always written together, so the console
 * (which reads `get_account_entitlement`) and anything still reading
 * `stores.plan` cannot disagree about the tier.
 */

import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { GRACE_PERIOD_DAYS, type Plan } from "./plans";
import type { PaidPlan } from "./paystack";

/** Service-role client, or null when the environment is not configured. */
export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type SessionUser = { id: string; email: string };

/** The signed-in user, from the request cookies. Null for a visitor. */
export async function currentSessionUser(): Promise<SessionUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // A Route Handler can write cookies, but this helper only reads the
        // session; refreshes belong to middleware.
        setAll: () => {},
      },
    });
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export type SubscriptionRow = {
  owner_id: string;
  plan: PaidPlan;
  status: "active" | "past_due" | "cancelled" | "complete";
  provider_subscription_code: string | null;
  provider_customer_code: string | null;
  provider_email_token: string | null;
  amount: number | null;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/** Write the plan to every store the account owns. */
async function writeStorePlan(
  db: SupabaseClient,
  ownerId: string,
  plan: Plan,
  patch: { graceUntil?: string | null; lapsedAt?: string | null } = {},
): Promise<string | null> {
  const { error } = await db
    .from("stores")
    .update({
      plan,
      plan_grace_until: patch.graceUntil ?? null,
      plan_lapsed_at: patch.lapsedAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", ownerId);
  return error ? error.message : null;
}

export type ApplyResult = { ok: boolean; message?: string };

/** A successful payment (or a verified return): the account is on a paid tier. */
export async function activateSubscription(input: {
  ownerId: string;
  plan: PaidPlan;
  subscriptionCode?: string | null;
  customerCode?: string | null;
  emailToken?: string | null;
  amount?: number | null;
  currency?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<ApplyResult> {
  const db = serviceClient();
  if (!db) return { ok: false, message: "Billing writes are not configured." };

  const { error } = await db.from("account_subscriptions").upsert(
    {
      owner_id: input.ownerId,
      plan: input.plan,
      status: "active",
      provider_subscription_code: input.subscriptionCode ?? null,
      provider_customer_code: input.customerCode ?? null,
      provider_email_token: input.emailToken ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? "NGN",
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );
  if (error) return { ok: false, message: error.message };

  const storeError = await writeStorePlan(db, input.ownerId, input.plan);
  if (storeError) return { ok: false, message: storeError };
  return { ok: true };
}

/**
 * A renewal failed. Features continue for the grace window (the policy in
 * lib/plans.ts), and the plan is only removed once that window has passed —
 * which the webhook does when Paystack reports the subscription disabled.
 */
export async function markSubscriptionPastDue(ownerId: string): Promise<ApplyResult> {
  const db = serviceClient();
  if (!db) return { ok: false, message: "Billing writes are not configured." };

  const graceUntil = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await db
    .from("account_subscriptions")
    .select("plan")
    .eq("owner_id", ownerId)
    .maybeSingle();

  const { error } = await db
    .from("account_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("owner_id", ownerId);
  if (error) return { ok: false, message: error.message };

  const storeError = await writeStorePlan(
    db,
    ownerId,
    ((existing?.plan as Plan | undefined) ?? "free") as Plan,
    { graceUntil },
  );
  return storeError ? { ok: false, message: storeError } : { ok: true };
}

/** The subscription is over: back to Free, with the lapse recorded. */
export async function endSubscription(ownerId: string, status: "cancelled" | "complete" = "cancelled"): Promise<ApplyResult> {
  const db = serviceClient();
  if (!db) return { ok: false, message: "Billing writes are not configured." };

  const { error } = await db
    .from("account_subscriptions")
    .update({
      status,
      cancel_at_period_end: false,
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", ownerId);
  if (error) return { ok: false, message: error.message };

  const storeError = await writeStorePlan(db, ownerId, "free", {
    lapsedAt: new Date().toISOString(),
  });
  return storeError ? { ok: false, message: storeError } : { ok: true };
}

/** The merchant cancelled: paid time continues, renewal stops. */
export async function markCancelAtPeriodEnd(ownerId: string): Promise<ApplyResult> {
  const db = serviceClient();
  if (!db) return { ok: false, message: "Billing writes are not configured." };
  const { error } = await db
    .from("account_subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("owner_id", ownerId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** The account's subscription row, for the Settings screen. */
export async function readSubscription(ownerId: string): Promise<SubscriptionRow | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("account_subscriptions")
    .select(
      "owner_id, plan, status, provider_subscription_code, provider_customer_code, provider_email_token, amount, currency, current_period_end, cancel_at_period_end",
    )
    .eq("owner_id", ownerId)
    .maybeSingle();
  return (data as SubscriptionRow | null) ?? null;
}

/**
 * Whether an account id is real.
 *
 * A webhook can name an owner that no longer exists (a deleted account, or a
 * forged-but-signed replay). Without this check the upsert fails on the foreign
 * key, the route answers 500, and Paystack retries the same doomed delivery
 * forever. "Nothing to do" is a 200.
 */
export async function accountExists(ownerId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data, error } = await db.auth.admin.getUserById(ownerId);
  return !error && Boolean(data?.user);
}

/** Find the account behind a subscription code (webhooks report the code, not us). */
export async function ownerForSubscriptionCode(code: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("account_subscriptions")
    .select("owner_id")
    .eq("provider_subscription_code", code)
    .maybeSingle();
  return (data?.owner_id as string | undefined) ?? null;
}

/** Find the account behind a customer code (used when a renewal fails). */
export async function ownerForCustomerCode(code: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("account_subscriptions")
    .select("owner_id")
    .eq("provider_customer_code", code)
    .maybeSingle();
  return (data?.owner_id as string | undefined) ?? null;
}
