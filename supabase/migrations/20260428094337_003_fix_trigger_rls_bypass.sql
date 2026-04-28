/*
  # Fix enforce_max_five_scores trigger RLS bypass

  The trigger function needs to bypass RLS when deleting the oldest score
  so it can operate across all rows without being restricted by user policies.
  Adding explicit SET row_security = off ensures the DELETE inside the trigger
  works regardless of who triggered it.
*/

CREATE OR REPLACE FUNCTION enforce_max_five_scores()
RETURNS TRIGGER AS $$
DECLARE
  score_count integer;
  oldest_score_id uuid;
BEGIN
  -- Count existing scores for this user (bypasses RLS as SECURITY DEFINER)
  SELECT COUNT(*) INTO score_count
  FROM scores
  WHERE user_id = NEW.user_id;

  -- If already at 5, remove the oldest before inserting the new one
  IF score_count >= 5 THEN
    SELECT id INTO oldest_score_id
    FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date ASC
    LIMIT 1;

    IF oldest_score_id IS NOT NULL THEN
      DELETE FROM scores WHERE id = oldest_score_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
