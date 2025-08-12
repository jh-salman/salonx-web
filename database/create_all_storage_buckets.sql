-- Create all storage buckets for SalonX application
-- This should be run in the Supabase SQL editor

-- =====================================================
-- 1. BRANDING BUCKET (for banner images)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  8388608, -- 8MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ATTACHMENTS BUCKET (for appointment files)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  52428800, -- 50MB limit for documents
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. AVATARS BUCKET (for user profile pictures)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  4194304, -- 4MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. LOGOS BUCKET (for brand logos)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  4194304, -- 4MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- BRANDING BUCKET POLICIES
CREATE POLICY "Allow authenticated users to upload branding images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view branding images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own branding images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own branding images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);

-- ATTACHMENTS BUCKET POLICIES
CREATE POLICY "Allow authenticated users to upload attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

-- AVATARS BUCKET POLICIES
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- LOGOS BUCKET POLICIES
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
); 