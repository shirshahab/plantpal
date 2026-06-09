-- Phase 10: Daily care tasks, care logs, plant timestamp columns

ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_pruned_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_repotted_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_health_scan_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_growth_photo_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS plant_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  task_type TEXT NOT NULL CHECK (task_type IN (
    'water', 'fertilize', 'prune', 'repot', 'inspect', 'scan',
    'harvest', 'take_growth_photo', 'complete_lesson'
  )),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'care_schedule'
    CHECK (source IN ('care_schedule', 'ai_plan', 'goal_mission', 'weather', 'manual', 'seasonal')),
  why_it_matters TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS plant_care_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plant_tasks_user_due ON plant_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_plant_tasks_plant ON plant_tasks(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_care_logs_plant ON plant_care_logs(plant_id);

ALTER TABLE plant_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_care_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own plant_tasks" ON plant_tasks;
CREATE POLICY "Users manage own plant_tasks" ON plant_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own plant_care_logs" ON plant_care_logs;
CREATE POLICY "Users manage own plant_care_logs" ON plant_care_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
