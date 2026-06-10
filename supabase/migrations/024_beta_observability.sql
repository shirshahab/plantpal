-- Phase 42: Beta launch readiness — ensure observability tables exist.
-- beta_feedback previously only lived in FIX_RUN_THIS.sql; this makes it a
-- proper migration so feedback reaches Supabase on fresh databases.

-- ─── Beta feedback ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  route TEXT,
  feedback_type TEXT DEFAULT 'beta',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit beta feedback" ON beta_feedback;
CREATE POLICY "Anyone can submit beta feedback" ON beta_feedback
  FOR INSERT WITH CHECK (true);
-- No SELECT policy for anon — only service role reads feedback.

-- ─── Onboarding profile sync ─────────────────────────────────────────────────
-- Mirror onboarding answers to the cloud profile so beta ops can see who
-- finished onboarding (previously localStorage-only).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS main_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grow_types TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
