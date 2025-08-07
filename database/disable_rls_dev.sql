-- =====================================================
-- TEMPORARILY DISABLE RLS FOR DEVELOPMENT
-- =====================================================
-- Run this script in Supabase SQL Editor to disable RLS during development

-- Disable RLS for profiles and brands
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Optional: Also disable for other tables if needed during development
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE services DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE performance_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE waitlist DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE branding_content DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- TO RE-ENABLE RLS FOR PRODUCTION:
-- =====================================================
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- Then run the fix_rls.sql script to set up proper policies
*/ 