/*
  # Fix infinite recursion in admin RLS policies

  ## Problem
  All admin policies across all tables query the `profiles` table to check role.
  The `profiles` table itself has an admin policy that queries `profiles` again.
  This causes "infinite recursion detected in policy for relation profiles" (42P17).

  ## Solution
  Create a SECURITY DEFINER helper function `is_admin()` that bypasses RLS
  when checking the current user's role. Replace all admin policy EXISTS subqueries
  with this function call.

  ## Changes
  - New function: `public.is_admin()` - security definer, checks profiles.role
  - Recreated all admin policies on all tables to use `is_admin()` instead of
    inline subquery against profiles
*/

-- Create a security definer function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── scores ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all scores" ON scores;
DROP POLICY IF EXISTS "Admins can update all scores" ON scores;
DROP POLICY IF EXISTS "Admins can delete any scores" ON scores;

CREATE POLICY "Admins can view all scores"
  ON scores FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all scores"
  ON scores FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any scores"
  ON scores FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── subscriptions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── charities ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all charities" ON charities;
DROP POLICY IF EXISTS "Admins can insert charities" ON charities;
DROP POLICY IF EXISTS "Admins can update charities" ON charities;
DROP POLICY IF EXISTS "Admins can delete charities" ON charities;

CREATE POLICY "Admins can view all charities"
  ON charities FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert charities"
  ON charities FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update charities"
  ON charities FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete charities"
  ON charities FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── charity_events ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage charity events" ON charity_events;
DROP POLICY IF EXISTS "Admins can update charity events" ON charity_events;
DROP POLICY IF EXISTS "Admins can delete charity events" ON charity_events;

CREATE POLICY "Admins can manage charity events"
  ON charity_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update charity events"
  ON charity_events FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete charity events"
  ON charity_events FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── user_charities ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all user charities" ON user_charities;

CREATE POLICY "Admins can view all user charities"
  ON user_charities FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── draws ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all draws" ON draws;
DROP POLICY IF EXISTS "Admins can insert draws" ON draws;
DROP POLICY IF EXISTS "Admins can update draws" ON draws;

CREATE POLICY "Admins can view all draws"
  ON draws FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert draws"
  ON draws FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update draws"
  ON draws FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── draw_numbers ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage draw numbers" ON draw_numbers;
DROP POLICY IF EXISTS "Admins can update draw numbers" ON draw_numbers;
DROP POLICY IF EXISTS "Admins can delete draw numbers" ON draw_numbers;

CREATE POLICY "Admins can manage draw numbers"
  ON draw_numbers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update draw numbers"
  ON draw_numbers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete draw numbers"
  ON draw_numbers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── winners ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all winners" ON winners;
DROP POLICY IF EXISTS "Admins can insert winners" ON winners;
DROP POLICY IF EXISTS "Admins can update winners" ON winners;

CREATE POLICY "Admins can view all winners"
  ON winners FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert winners"
  ON winners FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update winners"
  ON winners FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── winner_verifications ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all verifications" ON winner_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON winner_verifications;

CREATE POLICY "Admins can view all verifications"
  ON winner_verifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update verifications"
  ON winner_verifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── prize_pool_config ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update prize config" ON prize_pool_config;
DROP POLICY IF EXISTS "Admins can insert prize config" ON prize_pool_config;

CREATE POLICY "Admins can update prize config"
  ON prize_pool_config FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert prize config"
  ON prize_pool_config FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ── donations ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all donations" ON donations;

CREATE POLICY "Admins can view all donations"
  ON donations FOR SELECT
  TO authenticated
  USING (public.is_admin());
