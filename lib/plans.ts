/**
 * Plan entitlements and lifecycle rules.
 *
 * Before this module the free product cap existed in two places with two
 * different values — `BusinessView.tsx` enforced 5, `SwiftLinkContext.tsx`
 * enforced 6 — so a merchant got a different limit depending on which button
 * they pressed (docs/05-IMPROVEMENT-PLAN.md R-02). Every cap and every
 * lifecycle decision now lives here and is imported, so the numbers cannot
 * drift apart again.
 *
 * Tiers (confirmed with the owner, see the plan §6):
 *   free      — 6 products, 1 store
 *   pro       — unlimited products, 1 store
 *   business  — unlimited products, multiple stores
 *
 * "Unlimited" is an entitlement, not a licence to consume unbounded shared
 * storage: a per-user store cap and a per-store product fair-use ceiling are
 * applied on top, so one account cannot take all the space. Both numbers are
 * deliberately centralised here so they can be tuned in one place.
 *
 * The downgrade policy is **never delete anything**. Over the product limit the
 * vendor chooses which products stay visible and the rest are *hidden* (kept in
 * state, `visible: false`); extra stores are *unpublished* (`isLive: false`)
 * but remain readable and exportable. See `applyProductVisibility` and
 * `selectPublishedStoreIds`.
 */

export type Plan = "free" | "pro" | "business";

export const PLANS: readonly Plan[] = ["free", "pro", "business"] as const;

/** The free-tier catalogue cap. Exported so UI copy can name the real number. */
export const FREE_PRODUCT_LIMIT = 6;

/** Fair-use ceiling applied to every plan, including "unlimited" ones. */
export const MAX_PRODUCTS_PER_STORE = 1000;

/** Hard ceiling on how many stores one account may own, on any plan. */
export const MAX_STORES_PER_USER = 10;

/**
 * How long a store keeps its entitlements after a card payment fails, before
 * any downgrade is applied. The owner picked 7 days and asked for it to be
 * tunable — this constant and the DB column `stores.plan_grace_until` are the
 * only two places the number appears.
 */
export const GRACE_PERIOD_DAYS = 7;

/** `Infinity` reads naturally in comparisons (`count >= limit`) and in UI copy. */
const UNLIMITED = Number.POSITIVE_INFINITY;

/** Anything unrecognised is treated as `free` — never as a paid tier. */
export function normalizePlan(value: unknown): Plan {
  return value === "pro" || value === "business" ? value : "free";
}

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 };

/**
 * The plan an *account* holds, given the stores it owns.
 *
 * `plan` is stored on each store row, but billing is per account: every store a
 * merchant owns belongs to the same subscription. So the account's entitlement
 * is the **most privileged** plan among its stores.
 *
 * This exists because the two disagreeing was a live bug: `createNewStore`
 * inserted `plan: 'free'` for a new store, and `fetchStores` treats the DB
 * column as authoritative, so a paying Business merchant who added a second
 * store silently demoted themselves — capped at the free tier's 6 products with
 * multi-store switching hidden. Reading entitlements from the account instead
 * of from one arbitrary row makes that unrecoverable state impossible.
 *
 * Taking the maximum is also the safe direction for a *stale* row: a downgrade
 * is an explicit server-side action that writes every row, whereas silently
 * taking away a plan that was paid for is not recoverable by the merchant.
 */
export function accountPlanFor(stores: readonly { plan?: unknown }[]): Plan {
  return stores.reduce<Plan>((best, store) => {
    const candidate = normalizePlan(store.plan);
    return PLAN_RANK[candidate] > PLAN_RANK[best] ? candidate : best;
  }, "free");
}

/** A store row as far as entitlements are concerned. */
export type AccountPlanRow = {
  id?: string;
  /** The DB column. */
  plan?: unknown;
  /** The mirrored copy in the storefront payload. */
  state_json?: { plan?: unknown } | null;
};

export type AccountPlanReconciliation = {
  /** The plan the whole account is entitled to. */
  accountPlan: Plan;
  /** Ids of rows whose `plan` disagrees with it and should be rewritten. */
  staleIds: string[];
};

