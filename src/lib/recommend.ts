/**
 * Dorm Finder — AI Recommendation Engine v2
 *
 * Keyword matching + scoring สำหรับค้นหาหอพักด้วยภาษาธรรมชาติ
 */

export interface ScoredDorm {
  dorm: any;
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

// ============================================================
// Keyword categories — ขยายให้ครอบคลุมมากขึ้น
// ============================================================
const KEYWORD_CATEGORIES: Record<string, { weight: number; terms: string[] }> = {
  เงียบสงบ: {
    weight: 2,
    terms: ['เงียบ', 'สงบ', 'เก็บเสียง', 'ไม่เสียงดัง', 'ส่วนตัว', 'quiet', 'อ่านหนังสือ', 'เรียน'],
  },
  อาหาร: {
    weight: 1.5,
    terms: [
      'ของกิน', 'ร้านอาหาร', 'ตลาด', 'กิน', 'อาหาร', 'ร้านค้า', 'ร้านสะดวกซื้อ',
      '7-11', 'เซเว่น', 'street food', 'ข้าว', 'ก๋วยเตี๋ยว', 'ร้านชำ',
    ],
  },
  ใกล้มหาวิทยาลัย: {
    weight: 2,
    terms: [
      'ใกล้ม.', 'ใกล้มหาวิทยาลัย', 'ม.พะเยา', 'มหาลัย', 'ม.', 'ขึ้นมหาลัย',
      'ไปมหาลัย', 'ถึงมหาลัย', 'close to university', 'ใกล้ ม.',
    ],
  },
  ประตู: {
    weight: 1.5,
    terms: ['ประตู', 'gate', 'ทางเข้า', 'ด้านนอก', 'ประตู 1', 'ประตู 2', 'ประตู 3'],
  },
  wifi: {
    weight: 1,
    terms: ['wifi', 'ไวไฟ', 'อินเทอร์เน็ต', 'เน็ต', 'internet', 'wi-fi'],
  },
  ที่จอดรถ: {
    weight: 1.5,
    terms: ['ที่จอดรถ', 'จอดรถ', 'parking', 'ที่จอด', 'จอด', 'มอเตอร์ไซค์', 'รถยนต์'],
  },
  สิ่งอำนวยความสะดวก: {
    weight: 1,
    terms: [
      'แอร์', 'เครื่องซักผ้า', 'ตู้เย็น', 'ทีวี', 'เฟอร์นิเจอร์', 'ฟิตเนส',
      'air', 'washer', 'fridge', 'tv', 'furniture', 'gym', 'lift', 'ลิฟต์',
    ],
  },
  ความปลอดภัย: {
    weight: 1.5,
    terms: [
      'ปลอดภัย', 'security', 'กล้องวงจรปิด', 'cctv', 'keycard', 'รปภ.',
      'ปลอด', 'safe', 'guard', 'lock', 'keys',
    ],
  },
  ขนาด: {
    weight: 1,
    terms: ['กว้าง', 'ใหญ่', 'เล็ก', 'ห้องเดี่ยว', 'ห้องคู่', 'กว้างขวาง', 'spacious', 'big'],
  },
  ธรรมชาติ: {
    weight: 1,
    terms: ['ร่มรื่น', 'ต้นไม้', 'สวน', 'ธรรมชาติ', 'เขียว', 'green', 'garden', 'อากาศ'],
  },
};

// ============================================================
// Helper functions
// ============================================================

/**
 * ตรวจจับว่า user กังวลเรื่องราคาไหม
 */
function hasPriceConcern(query: string): boolean {
  const priceKeywords = [
    'ถูก', 'ประหยัด', 'ราคาถูก', 'ราคาถู', 'ไม่แพง', 'ถูกกว่า',
    'งบ', 'ราคา', 'budget', 'cheap', 'less', 'ต่ำ', 'ประหยัด',
  ];
  return priceKeywords.some((k) => query.toLowerCase().includes(k));
}

/**
 * ดึงช่วงราคาจาก query
 */
function extractPriceRange(query: string): { min?: number; max?: number } {
  // รูปแบบ 2000-3000
  const range = query.match(/(\d{3,})\s*-\s*(\d{3,})/);
  if (range) {
    return { min: parseInt(range[1]), max: parseInt(range[2]) };
  }
  // ไม่เกิน X / ต่ำกว่า X / ถูกกว่า X
  const maxMatch = query.match(/(?:ไม่เกิน|ต่ำกว่า|below|under|ถูกกว่า|ถูกว่า)\s*(\d{3,})/);
  if (maxMatch) {
    return { max: parseInt(maxMatch[1]) };
  }
  // เริ่มต้นที่ X / ตั้งแต่ X
  const minMatch = query.match(/(?:เริ่มต้น|ตั้งแต่|starting|from)\s*(\d{3,})/);
  if (minMatch) {
    return { min: parseInt(minMatch[1]) };
  }
  return {};
}

/**
 * นับจำนวนคำที่ match แบบ contains (ไม่ต้องตรงเป๊ะ)
 */
function textMatch(text: string | null | undefined, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let count = 0;
  for (const term of terms) {
    if (lower.includes(term)) {
      count++;
    }
  }
  return count;
}

/**
 * ตรวจจับ keywords สำคัญที่ user ต้องการ
 * เช่น "หอเงียบ" → เงียบ, "หอมีที่จอด" → จอดรถ
 */
function extractUserWants(query: string): string[] {
  const wants: string[] = [];
  const lower = query.toLowerCase();

  for (const [category, config] of Object.entries(KEYWORD_CATEGORIES)) {
    for (const term of config.terms) {
      if (lower.includes(term)) {
        wants.push(category);
        break; // แค่ category ละครั้ง
      }
    }
  }
  return wants;
}

// ============================================================
// Scoring Engine v2
// ============================================================

export function scoreDorm(
  dorm: any,
  query: string,
  reviews: { pros: string[]; cons: string[]; rating: number }[]
): ScoredDorm {
  const priceRange = extractPriceRange(query);
  const priceConcern = hasPriceConcern(query);
  const userWants = extractUserWants(query);

  const matchReasons: string[] = [];
  const matchDetails = { description: 0, facilities: 0, location: 0, price: 0, reviews: 0 };

  // ---- 1. Description matching ----
  const descText = `${dorm.name || ''} ${dorm.description || ''}`;
  for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
    const hits = textMatch(descText, cat.terms);
    if (hits > 0) {
      matchDetails.description += hits * cat.weight;
    }
  }

