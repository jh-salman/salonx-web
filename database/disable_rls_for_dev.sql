-- =====================================================
-- TEMPORARILY DISABLE RLS FOR DEVELOPMENT
-- =====================================================

-- This script temporarily disables RLS for development
-- Run this to fix signup issues

-- Disable RLS on key tables for development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'brands', 'user_brands', 'clients', 'services', 'appointments')
ORDER BY tablename;

-- Note: Remember to re-enable RLS for production
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_brands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY; 