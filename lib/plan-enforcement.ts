/**
 * Bringing an *existing* account inside its plan.
 *
 * The caps in `lib/plans.ts` stop a merchant from *adding* past their plan, but
 * they say nothing about the rows an account already owns. The live database
 * showed what that leaves behind: one free-tier owner running three stores, and
 * free stores whose catalogues were several times the six products the plan
 * allows — the storefront happily served all of them, so the limit was a
 * promise the product did not keep.
 *
 * This module computes the repair. It follows the never-delete policy in
 * `lib/plans.ts` exactly:
 *
 *   - extra products are **hidden** (`visible: false`), kept in state and
 *     re-showable by the merchant's own "pick six" choice, and
 *   - extra stores are **paused** (`isLive: false`), kept readable, exportable
 *     and automatically usable again on Business.
 *
 * Nothing is deleted here, and nothing is written to the database: the caller
 * decides what to persist, so this stays a pure function that can be tested
 * without a browser or a backend.
 */

import type { ShopState } from "./schema";
import {
  accountPlanFor,
  clampProductVisibility,
  effectiveProductLimitFor,
  effectiveStoreLimitFor,
  isProductVisible,
  isStorePublished,
  isUnlimited,
  selectPublishedStoreIds,
  visibleProductCount,
} from "./plans";

export type PlanRepair = {
  /** Store whose catalogue was brought within the cap, or null if none was. */
  storeId: string | null;
  /** Products hidden by this repair (never removed). */
  hiddenProducts: number;
  /** Extra stores paused by this repair (never removed). */
  unpublishedStoreIds: string[];
};

export type PlanRepairResult = {
  /** New rows. Unchanged rows are returned by identity, so a caller can diff. */
  stores: ShopState[];
  repair: PlanRepair;
  /** The account's plan, already resolved across all of its rows. */
  plan: ReturnType<typeof accountPlanFor>;
};

const EMPTY_REPAIR: PlanRepair = { storeId: null, hiddenProducts: 0, unpublishedStoreIds: [] };

/**
 * Which store ids stay published, using the shared "single-store plans keep the
 * first" rule in `lib/plans.ts` rather than a second copy of it. `ShopState.id`
 * is nullable, which the generic in `selectPublishedStoreIds` does not accept,
 * so the rows are projected to the shape that rule actually needs.
 */
function publishedAllowance(stores: readonly ShopState[], storeLimit: number): string[] {
  return selectPublishedStoreIds(
    stores.map((store, index) => ({ id: store.id ?? `row-${index}`, isLive: store.isLive })),
    storeLimit,
  );
}

/**
 * The store an account runs: the first one its plan keeps published, or the
 * first row of all when none is published.
 */
export function runningStoreIdFor(stores: readonly ShopState[], plan: unknown): string | null {
  const keep = publishedAllowance(stores, effectiveStoreLimitFor(plan));
  const running = stores.find((store) => keep.includes(store.id ?? ""));
  return running?.id ?? stores[0]?.id ?? null;
}

/**
 * Apply the account's plan to rows it already owns.
 *
 * `runningStoreId` names the store the merchant is actually working in; when
 * omitted the plan's own rule picks it (the first published store). Products are
 * clamped on every row the plan caps, because a single-store plan can only ever
 * be running one of its own rows anyway — and re-publishing a paused row on
 * Business must not resurrect a catalogue that was never brought in line.
 */
export function repairAccountToPlan(
  stores: readonly ShopState[],
  runningStoreId?: string | null,
): PlanRepairResult {
  const plan = accountPlanFor(stores);
  const productLimit = effectiveProductLimitFor(plan);
  const storeLimit = effectiveStoreLimitFor(plan);

  if (stores.length === 0) {
    return { stores: [], repair: EMPTY_REPAIR, plan };
  }

  // A named running store *is* the allowance — a single-store plan must not
  // keep the first row published as well and end up with two live storefronts.
  const stayPublished = new Set(
    runningStoreId ? [runningStoreId] : publishedAllowance(stores, storeLimit),
  );

  let storeId: string | null = null;
  let hiddenProducts = 0;
  const unpublishedStoreIds: string[] = [];

  const next = stores.map((store) => {
    let repaired = store;

    if (!isUnlimited(storeLimit) && isStorePublished(store) && !stayPublished.has(store.id as string)) {
      repaired = { ...repaired, isLive: false };
      unpublishedStoreIds.push(store.id as string);
    }

    if (!isUnlimited(productLimit) && visibleProductCount(repaired.products) > productLimit) {
      const alreadyHidden = repaired.products.filter((product) => !isProductVisible(product)).length;
      const products = clampProductVisibility(repaired.products, productLimit);
      hiddenProducts += products.filter((product) => !isProductVisible(product)).length - alreadyHidden;
      storeId = store.id ?? null;
      repaired = { ...repaired, products };
    }

    return repaired;
  });

  return {
    stores: next,
    repair: { storeId, hiddenProducts, unpublishedStoreIds },
    plan,
  };
}

/**
 * The rows a repair would change, paired with their replacement — the write
 * list a caller needs, computed without touching the database.
 */
export function repairWrites(
  before: readonly ShopState[],
  result: PlanRepairResult,
): Array<{ id: string; store: ShopState }> {
  return result.stores.reduce<Array<{ id: string; store: ShopState }>>((writes, store, index) => {
    if (store !== before[index] && store.id) writes.push({ id: store.id as string, store });
    return writes;
  }, []);
}

/** Merchant-facing summary of a repair, or "" when there was nothing to do. */
export function repairNotice(plan: unknown, repair: PlanRepair, planName: string): string {
  const parts: string[] = [];
  if (repair.hiddenProducts > 0) {
    parts.push(
      `${repair.hiddenProducts} product${repair.hiddenProducts === 1 ? "" : "s"} hidden to fit your ${planName} plan`,
    );
  }
  if (repair.unpublishedStoreIds.length > 0) {
    parts.push(
      `${repair.unpublishedStoreIds.length} store${repair.unpublishedStoreIds.length === 1 ? "" : "s"} paused`,
    );
  }
  if (parts.length === 0) return "";
  return `${parts.join(" and ")} — nothing was deleted. Pick what stays live in Settings, or upgrade.`;
}