/**
 * Resolve an account's plan from its raw store rows, and report which rows
 * disagree with it so a caller can repair them.
 *
 * The DB column is read first, falling back to the state mirror, so a row that
 * predates the column still counts. The stale list is what stops the mismatch
 * from reappearing on the next load — without it a merchant is capped every
 * time the console opens, not just once.
 */
export function reconcileAccountPlan(
  rows: readonly AccountPlanRow[],
): AccountPlanReconciliation {
  const declared = (row: AccountPlanRow) => row.plan ?? row.state_json?.plan;
  const accountPlan = accountPlanFor(rows.map((row) => ({ plan: declared(row) })));
  const staleIds = rows
    .filter((row) => normalizePlan(declared(row)) !== accountPlan)
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id));
  return { accountPlan, staleIds };
}

/** Maximum number of products a plan may hold, before the fair-use ceiling. */
export function productLimitFor(plan: unknown): number {
  return normalizePlan(plan) === "free" ? FREE_PRODUCT_LIMIT : UNLIMITED;
}

/** Maximum number of products actually enforced, after the fair-use ceiling. */
export function effectiveProductLimitFor(plan: unknown): number {
  return Math.min(productLimitFor(plan), MAX_PRODUCTS_PER_STORE);
}

/**
 * Maximum number of stores a plan may own, before the per-user cap. Only
 * Business may exceed one; free and pro are both single-store.
 */
export function storeLimitFor(plan: unknown): number {
  return normalizePlan(plan) === "business" ? UNLIMITED : 1;
}

/** Maximum number of stores actually enforced, after the per-user cap. */
export function effectiveStoreLimitFor(plan: unknown): number {
  return Math.min(storeLimitFor(plan), MAX_STORES_PER_USER);
}

export function isUnlimited(limit: number): boolean {
  return !Number.isFinite(limit);
}

/** Human-readable limit, for toasts and upgrade prompts: "6" or "unlimited". */
export function formatLimit(limit: number): string {
  return isUnlimited(limit) ? "unlimited" : String(limit);
}

/**
 * Upgrade prompt copy describing the plan's *entitlement*. This is what a
 * merchant sees when a free-tier cap blocks them, so it names the tier.
 */
export function productLimitMessage(plan: unknown): string {
  const limit = productLimitFor(plan);
  if (isUnlimited(limit)) return "This plan allows unlimited products.";
  return `Your ${normalizePlan(plan).toUpperCase()} plan allows a maximum of ${limit} products. Upgrade to add more!`;
}

/** Copy for the hard fair-use ceiling that applies even to "unlimited" plans. */
export function productCeilingMessage(): string {
  return `You have reached the ${MAX_PRODUCTS_PER_STORE}-product fair-use limit for a single store.`;
}

/**
 * The message to show when a product add is actually refused. For a paid plan
 * the block is the fair-use ceiling, not the entitlement, so it must not claim
 * the plan is limited — and for a free plan it must name the real cap.
 */
export function productLimitBlockedMessage(plan: unknown): string {
  return effectiveProductLimitFor(plan) === MAX_PRODUCTS_PER_STORE
    ? productCeilingMessage()
    : productLimitMessage(plan);
}

/** Upgrade prompt copy for the store cap. */
export function storeLimitMessage(plan: unknown, storeCount: number): string {
  const limit = effectiveStoreLimitFor(plan);
  if (storeCount < limit) return "";
  if (limit === MAX_STORES_PER_USER) {
    return `You have reached the ${MAX_STORES_PER_USER}-store limit for one account.`;
  }
  return "Multiple stores are a Business feature. Upgrade to Business to run more than one brand.";
}

/* -------------------------------------------------------------------------- */
/* Never-delete downgrade semantics                                            */
/* -------------------------------------------------------------------------- */

