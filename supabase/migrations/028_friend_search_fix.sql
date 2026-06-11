-- Friend search fix.
--
-- Root causes addressed:
-- 1. Databases bootstrapped without migration 020 only allow users to SELECT
--    their own profiles row, so user search always returns nothing.
-- 2. Users whose signup trigger failed (or predated it) have no profiles row
--    or a NULL email, making them unfindable by email search.

-- 1. Ensure authenticated users can discover other profiles.
DROP POLICY IF EXISTS "Authenticated users discover profiles" ON profiles;
CREATE POLICY "Authenticated users discover profiles" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- 2. Ensure users can create their own row (client self-heal upsert).
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Backfill: create missing profile rows for every existing auth user.
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill: fill NULL/empty emails on existing profile rows.
UPDATE public.profiles p
SET email = u.email, updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND (p.email IS NULL OR p.email = '');

-- 5. Harden the signup trigger so future signups always get a row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    WHERE profiles.email IS NULL OR profiles.email = '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Case-insensitive email lookups should be fast.
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (LOWER(email));
