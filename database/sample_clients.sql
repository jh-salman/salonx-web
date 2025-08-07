-- =====================================================
-- SAMPLE CLIENTS FOR TESTING
-- =====================================================
-- Run this script in Supabase SQL Editor to add sample clients

-- Insert sample clients
INSERT INTO clients (id, full_name, phone, email, birthday, stylist_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Lionesse Yami', '+1234567890', 'lionesse@example.com', '1990-05-15', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440011', 'Christian Chang', '+1234567891', 'christian@example.com', '1985-08-22', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 'Jade Solis', '+1234567892', 'jade@example.com', '1992-12-10', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440013', 'Claude Bowman', '+1234567893', 'claude@example.com', '1988-03-18', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440014', 'Mone Lara', '+1234567894', 'mone@example.com', '1995-07-25', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440015', 'Brooke Barber', '+1234567895', 'brooke@example.com', '1991-11-30', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440016', 'Ayesha Drake', '+1234567896', 'ayesha@example.com', '1987-09-14', '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW());

-- Insert sample services
INSERT INTO services (id, name, description, price, duration, stylist_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', 'Haircut', 'Basic haircut service', 45.00, 60, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440021', 'Hair Coloring', 'Professional hair coloring', 120.00, 120, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440022', 'Styling', 'Hair styling and blowout', 35.00, 45, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', 'Manicure', 'Basic manicure service', 25.00, 30, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW()),
  ('550e8400-e29b-41d4-a716-446655440024', 'Pedicure', 'Basic pedicure service', 35.00, 45, '1bb0bc41-165e-43ea-bda3-9cc3a8f64621', NOW());

-- =====================================================
-- END OF SAMPLE DATA
-- ===================================================== 