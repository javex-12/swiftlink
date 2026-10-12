-- Store reviews: public customer feedback on merchant storefronts
-- Written to be fully idempotent regardless of prior partial runs.

-- 1. Create table (no-op if it already exists)
CREATE TABLE IF NOT EXISTS store_reviews (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  reviewer_user_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_biz_name  text,
  reviewer_avatar    text,
  guest_name         text,
  message            text        NOT NULL,
  rating             smallint,
  created_at         timestamptz DEFAULT now()
);

-- 2. Add any columns that might be missing from a prior partial run
ALTER TABLE store_reviews
  ADD COLUMN IF NOT EXISTS reviewer_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_biz_name text,
  ADD COLUMN IF NOT EXISTS reviewer_avatar   text,
  ADD COLUMN IF NOT EXISTS guest_name        text,
  ADD COLUMN IF NOT EXISTS rating            smallint;

-- 3. Add constraints (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'store_reviews'::regclass
      AND conname  = 'store_reviews_message_length'
  ) THEN
    ALTER TABLE store_reviews
      ADD CONSTRAINT store_reviews_message_length
        CHECK (char_length(message) >= 5 AND char_length(message) <= 800);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'store_reviews'::regclass
      AND conname  = 'store_reviews_rating_range'
  ) THEN
    ALTER TABLE store_reviews
      ADD CONSTRAINT store_reviews_rating_range
        CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS store_reviews_store_id_idx   ON store_reviews (store_id);
CREATE INDEX IF NOT EXISTS store_reviews_created_at_idx ON store_reviews (created_at DESC);

-- 5. RLS
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- 6. Policies — always drop first so reruns don't error
DROP POLICY IF EXISTS "Public can read reviews"     ON store_reviews;
DROP POLICY IF EXISTS "Anyone can insert a review"  ON store_reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON store_reviews;

CREATE POLICY "Public can read reviews"
  ON store_reviews FOR SELECT
  USING (true);

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
