-- Critical auth fix: profiles only had SELECT/UPDATE policies, so the client
-- upsert that records onboarding completion silently affected zero rows when
-- the handle_new_user() trigger had not created a profile row. Allow users to
-- insert their own row so the upsert can self-heal.

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
