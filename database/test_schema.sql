-- =====================================================
-- TEST THE NEW SCHEMA
-- =====================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'brands', 'user_brands', 'clients', 'services', 'appointments')
ORDER BY table_name;

-- Check if user_brands table has the correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_brands'
ORDER BY ordinal_position;

-- Check if RLS is disabled (for development)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'brands', 'user_brands')
ORDER BY tablename;

-- Test insert (this should work if RLS is disabled)
-- Note: You'll need to replace 'test-user-id' with an actual auth.users id
/*
INSERT INTO profiles (id, full_name, email, phone, role) 
VALUES ('test-user-id', 'Test User', 'test@example.com', '+1234567890', 'owner');

INSERT INTO brands (name, description, owner_id) 
VALUES ('Test Brand', 'A test brand', 'test-user-id');

INSERT INTO user_brands (user_id, brand_id, role) 
VALUES ('test-user-id', (SELECT id FROM brands WHERE name = 'Test Brand'), 'owner');
*/ 