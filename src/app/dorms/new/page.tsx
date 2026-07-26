"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
    supabase.auth.getSession().then(({ data }: any) => {
      const u = data.session?.user;
      setUser(u || null);
      if (!u) {
        router.push("/auth/login");
        return;
      }
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .single()
        .then(({ data }: any) => {
          const role = data?.role || "user";
          setUserRole(role);
          if (role === "user") {
            router.push("/");
          }
        });
    });
  }, [router]);

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
      <div className="min-h-screen flex items-center justify-center">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🏠 Dorm Finder
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">เพิ่มหอพักใหม่</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>
          )}

          <div>
            <Label>ชื่อหอพัก *</Label>
            <Input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div>
            <Label>รายละเอียด</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="เล่าอะไรก็ได้เกี่ยวกับหอพัก..."
            />
          </div>

          <div>
            <Label>ที่อยู่ *</Label>
            <Input name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ราคาต่อเดือน (บาท) *</Label>
              <Input
                name="price_per_month"
                type="number"
                value={formData.price_per_month}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>ห้องว่าง *</Label>
              <Input
                name="rooms_available"
                type="number"
                value={formData.rooms_available}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ค่าน้ำ (บาท/หน่วย)</Label>
              <Input name="water_rate" type="number" value={formData.water_rate} onChange={handleChange} />
            </div>
            <div>
              <Label>ค่าไฟ (บาท/หน่วย)</Label>
              <Input name="electric_rate" type="number" value={formData.electric_rate} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ค่ามัดจำ (บาท)</Label>
              <Input name="deposit" type="number" value={formData.deposit} onChange={handleChange} />
            </div>
            <div>
              <Label>เบอร์โทร</Label>
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
