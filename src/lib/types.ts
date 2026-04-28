export type UserRole = 'subscriber' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  country: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'lapsed' | 'pending';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  amount_pence: number;
  currency: string;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  user_id: string;
  score: number;
  score_date: string;
  created_at: string;
  updated_at: string;
}

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  logo_url?: string;
  cover_image_url?: string;
  website_url?: string;
  category: string;
  country: string;
  is_featured: boolean;
  is_active: boolean;
  total_raised: number;
  supporter_count: number;
  created_at: string;
  updated_at: string;
  charity_events?: CharityEvent[];
}

export interface CharityEvent {
  id: string;
  charity_id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  created_at: string;
}

export interface UserCharity {
  id: string;
  user_id: string;
  charity_id: string;
  contribution_percentage: number;
  created_at: string;
  updated_at: string;
  charity?: Charity;
}

export interface Draw {
  id: string;
  month: number;
  year: number;
  draw_type: 'random' | 'algorithmic';
  status: 'pending' | 'simulated' | 'published' | 'cancelled';
  prize_pool_total: number;
  jackpot_amount: number;
  rollover_from_draw_id?: string;
  simulation_data?: DrawSimulationData;
  published_at?: string;
  created_at: string;
  updated_at: string;
  draw_numbers?: DrawNumber[];
  winners?: Winner[];
}

export interface DrawNumber {
  id: string;
  draw_id: string;
  number: number;
  position: number;
}

export interface DrawSimulationData {
  numbers: number[];
  five_match_winners: number;
  four_match_winners: number;
  three_match_winners: number;
  prize_breakdown: PrizeBreakdown;
}

export interface PrizeBreakdown {
  five_match_pool: number;
  four_match_pool: number;
  three_match_pool: number;
  five_match_per_winner: number;
  four_match_per_winner: number;
  three_match_per_winner: number;
}

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  match_tier: 3 | 4 | 5;
  matched_numbers: number[];
  prize_amount: number;
  payment_status: 'pending' | 'paid' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: Profile;
  verification?: WinnerVerification;
}

export interface WinnerVerification {
  id: string;
  winner_id: string;
  user_id: string;
  proof_url: string;
  admin_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PrizePoolConfig {
  id: string;
  monthly_price_pence: number;
  yearly_price_pence: number;
  prize_pool_percentage: number;
  five_match_share: number;
  four_match_share: number;
  three_match_share: number;
  charity_share_percentage: number;
}

export interface Donation {
  id: string;
  user_id?: string;
  charity_id: string;
  amount_pence: number;
  currency: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatCurrency(pence: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(pence / 100);
}

export function getMonthName(month: number): string {
  return MONTHS[month - 1] ?? '';
}
