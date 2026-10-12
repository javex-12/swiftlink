-- Repair migration: store_reviews columns may be missing if the table was
-- created by an earlier partial migration run. Add each column idempotently,
-- then drop and recreate the RLS policies that reference them.

-- 1. Add missing columns (IF NOT EXISTS is safe to run multiple times)
ALTER TABLE store_reviews
  ADD COLUMN IF NOT EXISTS reviewer_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_biz_name text,
  ADD COLUMN IF NOT EXISTS reviewer_avatar   text,
  ADD COLUMN IF NOT EXISTS guest_name        text,
  ADD COLUMN IF NOT EXISTS rating            smallint CHECK (rating BETWEEN 1 AND 5);

-- 2. Tighten the message check in case it was created without it.
--    Postgres does not support IF NOT EXISTS for constraints, so we use a
--    DO block to add it only when absent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'store_reviews'::regclass
      AND conname   = 'store_reviews_message_length'
  ) THEN
    ALTER TABLE store_reviews
      ADD CONSTRAINT store_reviews_message_length
        CHECK (char_length(message) >= 5 AND char_length(message) <= 800);
  END IF;
END $$;

-- 3. Ensure indexes exist
CREATE INDEX IF NOT EXISTS store_reviews_store_id_idx  ON store_reviews (store_id);
CREATE INDEX IF NOT EXISTS store_reviews_created_at_idx ON store_reviews (created_at DESC);

-- 4. Enable RLS (idempotent)
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if they exist, then recreate cleanly
DROP POLICY IF EXISTS "Public can read reviews"     ON store_reviews;
DROP POLICY IF EXISTS "Anyone can insert a review"  ON store_reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON store_reviews;

CREATE POLICY "Public can read reviews"
  ON store_reviews FOR SELECT
  USING (true);

-- Guest insert: must supply guest_name and must NOT supply reviewer_user_id.
-- Authenticated insert: reviewer_user_id must match the calling user.
CREATE POLICY "Anyone can insert a review"
  ON store_reviews FOR INSERT
  WITH CHECK (
    (guest_name IS NOT NULL AND reviewer_user_id IS NULL)
    OR
    (reviewer_user_id IS NOT NULL AND reviewer_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own review"
  ON store_reviews FOR DELETE
  USING (reviewer_user_id = auth.uid());
