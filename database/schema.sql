-- SalonX Database Schema
-- Complete setup for the salon management application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: PROFILES TABLE (without FK first)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'stylist')) NOT NULL,
  brand_id UUID, -- reference added later
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 2: BRANDS TABLE
-- =====================================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 3: ALTER profiles to add brand FK
-- =====================================================
ALTER TABLE profiles
ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 4: CLIENTS TABLE
-- =====================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birthday DATE,
  notes TEXT,
  stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 5: SERVICES TABLE
-- =====================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 6: APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price NUMERIC(10,2) NOT NULL,
  type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'consultation', 'follow_up')),
  deposit_percent INTEGER DEFAULT 0,
  notes TEXT,
  attachment_url TEXT,
  parked BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'parked', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 7: ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 8: TIMERS TABLE
-- =====================================================
CREATE TABLE timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  pause_time TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 9: PERFORMANCE LOGS TABLE
-- =====================================================
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kpi_score JSONB, -- {revenue: 85, retail: 70, retention: 90, service_gain: 75}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 10: WAITLIST TABLE
-- =====================================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  requested_date_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 11: BRANDING CONTENT TABLE
-- =====================================================
CREATE TABLE branding_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- dashboard_top, checkout_area, etc.
  content JSONB NOT NULL, -- {title: "Welcome", subtitle: "..."}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_brand_id ON profiles(brand_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Clients indexes
CREATE INDEX idx_clients_stylist_id ON clients(stylist_id);
CREATE INDEX idx_clients_brand_id ON clients(brand_id);
CREATE INDEX idx_clients_full_name ON clients(full_name);

-- Appointments indexes
CREATE INDEX idx_appointments_stylist_id ON appointments(stylist_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_brand_id ON appointments(brand_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_parked ON appointments(parked);

-- Services indexes
CREATE INDEX idx_services_stylist_id ON services(stylist_id);
CREATE INDEX idx_services_brand_id ON services(brand_id);

-- Performance logs indexes
CREATE INDEX idx_performance_logs_stylist_id ON performance_logs(stylist_id);
CREATE INDEX idx_performance_logs_brand_id ON performance_logs(brand_id);
CREATE INDEX idx_performance_logs_date ON performance_logs(date);

-- Waitlist indexes
CREATE INDEX idx_waitlist_stylist_id ON waitlist(stylist_id);
CREATE INDEX idx_waitlist_brand_id ON waitlist(brand_id);
CREATE INDEX idx_waitlist_requested_date_time ON waitlist(requested_date_time);

-- Branding content indexes
CREATE INDEX idx_branding_content_brand_id ON branding_content(brand_id);
CREATE INDEX idx_branding_content_user_id ON branding_content(user_id);
CREATE INDEX idx_branding_content_section ON branding_content(section);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- PROFILES RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow self access" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- BRANDS RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select brands if owner" ON brands
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Insert own brand" ON brands
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Update own brand" ON brands
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Delete own brand" ON brands
  FOR DELETE USING (owner_id = auth.uid());

-- CLIENTS RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own clients" ON clients
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert own clients" ON clients
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update own clients" ON clients
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delete own clients" ON clients
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- SERVICES RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own services" ON services
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert own services" ON services
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update own services" ON services
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delete own services" ON services
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- APPOINTMENTS RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or brand appointments" ON appointments
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert own or owner on team" ON appointments
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'owner' AND brand_id = appointments.brand_id)
  );

CREATE POLICY "Update own appointments" ON appointments
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'owner' AND brand_id = appointments.brand_id)
  );

CREATE POLICY "Delete own appointments" ON appointments
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    created_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'owner' AND brand_id = appointments.brand_id)
  );

-- ATTACHMENTS RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select if appointment creator" ON attachments
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Insert if created appointment" ON attachments
  FOR INSERT WITH CHECK (
    appointment_id IN (
      SELECT id FROM appointments WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Update if created appointment" ON attachments
  FOR UPDATE USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Delete if created appointment" ON attachments
  FOR DELETE USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE created_by = auth.uid()
    )
  );

-- TIMERS RLS
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own timers" ON timers
  FOR SELECT USING (stylist_id = auth.uid());

CREATE POLICY "Insert own timers" ON timers
  FOR INSERT WITH CHECK (stylist_id = auth.uid());

CREATE POLICY "Update own timers" ON timers
  FOR UPDATE USING (stylist_id = auth.uid());

CREATE POLICY "Delete own timers" ON timers
  FOR DELETE USING (stylist_id = auth.uid());

-- PERFORMANCE LOGS RLS
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own or brand performance" ON performance_logs
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert own performance" ON performance_logs
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update own performance" ON performance_logs
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delete own performance" ON performance_logs
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- WAITLIST RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own or brand waitlist" ON waitlist
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert own waitlist" ON waitlist
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update own waitlist" ON waitlist
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delete own waitlist" ON waitlist
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- BRANDING CONTENT RLS
ALTER TABLE branding_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own or brand branding" ON branding_content
  FOR SELECT USING (
    user_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert own branding" ON branding_content
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update own branding" ON branding_content
  FOR UPDATE USING (
    user_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delete own branding" ON branding_content
  FOR DELETE USING (
    user_id = auth.uid() OR
    brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- =====================================================
-- ADD UPDATED_AT COLUMNS TO TABLES
-- =====================================================

-- Add updated_at column to tables that don't have it
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE performance_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE branding_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_logs_updated_at BEFORE UPDATE ON performance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_content_updated_at BEFORE UPDATE ON branding_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional) - Comment out if not needed
-- =====================================================

-- Note: This sample data requires a valid auth.users entry first
-- You can uncomment and modify these after creating a user through Supabase Auth

/*
-- Insert sample profile (requires existing auth.users entry)
INSERT INTO profiles (id, full_name, email, phone, role, brand_id) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'John Doe',
  'john@example.com',
  '+1234567890',
  'owner',
  NULL
);

-- Insert sample brand
INSERT INTO brands (id, name, description, owner_id) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sample Salon',
  'A sample salon for testing',
  '550e8400-e29b-41d4-a716-446655440001'
);

-- Update profile with brand_id
UPDATE profiles 
SET brand_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Insert sample services
INSERT INTO services (name, description, price, duration, stylist_id, brand_id) VALUES
('Haircut', 'Basic haircut service', 45.00, 60, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Hair Coloring', 'Professional hair coloring', 120.00, 120, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('Styling', 'Hair styling and blowout', 35.00, 45, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample branding content
INSERT INTO branding_content (brand_id, user_id, section, content) VALUES
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'dashboard_top', '{"title": "Welcome to Sample Salon", "subtitle": "Professional hair care services"}');
*/

-- =====================================================
-- END OF SCHEMA
-- ===================================================== 