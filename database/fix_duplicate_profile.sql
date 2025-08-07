-- =====================================================
-- FIX DUPLICATE PROFILE ISSUES DURING SIGNUP
-- =====================================================

-- This script fixes the "duplicate key value violates unique constraint" error
-- that occurs when trying to create a profile that already exists

-- Step 1: Check for existing duplicate profiles
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE id IN (
    SELECT id 
    FROM profiles 
    GROUP BY id 
    HAVING COUNT(*) > 1
)
ORDER BY id, created_at;

-- Step 2: Create a function to safely handle profile creation
CREATE OR REPLACE FUNCTION create_profile_safely(
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'stylist'
)
RETURNS JSON AS $$
DECLARE
    existing_profile profiles%ROWTYPE;
    new_profile profiles%ROWTYPE;
BEGIN
    -- Check if profile already exists
    SELECT * INTO existing_profile 
    FROM profiles 
    WHERE id = user_id;
    
    -- If profile exists, return it
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'profile', existing_profile,
            'action', 'existing'
        );
    END IF;
    
    -- Create new profile
    INSERT INTO profiles (id, full_name, email, phone, role)
    VALUES (user_id, full_name, email, phone, user_role)
    RETURNING * INTO new_profile;
    
    RETURN json_build_object(
        'success', true,
        'profile', new_profile,
        'action', 'created'
    );
    
EXCEPTION
    WHEN unique_violation THEN
        -- Profile was created by another process, fetch it
        SELECT * INTO existing_profile 
        FROM profiles 
        WHERE id = user_id;
        
        RETURN json_build_object(
            'success', true,
            'profile', existing_profile,
            'action', 'fetched'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a function to handle brand creation with profile
CREATE OR REPLACE FUNCTION create_brand_with_profile_safely(
    brand_name TEXT,
    brand_description TEXT DEFAULT NULL,
    owner_id UUID,
    owner_full_name TEXT,
    owner_email TEXT,
    owner_phone TEXT DEFAULT NULL,
    owner_role TEXT DEFAULT 'owner'
)
RETURNS JSON AS $$
DECLARE
    profile_result JSON;
    brand_id UUID;
    user_brand_id UUID;
BEGIN
    -- Create or get profile safely
    SELECT create_profile_safely(owner_id, owner_full_name, owner_email, owner_phone, owner_role)
    INTO profile_result;
    
    IF (profile_result->>'success')::boolean = false THEN
        RETURN profile_result;
    END IF;
    
    -- Create brand
    INSERT INTO brands (name, description, owner_id)
    VALUES (brand_name, brand_description, owner_id)
    RETURNING id INTO brand_id;
    
    -- Create user_brands relationship
    INSERT INTO user_brands (user_id, brand_id, role)
    VALUES (owner_id, brand_id, owner_role)
    RETURNING id INTO user_brand_id;
    
    RETURN json_build_object(
        'success', true,
        'profile', profile_result->'profile',
        'brand_id', brand_id,
        'user_brand_id', user_brand_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update RLS policies to allow function execution
DROP POLICY IF EXISTS "Allow insert during signup" ON profiles;
CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );

-- Step 5: Verify the functions were created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('create_profile_safely', 'create_brand_with_profile_safely')
ORDER BY routine_name;

-- Step 6: Test the function (uncomment to test)
/*
-- Test profile creation
SELECT create_profile_safely(
    'test-user-id'::UUID,
    'Test User',
    'test@example.com',
    '+1234567890',
    'owner'
);
*/ 