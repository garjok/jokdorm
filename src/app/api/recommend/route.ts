import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recommendDorms } from '@/lib/recommend';

/**
 * POST /api/recommend
 *
 * Accepts a natural language query in Thai and returns ranked dorm recommendations.
 *
 * Body: { query: string, limit?: number }
 * Response: { results: ScoredDorm[], query: string }
 */
export async function POST(request: NextRequest) {
  const start = performance.now();

  let body: { query?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const limit = Math.min(body.limit || 10, 20);

  // Initialize Supabase client (server-side)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Demo mode: return mock recommendations
    const mockDorms = generateMockDorms();
    const results = recommendDorms(mockDorms, {}, query, limit);
    return NextResponse.json({
      results,
      query,
      meta: {
        total: results.length,
        processingTimeMs: Math.round(performance.now() - start),
        demo: true,
        message: '🔧 โหมดตัวอย่าง — ยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาตั้งค่า Supabase ใน .env.local',
      },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch all active dorms
    const { data: dorms, error: dormError } = await supabase
      .from('dorms')
      .select('*')
      .eq('is_active', true);

    if (dormError) {
      return NextResponse.json({ error: 'Database error', details: dormError.message }, { status: 500 });
    }

    if (!dorms || dorms.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        meta: { total: 0, processingTimeMs: Math.round(performance.now() - start), demo: false },
      });
    }

    // Fetch all reviews for sentiment analysis
    const dormIds = dorms.map((d) => d.id);
    const { data: allReviews, error: reviewError } = await supabase
      .from('reviews')
      .select('dorm_id, rating, pros, cons')
      .in('dorm_id', dormIds);

    if (reviewError) {
      return NextResponse.json({ error: 'Database error', details: reviewError.message }, { status: 500 });
    }

    // Group reviews by dorm_id
    const reviewsByDorm: Record<string, { pros: string[]; cons: string[]; rating: number }[]> = {};
    for (const review of allReviews || []) {
      if (!reviewsByDorm[review.dorm_id]) {
        reviewsByDorm[review.dorm_id] = [];
      }
      reviewsByDorm[review.dorm_id].push({
        pros: review.pros || [],
        cons: review.cons || [],
        rating: review.rating,
      });
    }

    // Run recommendation engine
    const results = recommendDorms(dorms, reviewsByDorm, query, limit);

    return NextResponse.json({
      results,
      query,
      meta: {
        total: results.length,
        totalDorms: dorms.length,
        processingTimeMs: Math.round(performance.now() - start),
        demo: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

function generateMockDorms() {
  return [
    {
      id: 'mock-1',
      name: 'หอพักสุขสบาย',
      description: 'หอพักติดถนนใหญ่ ใกล้ร้านอาหารและตลาด มีระบบรักษาความปลอดภัย กล้องวงจรปิด ห้องพักเงียบสงบ มีเครื่องซักผ้าหยอดเหรียญ',
      address: 'ใกล้ประตู 1 มหาวิทยาลัยพะเยา',
      price_per_month: 3500,
      water_rate: 20,
      electric_rate: 8,
      deposit: 2000,
      rooms_available: 5,
      facilities: ['wifi', 'ที่จอดรถ', 'เครื่องซักผ้า', 'กล้องวงจรปิด', 'แอร์'],
      nearby_places: ['ประตู 1 ม.พะเยา', 'ตลาด', 'ร้านอาหาร', '7-11'],
      avg_rating: 4.2,
      review_count: 15,
    },
    {
      id: 'mock-2',
      name: 'หอพักวนิดา',
      description: 'หอพัดลม ราคาประหยัด ใกล้มหาวิทยาลัย ห้องพักสะอาด มีร้านค้าและร้านอาหารใกล้เคียง',
      address: 'ซอย 2 ข้างมหาวิทยาลัยพะเยา',
      price_per_month: 2500,
      water_rate: 15,
      electric_rate: 7,
      deposit: 1500,
      rooms_available: 8,
      facilities: ['wifi', 'ที่จอดรถ'],
      nearby_places: ['ม.พะเยา', 'ร้านอาหาร', 'ร้านสะดวกซื้อ'],
      avg_rating: 3.8,
      review_count: 22,
    },
    {
      id: 'mock-3',
      name: 'หอพักธัญญ์',
      description: 'หอพักใหม่ เดือนมกราคม 2025 ห้องกว้าง เฟอร์นิเจอร์ครบ มีระบบ keycard และกล้องวงจรปิด ที่จอดรถกว้างขวาง',
      address: 'ถนนพหลโยธิน ฝั่งตรงข้ามประตู 3 ม.พะเยา',
      price_per_month: 4500,
      water_rate: 25,
      electric_rate: 8,
      deposit: 3000,
      rooms_available: 3,
      facilities: ['wifi', 'ที่จอดรถ', 'keycard', 'กล้องวงจรปิด', 'เฟอร์นิเจอร์', 'แอร์', 'ตู้เย็น'],
      nearby_places: ['ประตู 3 ม.พะเยา', 'ตลาด', 'ปั้มน้ำมัน'],
      avg_rating: 4.5,
      review_count: 8,
    },
    {
      id: 'mock-4',
      name: 'หอพักต้นไม้',
      description: 'บรรยากาศร่มรื่น เงียบสงบ เหมาะสำหรับคนที่ต้องการสมาธิในการอ่านหนังสือ มีสวนเล็กๆ ด้านหน้า',
      address: 'ซอย 5 ต.แม่กา อ.เมือง จ.พะเยา',
      price_per_month: 3000,
      water_rate: 20,
      electric_rate: 8,
      deposit: 2000,
      rooms_available: 4,
      facilities: ['wifi', 'ที่จอดรถ', 'สวน'],
      nearby_places: ['ร้านกาแฟ', 'ร้านอาหาร'],
      avg_rating: 4.0,
      review_count: 12,
    },
    {
      id: 'mock-5',
      name: 'หอพักใกล้ชิด',
      description: 'หอพักติดมหาวิทยาลัย เดินถึงชั้นเรียนได้ ห้องรายเดือนราคาถูก มีร้านค้าและร้านก๋วยเตี๋ยวข้างล่าง',
      address: 'ติดรั้วมหาวิทยาลัยพะเยา ด้านประตู 2',
      price_per_month: 2800,
      water_rate: 15,
      electric_rate: 7,
      deposit: 1000,
      rooms_available: 2,
      facilities: ['wifi'],
      nearby_places: ['ประตู 2 ม.พะเยา', 'ร้านก๋วยเตี๋ยว', 'ร้านชำ'],
      avg_rating: 3.5,
      review_count: 30,
    },
    {
      id: 'mock-6',
      name: 'หอพักเกษมสุข',
      description: 'หอพัก Premium ห้องกว้าง เฟอร์นิเจอร์พร้อมอยู่ มีฟิตเนส และระบบรักษาความปลอดภัย 24 ชม.',
      address: 'ถนนสายเอเชีย ใกล้ประตู 1 ม.พะเยา 500 เมตร',
      price_per_month: 6000,
      water_rate: 30,
      electric_rate: 10,
      deposit: 5000,
      rooms_available: 1,
      facilities: ['wifi', 'ที่จอดรถ', 'ฟิตเนส', 'แอร์', 'ตู้เย็น', 'keycard', 'กล้องวงจรปิด', 'เครื่องซักผ้า'],
      nearby_places: ['ประตู 1 ม.พะเยา', 'ตลาด', '7-11', 'ร้านอาหาร'],
      avg_rating: 4.8,
      review_count: 6,
    },
  ];
}
