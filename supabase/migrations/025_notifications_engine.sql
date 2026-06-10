-- Phase 41: Notifications, reminders & retention engine.
-- App-level notification history, push token registry, health follow-ups,
-- and notification analytics.

-- ─── Notifications (app-level history) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id) WHERE read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Push token registry (PWA web-push now, Expo/iOS/Android later) ─────────
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web-push', 'expo', 'ios', 'android')),
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON user_push_tokens(user_id);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON user_push_tokens;
CREATE POLICY "Users manage own push tokens" ON user_push_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Health follow-ups (rescan / symptom-check reminders per diagnosis) ─────
CREATE TABLE IF NOT EXISTS health_followups (
  -- TEXT id: deterministic per report+kind (e.g. "rescan-<reportId>") so
  -- client re-syncs upsert instead of duplicating.
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_id TEXT NOT NULL,
  plant_id TEXT,
  plant_name TEXT,
  issue_label TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('rescan', 'symptom_check', 'recovery_step')),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_followups_user_due
  ON health_followups(user_id, due_date);

ALTER TABLE health_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own health followups" ON health_followups;
CREATE POLICY "Users manage own health followups" ON health_followups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Notification analytics (sent / opened / completed) ─────────────────────
CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_id TEXT,
  notification_type TEXT,
  event TEXT NOT NULL CHECK (event IN ('sent', 'opened', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_created
  ON notification_analytics(created_at DESC);

ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own notification analytics" ON notification_analytics;
CREATE POLICY "Users insert own notification analytics" ON notification_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- No SELECT policy for anon — only service role reads analytics.
