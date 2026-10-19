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
 *   pro       — 1,000 products, up to 3 stores
 *   business  — 1,000 products, up to 10 stores
 *
 * **No tier is unlimited, and no copy says it is.** "Unlimited products" used
 * to describe a plan whose real enforced ceiling was 1,000, so a merchant could
 * read one number on the pricing page and hit a different one in the editor. A
 * shared host also cannot promise unbounded storage: one account filling it
 * would degrade every other store, so the ceiling is a product decision, not an
 * apology. Every cap lives here and every screen reads it from here, which is
 * what keeps the claim and the enforcement the same number.
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
export const FREE_PRODUCT_LIMIT = 10;

/** The product limit for the Pro tier across all stores. */
export const PRO_PRODUCT_LIMIT = 500;

/** The product limit for the Business tier across all stores. */
export const BUSINESS_PRODUCT_LIMIT = 1000;

/** The hard ceiling on published products across all stores, on every plan. */
export const MAX_PRODUCTS_PER_STORE = 1000;

/** Stores a free account may run. */
export const FREE_STORE_LIMIT = 1;

/** Stores a Pro account may run. */
export const PRO_STORE_LIMIT = 3;

/** Hard ceiling on how many stores one account may own, on any plan. */
export const MAX_STORES_PER_USER = 10;

/** Free-tier eligible storefront templates. All other templates require Pro or Business. */
export const FREE_TEMPLATE_IDS = ["editorial", "boutique", "bold"] as const;
export type FreeTemplateId = (typeof FREE_TEMPLATE_IDS)[number];

