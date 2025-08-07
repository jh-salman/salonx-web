-- =====================================================
-- FIX PROFILES BRAND_ID COLUMN ISSUE
-- =====================================================

-- This script adds the brand_id column to profiles table
-- and fixes the schema cache issue

-- Step 1: Add brand_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Step 2: Create index for brand_id
CREATE INDEX IF NOT EXISTS idx_profiles_brand_id ON profiles(brand_id);

-- Step 3: Update RLS policies to include brand_id
DROP POLICY IF EXISTS "Allow self access" ON profiles;
DROP POLICY IF EXISTS "Allow insert" ON profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON profiles;

-- Create improved policies for profiles
CREATE POLICY "Allow self access" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );

CREATE POLICY "Allow update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'brand_id';

-- Step 5: Check if there are any existing user_brands relationships
-- that need to be migrated to the brand_id column
SELECT 
    ub.user_id,
    ub.brand_id,
    p.brand_id as profile_brand_id
FROM user_brands ub
LEFT JOIN profiles p ON ub.user_id = p.id
WHERE ub.role = 'owner';

-- Step 6: Update profiles with brand_id from user_brands (optional)
-- Uncomment this if you want to migrate existing relationships
/*
UPDATE profiles 
SET brand_id = (
    SELECT brand_id 
    FROM user_brands 
    WHERE user_id = profiles.id 
    AND role = 'owner' 
    LIMIT 1
)
WHERE brand_id IS NULL;
*/ 