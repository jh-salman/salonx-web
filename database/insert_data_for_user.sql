-- Insert test data for user: 1bb0bc41-165e-43ea-bda3-9cc3a8f64621
-- Run this in Supabase SQL editor

-- Insert test clients for this user
INSERT INTO clients (full_name, phone, email, stylist_id, brand_id) VALUES
('John Smith', '+1234567890', 'john@example.com', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Sarah Johnson', '+1234567891', 'sarah@example.com', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Mike Davis', '+1234567892', 'mike@example.com', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Lisa Wilson', '+1234567893', 'lisa@example.com', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('David Brown', '+1234567894', 'david@example.com', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL);

-- Insert test services for this user
INSERT INTO services (name, description, price, duration, stylist_id, brand_id) VALUES
('Haircut', 'Basic haircut service', 45.00, 60, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Hair Coloring', 'Professional hair coloring service', 120.00, 120, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Hair Styling', 'Hair styling and blowout', 35.00, 45, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Manicure', 'Basic manicure service', 25.00, 30, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL),
('Pedicure', 'Basic pedicure service', 35.00, 45, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NULL);

-- Check the inserted data
SELECT COUNT(*) as client_count FROM clients WHERE stylist_id = '1bb0bc41-165e-43ea-bda3-9cc3a8f64621';
SELECT COUNT(*) as service_count FROM services WHERE stylist_id = '1bb0bc41-165e-43ea-bda3-9cc3a8f64621'; 