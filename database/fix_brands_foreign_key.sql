-- =====================================================
-- FIX BRANDS FOREIGN KEY CONSTRAINT ISSUE
-- =====================================================

-- This script fixes the "brands_owner_id_fkey" foreign key constraint violation
-- The issue occurs when trying to insert/update brands with an owner_id that doesn't exist in profiles

-- =====================================================
-- STEP 1: CHECK CURRENT STATE
-- =====================================================

-- Check if the constraint exists and what it references
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'brands'
    AND kcu.column_name = 'owner_id';

-- =====================================================
-- STEP 2: TEMPORARILY DROP THE CONSTRAINT
-- =====================================================

-- Drop the problematic constraint
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_owner_id_fkey;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS fk_brands_owner_id;

-- =====================================================
-- STEP 3: ENSURE PROFILES TABLE EXISTS AND HAS DATA
-- =====================================================

-- Check if profiles table exists and has the user
-- This query will help identify if the user exists in profiles
-- Replace 'your-user-id-here' with the actual user ID causing the issue
/*
SELECT id, full_name, email, role 
FROM profiles 
WHERE id = 'your-user-id-here';
*/

-- =====================================================
-- STEP 4: RECREATE THE CONSTRAINT WITH PROPER SETTINGS
-- =====================================================

-- Recreate the foreign key constraint with explicit name and proper settings
ALTER TABLE brands 
ADD CONSTRAINT fk_brands_owner_id 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add a comment to clarify the relationship
COMMENT ON CONSTRAINT fk_brands_owner_id ON brands IS 'Brand is owned by a profile (user)';

-- =====================================================
-- STEP 5: VERIFY THE FIX
-- =====================================================

-- Check that the constraint was created properly
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'brands'
    AND kcu.column_name = 'owner_id';

-- =====================================================
-- STEP 6: ALTERNATIVE SOLUTION - USE A FUNCTION
-- =====================================================

-- Create a function to safely insert brands with profile creation
CREATE OR REPLACE FUNCTION create_brand_with_profile(
    brand_name TEXT,
    brand_description TEXT DEFAULT NULL,
    owner_email TEXT,
    owner_full_name TEXT,
    owner_phone TEXT DEFAULT NULL,
    owner_role TEXT DEFAULT 'owner'
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    brand_id UUID;
BEGIN
    -- First, ensure the user exists in auth.users (this should be done by your app)
    -- Then create or get the profile
    INSERT INTO profiles (id, full_name, email, phone, role)
    VALUES (
        auth.uid(), -- This assumes the user is authenticated
        owner_full_name,
        owner_email,
        owner_phone,
        owner_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role
    RETURNING id INTO user_id;

    -- Now create the brand
    INSERT INTO brands (name, description, owner_id)
    VALUES (brand_name, brand_description, user_id)
    RETURNING id INTO brand_id;

    -- Update the profile with the brand_id
    UPDATE profiles 
    SET brand_id = brand_id
    WHERE id = user_id;

    RETURN brand_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: RLS POLICIES FOR SAFE BRAND CREATION
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Insert own brand" ON brands;
DROP POLICY IF EXISTS "Select brands if owner" ON brands;
DROP POLICY IF EXISTS "Update own brand" ON brands;
DROP POLICY IF EXISTS "Delete own brand" ON brands;

-- Create improved policies
CREATE POLICY "Select brands if owner" ON brands
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Insert own brand" ON brands
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR
    -- Allow brand creation during signup process
    (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  );

CREATE POLICY "Update own brand" ON brands
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Delete own brand" ON brands
  FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- STEP 8: DEBUGGING QUERIES
-- =====================================================

-- Use these queries to debug the issue:

-- 1. Check if a specific user exists in profiles
-- SELECT * FROM profiles WHERE id = 'your-user-id-here';

-- 2. Check if a specific user exists in auth.users
-- SELECT * FROM auth.users WHERE id = 'your-user-id-here';

-- 3. Check existing brands and their owners
-- SELECT b.id, b.name, b.owner_id, p.full_name, p.email 
-- FROM brands b 
-- LEFT JOIN profiles p ON b.owner_id = p.id;

-- 4. Check for orphaned brands (brands with non-existent owners)
-- SELECT b.id, b.name, b.owner_id 
-- FROM brands b 
-- LEFT JOIN profiles p ON b.owner_id = p.id 
-- WHERE p.id IS NULL;

-- =====================================================
-- STEP 9: CLEANUP ORPHANED DATA (if needed)
-- =====================================================

-- Uncomment and run these if you have orphaned brands:
/*
-- Delete brands with non-existent owners
DELETE FROM brands 
WHERE owner_id NOT IN (SELECT id FROM profiles);

-- Or update them to have a valid owner (replace with actual user ID)
-- UPDATE brands 
-- SET owner_id = 'valid-user-id-here' 
-- WHERE owner_id NOT IN (SELECT id FROM profiles);
*/

-- =====================================================
-- END OF FIX
-- ===================================================== 