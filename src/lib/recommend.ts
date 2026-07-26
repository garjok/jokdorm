/**
 * Dorm Finder — AI Recommendation Engine
 *
 * Analyzes natural language queries in Thai and scores dorms
 * by matching keywords against descriptions, facilities, location, and reviews.
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

// Keyword categories for Thai dorm search
const KEYWORD_CATEGORIES: Record<string, { weight: number; terms: string[] }> = {
  เงียบสงบ: {
    weight: 2,
    terms: ['เงียบ', 'สงบ', 'เก็บเสียง', 'ไม่เสียงดัง', 'ส่วนตัว', 'quiet'],
  },
  อาหาร: {
    weight: 1.5,
    terms: [
      'ของกิน', 'ร้านอาหาร', 'ตลาด', 'กิน', 'อาหาร', 'ร้านค้า', 'ร้านสะดวกซื้อ',
      '7-11', 'เซเว่น', 'street food', 'ข้าว',
    ],
  },
  ใกล้มหาวิทยาลัย: {
    weight: 2,
    terms: [
      'ใกล้ม.', 'ใกล้มหาวิทยาลัย', 'ม.พะเยา', 'มหาลัย', 'ม.', 'ขึ้นมหาลัย',
      'ไปมหาลัย', 'ถึงมหาลัย', 'close to university',
    ],
  },
  ประตู: {
    weight: 1.5,
    terms: ['ประตู', 'gate', 'ทางเข้า', 'ด้านนอก'],
  },
  ราคา: {
    weight: 1,
    terms: ['ถูก', 'ประหยัด', 'ราคาถูก', 'ไม่แพง', 'ย่อมเยา', 'ราคาดี', 'คุ้ม', 'ราคา'],
  },
  wifi: {
    weight: 1,
    terms: ['wifi', 'ไวไฟ', 'อินเทอร์เน็ต', 'เน็ต', 'internet', 'wi-fi'],
  },
  ที่จอดรถ: {
    weight: 1.5,
    terms: ['ที่จอดรถ', 'จอดรถ', 'parking', 'ที่จอด', 'จอด'],
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
      'ปลอด', 'safe', 'guard', 'lock',
    ],
  },
  ขนาด: {
    weight: 1,
    terms: ['กว้าง', 'ใหญ่', 'เล็ก', 'ห้องเดี่ยว', 'ห้องคู่', 'กว้างขวาง', ' spacious', 'big'],
  },
  ธรรมชาติ: {
    weight: 1,
    terms: ['ร่มรื่น', 'ต้นไม้', 'สวน', 'ธรรมชาติ', 'เขียว', 'air', 'green', 'garden'],
  },
};

/**
 * Extract key search terms from a Thai natural language query
 */
function extractKeywords(query: string): string[] {
  // Split by spaces, commas, and common Thai connectors
  const tokens = query
    .toLowerCase()
    .replace(/[,\.\?\!\:\;]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);

  // Also extract meaningful multi-word phrases
  const phrases: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    phrases.push(tokens[i] + tokens[i + 1]);
  }

  return [...new Set([...tokens, ...phrases])];
}

/**
 * Check if query implies concern about price
 */
function hasPriceConcern(query: string): boolean {
  const priceKeywords = ['ถูก', 'ประหยัด', 'ราคาถูก', 'ไม่แพง', 'งบ', 'ราคา', ' budget', 'cheap', 'less', 'ต่ำ'];
  return priceKeywords.some((k) => query.toLowerCase().includes(k));
}

/**
 * Check if query implies a price range (e.g., "ไม่เกิน 3000", "2000-3000")
 */
function extractPriceRange(query: string): { min?: number; max?: number } {
  const range = query.match(/(\d{3,})\s*-\s*(\d{3,})/);
  if (range) {
    return { min: parseInt(range[1]), max: parseInt(range[2]) };
  }
  const maxMatch = query.match(/(?:ไม่เกิน|ไม่เกิน|ต่ำกว่า|below|under)\s*(\d{3,})/);
  if (maxMatch) {
    return { max: parseInt(maxMatch[1]) };
  }
  return {};
}

/**
 * Check if a dorm's text fields contain any of the given terms
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
 * Score a single dorm against the user's query
 */
