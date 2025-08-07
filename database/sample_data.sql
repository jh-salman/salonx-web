-- Sample data for testing
-- Make sure to run this after the schema is set up

-- Sample clients (replace the stylist_id with actual user ID from your auth.users)
INSERT INTO clients (full_name, phone, email, stylist_id, brand_id) VALUES
('John Smith', '+1234567890', 'john@example.com', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Sarah Johnson', '+1234567891', 'sarah@example.com', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Mike Davis', '+1234567892', 'mike@example.com', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Lisa Wilson', '+1234567893', 'lisa@example.com', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('David Brown', '+1234567894', 'david@example.com', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');

-- Sample services (replace the stylist_id with actual user ID from your auth.users)
INSERT INTO services (name, description, price, duration, stylist_id, brand_id) VALUES
('Haircut', 'Basic haircut service', 45.00, 60, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Hair Coloring', 'Professional hair coloring service', 120.00, 120, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Hair Styling', 'Hair styling and blowout', 35.00, 45, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Manicure', 'Basic manicure service', 25.00, 30, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Pedicure', 'Basic pedicure service', 35.00, 45, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');

-- Sample appointments
INSERT INTO appointments (stylist_id, client_id, service_id, brand_id, date, duration, price, type, notes, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM clients WHERE full_name = 'John Smith' LIMIT 1), (SELECT id FROM services WHERE name = 'Haircut' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', NOW() + INTERVAL '1 day', 60, 45.00, 'normal', 'Regular haircut', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM clients WHERE full_name = 'Sarah Johnson' LIMIT 1), (SELECT id FROM services WHERE name = 'Hair Coloring' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', NOW() + INTERVAL '2 days', 120, 120.00, 'normal', 'Full hair coloring', '550e8400-e29b-41d4-a716-446655440001'); 