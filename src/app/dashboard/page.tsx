"use client";

import { useState, useEffect } from "react";
import { supabase, getMyRole } from "@/lib/supabase";
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
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    // ใช้ getUser() — validate กับ Supabase server จริง ๆ
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Dashboard: no user", authError);
      router.push("/auth/login");
      return;
    }

    setUser(user);

    // Query role
    // ใช้ RPC bypass RLS สำหรับอ่าน role
    const role = await getMyRole();

    if (!role) {
      console.error("Dashboard: role query failed");
      setError("ไม่พบสิทธิ์ผู้ใช้ — โปรดติดต่อผู้ดูแลระบบ");
      setLoading(false);
      return;
    }
    setUserRole(role);

    if (role === "user") {
      router.push("/");
      return;
    }

    fetchDorms(role, user.id);
  }

  async function fetchDorms(role: string, userId: string) {
    setLoading(true);
    let query = supabase.from("dorms").select("*");
    if (role === "owner") {
      query = query.eq("owner_id", userId);
    }
    // admin เห็นทั้งหมด
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("Dashboard: fetch dorms failed", error);
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            🏠 Dorm Finder
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/recommend" className="text-sm text-blue-600 hover:text-blue-800">🤖 AI แนะนำ</Link>
            <Link href="/compare" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">⚖️ เปรียบเทียบ</Link>
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userRole === "admin" ? "จัดการหอพักทั้งหมด" : "หอพักของฉัน"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {dorms.length} หอพัก
            </p>
          </div>
          <Link href="/dorms/new">
            <Button>+ เพิ่มหอพัก</Button>
          </Link>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        ) : dorms.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            ยังไม่มีหอพัก{" "}
            <Link href="/dorms/new" className="text-blue-600 underline">
              เพิ่มหอพักเลย
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dorms.map((dorm) => (
              <Card key={dorm.id} className="hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dorm.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{dorm.address}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ฿{dorm.price_per_month.toLocaleString()}/เดือน
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
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