export function scoreDorm(
  dorm: any,
  query: string,
  reviews: { pros: string[]; cons: string[]; rating: number }[]
): ScoredDorm {
  const keywords = extractKeywords(query);
  const priceRange = extractPriceRange(query);
  const priceConcern = hasPriceConcern(query);

  const matchReasons: string[] = [];
  const matchDetails = {
    description: 0,
    facilities: 0,
    location: 0,
    price: 0,
    reviews: 0,
  };

  // --- 1. Description matching ---
  const descText = `${dorm.name || ''} ${dorm.description || ''}`;
  for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
    const hits = textMatch(descText, cat.terms);
    if (hits > 0) {
      matchDetails.description += hits * cat.weight;
    }
  }
  // Also match raw query keywords against description
  for (const kw of keywords) {
    if (descText.toLowerCase().includes(kw)) {
      matchDetails.description += 0.5;
    }
  }

  // --- 2. Facilities matching ---
  const facilityText = (dorm.facilities || []).join(' ');
  for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
    const hits = textMatch(facilityText, cat.terms);
    if (hits > 0) {
      matchDetails.facilities += hits * cat.weight * 1.5; // Higher weight for explicit facilities
    }
  }

  // --- 3. Location matching ---
  const locationText = `${dorm.address || ''} ${(dorm.nearby_places || []).join(' ')}`;
  for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
    const hits = textMatch(locationText, cat.terms);
    if (hits > 0) {
      matchDetails.location += hits * cat.weight * 1.2;
    }
  }

  // --- 4. Price matching ---
  if (priceConcern && dorm.price_per_month) {
    const price = dorm.price_per_month;
    if (price < 3000) {
      matchDetails.price += 3; // very cheap
    } else if (price < 4000) {
      matchDetails.price += 2; // cheap
    } else if (price < 5500) {
      matchDetails.price += 1; // moderate
    }
  }
  if (priceRange.max && dorm.price_per_month) {
    if (dorm.price_per_month <= priceRange.max) {
      matchDetails.price += 4;
      matchReasons.push(`ราคา ${dorm.price_per_month} บาท อยู่ในงบที่กำหนด`);
    } else {
      matchDetails.price -= 2; // penalty
    }
  }
  if (priceRange.min && dorm.price_per_month) {
    if (dorm.price_per_month >= priceRange.min) {
      matchDetails.price += 1;
    }
  }

  // --- 5. Review sentiment matching ---
  if (reviews.length > 0) {
    // Average rating bonus
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    matchDetails.reviews += (avgRating - 3) * 1.5; // bonus for high rating

    // Match pros/cons against query
    for (const review of reviews) {
      const allPros = (review.pros || []).join(' ');
      const allCons = (review.cons || []).join(' ');
      for (const [, cat] of Object.entries(KEYWORD_CATEGORIES)) {
        const proHits = textMatch(allPros, cat.terms);
        if (proHits > 0) {
          matchDetails.reviews += proHits * cat.weight * 0.5;
        }
        const conHits = textMatch(allCons, cat.terms);
        if (conHits > 0) {
          matchDetails.reviews -= conHits * cat.weight * 0.3; // penalty for negative matches
        }
      }
    }
  }

  // --- Calculate total score ---
  const total =
    matchDetails.description +
    matchDetails.facilities +
    matchDetails.location +
    matchDetails.price +
    matchDetails.reviews;

  // --- Generate human-readable match reasons ---
  if (matchDetails.description > 0) generateMatchReasons(matchReasons, matchDetails.description, 'รายละเอียด', 'ตรงกับความต้องการ');
  if (matchDetails.facilities > 1) generateMatchReasons(matchReasons, matchDetails.facilities, 'สิ่งอำนวยความสะดวก', '');
  if (matchDetails.location > 1) generateMatchReasons(matchReasons, matchDetails.location, 'ทำเลที่ตั้ง', '');
  if (matchDetails.price > 0) {
    if (dorm.price_per_month) {
      matchReasons.push(`ราคา ${dorm.price_per_month} บาท/เดือน`);
    }
  }
  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    matchReasons.push(`คะแนนรีวิว ${avg.toFixed(1)} ดาว (${reviews.length} รีวิว)`);
  }

  return {
    dorm,
    score: Math.max(0, total),
    matchReasons,
    matchDetails,
  };
}

function generateMatchReasons(reasons: string[], score: number, category: string, suffix: string): void {
  if (score > 5) {
    reasons.push(`${category} ตรงมาก${suffix}`);
  } else if (score > 2) {
    reasons.push(`${category} ตรง${suffix}`);
  }
}

/**
 * Rank dorms by relevance to a natural language query
 */
export function recommendDorms(
  dorms: any[],
  reviewsByDorm: Record<string, { pros: string[]; cons: string[]; rating: number }[]>,
  query: string,
  limit: number = 10
): ScoredDorm[] {
  const scored: ScoredDorm[] = dorms.map((dorm) =>
    scoreDorm(dorm, query, reviewsByDorm[dorm.id] || [])
  );

  // Sort by score descending, minimum score threshold
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
