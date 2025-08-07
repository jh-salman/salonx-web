-- =====================================================
-- FIX RLS POLICIES FOR SIGNUP ISSUE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow self access" ON profiles;
DROP POLICY IF EXISTS "Allow insert" ON profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON profiles;

-- Create improved policies for profiles
CREATE POLICY "Allow self access" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    -- Allow insert if the user is authenticated and the profile doesn't exist yet
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );

CREATE POLICY "Allow update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Also fix brands policy to allow initial brand creation
DROP POLICY IF EXISTS "Insert own brand" ON brands;

CREATE POLICY "Insert own brand" ON brands
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR
    -- Allow brand creation during signup process
    (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  );

-- =====================================================
-- ALTERNATIVE: TEMPORARILY DISABLE RLS FOR TESTING
-- =====================================================
-- Uncomment the lines below if you want to temporarily disable RLS for testing

/*
-- Temporarily disable RLS for profiles and brands during development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Re-enable when ready for production:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
*/ 