/** A product is visible unless it was explicitly hidden. */
export type HideableProduct = { visible?: boolean; [key: string]: unknown };
/** A store is published unless it was explicitly unpublished. */
export type PublishableStore = { isLive?: boolean; [key: string]: unknown };

export function isProductVisible(product: HideableProduct): boolean {
  return product.visible !== false;
}

export function isStorePublished(store: PublishableStore): boolean {
  return store.isLive !== false;
}

export function visibleProductCount(products: readonly HideableProduct[]): number {
  return products.reduce((count, product) => count + (isProductVisible(product) ? 1 : 0), 0);
}

export function hiddenProductCount(products: readonly HideableProduct[]): number {
  return products.length - visibleProductCount(products);
}

/**
 * Return a new array with exactly the given ids marked visible and every other
 * product marked hidden. Nothing is removed — this is the "vendor picks which
 * stay visible" step of the downgrade flow. Products whose visibility does not
 * change keep their identity, so React keys and diffs stay stable.
 */
export function applyProductVisibility<T extends { id: number | string } & HideableProduct>(
  products: readonly T[],
  visibleIds: readonly (number | string)[],
): T[] {
  const keep = new Set(visibleIds.map(String));
  return products.map((product) => {
    const visible = keep.has(String(product.id));
    if (isProductVisible(product) === visible && product.visible !== undefined) return product;
    return { ...product, visible };
  });
}

/**
 * Deterministic default for an automatic downgrade: keep the first `limit`
 * products that are currently visible and hide the remainder, preserving
 * order. The vendor can then re-pick via `applyProductVisibility`. Returns the
 * input unchanged when already within the limit.
 */
export function clampProductVisibility<T extends { id: number | string } & HideableProduct>(
  products: readonly T[],
  limit: number,
): T[] {
  if (isUnlimited(limit)) return [...products];
  let kept = 0;
  return products.map((product) => {
    if (!isProductVisible(product)) return product;
    kept += 1;
    if (kept <= limit) return product;
    return { ...product, visible: false };
  });
}

/**
 * Which stores stay published under a plan. Business (within the per-user cap)
 * keeps them all; every other plan keeps the first `limit`. Used to compute the
 * downgrade rather than to mutate state.
 */
export function selectPublishedStoreIds<T extends { id: string } & PublishableStore>(
  stores: readonly T[],
  limit: number,
): string[] {
  if (isUnlimited(limit)) return stores.map((store) => store.id);
  return stores
    .filter(isStorePublished)
    .slice(0, limit)
    .map((store) => store.id);
}

/* -------------------------------------------------------------------------- */
/* Grace period and cleanup eligibility                                        */
/* -------------------------------------------------------------------------- */

export type BillingState = {
  /** Set when a card payment fails; entitlements continue until this moment. */
  planGraceUntil?: string | Date | null;
  /** Set once the grace period has expired and the plan was reduced. */
  planLapsedAt?: string | Date | null;
};

function toTime(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/** The moment a failed payment's grace period ends. */
export function graceDeadline(from: Date): Date {
  return new Date(from.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

/** True while the store is inside its post-failure grace window. */
export function isInGrace(state: BillingState, now: Date = new Date()): boolean {
  const until = toTime(state.planGraceUntil);
  if (until === null) return false;
  return until > now.getTime() && toTime(state.planLapsedAt) === null;
}

/** True once a lapse has been recorded (grace expired, entitlements reduced). */
export function isLapsed(state: BillingState, now: Date = new Date()): boolean {
  return toTime(state.planLapsedAt) !== null;
}

/**
 * Whether an inactive store may be swept up by the inactivity cleanup job.
 *
 * Stores inside a grace window and stores that have already lapsed are
 * **excluded** — the owner's instruction is that a billing problem must never
 * cause data loss. There is no cleanup job in the codebase yet; this predicate
 * (and the matching SQL view `cleanup_eligible_stores`) is the contract any
 * future job must use.
 */
export function isCleanupEligible(state: BillingState, now: Date = new Date()): boolean {
  if (isInGrace(state, now)) return false;
  if (isLapsed(state, now)) return false;
  return true;
}
