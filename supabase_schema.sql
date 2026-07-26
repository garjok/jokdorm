-- Dorm Finder Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Dorms table
CREATE TABLE IF NOT EXISTS dorms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  price_per_month DECIMAL(10,2) NOT NULL,
  water_rate DECIMAL(10,2),
  electric_rate DECIMAL(10,2),
  deposit DECIMAL(10,2),
  rooms_available INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  images TEXT[] DEFAULT '{}',
  facilities TEXT[] DEFAULT '{}',
  nearby_places TEXT[] DEFAULT '{}',
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dorm_id, user_id)
);

-- RLS Policies for dorms
ALTER TABLE dorms ENABLE ROW LEVEL SECURITY;

-- Everyone can read active dorms
CREATE POLICY "dorms_read_all" ON dorms
  FOR SELECT USING (is_active = true);

-- Owners can insert their own dorms
CREATE POLICY "dorms_insert_owner" ON dorms
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Owners can update their own dorms
CREATE POLICY "dorms_update_owner" ON dorms
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Owners can delete their own dorms
CREATE POLICY "dorms_delete_owner" ON dorms
  FOR DELETE USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "reviews_read_all" ON reviews
  FOR SELECT USING (true);

-- Users can insert reviews (one per dorm)
CREATE POLICY "reviews_insert_user" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "reviews_update_user" ON reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_user" ON reviews
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "user_roles_read_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Admin can read all roles
CREATE POLICY "user_roles_read_admin" ON user_roles
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create trigger to set updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dorms_updated_at BEFORE UPDATE ON dorms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
