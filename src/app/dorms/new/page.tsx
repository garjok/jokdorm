"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase, getMyRole } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewDormPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    price_per_month: "",
    water_rate: "",
    electric_rate: "",
    deposit: "",
    rooms_available: "",
    phone: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push("/auth/login");
      return;
    }
    setUser(user);

    // ใช้ RPC bypass RLS สำหรับอ่าน role
    const role = await getMyRole();

    if (!role) {
      setError("ไม่พบสิทธิ์ผู้ใช้");
      return;
    }

    setUserRole(role);

    if (role === "user") {
      router.push("/");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("กรุณาเข้าสู่ระบบ");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("dorms").insert({
      name: formData.name,
      description: formData.description || null,
      address: formData.address,
      price_per_month: parseFloat(formData.price_per_month) || 0,
      water_rate: formData.water_rate ? parseFloat(formData.water_rate) : null,
      electric_rate: formData.electric_rate ? parseFloat(formData.electric_rate) : null,
      deposit: formData.deposit ? parseFloat(formData.deposit) : null,
      rooms_available: parseInt(formData.rooms_available) || 0,
      phone: formData.phone || null,
      owner_id: user.id,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  if (!user || userRole === "user") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            🏠 Dorm Finder
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">เพิ่มหอพักใหม่</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg border dark:border-slate-700">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
          )}

          <div>
            <Label className="text-gray-900 dark:text-white">ชื่อหอพัก *</Label>
            <Input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div>
            <Label className="text-gray-900 dark:text-white">รายละเอียด</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="เล่าอะไรก็ได้เกี่ยวกับหอพัก..."
            />
          </div>

          <div>
            <Label className="text-gray-900 dark:text-white">ที่อยู่ *</Label>
            <Input name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 dark:text-white">ราคาต่อเดือน (บาท) *</Label>
              <Input name="price_per_month" type="number" value={formData.price_per_month} onChange={handleChange} required />
            </div>
            <div>
              <Label className="text-gray-900 dark:text-white">ห้องว่าง *</Label>
              <Input name="rooms_available" type="number" value={formData.rooms_available} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 dark:text-white">ค่าน้ำ (บาท/หน่วย)</Label>
              <Input name="water_rate" type="number" value={formData.water_rate} onChange={handleChange} />
            </div>
            <div>
              <Label className="text-gray-900 dark:text-white">ค่าไฟ (บาท/หน่วย)</Label>
              <Input name="electric_rate" type="number" value={formData.electric_rate} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 dark:text-white">ค่ามัดจำ (บาท)</Label>
              <Input name="deposit" type="number" value={formData.deposit} onChange={handleChange} />
            </div>
            <div>
              <Label className="text-gray-900 dark:text-white">เบอร์โทร</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกหอพัก"}
          </Button>
        </form>
      </main>
    </div>
  );
}