  // ---- 2. Facilities matching ----
  const facilityText = (dorm.facilities || []).join(' ');
  for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
    const hits = textMatch(facilityText, cat.terms);
    if (hits > 0) {
      matchDetails.facilities += hits * cat.weight * 1.5;
    }
  }

  // ---- 3. Location matching ----
  const locationText = `${dorm.address || ''} ${(dorm.nearby_places || []).join(' ')}`;
  for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
    const hits = textMatch(locationText, cat.terms);
    if (hits > 0) {
      matchDetails.location += hits * cat.weight * 1.2;
    }
  }

  // ---- 4. Price ----
  let overBudget = false;

  // ถ้า user กังวลเรื่องราคา ให้หอราคาถูกได้แต้ม
  if (priceConcern && dorm.price_per_month) {
    const price = dorm.price_per_month;
    if (price < 3000) {
      matchDetails.price += 5;  // ถูกมาก
      matchReasons.push('💰 ราคาประหยัด');
    } else if (price < 4000) {
      matchDetails.price += 3;  // กำลังดี
    }
  }

  // ⛔ ถ้า user ระบุ budget มาชัด → ห้ามเกิน!
  if (priceRange.max && dorm.price_per_month) {
    if (dorm.price_per_month <= priceRange.max) {
      matchDetails.price += 10;
      matchReasons.push(`✅ ราคา ${dorm.price_per_month} บาท อยู่ในงบ`);
    } else {
      matchDetails.price -= 100; // ⛔ ตัดแต้มหนักมาก
      overBudget = true;
    }
  }
  if (priceRange.min && dorm.price_per_month) {
    if (dorm.price_per_month >= priceRange.min) {
      matchDetails.price += 5;
    } else {
      matchDetails.price -= 100;
      overBudget = true;
    }
  }

  // price ทั่วไป (ถ้าไม่ได้ระบุ budget)
  if (!priceRange.max && !priceRange.min && dorm.price_per_month) {
    matchReasons.push(`ราคา ${dorm.price_per_month} บาท/เดือน`);
  }

  // ---- 5. Reviews ----
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    matchDetails.reviews += (avgRating - 3) * 2;

    for (const review of reviews) {
      const allPros = (review.pros || []).join(' ');
      const allCons = (review.cons || []).join(' ');
      for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
        const proHits = textMatch(allPros, cat.terms);
        if (proHits > 0) matchDetails.reviews += proHits * cat.weight * 0.5;
        const conHits = textMatch(allCons, cat.terms);
        if (conHits > 0) matchDetails.reviews -= conHits * cat.weight * 0.3;
      }
    }
  }

  // ---- 6. Bonus: ถ้า user ระบุความต้องการที่ตรงกับข้อมูลหอ ----
  for (const want of userWants) {
    const catConfig = KEYWORD_CATEGORIES[want];
    if (!catConfig) continue;

    // ถ้า user ต้องการสิ่งนี้ และหอมี → bonus
    const hasInFacilities = textMatch(facilityText, catConfig.terms) > 0;
    const hasInDesc = textMatch(descText, catConfig.terms) > 0;
    const hasInLocation = textMatch(locationText, catConfig.terms) > 0;

    if (hasInFacilities || hasInDesc || hasInLocation) {
      matchDetails.description += 2; // bonus
      if (!matchReasons.includes(`${want}`)) {
        matchReasons.push(`✅ ${want}`);
      }
    }
  }

  // ---- Total score ----
  const total =
    matchDetails.description +
    matchDetails.facilities +
    matchDetails.location +
    matchDetails.price +
    matchDetails.reviews;

  // ----  Match reasons ที่เหลือ ----
  const reasonLabels: { key: keyof typeof matchDetails; label: string; threshold: number }[] = [
    { key: 'description', label: 'รายละเอียด', threshold: 3 },
    { key: 'facilities', label: 'สิ่งอำนวยความสะดวก', threshold: 2 },
    { key: 'location', label: 'ทำเลที่ตั้ง', threshold: 2 },
  ];

  for (const rl of reasonLabels) {
    if (matchDetails[rl.key] >= rl.threshold) {
      if (!matchReasons.some((m) => m.includes(rl.label))) {
        matchReasons.push(`✓ ${rl.label} ตรง`);
      }
    }
  }

  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    matchReasons.push(`คะแนนรีวิว ${avg.toFixed(1)} ดาว (${reviews.length} รีวิว)`);
  }

  // mark overBudget for filtering
  (dorm as any).__overBudget = overBudget;

  return {
    dorm,
    score: Math.max(0, total),
    matchReasons: [...new Set(matchReasons)], // unique
    matchDetails,
  };
}

// ============================================================
// Rank
// ============================================================

export function recommendDorms(
  dorms: any[],
  reviewsByDorm: Record<string, { pros: string[]; cons: string[]; rating: number }[]>,
  query: string,
  limit: number = 10
): ScoredDorm[] {
  const scored: ScoredDorm[] = dorms.map((dorm) =>
    scoreDorm(dorm, query, reviewsByDorm[dorm.id] || [])
  );

  // Filter: ตัดหอที่เกิน budget
  const filtered = scored.filter((s) => {
    if (s.dorm.__overBudget) return false;
    return s.score > 0;
  });

  return filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
