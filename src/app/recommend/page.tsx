"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dorm } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RatingStars } from "@/components/RatingStars";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface ScoredDorm {
  dorm: Dorm & { facilities?: string[]; nearby_places?: string[] };
  score: number;
  matchReasons: string[];
  matchDetails: {
    description: number;
    facilities: number;
    location: number;
    price: number;
    reviews: number;
  };
}

interface ApiResponse {
  results: ScoredDorm[];
  query: string;
  meta: {
    total: number;
    totalDorms?: number;
    processingTimeMs: number;
    demo?: boolean;
    message?: string;
  };
}

const SUGGESTIONS = [
  "ต้องการห้องที่เงียบสงบ ใกล้ร้านอาหาร และใกล้ประตู 1",
  "หอราคาถูก ไม่เกิน 3000 ใกล้มหาวิทยาลัย",
  "หอที่มีที่จอดรถ wifi แรง ปลอดภัย",
  "ห้องกว้าง เงียบ เหมาะอ่านหนังสือ",
  "ต้องการหอที่มีฟิตเนส แอร์ เฟอร์นิเจอร์ครบ",
];

export default function RecommendPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScoredDorm[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q?: string) {
    const searchQuery = (q || query).trim();
    if (!searchQuery || searchQuery.length < 2) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "เกิดข้อผิดพลาด");
      }

      const data: ApiResponse = await res.json();
      setResults(data.results);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการค้นหา");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(suggestion: string) {
    setQuery(suggestion);
    handleSearch(suggestion);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🏠 Dorm Finder
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              หอพักทั้งหมด
            </Link>
            <Link href="/recommend" className="text-sm font-medium text-blue-600">
              🤖 AI แนะนำ
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🤖 AI แนะนำหอพัก</h1>
          <p className="text-gray-600">
            บอกความต้องการของคุณ แล้ว AI จะคัดกรองหอพักที่ใช่ให้คุณ
          </p>
        </div>

        {/* Search Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                  บอกความต้องการของคุณ
                </label>
                <Textarea
                  id="query"
                  placeholder="เช่น: ต้องการห้องที่ค่อนข้างเก็บเสียง ใกล้แหล่งของกิน และใกล้ประตู 1"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={loading || query.trim().length < 2}
                className="w-full"
                size="lg"
              >
                {loading ? "🤖 กำลังวิเคราะห์..." : "🔍 ค้นหาด้วย AI"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">ลองค้นหาแบบนี้:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Mode Notice */}
        {meta?.demo && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">{meta.message}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">😕 ไม่พบหอพักที่ตรงกับความต้องการ</p>
                <p className="text-gray-400 text-sm">ลองเปลี่ยนคำค้นหาหรือลดเงื่อนไขลง</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    ผลลัพธ์ที่แนะนำ ({results.length} แห่ง)
                  </h2>
                  {meta && (
                    <span className="text-xs text-gray-400">
                      ประมวลผลใน {meta.processingTimeMs} ms
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {results.map((item, index) => (
                    <RecommendCard key={item.dorm.id} item={item} rank={index + 1} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Initial state */}
        {!searched && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">🤖</p>
            <p>พิมพ์ความต้องการของคุณด้านบน</p>
            <p className="text-sm">หรือกดตัวอย่างคำค้นหาเพื่อลองระบบ</p>
          </div>
        )}
      </main>
    </div>
  );
}

function RecommendCard({ item, rank }: { item: ScoredDorm; rank: number }) {
  const { dorm, score, matchReasons, matchDetails } = item;

  // Match score as percentage (max realistic score ~50)
  const scorePercent = Math.min(100, Math.round((score / 50) * 100));

  return (
    <Card className={`hover:shadow-md transition-shadow ${rank <= 3 ? 'border-blue-300' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            rank === 1 ? 'bg-yellow-100 text-yellow-700' :
            rank === 2 ? 'bg-gray-100 text-gray-600' :
            rank === 3 ? 'bg-orange-100 text-orange-700' :
            'bg-gray-50 text-gray-400'
          }`}>
            {rank}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <Link href={`/dorms/${dorm.id}`} className="text-lg font-semibold hover:text-blue-600">
                  {dorm.name}
                </Link>
                <p className="text-sm text-gray-500">📍 {dorm.address}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xl font-bold text-gray-900">
                  {dorm.price_per_month?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">บาท/เดือน</p>
              </div>
            </div>

            {/* Match Score Bar */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      scorePercent > 80 ? 'bg-green-500' :
                      scorePercent > 50 ? 'bg-blue-500' :
                      scorePercent > 25 ? 'bg-yellow-500' :
                      'bg-gray-300'
                    }`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {scorePercent}% match
                </span>
              </div>
            </div>

            {/* Match Reasons */}
            {matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {matchReasons.map((reason, i) => (
                  <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    ✓ {reason}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {dorm.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{dorm.description}</p>
            )}

            {/* Facilities */}
            {dorm.facilities && dorm.facilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {dorm.facilities.map((f, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Room availability */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {dorm.avg_rating !== undefined && (
                <span className="flex items-center gap-1">
                  <RatingStars value={Math.round(dorm.avg_rating || 0)} readonly size="sm" />
                  {dorm.avg_rating?.toFixed(1)}
                </span>
              )}
              <span>📦 {dorm.rooms_available} ห้องว่าง</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
