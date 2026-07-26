"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dorm, SortOption } from "@/types";
import { DormCard } from "@/components/DormCard";
import { SearchBar } from "@/components/SearchBar";
import { SortDropdown } from "@/components/SortDropdown";
import Link from "next/link";

export default function Home() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("rating_desc");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      setUser(data.session?.user || null);
    });
  }, []);

  useEffect(() => {
    fetchDorms();
  }, [search, sortBy]);

  async function fetchDorms() {
    setLoading(true);
    let query = supabase
      .from("dorms")
      .select("*, reviews(rating)")
      .eq("is_active", true);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setDorms([]);
      setLoading(false);
      return;
    }

    // Calculate avg rating client-side for MVP
    const processed = (data || []).map((dorm: any) => {
      const reviews = dorm.reviews || [];
      const avg = reviews.length
        ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
        : 0;
      return {
        ...dorm,
        avg_rating: avg,
        review_count: reviews.length,
      };
    });

    // Sort
    const sorted = [...processed].sort((a, b) => {
      switch (sortBy) {
        case "rating_desc":
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case "price_asc":
          return a.price_per_month - b.price_per_month;
        case "price_desc":
          return b.price_per_month - a.price_per_month;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "positive_reviews":
          return (b.review_count || 0) - (a.review_count || 0);
        default:
          return 0;
      }
    });

    setDorms(sorted);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🏠 Dorm Finder
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <Link
                  href="/dashboard"
                  className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  จัดการหอ
                </Link>
                <button
                  onClick={() => supabase.auth.signOut().then(() => setUser(null))}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-50 to-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ค้นหาหอพักใกล้มหาวิทยาลัยพะเยา
          </h1>
          <p className="text-gray-600 mb-8">
            เปรียบเทียบราคา อ่านรีวิว ตัดสินใจเลือกหอที่ใช่
          </p>

          <div className="max-w-2xl mx-auto space-y-4">
            <SearchBar value={search} onChange={setSearch} />
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>
      </div>

      {/* Dorm List */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
        ) : dorms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีหอพักในระบบ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dorms.map((dorm) => (
              <DormCard key={dorm.id} dorm={dorm} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
