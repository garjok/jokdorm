-- ============================================================
-- Dorm Finder — รัน SQL นี้ทีเดียวใน Supabase SQL Editor
-- รวม: ตาราง + RLS + Trigger + Admin
-- **รันซ้ำได้ ไม่ error**
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES (IF NOT EXISTS = รันซ้ำได้)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

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

-- ============================================================
-- TRIGGER — auto insert role='user' เมื่อสมัครสมาชิก
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS: dorms (DROP ก่อน = รันซ้ำได้)
-- ============================================================
ALTER TABLE dorms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dorms_read_all" ON dorms;
CREATE POLICY "dorms_read_all" ON dorms FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "dorms_insert_owner" ON dorms;
CREATE POLICY "dorms_insert_owner" ON dorms FOR INSERT WITH CHECK (
  owner_id = auth.uid() AND
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "dorms_update_owner" ON dorms;
CREATE POLICY "dorms_update_owner" ON dorms FOR UPDATE USING (
  owner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "dorms_delete_owner" ON dorms;
CREATE POLICY "dorms_delete_owner" ON dorms FOR DELETE USING (
  owner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- RLS: reviews
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_read_all" ON reviews;
CREATE POLICY "reviews_read_all" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_user" ON reviews;
CREATE POLICY "reviews_insert_user" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_user" ON reviews;
CREATE POLICY "reviews_update_user" ON reviews FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_user" ON reviews;
CREATE POLICY "reviews_delete_user" ON reviews FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- RLS: user_roles
-- ============================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_read_own" ON user_roles;
CREATE POLICY "user_roles_read_own" ON user_roles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_roles_read_admin" ON user_roles;
CREATE POLICY "user_roles_read_admin" ON user_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- Trigger updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dorms_updated_at ON dorms;
CREATE TRIGGER update_dorms_updated_at
  BEFORE UPDATE ON dorms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Insert role admin (ปลอดภัย รันซ้ำได้)
-- ============================================================
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@dormfinder.local'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
