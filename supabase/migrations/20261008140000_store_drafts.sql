-- ============================================================================
-- store_drafts — autosaved merchant work-in-progress (plan item 5.2)
-- ============================================================================
--
-- Why a separate table instead of `stores.draft_json`:
--
--   `public.stores` carries a world-readable SELECT policy ("Public can read
--   live stores"), because the storefront reads store rows anonymously. Any
--   column added to `stores` is therefore readable by anyone through the REST
--   API with the anon key. A draft column would leak *unpublished* merchant
--   work — including products the merchant deliberately hid because their plan
--   went over the visible limit (lib/plans.ts) — to the public internet.
--
--   A separate table lets RLS scope drafts to their owner while the public
--   storefront keeps reading `stores` exactly as before.
--
-- Blue-green / expand-contract (docs/06-DEPLOYMENT.md §6):
--   This migration is purely additive — one new table, new policies, one new
--   index. No existing table, column, row, or policy is touched, so the old
--   application version and the new one both run correctly against it. It can
--   ship before the code that uses it, which is exactly the safe order.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_drafts (
  -- One draft per store, replaced in place.
  store_id   uuid        PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The merchant's full working state. Shape mirrors `stores.state_json`.
  draft_json jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.store_drafts IS
  'Autosaved merchant drafts. Never read by the storefront; published to stores.state_json only when the merchant explicitly saves.';
COMMENT ON COLUMN public.store_drafts.store_id IS
  'The store this draft belongs to. Deleted with the store.';
COMMENT ON COLUMN public.store_drafts.draft_json IS
  'ShopState JSON for unpublished edits. Same shape as stores.state_json.';

CREATE INDEX IF NOT EXISTS store_drafts_owner_id_idx
  ON public.store_drafts (owner_id);

-- ---------------------------------------------------------------------------
-- RLS: owner-only, plus read access for admins.
-- ---------------------------------------------------------------------------

ALTER TABLE public.store_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read own drafts"   ON public.store_drafts;
DROP POLICY IF EXISTS "Owners can insert own drafts" ON public.store_drafts;
DROP POLICY IF EXISTS "Owners can update own drafts" ON public.store_drafts;
DROP POLICY IF EXISTS "Owners can delete own drafts" ON public.store_drafts;
DROP POLICY IF EXISTS "Admins can read all drafts"   ON public.store_drafts;

CREATE POLICY "Owners can read own drafts"
  ON public.store_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Upsert needs both INSERT and UPDATE; keep the predicates identical so the
-- two halves of an upsert can never disagree about who owns the row.
CREATE POLICY "Owners can insert own drafts"
  ON public.store_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own drafts"
  ON public.store_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own drafts"
  ON public.store_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can read all drafts"
  ON public.store_drafts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.system_admins a WHERE a.id = auth.uid()));

-- The service role (migrations, cleanup jobs) bypasses RLS, so no extra policy
-- is needed for `cleanup_eligible_stores` or future retention work.
