-- Temporary script to disable RLS for testing
-- Run this in Supabase SQL editor to test if RLS is blocking the queries

-- Disable RLS temporarily for testing
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Check if data exists
SELECT COUNT(*) as client_count FROM clients;
SELECT COUNT(*) as service_count FROM services;

-- Re-enable RLS after testing
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY; 