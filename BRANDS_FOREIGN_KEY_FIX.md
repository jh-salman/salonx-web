# Fix for "brands_owner_id_fkey" Foreign Key Constraint Violation

## Problem Description

The error `insert or update on table "brands" violates foreign key constraint "brands_owner_id_fkey"` occurs when trying to insert or update a record in the `brands` table with an `owner_id` that doesn't exist in the `profiles` table.

## Root Cause

The issue stems from a **circular dependency** in the database schema:

1. `brands` table has `owner_id` that references `profiles(id)`
2. `profiles` table has `brand_id` that references `brands(id)`

This creates a chicken-and-egg problem where you can't insert into either table without the other existing first.

## Solutions

### Solution 1: Quick Fix (Recommended)

Run the following SQL in your Supabase SQL editor:

```sql
-- Drop the problematic constraint
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_owner_id_fkey;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS fk_brands_owner_id;

-- Recreate the constraint with proper name
ALTER TABLE brands 
ADD CONSTRAINT fk_brands_owner_id 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix RLS policies to allow brand creation during signup
DROP POLICY IF EXISTS "Insert own brand" ON brands;

CREATE POLICY "Insert own brand" ON brands
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR
    (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  );
```

### Solution 2: Application Code Fix

The main issue was in the signup process where the code was trying to create a brand BEFORE creating the profile. I've already fixed this in `src/features/auth/authSlice.js`:

**Before (Problematic):**
```javascript
// Create brand first (WRONG)
const { data: brandData, error: brandError } = await supabase
  .from('brands')
  .insert({
    name: brandName,
    owner_id: user.id  // ❌ Profile doesn't exist yet!
  })

// Create profile later
const { data, error } = await supabase
  .from('profiles')
  .insert({...})
```

**After (Fixed):**
```javascript
// Create profile FIRST
const { data, error } = await supabase
  .from('profiles')
  .insert({
    id: user.id,
    full_name: fullName,
    email: email,
    phone: phone,
    role: role
  })

// THEN create brand (AFTER profile exists)
const { data: brandData, error: brandError } = await supabase
  .from('brands')
  .insert({
    name: brandName,
    owner_id: user.id  // ✅ Profile exists now!
  })
```

### Solution 3: Database Function Approach

For a more robust solution, you can use the database function approach from `database/fix_brands_foreign_key.sql`:

```sql
-- Create a function to safely insert brands with profile creation
CREATE OR REPLACE FUNCTION create_brand_with_profile(
    brand_name TEXT,
    brand_description TEXT DEFAULT NULL,
    owner_email TEXT,
    owner_full_name TEXT,
    owner_phone TEXT DEFAULT NULL,
    owner_role TEXT DEFAULT 'owner'
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    brand_id UUID;
BEGIN
    -- Create or update profile
    INSERT INTO profiles (id, full_name, email, phone, role)
    VALUES (
        auth.uid(),
        owner_full_name,
        owner_email,
        owner_phone,
        owner_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role
    RETURNING id INTO user_id;

    -- Create brand
    INSERT INTO brands (name, description, owner_id)
    VALUES (brand_name, brand_description, user_id)
    RETURNING id INTO brand_id;

    -- Update profile with brand_id
    UPDATE profiles 
    SET brand_id = brand_id
    WHERE id = user_id;

    RETURN brand_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Debugging Steps

If you're still experiencing issues, run these queries to debug:

### 1. Check if user exists in profiles
```sql
SELECT * FROM profiles WHERE id = 'your-user-id-here';
```

### 2. Check if user exists in auth.users
```sql
SELECT * FROM auth.users WHERE id = 'your-user-id-here';
```

### 3. Check existing brands and their owners
```sql
SELECT b.id, b.name, b.owner_id, p.full_name, p.email 
FROM brands b 
LEFT JOIN profiles p ON b.owner_id = p.id;
```

### 4. Check for orphaned brands
```sql
SELECT b.id, b.name, b.owner_id 
FROM brands b 
LEFT JOIN profiles p ON b.owner_id = p.id 
WHERE p.id IS NULL;
```

## Prevention

To prevent this issue in the future:

1. **Always create profiles before brands** in your application code
2. **Use database functions** for complex operations involving multiple tables
3. **Implement proper error handling** with retry logic
4. **Test signup flows** thoroughly in development

## Files Modified

1. `database/quick_fix_brands_fk.sql` - Quick SQL fix
2. `database/fix_brands_foreign_key.sql` - Comprehensive fix with debugging
3. `src/features/auth/authSlice.js` - Fixed signup order
4. `BRANDS_FOREIGN_KEY_FIX.md` - This documentation

## Next Steps

1. Run the quick fix SQL in your Supabase SQL editor
2. Test the signup process again
3. If issues persist, use the debugging queries to identify the specific problem
4. Consider implementing the database function approach for production

The fix ensures that profiles are created before brands, eliminating the foreign key constraint violation. 