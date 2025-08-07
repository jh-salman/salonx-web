-- =====================================================
-- FIX APPOINTMENTS RLS POLICIES
-- =====================================================

-- This script fixes the RLS policies for appointments table
-- to allow proper appointment creation

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "View own or brand appointments" ON appointments;
DROP POLICY IF EXISTS "Insert own or owner on team" ON appointments;
DROP POLICY IF EXISTS "Update own appointments" ON appointments;
DROP POLICY IF EXISTS "Delete own appointments" ON appointments;

-- Step 2: Create improved policies
CREATE POLICY "View own or brand appointments" ON appointments
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()) OR
    created_by = auth.uid()
  );

CREATE POLICY "Insert appointments" ON appointments
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Update own appointments" ON appointments
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Delete own appointments" ON appointments
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid())
  );

-- Step 3: Alternative - Temporarily disable RLS for development
-- Uncomment the line below if you want to disable RLS temporarily
-- ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'appointments'
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
    AND tc.table_name = 'appointments'; 