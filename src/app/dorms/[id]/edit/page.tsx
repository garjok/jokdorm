"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function EditDormPage() {
  const params = useParams();
  const dormId = params.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!user || !dormId) return;
    fetchDorm();
  }, [user, dormId]);

  async function fetchDorm() {
    const { data } = await supabase.from("dorms").select("*").eq("id", dormId).single();
    if (!data) {
      router.push("/");
      return;
    }

    // Check permission
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role || "user";
    if (role !== "admin" && data.owner_id !== user.id) {
      router.push("/");
      return;
    }

    setFormData({
      name: data.name,
      description: data.description || "",
      address: data.address,
      price_per_month: String(data.price_per_month),
      water_rate: data.water_rate ? String(data.water_rate) : "",
      electric_rate: data.electric_rate ? String(data.electric_rate) : "",
      deposit: data.deposit ? String(data.deposit) : "",
      rooms_available: String(data.rooms_available),
      phone: data.phone || "",
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("dorms")
      .update({
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        price_per_month: parseFloat(formData.price_per_month) || 0,
        water_rate: formData.water_rate ? parseFloat(formData.water_rate) : null,
        electric_rate: formData.electric_rate ? parseFloat(formData.electric_rate) : null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        rooms_available: parseInt(formData.rooms_available) || 0,
        phone: formData.phone || null,
      })
      .eq("id", dormId);

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push(`/dorms/${dormId}`);
    }
  }

  async function handleDelete() {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหอพักนี้?")) return;

    setLoading(true);
    const { error } = await supabase.from("dorms").delete().eq("id", dormId);
    setLoading(false);

    if (!error) {
      router.push("/dashboard");
    }
  }

  if (!user) {
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">แก้ไขหอพัก</h1>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            ลบหอพัก
          </Button>
        </div>

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
            <Textarea name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div>
            <Label>ที่อยู่ *</Label>
            <Input name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ราคาต่อเดือน (บาท) *</Label>
              <Input name="price_per_month" type="number" value={formData.price_per_month} onChange={handleChange} required />
            </div>
            <div>
              <Label>ห้องว่าง *</Label>
              <Input name="rooms_available" type="number" value={formData.rooms_available} onChange={handleChange} required />
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

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
            <Link href={`/dorms/${dormId}`}>
              <Button variant="outline">ยกเลิก</Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
