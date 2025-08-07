-- =====================================================
-- TEMPORARILY DISABLE APPOINTMENTS RLS FOR DEVELOPMENT
-- =====================================================

-- This script temporarily disables RLS for appointments
-- Run this to fix appointment creation issues

-- Disable RLS on appointments table for development
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on related tables if needed
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('appointments', 'clients', 'services')
ORDER BY tablename;

-- Note: Remember to re-enable RLS for production
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY; 