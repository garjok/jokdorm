export interface Dorm {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price_per_month: number;
  water_rate: number | null;
  electric_rate: number | null;
  deposit: number | null;
  rooms_available: number;
  phone: string | null;
  images: string[];
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avg_rating?: number;
  review_count?: number;
}

export interface Review {
  id: string;
  dorm_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  pros: string[];
  cons: string[];
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
  };
}

export type SortOption = 'rating_desc' | 'price_asc' | 'price_desc' | 'newest' | 'positive_reviews';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'owner' | 'admin';
}
