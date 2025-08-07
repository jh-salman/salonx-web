-- Fix clients and services RLS policies for single user mode
-- Run this in Supabase SQL editor

-- Fix CLIENTS RLS policies
DROP POLICY IF EXISTS "Select own clients" ON clients;
DROP POLICY IF EXISTS "Insert own clients" ON clients;
DROP POLICY IF EXISTS "Update own clients" ON clients;
DROP POLICY IF EXISTS "Delete own clients" ON clients;

CREATE POLICY "Select own clients" ON clients
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Insert own clients" ON clients
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Update own clients" ON clients
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Delete own clients" ON clients
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

-- Fix SERVICES RLS policies
DROP POLICY IF EXISTS "Select own services" ON services;
DROP POLICY IF EXISTS "Insert own services" ON services;
DROP POLICY IF EXISTS "Update own services" ON services;
DROP POLICY IF EXISTS "Delete own services" ON services;

CREATE POLICY "Select own services" ON services
  FOR SELECT USING (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Insert own services" ON services
  FOR INSERT WITH CHECK (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Update own services" ON services
  FOR UPDATE USING (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Delete own services" ON services
  FOR DELETE USING (
    stylist_id = auth.uid() OR
    (brand_id IS NOT NULL AND brand_id IN (
      SELECT brand_id FROM user_brands WHERE user_id = auth.uid()
    ))
  ); 