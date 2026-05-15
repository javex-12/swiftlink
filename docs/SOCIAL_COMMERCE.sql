-- SOCIAL COMMERCE INTEGRATION
-- Run this to allow product tagging in social posts

ALTER TABLE public.store_reviews 
ADD COLUMN IF NOT EXISTS tagging_product BIGINT;

-- Optional: If you want to link it properly, but BIGINT is safer for flexible IDs
-- ALTER TABLE public.store_reviews ADD CONSTRAINT fk_tagging_product FOREIGN KEY (tagging_product) REFERENCES public.products(id);
