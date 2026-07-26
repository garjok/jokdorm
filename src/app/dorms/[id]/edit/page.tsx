"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase, getMyRole } from "@/lib/supabase";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);

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
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

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
      return;
    }
    loadDorm(user.id, role);
  }

  async function loadDorm(userId: string, role: string) {
    const { data, error } = await supabase.from("dorms").select("*").eq("id", dormId).single();
    if (error || !data) {
      router.push("/");
      return;
    }
    if (role !== "admin" && data.owner_id !== userId) {
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
      facilities: (data.facilities || []).join(', '),
      nearby_places: (data.nearby_places || []).join(', '),
    });
    setExistingImages(data.images || []);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleNewImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setNewFiles(files);
    setNewPreviews(files.map(f => URL.createObjectURL(f)));
  }

  function removeExisting(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadNewImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of newFiles) {
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
    setSaving(true);
    setError("");

    let allImages = [...existingImages];
    if (newFiles.length > 0) {
      const uploaded = await uploadNewImages();
      allImages = [...allImages, ...uploaded];
    }

    const facilities = formData.facilities ? formData.facilities.split(',').map(s => s.trim()).filter(Boolean) : [];
    const nearby_places = formData.nearby_places ? formData.nearby_places.split(',').map(s => s.trim()).filter(Boolean) : [];

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
        images: allImages,
        facilities,
        nearby_places,
      })
      .eq("id", dormId);

    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      router.push(`/dorms/${dormId}`);
    }
  }

  async function handleDelete() {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหอพักนี้?")) return;
    setSaving(true);
    const { error } = await supabase.from("dorms").delete().eq("id", dormId);
    setSaving(false);
    if (!error) router.push("/dashboard");
  }

  if (!user) {
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
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">🏠 Dorm Finder</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">แก้ไขหอพัก</h1>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>ลบหอพัก</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg border dark:border-slate-700">
          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}

          <div>
            <Label className="text-gray-900 dark:text-white">ชื่อหอพัก *</Label>
            <Input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">รายละเอียด</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} />
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

          {/* รูปภาพปัจจุบัน */}
          {existingImages.length > 0 && (
            <div>
              <Label className="text-gray-900 dark:text-white">รูปภาพปัจจุบัน</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border dark:border-slate-600" />
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* เพิ่มรูปใหม่ */}
          <div>
            <Label className="text-gray-900 dark:text-white">เพิ่มรูปภาพ</Label>
            <Input type="file" accept="image/*" multiple onChange={handleNewImages} className="mt-1" />
            {newPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {newPreviews.map((preview, i) => (
                  <img key={i} src={preview} alt="" className="w-24 h-24 object-cover rounded-lg border dark:border-slate-600" />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">เลือกรูปเพิ่ม หรือเว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน</p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
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
