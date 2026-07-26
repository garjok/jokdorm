-- ============================================================
-- Dorm Finder Supabase Schema
-- รวมทุกอย่าง: ตาราง + RLS + Trigger insert role อัตโนมัติ
-- รันใน SQL Editor ของ Supabase ได้เลย
-- ============================================================

-- 1. Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLE: user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. TABLE: dorms
-- ============================================================
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

-- ============================================================
-- 4. TABLE: reviews
-- ============================================================
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
-- 5. TRIGGER: Insert role='user' อัตโนมัติเมื่อสมัครสมาชิก
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- ลบ trigger เก่าถ้ามี แล้วสร้างใหม่
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. RLS: dorms
-- ============================================================
ALTER TABLE dorms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dorms_read_all" ON dorms
  FOR SELECT USING (is_active = true);

CREATE POLICY "dorms_insert_owner" ON dorms
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "dorms_update_owner" ON dorms
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "dorms_delete_owner" ON dorms
  FOR DELETE USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. RLS: reviews
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_read_all" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_user" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_user" ON reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "reviews_delete_user" ON reviews
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 8. RLS: user_roles
-- ============================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- อ่าน role ของตัวเองได้
CREATE POLICY "user_roles_read_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Admin อ่าน role ของทุกคนได้
CREATE POLICY "user_roles_read_admin" ON user_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 9. Trigger: อัปเดต updated_at อัตโนมัติ
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dorms_updated_at
  BEFORE UPDATE ON dorms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. 🔥 ถ้ายังไม่ได้ Insert role admin ให้รันอันนี้ (เฉพาะครั้งแรก)
-- ============================================================
-- INSERT INTO user_roles (user_id, role)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@dormfinder.local'),
--   'admin'
-- )
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
