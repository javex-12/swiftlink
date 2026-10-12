-- Store reviews: public customer feedback on merchant storefronts
CREATE TABLE IF NOT EXISTS store_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  -- For SwiftLink users (optional)
  reviewer_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_biz_name  text,        -- SwiftLink merchant's store/biz name
  reviewer_avatar    text,        -- SwiftLink merchant's bizImage URL
  -- For guests
  guest_name    text,
  -- Content
  message       text NOT NULL CHECK(char_length(message) >= 5 AND char_length(message) <= 800),
  rating        smallint CHECK(rating BETWEEN 1 AND 5),
  created_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS store_reviews_store_id_idx ON store_reviews(store_id);
CREATE INDEX IF NOT EXISTS store_reviews_created_at_idx ON store_reviews(created_at DESC);

-- RLS
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews for a given store (public storefront)
CREATE POLICY "Public can read reviews"
  ON store_reviews FOR SELECT
  USING (true);

-- Guests (anon) can insert with no reviewer_user_id
CREATE POLICY "Anyone can insert a review"
  ON store_reviews FOR INSERT
  WITH CHECK (
    -- Must have either a guest_name or a reviewer_user_id
    (guest_name IS NOT NULL AND reviewer_user_id IS NULL)
    OR
    (reviewer_user_id IS NOT NULL AND reviewer_user_id = auth.uid())
  );

-- Users can delete their own reviews
CREATE POLICY "Users can delete own review"
  ON store_reviews FOR DELETE
  USING (reviewer_user_id = auth.uid());
