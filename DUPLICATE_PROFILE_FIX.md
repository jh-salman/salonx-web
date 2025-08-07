# Duplicate Profile Fix for Signup Issues

## Problem Description

The error `duplicate key value violates unique constraint "profiles_pkey"` occurs during team/brand signup because:

1. The same user ID is being used to create a profile that already exists
2. Race conditions during the signup process
3. Multiple signup attempts with the same email
4. Timing issues between auth user creation and profile creation

## Solutions Implemented

### Solution 1: Application Code Fix

Updated the signup process to handle duplicate profiles:

```javascript
// Use upsert to handle existing profiles
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    full_name: fullName,
    email: email,
    phone: phone,
    role: role
  }, {
    onConflict: 'id',
    ignoreDuplicates: false
  })
  .select()
  .single()

// Handle duplicate key errors
if (error.message.includes('duplicate key') || error.message.includes('violates unique constraint')) {
  // Fetch existing profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  profileData = existingProfile
}
```

### Solution 2: Database Functions

Created safe database functions:

```sql
-- Safe profile creation function
CREATE OR REPLACE FUNCTION create_profile_safely(
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'stylist'
)
RETURNS JSON AS $$
-- Function implementation
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe brand creation with profile
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
-- Function implementation
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Solution 3: RLS Policy Updates

Updated RLS policies to allow proper signup:

```sql
DROP POLICY IF EXISTS "Allow insert during signup" ON profiles;
CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );
```

## Usage Examples

### Example 1: Using Database Function

```javascript
// Call the database function for safe profile creation
const { data, error } = await supabase.rpc('create_profile_safely', {
  user_id: user.id,
  full_name: fullName,
  email: email,
  phone: phone,
  user_role: role
})

if (error) {
  console.error('Profile creation error:', error)
  throw error
}

const result = data
if (result.success) {
  console.log('Profile action:', result.action) // 'created', 'existing', or 'fetched'
  profileData = result.profile
}
```

### Example 2: Using Brand Creation Function

```javascript
// Call the database function for safe brand creation
const { data, error } = await supabase.rpc('create_brand_with_profile_safely', {
  brand_name: brandName,
  brand_description: brandDescription,
  owner_id: user.id,
  owner_full_name: fullName,
  owner_email: email,
  owner_phone: phone,
  owner_role: role
})

if (error) {
  console.error('Brand creation error:', error)
  throw error
}

const result = data
if (result.success) {
  brandId = result.brand_id
  profileData = result.profile
}
```

## Debugging Steps

### 1. Check for Duplicate Profiles

```sql
-- Find duplicate profiles
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
```

### 2. Check RLS Status

```sql
-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';
```

### 3. Test Database Functions

```sql
-- Test profile creation function
SELECT create_profile_safely(
    'test-user-id'::UUID,
    'Test User',
    'test@example.com',
    '+1234567890',
    'owner'
);
```

## Prevention Strategies

1. **Use upsert operations** instead of insert
2. **Implement retry logic** with exponential backoff
3. **Use database functions** for complex operations
4. **Add proper error handling** for duplicate scenarios
5. **Implement proper validation** before signup

## Files Modified

1. `src/features/auth/authSlice.js` - Enhanced signup with upsert and error handling
2. `database/fix_duplicate_profile.sql` - Database functions and fixes
3. `DUPLICATE_PROFILE_FIX.md` - This documentation

## Next Steps

1. **Run the database fixes** in Supabase SQL editor
2. **Test the signup process** for both single and team modes
3. **Monitor console logs** for any remaining issues
4. **Implement the database functions** if needed for production

## Testing Checklist

- [ ] Single user signup works
- [ ] Team/brand signup works
- [ ] Duplicate email handling works
- [ ] Profile creation is idempotent
- [ ] Brand creation works with existing profiles
- [ ] Error messages are clear and helpful

The signup process should now handle duplicate profiles gracefully and work reliably for all scenarios. 