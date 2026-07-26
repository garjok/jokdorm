# Dorm Finder — Setup Guide (คู่มือติดตั้ง)

## 1. Supabase Setup

1. ไปที่ https://supabase.com → Sign up (ฟรี)
2. สร้าง Project ใหม่ → เลือก region **Singapore** (ใกล้ไทยที่สุด)
3. รอสัก 1-2 นาทีให้ database สร้างเสร็จ
4. ไปที่ **Project Settings > API**
5. คัดลอกค่า:
   - `Project URL` → ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → ใส่ใน `SUPABASE_SERVICE_ROLE_KEY`

### 2. Run Schema

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. เปิดไฟล์ `supabase_schema.sql` แล้ว Copy ทั้งหมด
3. วางใน SQL Editor แล้วกัด Run

### 3. ตั้งค่า Auth

1. ไปที่ **Authentication > Settings**
2. เปิด **Email + Password** auth (หรือเพิ่ม Google OAuth ก็ได้)
3. ปิด **Confirm email** (สำหรับ dev) เพื่อให้ register ได้ทันที

### 4. สร้าง Admin User

```sql
-- รันใน SQL Editor หลังจากมี user สมัครแล้ว
-- หา user id จาก Authentication > Users
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_FROM_SUPABASE', 'admin');
```

## 5. ทดสอบ Local

```bash
# 1. Copy .env.example → .env.local
# 2. ใส่ค่า Supabase ของคุณ
# 3. รัน
npm run dev
# 4. เปิด http://localhost:3000
```

## 6. Deploy to Vercel

1. ไปที่ https://vercel.com → Import Git Repo
2. เลือก Repo: `garjok/jokdorm`
3. Vercel detect Next.js อัตโนมัติ → กด Deploy
4. ไปที่ **Settings > Environment Variables** เพิ่ม:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Redeploy → เสร็จ!

---

## ฟีเจอร์ที่ทำเสร็จแล้ว (MVP)

- ✅ **Dorm CRUD** — Owner/Admin เพิ่ม/แก้ไข/ลบหอพัก
- ✅ **Review System** — ให้ดาว 1-5 + ข้อความ + ข้อดี/ข้อเสีย
- ✅ **Search** — ค้นหาชื่อหอและที่อยู่
- ✅ **Sort** — เรียงตามดาว, ราคา, ล่าสุด, รีวิวแง่บวก
- ✅ **Auth** — สมัคร/เข้าสู่ระบบ (Supabase Auth)
- ✅ **Roles** — user / owner / admin
- ✅ **RSL** — Row Level Security ทุกตาราง
- ✅ **🤖 AI แนะนำ** — พิมพ์ความต้องการแล้ว AI คัดกรองหอให้
- ✅ **Demo Mode** — ถ้ายังไม่เชื่อมต่อ Supabase, ระบบจะใช้ข้อมูลตัวอย่าง
