-- =====================================================
-- FIX USER_BRANDS RLS POLICIES FOR SIGNUP
-- =====================================================

-- This script fixes the RLS policies for user_brands table
-- to allow proper signup process

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Select user brands" ON user_brands;
DROP POLICY IF EXISTS "Insert user brands" ON user_brands;
DROP POLICY IF EXISTS "Update user brands" ON user_brands;
DROP POLICY IF EXISTS "Delete user brands" ON user_brands;

-- Step 2: Create improved policies
CREATE POLICY "Select user brands" ON user_brands
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Insert user brands during signup" ON user_brands
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    -- Allow insertion during signup process
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Update user brands" ON user_brands
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delete user brands" ON user_brands
  FOR DELETE USING (user_id = auth.uid());

-- Step 3: Alternative - Temporarily disable RLS for development
-- Uncomment the line below if you want to disable RLS temporarily
-- ALTER TABLE user_brands DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_brands'
ORDER BY policyname;

-- Step 5: Test the policies
-- This query should work if policies are correct
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
    AND tc.table_name = 'user_brands'; 