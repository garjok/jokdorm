"use client";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Dorm, Review } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/RatingStars";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { DormMap } from "@/components/DormMap";

export default function DormDetailPage() {
  const params = useParams();
  const dormId = params.id as string;

  const [dorm, setDorm] = useState<Dorm | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      setUser(data.session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()
        .then(({ data }: any) => {
          setUserRole(data?.role || "user");
        });
    }
  }, [user]);

  useEffect(() => {
    fetchDorm();
  }, [dormId]);

  useEffect(() => {
    if (user && reviews.length > 0) {
      const userReview = reviews.find((r) => r.user_id === user.id);
      setHasReviewed(!!userReview);
    }
  }, [user, reviews]);

  async function fetchDorm() {
    setLoading(true);

    const { data: dormData } = await supabase
      .from("dorms")
      .select("*")
      .eq("id", dormId)
      .single();

    const { data: rawReviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("dorm_id", dormId)
      .order("created_at", { ascending: false });

    const reviewList: Review[] = (rawReviews as any) || [];

    if (dormData) {
      const avg =
        reviewList.length > 0
          ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length
          : 0;

      setDorm({
        ...dormData,
        avg_rating: avg,
        review_count: reviewList.length,
      });
      setReviews(reviewList);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        กำลังโหลด...
      </div>
    );
  }

  if (!dorm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        ไม่พบหอพักนี้
      </div>
    );
  }

  const canEdit =
    user && (userRole === "admin" || dorm.owner_id === user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🏠 Dorm Finder
          </Link>
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Dorm Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold">{dorm.name}</h1>
            {canEdit && (
              <Link href={`/dorms/${dorm.id}/edit`}>
                <Button variant="outline">แก้ไข</Button>
              </Link>
            )}
          </div>
          <p className="text-gray-600">📍 {dorm.address}</p>
          {dorm.phone && <p className="text-gray-600 mt-1">📞 {dorm.phone}</p>}
        </div>

        {/* Images */}
        {dorm.images && dorm.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {dorm.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${dorm.name} - รูปที่ ${i + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ราคาต่อเดือน</CardDescription>
              <p className="text-2xl font-bold">
                {formatPrice(dorm.price_per_month)}
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ห้องว่าง</CardDescription>
              <p className="text-2xl font-bold">{dorm.rooms_available} ห้อง</p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>คะแนนเฉลี่ย</CardDescription>
              <div className="flex items-center gap-2">
                <RatingStars value={Math.round(dorm.avg_rating || 0)} readonly size="sm" />
                <span className="text-2xl font-bold">
                  {dorm.avg_rating?.toFixed(1) || "0.0"}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {dorm.review_count || 0} รีวิว
              </p>
            </CardHeader>
          </Card>
        </div>

        {/* Map */}
        {dorm.latitude && dorm.longitude && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">🗺️ แผนที่</h2>
            <DormMap
              latitude={dorm.latitude}
              longitude={dorm.longitude}
              name={dorm.name}
              address={dorm.address}
              height="350px"
            />
          </div>
        )}

        {/* Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>รายละเอียด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* รายละเอียด */}
            {(dorm.description || (dorm.facilities && dorm.facilities.length > 0) || (dorm.nearby_places && dorm.nearby_places.length > 0)) ? (
              <>
                {dorm.description && (
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{dorm.description}</p>
                  </div>
                )}

                {/* Facilities */}
                {dorm.facilities && dorm.facilities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">สิ่งอำนวยความสะดวก</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dorm.facilities.map((f: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* NearBy */}
                {dorm.nearby_places && dorm.nearby_places.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">สถานที่ใกล้เคียง</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dorm.nearby_places.map((p: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          📍 {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">ไม่มีรายละเอียดเพิ่มเติม</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm border-t dark:border-slate-700 pt-4">
              {dorm.water_rate !== null && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ค่าน้ำ:</span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white">{dorm.water_rate} บาท/หน่วย</span>
                </div>
              )}
              {dorm.electric_rate !== null && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ค่าไฟ:</span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white">{dorm.electric_rate} บาท/หน่วย</span>
                </div>
              )}
              {dorm.deposit !== null && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ค่ามัดจำ:</span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(dorm.deposit)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              อัปเดตล่าสุด: {formatDate(dorm.updated_at)}
            </p>
          </CardContent>
        </Card>

        {/* Reviews */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            รีวิว ({reviews.length})
          </h2>

          {user && !hasReviewed && (
            <div className="mb-6">
              <ReviewForm dormId={dormId} onSubmit={fetchDorm} />
            </div>
          )}

          {!user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-700">
                <Link href="/auth/login" className="font-medium underline">
                  เข้าสู่ระบบ
                </Link>{" "}
                เพื่อเขียนรีวิว
              </p>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                ยังไม่มีรีวิว — เป็นคนแรกที่รีวิว!
              </p>
            ) : (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