export function isTemplateAllowedOnPlan(templateId: string, plan: unknown): boolean {
  const normalized = normalizePlan(plan);
  if (normalized === "pro" || normalized === "business") return true;
  return (FREE_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

export function templateUpgradeRequiredMessage(templateName: string): string {
  return `The ${templateName} template is an exclusive feature on SwiftLink Pro & Business. Upgrade your plan to use this template on your live store.`;
}

/**
 * How long a store keeps its entitlements after a card payment fails, before
 * any downgrade is applied. The owner picked 7 days and asked for it to be
 * tunable — this constant and the DB column `stores.plan_grace_until` are the
 * only two places the number appears.
 */
export const GRACE_PERIOD_DAYS = 7;

export type BillingInterval = "monthly" | "yearly";

/**
 * What each paid tier costs per month, in **minor units** — the unit Paystack charges in.
 * Pro: ₦5,000 / mo. Business: ₦12,000 / mo.
 */
export const PLAN_PRICE_MINOR: Record<"pro" | "business", number> = {
  pro: 500_000,
  business: 1_200_000,
};

/** The same prices in major units, for display. */
export const PLAN_PRICE_NGN: Record<"pro" | "business", number> = {
  pro: PLAN_PRICE_MINOR.pro / 100,
  business: PLAN_PRICE_MINOR.business / 100,
};

/**
 * Yearly option: pay for 10 months, get 12.
 * Pro: ₦50,000 / yr (save ₦10,000). Business: ₦120,000 / yr (save ₦24,000).
 */
export const PLAN_PRICE_YEARLY_MINOR: Record<"pro" | "business", number> = {
  pro: 5_000_000,
  business: 12_000_000,
};

export const PLAN_PRICE_YEARLY_NGN: Record<"pro" | "business", number> = {
  pro: PLAN_PRICE_YEARLY_MINOR.pro / 100,
  business: PLAN_PRICE_YEARLY_MINOR.business / 100,
};


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

/**
 * The plan the account is actually **entitled** to, which is what every screen
 * and every cap must read.
 *
 * A deployment administrator is entitled to Business — that rule used to live
 * only in `checkAdminStatus`, which upgraded local state that `fetchStores` then
 * overwrote from the store row, so the badge flicked to the real plan and an
 * admin was capped at the free tier. The server resolves this now
 * (`get_account_entitlement`); this function is the pure equivalent used as a
 * fallback and in tests, so both paths agree.
 *
 * An admin override is **not** written back to `stores.plan`: it follows the
 * person, not the shop, and demoting an admin must not leave paid plans behind.
 */
export function entitledPlanFor(
  stores: readonly { plan?: unknown }[],
  options: { isAdmin?: boolean } = {},
): Plan {
  return options.isAdmin ? "business" : accountPlanFor(stores);
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

/**
 * How many products each plan may publish. Finite for every tier on purpose:
 * the pricing page, the editor and this cap all quote the same number.
 */
export const PLAN_PRODUCT_LIMIT: Record<Plan, number> = {
  free: FREE_PRODUCT_LIMIT,
  pro: PRO_PRODUCT_LIMIT,
  business: BUSINESS_PRODUCT_LIMIT,
};

/** Maximum number of products a plan may publish. */
export function productLimitFor(plan: unknown): number {
  return PLAN_PRODUCT_LIMIT[normalizePlan(plan)];
}

/** The limit actually enforced. Kept as its own function so callers read intent. */
export function effectiveProductLimitFor(plan: unknown): number {
  return Math.min(productLimitFor(plan), MAX_PRODUCTS_PER_STORE);
}

/**
 * Maximum number of stores a plan may run. Free is single-store, Pro runs 3
 * brands, and Business stops at the per-account cap.
 */
export function storeLimitFor(plan: unknown): number {
  const normalized = normalizePlan(plan);
  if (normalized === "business") return MAX_STORES_PER_USER;
  if (normalized === "pro") return PRO_STORE_LIMIT;
  return FREE_STORE_LIMIT;
}

/** The store limit actually enforced. */
export function effectiveStoreLimitFor(plan: unknown): number {
  return Math.min(storeLimitFor(plan), MAX_STORES_PER_USER);
}

/**
 * Whether a limit is unbounded. No plan is any more, so this is now only a
 * guard for callers that must not divide by or compare against a missing
 * number — it returning true in production would mean a cap was forgotten.
 */
export function isUnlimited(limit: number): boolean {
  return !Number.isFinite(limit);
}

/**
 * Whether the account may create another store. This is the rule, not a UI
 * hint: it is checked in `createNewStore` itself, because the limit used to
 * live only in whichever screen rendered a button. The live database showed
 * what that costs — an owner on the free tier holding three stores.
 */
export function canCreateStore(plan: unknown, storeCount: number): boolean {
  return storeCount < effectiveStoreLimitFor(plan);
}

/**
 * Whether the account may move between stores it already owns.
 *
 * A plan keeps every row it owns (nothing is ever deleted), but may only *run*
 * as many stores as it is entitled to. Extra rows are data, not entitlement, so
 * they stay readable and exportable and come back the moment the account
 * upgrades.
 */
export function canSwitchStore(plan: unknown): boolean {
  return effectiveStoreLimitFor(plan) > 1;
}

/** Refusal copy for a store action the plan does not entitle, or "" when allowed. */
export function storeActionBlockedMessage(plan: unknown, storeCount: number): string {
  return canCreateStore(plan, storeCount)
    ? ""
    : storeLimitMessage(plan, storeCount) ||
        "Upgrade your plan to run more than one brand.";
}

/* -------------------------------------------------------------------------- */
/* Tier presentation                                                           */
/* -------------------------------------------------------------------------- */

export type PlanDetail = {
  id: Plan;
  name: string;
  price: string;
  yearlyPrice?: string;
  tag?: string;
  /** Short line for a badge or a plan card. */
  summary: string;
  /** Card features, in the order they matter to a merchant. */
  features: readonly string[];
};

/**
 * What each tier actually is, in one place, so the marketing page and the
 * console's plan panel cannot describe the same plan differently.
 */
export const PLAN_DETAILS: Record<Plan, PlanDetail> = {
  free: {
    id: "free",
    name: "Free",
    price: "₦0",
    yearlyPrice: "₦0",
    summary: "Run one store with a full storefront.",
    features: [
      `Up to ${FREE_PRODUCT_LIMIT} products`,
      `${FREE_STORE_LIMIT} store`,
      "WhatsApp checkout",
      "Price requests for services",
      `${FREE_TEMPLATE_IDS.length} starter templates`,
      "SwiftLink branding shown",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tag: "Most Popular",
    price: `₦${PLAN_PRICE_NGN.pro.toLocaleString()} / month`,
    yearlyPrice: `₦${PLAN_PRICE_YEARLY_NGN.pro.toLocaleString()} / year`,
    summary: `Up to ${PRO_STORE_LIMIT} stores with up to ${PRO_PRODUCT_LIMIT} products across all stores.`,
    features: [
      "Everything in Free",
      `Up to ${PRO_PRODUCT_LIMIT} products`,
      `Up to ${PRO_STORE_LIMIT} stores`,
      "All storefront templates",
      "Discount codes",
      "Detailed analytics",
      "CSV export",
      "SwiftLink branding shown",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: `₦${PLAN_PRICE_NGN.business.toLocaleString()} / month`,
    yearlyPrice: `₦${PLAN_PRICE_YEARLY_NGN.business.toLocaleString()} / year`,
    summary: `Up to ${MAX_STORES_PER_USER} stores with up to ${BUSINESS_PRODUCT_LIMIT.toLocaleString()} products across all stores.`,
    features: [
      "Everything in Pro",
      `Up to ${BUSINESS_PRODUCT_LIMIT.toLocaleString()} products`,
      `Up to ${MAX_STORES_PER_USER} stores`,
      "Connect your own domain",
      "No SwiftLink branding",
      "Custom preloader screen",
      "Priority WhatsApp support",
    ],
  },
};

/** Human-readable usage for a plan card: "4 of 10". */
export function formatUsage(used: number, limit: number): string {
  return `${used} of ${formatLimit(limit)}`;
}

/** Human-readable limit, for toasts and upgrade prompts: "10". */
export function formatLimit(limit: number): string {
  return isUnlimited(limit) ? String(MAX_PRODUCTS_PER_STORE) : String(limit);
}

/**
 * Upgrade prompt copy describing the plan's *entitlement*. This is what a
 * merchant sees when a free-tier cap blocks them, so it names the tier.
 */
export function productLimitMessage(plan: unknown): string {
  const limit = productLimitFor(plan);
  const normalized = normalizePlan(plan);
  if (normalized === "free") {
    return `Your FREE plan allows a maximum of ${limit} products. Upgrade to Pro for up to 500 products!`;
  }
  return `Your ${normalized.toUpperCase()} plan allows a maximum of ${limit.toLocaleString()} products across all stores. Upgrade to add more!`;
}

/** Copy for the per-store ceiling, which is the cap every paid plan has. */
export function productCeilingMessage(): string {
  return `You have reached the ${BUSINESS_PRODUCT_LIMIT.toLocaleString()}-product limit across all stores.`;
}

/**
 * The message to show when a product add is actually refused: for a free plan it
 * names the free cap, and for a paid plan it names the per-store ceiling, which
 * is the same 1,000 the pricing page quotes.
 */
export function productLimitBlockedMessage(plan: unknown): string {
  return effectiveProductLimitFor(plan) === BUSINESS_PRODUCT_LIMIT
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
  return `Your ${normalizePlan(plan).toUpperCase()} plan allows up to ${limit} store${
    limit === 1 ? "" : "s"
  }. Upgrade to run more brands.`;
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
