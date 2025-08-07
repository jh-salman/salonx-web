-- =====================================================
-- QUICK FIX FOR BRANDS FOREIGN KEY CONSTRAINT
-- =====================================================

-- This is a quick fix for the "brands_owner_id_fkey" violation
-- Run this in your Supabase SQL editor

-- Step 1: Drop the problematic constraint
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_owner_id_fkey;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS fk_brands_owner_id;

-- Step 2: Recreate the constraint with proper name
ALTER TABLE brands 
ADD CONSTRAINT fk_brands_owner_id 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 3: Fix RLS policies to allow brand creation during signup
DROP POLICY IF EXISTS "Insert own brand" ON brands;

CREATE POLICY "Insert own brand" ON brands
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR
    (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  );

-- Step 4: Verify the fix
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