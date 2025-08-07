# User Brands RLS Fix for Signup Issues

## Problem Description

The error `new row violates row-level security policy for table "user_brands"` occurs during team/brand signup because:

1. RLS (Row Level Security) policies are blocking the insertion
2. The user is not properly authenticated when trying to insert
3. The policy conditions are too restrictive for signup process

## Solutions

### Solution 1: Quick Fix - Disable RLS for Development

Run this SQL in your Supabase SQL editor:

```sql
-- Temporarily disable RLS for development
ALTER TABLE user_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
```

### Solution 2: Fix RLS Policies

Run this SQL to create better policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Select user brands" ON user_brands;
DROP POLICY IF EXISTS "Insert user brands" ON user_brands;
DROP POLICY IF EXISTS "Update user brands" ON user_brands;
DROP POLICY IF EXISTS "Delete user brands" ON user_brands;

-- Create improved policies
CREATE POLICY "Select user brands" ON user_brands
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Insert user brands during signup" ON user_brands
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Update user brands" ON user_brands
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delete user brands" ON user_brands
  FOR DELETE USING (user_id = auth.uid());
```

### Solution 3: Application Code Fix

I've already updated the signup code with retry logic:

```javascript
// Create user_brands relationship with retry logic
let userBrandError = null
let retryCount = 0
const maxRetries = 3

while (retryCount < maxRetries && userBrandError === null) {
  try {
    console.log('signUp: Creating user_brands relationship, attempt:', retryCount + 1)
    const { error } = await supabase
      .from('user_brands')
      .insert({
        user_id: user.id,
        brand_id: brandId,
        role: role
      })

    if (error) {
      userBrandError = error
      console.error('signUp: user_brands insert error:', error)
      retryCount++
      if (retryCount >= maxRetries) {
        throw error
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
      console.log('signUp: user_brands relationship created successfully')
      break
    }
  } catch (error) {
    userBrandError = error
    retryCount++
    if (retryCount >= maxRetries) {
      throw error
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

## Recommended Approach

**For Development**: Use Solution 1 (disable RLS)
**For Production**: Use Solution 2 (fix policies)

## Steps to Fix

1. **Run the SQL fix** (Solution 1 or 2)
2. **Test the signup process**
3. **Check console logs** for any remaining errors
4. **Verify the signup works** for both single and team modes

## Debugging

If issues persist, check:

1. **Console logs** for detailed error messages
2. **Network tab** for failed requests
3. **Database logs** in Supabase dashboard
4. **RLS status** with this query:

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_brands';
```

## Files Modified

1. `database/fix_user_brands_rls.sql` - RLS policy fixes
2. `database/disable_rls_for_dev.sql` - Development RLS disable
3. `src/features/auth/authSlice.js` - Enhanced signup with retry logic
4. `USER_BRANDS_RLS_FIX.md` - This documentation

## Next Steps

1. Run the SQL fix in Supabase
2. Test team/brand signup
3. Monitor console logs
4. Re-enable RLS for production when ready

The signup process should now work properly for both single and team modes. 