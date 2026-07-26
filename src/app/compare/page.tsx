"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dorm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/RatingStars";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function ComparePage() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Dorm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDorms();
    // Load selected from sessionStorage
    const saved = sessionStorage.getItem("dorm-compare");
    if (saved) {
      setSelected(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (dorms.length > 0 && selected.length > 0) {
      const matched = dorms.filter((d) => selected.includes(d.id));
      setCompareList(matched);
    }
  }, [dorms, selected]);

  async function fetchDorms() {
    const { data } = await supabase
      .from("dorms")
      .select("*, reviews(rating)")
      .eq("is_active", true);
    if (data) setDorms(data as Dorm[]);
    setLoading(false);
  }

  function toggleSelect(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : selected.length < 3
        ? [...selected, id]
        : selected;
    setSelected(next);
    sessionStorage.setItem("dorm-compare", JSON.stringify(next));
  }

  function clearAll() {
    setSelected([]);
    setCompareList([]);
    sessionStorage.removeItem("dorm-compare");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🏠 Dorm Finder
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">หอพักทั้งหมด</Link>
            <Link href="/recommend" className="text-sm text-blue-600 hover:text-blue-800">🤖 AI แนะนำ</Link>
            <span className="text-sm font-medium">⚖️ เปรียบเทียบ</span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">⚖️ เปรียบเทียบหอพัก</h1>
            <p className="text-gray-600 mt-1">
              เลือกหอพัก 2-3 แห่งเพื่อเปรียบเทียบ side-by-side
            </p>
          </div>
          {selected.length > 0 && (
            <Button variant="outline" onClick={clearAll}>
              ล้างทั้งหมด
            </Button>
          )}
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {dorms.map((dorm) => {
            const isSel = selected.includes(dorm.id);
            return (
              <button
                key={dorm.id}
                onClick={() => toggleSelect(dorm.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSel
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{dorm.name}</span>
                  {isSel && <span className="text-blue-600 text-xs">✓</span>}
                </div>
                <p className="text-xs text-gray-500">{formatPrice(dorm.price_per_month)}/เดือน</p>
                <p className="text-xs text-gray-400">{dorm.rooms_available} ห้อง</p>
              </button>
            );
          })}
        </div>

        {/* Compare Table */}
        {compareList.length >= 2 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-4 font-medium text-gray-500 w-40">คุณสมบัติ</th>
                    {compareList.map((dorm) => (
                      <th key={dorm.id} className="p-4 text-center">
                        <Link href={`/dorms/${dorm.id}`} className="font-bold hover:text-blue-600">
                          {dorm.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="border-b">
                    <td className="p-4 font-medium text-gray-600">💵 ราคา/เดือน</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4 text-center font-bold text-lg">
                        {formatPrice(d.price_per_month)}
                      </td>
                    ))}
                  </tr>
                  {/* Rooms */}
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 font-medium text-gray-600">📦 ห้องว่าง</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4 text-center">{d.rooms_available} ห้อง</td>
                    ))}
                  </tr>
                  {/* Rating */}
                  <tr className="border-b">
                    <td className="p-4 font-medium text-gray-600">⭐ คะแนน</td>
                    {compareList.map((d) => {
                      const avg = (d as any).avg_rating || 0;
                      return (
                        <td key={d.id} className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <RatingStars value={Math.round(avg)} readonly size="sm" />
                            <span>{avg.toFixed(1)}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Water */}
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 font-medium text-gray-600">🚰 ค่าน้ำ</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4 text-center">
                        {d.water_rate ? `${d.water_rate} บาท/หน่วย` : "-"}
                      </td>
                    ))}
                  </tr>
                  {/* Electric */}
                  <tr className="border-b">
                    <td className="p-4 font-medium text-gray-600">⚡ ค่าไฟ</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4 text-center">
                        {d.electric_rate ? `${d.electric_rate} บาท/หน่วย` : "-"}
                      </td>
                    ))}
                  </tr>
                  {/* Deposit */}
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 font-medium text-gray-600">🔒 ค่ามัดจำ</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4 text-center">
                        {d.deposit ? formatPrice(d.deposit) : "-"}
                      </td>
                    ))}
                  </tr>
                  {/* Facilities */}
                  <tr className="border-b">
                    <td className="p-4 font-medium text-gray-600">🛋️ สิ่งอำนวยความสะดวก</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {((d as any).facilities || []).map((f: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-green-50 text-green-700">{f}</Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  {/* Nearby */}
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 font-medium text-gray-600">📍 สถานที่ใกล้เคียง</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {((d as any).nearby_places || []).map((p: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700">{p}</Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  {/* Address */}
                  <tr>
                    <td className="p-4 font-medium text-gray-600">📌 ที่อยู่</td>
                    {compareList.map((d) => (
                      <td key={d.id} className="p-4 text-center text-gray-600 text-xs">{d.address}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {compareList.length < 2 && selected.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            เลือกอย่างน้อย 2 หอเพื่อเปรียบเทียบ (เลือกแล้ว {selected.length}/3)
          </div>
        )}

        {selected.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">⚖️</p>
            <p>คลิกเลือกหอพัก 2-3 แห่งด้านบนเพื่อเปรียบเทียบ</p>
          </div>
        )}
      </main>
    </div>
  );
}
