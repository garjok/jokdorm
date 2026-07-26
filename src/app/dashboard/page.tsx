"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dorm } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
            return;
          }
          fetchDorms(role, u.id);
        });
    });
  }, [router]);

  async function fetchDorms(role: string, userId: string) {
    setLoading(true);
    let query = supabase.from("dorms").select("*");
    if (role === "owner") {
      query = query.eq("owner_id", userId);
    }
    // admin sees all
    const { data } = await query.order("created_at", { ascending: false });
    setDorms(data || []);
    setLoading(false);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🏠 Dorm Finder
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/recommend" className="text-sm text-blue-600 hover:text-blue-800">🤖 AI แนะนำ</Link>
            <Link href="/compare" className="text-sm text-gray-600 hover:text-gray-900">⚖️ เปรียบเทียบ</Link>
            <ThemeToggle />
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {userRole === "admin" ? "จัดการหอพักทั้งหมด" : "หอพักของฉัน"}
            </h1>
            <p className="text-gray-600 mt-1">
              {dorms.length} หอพัก
            </p>
          </div>
          <Link href="/dorms/new">
            <Button>+ เพิ่มหอพัก</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : dorms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีหอพัก{" "}
            <Link href="/dorms/new" className="text-blue-600 underline">
              เพิ่มหอพักเลย
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dorms.map((dorm) => (
              <Card key={dorm.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-semibold">{dorm.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{dorm.address}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold">
                      ฿{dorm.price_per_month.toLocaleString()}/เดือน
                    </span>
                    <span className="text-sm text-gray-500">
                      ว่าง {dorm.rooms_available} ห้อง
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dorms/${dorm.id}/edit`}>
                      <Button variant="outline" size="sm">แก้ไข</Button>
                    </Link>
                    <Link href={`/dorms/${dorm.id}`}>
                      <Button variant="ghost" size="sm">ดูรายละเอียด</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
