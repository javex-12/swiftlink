-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read reviews
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews"
  ON store_reviews FOR SELECT USING (true);

CREATE POLICY "Anyone can post review"
  ON store_reviews FOR INSERT WITH CHECK (true);

-- Index for fast lookup by store
CREATE INDEX IF NOT EXISTS idx_store_reviews_store_id ON store_reviews(store_id);

CREATE TABLE IF NOT EXISTS store_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES store_reviews(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read and write comments
ALTER TABLE store_review_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON store_review_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can post comment" ON store_review_comments FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_store_review_comments_review_id ON store_review_comments(review_id);
