-- PHASE 45: Idempotent schema repair for production gaps.
-- Safe to run multiple times. Never drops data.

-- ── Profiles: onboarding + discovery columns ────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS main_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grow_types TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS garden_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_prefs JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username) WHERE username IS NOT NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users discover profiles" ON profiles;
CREATE POLICY "Authenticated users discover profiles" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── Plant journal entries ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('photo', 'note', 'milestone')),
  body TEXT DEFAULT '',
  photo_url TEXT,
  milestone_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (
    visibility IN ('private', 'friends', 'circle', 'public')
  ),
  feed_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plant_journal_user_created
  ON plant_journal_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_journal_plant
  ON plant_journal_entries (plant_id, created_at DESC);

ALTER TABLE plant_journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own journal entries" ON plant_journal_entries;
CREATE POLICY "Users manage own journal entries" ON plant_journal_entries
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Pro health reports ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  species TEXT NOT NULL DEFAULT '',
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  environment JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb,
  remedy_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  prognosis JSONB NOT NULL DEFAULT '{}'::jsonb,
  commercial_context JSONB,
  severity TEXT NOT NULL DEFAULT 'moderate'
    CHECK (severity IN ('mild', 'moderate', 'severe')),
  confidence INTEGER NOT NULL DEFAULT 50
    CHECK (confidence BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'monitoring', 'improved', 'resolved', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pro_health_reports_user_created
  ON pro_health_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_health_reports_status
  ON pro_health_reports (user_id, status);

ALTER TABLE pro_health_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own pro health reports" ON pro_health_reports;
DROP POLICY IF EXISTS "Users insert own pro health reports" ON pro_health_reports;
DROP POLICY IF EXISTS "Users update own pro health reports" ON pro_health_reports;
CREATE POLICY "Users read own pro health reports" ON pro_health_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pro health reports" ON pro_health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pro health reports" ON pro_health_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Expert review requests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expert_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_report_id UUID REFERENCES pro_health_reports(id) ON DELETE SET NULL,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  urgency TEXT NOT NULL DEFAULT 'medium'
    CHECK (urgency IN ('low', 'medium', 'high')),
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expert_review_requests_user_id
  ON expert_review_requests (user_id);

ALTER TABLE expert_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own expert requests" ON expert_review_requests;
DROP POLICY IF EXISTS "Users insert own expert requests" ON expert_review_requests;
CREATE POLICY "Users read own expert requests" ON expert_review_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own expert requests" ON expert_review_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Scan history ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  scan_type TEXT NOT NULL DEFAULT 'identify'
    CHECK (scan_type IN ('identify', 'diagnose', 'tag', 'progress')),
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_description TEXT,
  symptom_chips TEXT[] DEFAULT '{}',
  plant_id_guess TEXT,
  plant_id_confidence TEXT,
  diagnosis_result JSONB,
  confidence TEXT,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_created
  ON scan_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_plant
  ON scan_history (plant_id) WHERE plant_id IS NOT NULL;

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own scan history" ON scan_history;
CREATE POLICY "Users manage own scan history" ON scan_history
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Intelligence signal tables ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,
  plant_species TEXT,
  issue TEXT,
  zip_prefix TEXT,
  city TEXT,
  state TEXT,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_signals_period
  ON community_signals (period_start, signal_type);

CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  location TEXT,
  percent_change NUMERIC,
  direction TEXT NOT NULL DEFAULT 'flat',
  reason TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'estimated',
  source TEXT NOT NULL DEFAULT 'manual',
  estimated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trend_signals_term ON trend_signals (term, created_at DESC);

CREATE TABLE IF NOT EXISTS local_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (zip_code)
);

CREATE INDEX IF NOT EXISTS idx_local_insights_cache_zip ON local_insights_cache (zip_code);

ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_insights_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read community signals" ON community_signals;
CREATE POLICY "Authenticated read community signals" ON community_signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read trend signals" ON trend_signals;
CREATE POLICY "Authenticated read trend signals" ON trend_signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read local insights cache" ON local_insights_cache;
CREATE POLICY "Authenticated read local insights cache" ON local_insights_cache
  FOR SELECT TO authenticated USING (true);

-- ── Notifications engine ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, token)
);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON user_push_tokens;
CREATE POLICY "Users manage own push tokens" ON user_push_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS health_followups (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_id TEXT NOT NULL,
  plant_id TEXT,
  plant_name TEXT,
  issue_label TEXT,
  kind TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE health_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own health followups" ON health_followups;
CREATE POLICY "Users manage own health followups" ON health_followups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_id TEXT,
  event_type TEXT NOT NULL,
  channel TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification analytics" ON notification_analytics;
CREATE POLICY "Users manage own notification analytics" ON notification_analytics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Task validation columns ─────────────────────────────────────────────────
ALTER TABLE plant_tasks
  ADD COLUMN IF NOT EXISTS validation_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE plant_tasks
  ADD COLUMN IF NOT EXISTS validation_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
