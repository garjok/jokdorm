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
    facilities: "",
    nearby_places: "",
    latitude: "",
    longitude: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadImages(dormId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop();
      const path = `${dormId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('dorm-images')
        .upload(path, file);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('dorm-images')
        .getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
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

    // บันทึกหอพักก่อน
    // แปลง facilities / nearby_places จาก comma-separated → array
    const facilities = formData.facilities ? formData.facilities.split(',').map(s => s.trim()).filter(Boolean) : [];
    const nearby_places = formData.nearby_places ? formData.nearby_places.split(',').map(s => s.trim()).filter(Boolean) : [];

    const { data: dorm, error: insertError } = await supabase.from("dorms").insert({
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
      images: [],
      facilities,
      nearby_places,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    }).select("id").single();

    if (insertError || !dorm) {
      setError(insertError?.message || "บันทึกข้อมูลไม่สำเร็จ");
      setLoading(false);
      return;
    }

    // อัปโหลดรูปถ้ามี
    if (imageFiles.length > 0) {
      const urls = await uploadImages(dorm.id);
      if (urls.length > 0) {
        await supabase.from("dorms").update({ images: urls }).eq("id", dorm.id);
      }
    }

    setLoading(false);
    router.push(`/dorms/${dorm.id}`);
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

          {/* พิกัดแผนที่ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 dark:text-white">ละติจูด (Latitude)</Label>
              <Input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="เช่น 19.0283" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  🔗 เปิด Google Maps
                </a>
                 → คลิกขวาที่ตำแหน่ง → Copy พิกัด
              </p>
            </div>
            <div>
              <Label className="text-gray-900 dark:text-white">ลองจิจูด (Longitude)</Label>
              <Input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="เช่น 100.9123" />
            </div>
          </div>

          {/* สิ่งอำนวยความสะดวก */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 dark:text-white">สิ่งอำนวยความสะดวก</Label>
              <Input name="facilities" value={formData.facilities} onChange={handleChange} placeholder="wifi, แอร์, ที่จอดรถ, ..." />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">คั่นด้วยเครื่องหมาย ,</p>
            </div>
            <div>
              <Label className="text-gray-900 dark:text-white">สถานที่ใกล้เคียง</Label>
              <Input name="nearby_places" value={formData.nearby_places} onChange={handleChange} placeholder="ประตู 1, ตลาด, 7-11, ..." />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">คั่นด้วยเครื่องหมาย ,</p>
            </div>
          </div>

          {/* รูปภาพ */}
          <div>
            <Label className="text-gray-900 dark:text-white">รูปภาพหอพัก</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImages}
              className="mt-1"
            />
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={preview}
                      alt={`รูป ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">เลือกได้หลายรูป (แนะนำ 1-5 รูป)</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกหอพัก"}
          </Button>
        </form>
      </main>
    </div>
  );
}
