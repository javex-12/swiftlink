/**
 * Paystack, server side only.
 *
 * Everything here reads `PAYSTACK_SECRET_KEY`, so it must never be imported by a
 * client component: the key lives in `.env.local` (gitignored) and in the
 * deployment's environment, never in the browser bundle. The browser only ever
 * talks to the routes in `app/api/paystack/*`, which are the things that speak
 * to this module.
 *
 * ## How a subscription is sold
 *
 *   1. `POST /transaction/initialize` with the plan code and the buyer's email —
 *      Paystack hosts the card form, so no card data touches this app.
 *   2. The buyer returns to `/account?billing=return&reference=…`, and the
 *      reference is verified out of band (never trusted from the URL).
 *   3. Paystack's webhook confirms the subscription and every renewal, including
 *      failures.
 *
 * Prices are in **minor units** (kobo) because that is what the API takes, and
 * they are the same numbers `PLAN_DETAILS` prints — one constant, so the price a
 * merchant reads and the amount they are charged cannot drift apart.
 */

import crypto from "node:crypto";
import { PLAN_PRICE_MINOR, type Plan } from "./plans";

export type PaidPlan = Exclude<Plan, "free">;

export const PAYSTACK_API = "https://api.paystack.co";

/** True when billing can run at all in this environment. */
export function paystackSecretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key ? key : null;
}

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === "pro" || value === "business";
}

/** The Paystack plan code for a tier, or null when that plan is not configured. */
export function planCodeFor(plan: PaidPlan): string | null {
  const code =
    plan === "pro"
      ? process.env.PAYSTACK_PLAN_PRO?.trim()
      : process.env.PAYSTACK_PLAN_BUSINESS?.trim();
  return code ? code : null;
}

/** Reverse lookup, used by webhooks that report a plan code rather than a tier. */
export function planForCode(code: unknown): PaidPlan | null {
  if (typeof code !== "string") return null;
  const pro = process.env.PAYSTACK_PLAN_PRO?.trim();
  const business = process.env.PAYSTACK_PLAN_BUSINESS?.trim();
  if (pro && code === pro) return "pro";
  if (business && code === business) return "business";
  return null;
}

/** Amount in minor units for a tier — the same number the plan was created with. */
export function amountFor(plan: PaidPlan): number {
  return PLAN_PRICE_MINOR[plan];
}

/**
 * Verify a webhook body against `x-paystack-signature`.
 *
 * Paystack signs the **raw** request body with HMAC-SHA512 using the secret key.
 * This has to run on the exact bytes received: parsing and re-serialising the
 * JSON changes key order and whitespace, which changes the digest, so the caller
 * must pass the raw text.
 *
 * `timingSafeEqual` avoids leaking how much of a forged signature was correct.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const key = paystackSecretKey();
  if (!key || !signature) return false;
  const expected = crypto.createHmac("sha512", key).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type PaystackResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  message: string;
};

/** A single call to the Paystack API. Never throws; failures come back as `ok: false`. */
export async function paystackFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<PaystackResponse<T>> {
  const key = paystackSecretKey();
  if (!key) {
    return { ok: false, status: 503, data: null, message: "Billing is not configured." };
  }
  try {
    const response = await fetch(`${PAYSTACK_API}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // Never serve a stale "initialized" response from a cache.
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: T }
      | null;
    return {
      ok: response.ok && payload?.status !== false,
      status: response.status,
      data: (payload?.data as T) ?? null,
      message: payload?.message ?? (response.ok ? "" : `Paystack responded ${response.status}`),
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: null,
      message: error instanceof Error ? error.message : "Could not reach Paystack.",
    };
  }
}

export type InitializeResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

/**
 * Start a checkout for one tier.
 *
 * `callback_url` brings the buyer back to Settings, where the reference is
 * verified server-side; `metadata` carries the account and tier so the webhook
 * does not have to guess which plan a payment was for.
 */
export async function initializePlanCheckout(input: {
  email: string;
  plan: PaidPlan;
  ownerId: string;
  callbackUrl: string;
}): Promise<PaystackResponse<InitializeResult>> {
  const planCode = planCodeFor(input.plan);
  if (!planCode) {
    return {
      ok: false,
      status: 503,
      data: null,
      message: `No Paystack plan is configured for the ${input.plan} tier.`,
    };
  }

  return paystackFetch<InitializeResult>("/transaction/initialize", {
    method: "POST",
    body: {
      email: input.email,
      // Paystack overrides this with the plan's own amount; sending both keeps
      // the record readable if the plan is edited in the dashboard later.
      amount: amountFor(input.plan),
      plan: planCode,
      callback_url: input.callbackUrl,
      metadata: {
        owner_id: input.ownerId,
        plan: input.plan,
        product: "swiftlink-subscription",
      },
    },
  });
}

export type VerifiedTransaction = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  plan?: string;
  subscriptionCode?: string;
  customerCode?: string;
  emailToken?: string;
  ownerId?: string;
  planName?: PaidPlan | null;
};

/** Read a transaction back by reference — the only trustworthy source for it. */
export async function verifyTransaction(
  reference: string,
): Promise<PaystackResponse<VerifiedTransaction>> {
  const result = await paystackFetch<{
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    plan?: unknown;
    customer?: { customer_code?: string; email?: string };
    metadata?: { owner_id?: string; plan?: string };
    subscription?: { subscription_code?: string; email_token?: string } | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  if (!result.ok || !result.data) return { ...result, data: null };

  const raw = result.data;
  return {
    ...result,
    data: {
      reference: raw.reference ?? reference,
      status: raw.status ?? "failed",
      amount: Number(raw.amount) || 0,
      currency: raw.currency ?? "NGN",
      subscriptionCode: raw.subscription?.subscription_code,
      customerCode: raw.customer?.customer_code,
      emailToken: raw.subscription?.email_token,
      ownerId: raw.metadata?.owner_id,
      planName: isPaidPlan(raw.metadata?.plan) ? raw.metadata.plan : null,
    },
  };
}

/** Stop a subscription from renewing. Paystack keeps the paid period intact. */
export async function disableSubscription(
  subscriptionCode: string,
  emailToken: string,
): Promise<PaystackResponse<unknown>> {
  return paystackFetch(`/subscription/disable`, {
    method: "POST",
    body: { code: subscriptionCode, token: emailToken },
  });
}
