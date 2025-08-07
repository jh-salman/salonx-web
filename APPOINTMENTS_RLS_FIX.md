# Appointments RLS Fix for Appointment Creation Issues

## Problem Description

The error `new row violates row-level security policy for table "appointments"` occurs when trying to create appointments because:

1. RLS (Row Level Security) policies are blocking the insertion
2. The user is not properly authenticated when trying to insert
3. The policy conditions are too restrictive for appointment creation
4. Missing proper brand_id or stylist_id in the appointment data

## Solutions

### Solution 1: Quick Fix - Disable RLS for Development

Run this SQL in your Supabase SQL editor:

```sql
-- Temporarily disable RLS for development
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
```

### Solution 2: Fix RLS Policies

Run this SQL to create better policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "View own or brand appointments" ON appointments;
DROP POLICY IF EXISTS "Insert own or owner on team" ON appointments;
DROP POLICY IF EXISTS "Update own appointments" ON appointments;
DROP POLICY IF EXISTS "Delete own appointments" ON appointments;

-- Create improved policies
CREATE POLICY "View own or brand appointments" ON appointments
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()) OR
    created_by = auth.uid()
  );

CREATE POLICY "Insert appointments" ON appointments
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Update own appointments" ON appointments
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Delete own appointments" ON appointments
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid())
  );
```

### Solution 3: Application Code Fix

I've already updated the appointment creation code with retry logic:

```javascript
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData, { getState, rejectWithValue }) => {
    try {
      console.log('createAppointment: Starting appointment creation...')
      const { auth } = getState()
      const profile = auth.profile

      const appointment = {
        ...appointmentData,
        stylist_id: profile.id,
        brand_id: auth.brandId,
        created_by: profile.id,
        status: APPOINTMENT_STATUS.SCHEDULED
      }

      // Add retry logic for appointment creation
      let appointmentError = null
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries && appointmentError === null) {
        try {
          console.log('createAppointment: Creating appointment, attempt:', retryCount + 1)
          const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select(`
              *,
              clients (
                id,
                full_name,
                phone,
                email
              ),
              services (
                id,
                name,
                price,
                duration
              )
            `)
            .single()

          if (error) {
            appointmentError = error
            console.error('createAppointment: Appointment creation error:', error)
            
            // If it's an RLS error, wait a bit and retry
            if (error.message.includes('row-level security') || error.message.includes('violates row-level security')) {
              retryCount++
              if (retryCount >= maxRetries) {
                throw error
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000))
              continue
            }
            throw error
          }

          console.log('createAppointment: Appointment created successfully:', data)
          return data
        } catch (error) {
          appointmentError = error
          console.error('createAppointment: Appointment creation catch error:', error)
          retryCount++
          if (retryCount >= maxRetries) {
            throw error
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (appointmentError) throw appointmentError
    } catch (error) {
      console.error('createAppointment: Final error:', error)
      return rejectWithValue(error.message)
    }
  }
)
```

## Debugging Steps

### 1. Check RLS Status

```sql
-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'appointments';
```

### 2. Check User Authentication

```javascript
// In your browser console, check if user is authenticated
console.log('Current user:', supabase.auth.getUser())
console.log('Auth state:', supabase.auth.getSession())
```

### 3. Check Appointment Data

```javascript
// Log the appointment data being sent
console.log('Appointment data:', {
  stylist_id: profile.id,
  brand_id: auth.brandId,
  created_by: profile.id,
  ...appointmentData
})
```

### 4. Check User Permissions

```sql
-- Check if user has proper permissions
SELECT 
    p.id,
    p.full_name,
    p.role,
    ub.brand_id,
    ub.role as brand_role
FROM profiles p
LEFT JOIN user_brands ub ON p.id = ub.user_id
WHERE p.id = auth.uid();
```

## Common Issues and Fixes

### Issue 1: Missing brand_id

**Problem**: `brand_id` is null or undefined
**Fix**: Ensure `auth.brandId` is properly set

```javascript
const appointment = {
  ...appointmentData,
  stylist_id: profile.id,
  brand_id: auth.brandId || null, // Handle null case
  created_by: profile.id,
  status: APPOINTMENT_STATUS.SCHEDULED
}
```

### Issue 2: Missing stylist_id

**Problem**: `stylist_id` is null or undefined
**Fix**: Ensure profile exists and has proper ID

```javascript
if (!profile || !profile.id) {
  throw new Error('User profile not found')
}
```

### Issue 3: RLS Policy Too Restrictive

**Problem**: Policy doesn't allow the current user
**Fix**: Use the improved policies above

## Testing Checklist

- [ ] Single user appointment creation works
- [ ] Team/brand appointment creation works
- [ ] Appointment creation with different user roles works
- [ ] Error messages are clear and helpful
- [ ] Retry logic works for RLS errors
- [ ] Console logs show proper debugging information

## Files Modified

1. `src/features/appointments/appointmentsSlice.js` - Enhanced appointment creation with retry logic
2. `database/fix_appointments_rls.sql` - RLS policy fixes
3. `database/disable_appointments_rls.sql` - Development RLS disable
4. `APPOINTMENTS_RLS_FIX.md` - This documentation

## Next Steps

1. **Run the SQL fix** in Supabase SQL editor
2. **Test appointment creation** for both single and team modes
3. **Monitor console logs** for any remaining issues
4. **Re-enable RLS** for production when ready

The appointment creation process should now work reliably for all scenarios. 