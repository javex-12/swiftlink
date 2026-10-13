/**
 * Who is looking at this storefront?
 *
 * The storefront needs to know when its *owner* is the one browsing, because the
 * things only customers may do — leave a review on the shop — must not be
 * offered to the merchant. The obvious test, `state.ownerId === user.id`, cannot
 * work on a public storefront: `ownerId` is deliberately stripped from the public
 * store projection (`lib/__tests__/public-store-whitelist.test.ts`), so the
 * merchant looked exactly like a stranger on their own `/<handle>` page. That is
 * how the owner ended up able to review their own shop.
 *
 * The console, however, already loads every store the signed-in account owns
 * (`fetchStores` in `context/SwiftLinkContext.tsx`). Matching this store's id
 * against that list decides ownership without publishing an owner id to the page.
 */
export function viewerOwnsStore(
  storeId: string | null | undefined,
  viewerId: string | null | undefined,
  ownedStoreIds: Iterable<string | null | undefined>,
): boolean {
  if (!storeId || !viewerId) return false;

  for (const ownedId of ownedStoreIds) {
    if (ownedId && ownedId === storeId) return true;
  }

  return false;
}
