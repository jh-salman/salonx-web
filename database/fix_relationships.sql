-- =====================================================
-- FIX RELATIONSHIP ISSUES BETWEEN PROFILES AND BRANDS
-- =====================================================

-- Drop existing foreign key constraints to recreate them with proper names
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_brand;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_owner_id_fkey;

-- Recreate foreign key constraints with explicit names
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_brand_id 
FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

ALTER TABLE brands 
ADD CONSTRAINT fk_brands_owner_id 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add comments to clarify relationships
COMMENT ON CONSTRAINT fk_profiles_brand_id ON profiles IS 'Profile belongs to a brand (for team mode)';
COMMENT ON CONSTRAINT fk_brands_owner_id ON brands IS 'Brand is owned by a profile (user)';

-- =====================================================
-- VERIFY RELATIONSHIPS
-- =====================================================

-- Check if constraints exist
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
    AND tc.table_name IN ('profiles', 'brands')
ORDER BY tc.table_name, tc.constraint_name; 