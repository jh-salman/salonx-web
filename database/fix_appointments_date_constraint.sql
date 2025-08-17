-- Fix appointments table date constraint to allow null values for parked appointments
-- This allows parked appointments to have null date, service_id, and duration

-- Step 1: Drop the NOT NULL constraint from date column
ALTER TABLE appointments ALTER COLUMN date DROP NOT NULL;

-- Step 2: Drop the NOT NULL constraint from duration column (since parked appointments won't have duration)
ALTER TABLE appointments ALTER COLUMN duration DROP NOT NULL;

-- Step 3: Drop the NOT NULL constraint from price column (since parked appointments won't have price)
ALTER TABLE appointments ALTER COLUMN price DROP NOT NULL;

-- Step 4: Add a check constraint to ensure that non-parked appointments have required fields
ALTER TABLE appointments ADD CONSTRAINT check_non_parked_appointment_fields 
CHECK (
  (parked = true) OR 
  (parked = false AND date IS NOT NULL AND duration IS NOT NULL AND price IS NOT NULL)
);

-- Step 5: Add a check constraint to ensure that parked appointments have null fields
ALTER TABLE appointments ADD CONSTRAINT check_parked_appointment_fields 
CHECK (
  (parked = false) OR 
  (parked = true AND date IS NULL AND service_id IS NULL AND duration IS NULL)
);

-- Step 6: Update any existing appointments that might be inconsistent
-- This will set parked=true for appointments that have null date but aren't marked as parked
UPDATE appointments 
SET parked = true, 
    status = 'parked',
    service_id = NULL,
    duration = NULL,
    price = NULL
WHERE date IS NULL AND parked = false;

-- Step 7: Update any existing appointments that have parked=true but still have date
-- This will set date=NULL for appointments that are marked as parked but still have date
UPDATE appointments 
SET date = NULL,
    service_id = NULL,
    duration = NULL,
    price = NULL
WHERE parked = true AND date IS NOT NULL;

-- Step 8: Verify the changes
SELECT 
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE parked = true) as parked_appointments,
  COUNT(*) FILTER (WHERE parked = false) as active_appointments,
  COUNT(*) FILTER (WHERE date IS NULL) as null_date_appointments,
  COUNT(*) FILTER (WHERE parked = true AND date IS NULL) as correctly_parked_appointments
FROM appointments; 