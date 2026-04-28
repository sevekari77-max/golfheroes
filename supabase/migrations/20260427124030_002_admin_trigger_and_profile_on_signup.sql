/*
  # Auto-create profile on signup + Admin email trigger

  1. Creates a trigger that auto-creates a profile record when a new auth user signs up
  2. Grants admin role to the designated admin email address
  3. Handles profile creation gracefully if it already exists
*/

-- Function: auto-create profile from auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  -- Assign admin role to designated admin email
  IF NEW.email = 'admin@golfheroes.com' THEN
    user_role := 'admin';
  ELSE
    user_role := 'subscriber';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = CASE WHEN public.profiles.role = 'admin' THEN 'admin' ELSE user_role END,
        updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also update any existing profile with admin email
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'admin@golfheroes.com';
