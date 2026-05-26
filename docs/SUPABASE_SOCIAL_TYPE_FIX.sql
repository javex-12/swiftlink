-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO SEPARATE POSTS FROM REVIEWS

ALTER TABLE public.store_reviews 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'review';

-- Convert existing social posts into 'post' type
UPDATE public.store_reviews 
SET type = 'post' 
WHERE attachments IS NOT NULL OR tagging_product IS NOT NULL;
