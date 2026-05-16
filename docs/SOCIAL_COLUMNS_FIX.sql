-- SOCIAL HUB FIX: Run this in your Supabase SQL Editor
-- This adds the missing columns to store_reviews so your Social Hub posts actually save!

ALTER TABLE public.store_reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS tagging_product INTEGER;
