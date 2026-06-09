-- Phase 13: Task sync keys, snooze, reminder settings

ALTER TABLE plant_tasks ADD COLUMN IF NOT EXISTS task_key TEXT;
ALTER TABLE plant_tasks ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plant_tasks_user_task_key
  ON plant_tasks(user_id, task_key)
  WHERE task_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_reminder_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_time TEXT NOT NULL DEFAULT '09:00',
  watering_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  fertilizer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  health_check_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  growth_photo_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mission_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_reminder_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reminder settings" ON user_reminder_settings;
CREATE POLICY "Users manage own reminder settings" ON user_reminder_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
