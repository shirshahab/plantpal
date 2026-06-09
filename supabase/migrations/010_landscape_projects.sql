-- Phase 21: AI Landscape Designer — saved projects

CREATE TABLE IF NOT EXISTS landscape_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  space_type TEXT NOT NULL CHECK (
    space_type IN (
      'front_yard', 'back_yard', 'side_yard', 'patio', 'balcony', 'slope'
    )
  ),
  style_goal TEXT NOT NULL CHECK (
    style_goal IN (
      'fruit_garden', 'low_maintenance', 'native_garden', 'tropical',
      'mediterranean', 'japanese_garden', 'kids_family', 'pollinator',
      'privacy', 'outdoor_living'
    )
  ),
  budget_range TEXT NOT NULL CHECK (
    budget_range IN (
      'under_500', '500_2500', '2500_8000', '8000_plus', 'flexible'
    )
  ),
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  design_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_landscape_projects_user_id
  ON landscape_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_landscape_projects_updated_at
  ON landscape_projects(updated_at DESC);

ALTER TABLE landscape_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own landscape projects" ON landscape_projects;
CREATE POLICY "Users read own landscape projects" ON landscape_projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own landscape projects" ON landscape_projects;
CREATE POLICY "Users insert own landscape projects" ON landscape_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own landscape projects" ON landscape_projects;
CREATE POLICY "Users update own landscape projects" ON landscape_projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own landscape projects" ON landscape_projects;
CREATE POLICY "Users delete own landscape projects" ON landscape_projects
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
