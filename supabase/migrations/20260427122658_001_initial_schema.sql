/*
  # Initial Schema - Golf Performance + Charity + Draw Platform

  ## Overview
  Complete schema for the subscription-driven golf platform including:
  - User profiles with role management
  - Subscription tracking
  - Score management (rolling 5 scores, date uniqueness enforced)
  - Charity directory and user contributions
  - Draw system with random and algorithmic modes
  - Prize pool with rollover logic
  - Winner verification workflow

  ## Tables
  1. `profiles` - Extended user data, role, and subscription reference
  2. `subscriptions` - Subscription records with Stripe integration
  3. `scores` - Golf scores (max 5 per user, date-unique per user)
  4. `charities` - Charity directory
  5. `user_charities` - User-selected charity and contribution %
  6. `draws` - Monthly draw events
  7. `draw_numbers` - The 5 winning numbers per draw
  8. `draw_entries` - User participation per draw
  9. `winners` - Winners per draw with tier
  10. `winner_verifications` - Proof upload and admin review
  11. `prize_pool_config` - Platform-level prize config
  12. `jackpot_rollovers` - Accumulated jackpot tracking
  13. `donations` - Independent donations outside of subscription

  ## Security
  - RLS enabled on all tables
  - Admin role checked via profiles.role
  - Users can only access their own data
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  country text DEFAULT 'IE',
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'lapsed', 'pending')),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  amount_pence integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, score_date)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, score_date DESC);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scores"
  ON scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update all scores"
  ON scores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete any scores"
  ON scores FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Function to enforce max 5 scores per user (rolling window)
CREATE OR REPLACE FUNCTION enforce_max_five_scores()
RETURNS TRIGGER AS $$
DECLARE
  score_count integer;
  oldest_score_id uuid;
BEGIN
  SELECT COUNT(*) INTO score_count
  FROM scores
  WHERE user_id = NEW.user_id;

  IF score_count >= 5 THEN
    SELECT id INTO oldest_score_id
    FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date ASC
    LIMIT 1;

    DELETE FROM scores WHERE id = oldest_score_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_max_five_scores ON scores;
CREATE TRIGGER trigger_enforce_max_five_scores
  BEFORE INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_five_scores();

-- ============================================================
-- CHARITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  logo_url text,
  cover_image_url text,
  website_url text,
  category text DEFAULT 'general',
  country text DEFAULT 'IE',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  total_raised integer DEFAULT 0,
  supporter_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charities_slug ON charities(slug);
CREATE INDEX IF NOT EXISTS idx_charities_featured ON charities(is_featured);
CREATE INDEX IF NOT EXISTS idx_charities_active ON charities(is_active);

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active charities"
  ON charities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all charities"
  ON charities FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert charities"
  ON charities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update charities"
  ON charities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete charities"
  ON charities FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Charity events
CREATE TABLE IF NOT EXISTS charity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id uuid NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  event_date date NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view charity events"
  ON charity_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage charity events"
  ON charity_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update charity events"
  ON charity_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete charity events"
  ON charity_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- USER CHARITIES (selected charity + contribution %)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id uuid NOT NULL REFERENCES charities(id),
  contribution_percentage integer NOT NULL DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own charity selection"
  ON user_charities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own charity selection"
  ON user_charities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own charity selection"
  ON user_charities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user charities"
  ON user_charities FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- DRAWS
-- ============================================================
CREATE TABLE IF NOT EXISTS draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  draw_type text NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published', 'cancelled')),
  prize_pool_total integer NOT NULL DEFAULT 0,
  jackpot_amount integer NOT NULL DEFAULT 0,
  rollover_from_draw_id uuid REFERENCES draws(id),
  simulation_data jsonb,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month, year)
);

CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_draws_year_month ON draws(year DESC, month DESC);

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published draws"
  ON draws FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can view all draws"
  ON draws FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert draws"
  ON draws FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update draws"
  ON draws FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Draw winning numbers
CREATE TABLE IF NOT EXISTS draw_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  number integer NOT NULL CHECK (number >= 1 AND number <= 45),
  position integer NOT NULL CHECK (position >= 1 AND position <= 5),
  UNIQUE(draw_id, position),
  UNIQUE(draw_id, number)
);

ALTER TABLE draw_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view draw numbers for published draws"
  ON draw_numbers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM draws d WHERE d.id = draw_id AND d.status = 'published')
  );

CREATE POLICY "Admins can manage draw numbers"
  ON draw_numbers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update draw numbers"
  ON draw_numbers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete draw numbers"
  ON draw_numbers FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- WINNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  match_tier integer NOT NULL CHECK (match_tier IN (3, 4, 5)),
  matched_numbers integer[] NOT NULL DEFAULT '{}',
  prize_amount integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);

ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wins"
  ON winners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all winners"
  ON winners FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert winners"
  ON winners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update winners"
  ON winners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- WINNER VERIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS winner_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id uuid NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  proof_url text NOT NULL,
  admin_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE winner_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON winner_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
  ON winner_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
  ON winner_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update verifications"
  ON winner_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- PRIZE POOL CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS prize_pool_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_price_pence integer NOT NULL DEFAULT 999,
  yearly_price_pence integer NOT NULL DEFAULT 9999,
  prize_pool_percentage integer NOT NULL DEFAULT 60 CHECK (prize_pool_percentage >= 0 AND prize_pool_percentage <= 100),
  five_match_share integer NOT NULL DEFAULT 40,
  four_match_share integer NOT NULL DEFAULT 35,
  three_match_share integer NOT NULL DEFAULT 25,
  charity_share_percentage integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prize_pool_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prize config"
  ON prize_pool_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can update prize config"
  ON prize_pool_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert prize config"
  ON prize_pool_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- DONATIONS (independent)
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  charity_id uuid NOT NULL REFERENCES charities(id),
  amount_pence integer NOT NULL CHECK (amount_pence > 0),
  currency text NOT NULL DEFAULT 'GBP',
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_charity_id ON donations(charity_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own donations"
  ON donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations"
  ON donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- SEED: Default prize pool config
-- ============================================================
INSERT INTO prize_pool_config (monthly_price_pence, yearly_price_pence, prize_pool_percentage, five_match_share, four_match_share, three_match_share, charity_share_percentage)
VALUES (999, 9999, 60, 40, 35, 25, 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Sample charities
-- ============================================================
INSERT INTO charities (name, slug, description, short_description, logo_url, cover_image_url, category, country, is_featured, is_active, total_raised, supporter_count) VALUES
(
  'Cancer Research Ireland',
  'cancer-research-ireland',
  'Cancer Research Ireland is the leading funder of cancer research in Ireland. We fund world-class scientists and clinicians to develop better treatments, improve early detection, and ultimately find cures for cancer. Our work impacts thousands of lives every year through groundbreaking discoveries.',
  'Funding world-class cancer research to save lives across Ireland.',
  'https://images.pexels.com/photos/6129025/pexels-photo-6129025.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/6129025/pexels-photo-6129025.jpeg?auto=compress&cs=tinysrgb&w=800',
  'health',
  'IE',
  true,
  true,
  284500,
  1240
),
(
  'Children''s Health Foundation',
  'childrens-health-foundation',
  'The Children''s Health Foundation raises funds to enhance the care and treatment of sick children and young people at Children''s Health Ireland. We support vital medical equipment, family support services, and research programmes that make a real difference to children and families facing illness.',
  'Supporting the health and wellbeing of children across Ireland.',
  'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
  'children',
  'IE',
  false,
  true,
  156200,
  890
),
(
  'Irish Heart Foundation',
  'irish-heart-foundation',
  'The Irish Heart Foundation is the national charity for people affected by heart disease and stroke in Ireland. We fund vital research, provide support for patients and families, and run community health programmes that teach life-saving CPR and promote heart health across the country.',
  'Fighting heart disease and stroke, Ireland''s biggest killers.',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=800',
  'health',
  'IE',
  false,
  true,
  98300,
  654
),
(
  'Focus Ireland',
  'focus-ireland',
  'Focus Ireland works to prevent people losing their homes and to help people out of homelessness by providing housing, advice, and support services. We believe everyone has the right to a place they can call home and we work tirelessly to make that a reality for vulnerable people across Ireland.',
  'Working with people experiencing homelessness across Ireland.',
  'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800',
  'community',
  'IE',
  false,
  true,
  72100,
  432
),
(
  'ISPCA Animal Welfare',
  'ispca-animal-welfare',
  'The Irish Society for the Prevention of Cruelty to Animals (ISPCA) is the national animal welfare charity of Ireland. We rescue, rehabilitate, and rehome thousands of animals every year, and we work to end animal cruelty through education, advocacy, and enforcement of animal welfare laws.',
  'Protecting animals and ending cruelty across Ireland.',
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=100',
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
  'animals',
  'IE',
  false,
  true,
  45600,
  310
)
ON CONFLICT (slug) DO NOTHING;
