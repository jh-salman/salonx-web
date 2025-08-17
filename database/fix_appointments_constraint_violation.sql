-- Fix appointments table constraint violation
-- First check existing data, then fix constraints

-- Step 1: Check current data state
SELECT 
  'Current State' as info,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE parked = true) as parked_appointments,
  COUNT(*) FILTER (WHERE parked = false) as active_appointments,
  COUNT(*) FILTER (WHERE date IS NULL) as null_date_appointments,
  COUNT(*) FILTER (WHERE parked = true AND date IS NULL) as correctly_parked_appointments,
  COUNT(*) FILTER (WHERE parked = true AND date IS NOT NULL) as incorrectly_parked_appointments
FROM appointments;

-- Step 2: Show appointments that violate the constraint
SELECT 
  id,
  client_id,
  parked,
  status,
  date,
  service_id,
  duration,
  price,
  created_at
FROM appointments 
WHERE parked = true AND (date IS NOT NULL OR service_id IS NOT NULL OR duration IS NOT NULL);

-- Step 3: Drop the problematic constraint first
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_parked_appointment_fields;

-- Step 4: Fix the data - set null values for parked appointments
UPDATE appointments 
SET 
  date = NULL,
  service_id = NULL,
  duration = NULL,
  price = NULL
WHERE parked = true AND (date IS NOT NULL OR service_id IS NOT NULL OR duration IS NOT NULL);

-- Step 5: Verify the fix
SELECT 
  'After Fix' as info,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE parked = true) as parked_appointments,
  COUNT(*) FILTER (WHERE parked = false) as active_appointments,
  COUNT(*) FILTER (WHERE date IS NULL) as null_date_appointments,
  COUNT(*) FILTER (WHERE parked = true AND date IS NULL) as correctly_parked_appointments,
  COUNT(*) FILTER (WHERE parked = true AND date IS NOT NULL) as incorrectly_parked_appointments
FROM appointments;

-- Step 6: Show parked appointments after fix
SELECT 
  id,
  client_id,
  parked,
  status,
  date,
  service_id,
  duration,
  price
FROM appointments 
WHERE parked = true;

-- Step 7: Now add the constraint back
ALTER TABLE appointments ADD CONSTRAINT check_parked_appointment_fields 
CHECK (
  (parked = false) OR 
  (parked = true AND date IS NULL AND service_id IS NULL AND duration IS NULL)
);

-- Step 8: Final verification
SELECT 
  'Final State' as info,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE parked = true) as parked_appointments,
  COUNT(*) FILTER (WHERE parked = false) as active_appointments,
  COUNT(*) FILTER (WHERE date IS NULL) as null_date_appointments,
  COUNT(*) FILTER (WHERE parked = true AND date IS NULL) as correctly_parked_appointments
FROM appointments; 