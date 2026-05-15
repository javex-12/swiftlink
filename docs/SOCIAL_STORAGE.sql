-- STORAGE BUCKET FOR SOCIAL MEDIA
-- Run this in your Supabase SQL Editor to enable photo sharing

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social_media', 'social_media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to view media
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'social_media');

-- 3. Allow authenticated users to upload their own media
CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'social_media');
