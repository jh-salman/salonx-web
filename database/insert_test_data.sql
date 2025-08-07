-- Insert test data for current user
-- Run this in Supabase SQL editor after signing up

-- First, get the current user's ID
-- Replace 'your-email@example.com' with the actual email you used to sign up
SELECT id, full_name, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert test data using that user ID
-- Replace 'USER_ID_HERE' with the actual user ID from above query

-- Insert test clients
INSERT INTO clients (full_name, phone, email, stylist_id, brand_id) VALUES
('Test Client 1', '+1234567890', 'client1@test.com', 'USER_ID_HERE', NULL),
('Test Client 2', '+1234567891', 'client2@test.com', 'USER_ID_HERE', NULL),
('Test Client 3', '+1234567892', 'client3@test.com', 'USER_ID_HERE', NULL);

-- Insert test services
INSERT INTO services (name, description, price, duration, stylist_id, brand_id) VALUES
('Test Service 1', 'Test service description', 50.00, 60, 'USER_ID_HERE', NULL),
('Test Service 2', 'Another test service', 75.00, 90, 'USER_ID_HERE', NULL),
('Test Service 3', 'Third test service', 100.00, 120, 'USER_ID_HERE', NULL);

-- Check the inserted data
SELECT * FROM clients WHERE stylist_id = 'USER_ID_HERE';
SELECT * FROM services WHERE stylist_id = 'USER_ID_HERE'; 