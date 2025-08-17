-- Simple fix for appointments table constraints
-- Run this step by step

-- Step 1: Drop all problematic constraints first
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_parked_appointment_fields;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_non_parked_appointment_fields;

-- Step 2: Drop NOT NULL constraints
ALTER TABLE appointments ALTER COLUMN date DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN price DROP NOT NULL;

-- Step 3: Fix existing data - set null values for parked appointments
UPDATE appointments 
SET 
  date = NULL,
  service_id = NULL,
  duration = NULL,
  price = NULL
WHERE parked = true;

-- Step 4: Verify the fix
SELECT 
  'Data after fix' as info,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE parked = true) as parked_appointments,
  COUNT(*) FILTER (WHERE parked = false) as active_appointments,
  COUNT(*) FILTER (WHERE date IS NULL) as null_date_appointments
FROM appointments;

-- Step 5: Show parked appointments
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