-- PlantPal Phase 8: Goal-Based Plant Care
-- Also appended to supabase/FIX_RUN_THIS.sql

-- ─── Goal catalog (reference) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'general', 'fruit_trees', 'flowering', 'landscape', 'bonsai', 'indoor'
  )),
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── User plant goals ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_plant_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL REFERENCES plant_goals(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, plant_id, goal_id)
);

-- ─── Milestones ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Missions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  season TEXT,
  task_type TEXT CHECK (task_type IN (
    'water', 'fertilize', 'prune', 'inspect', 'photo', 'repot', 'custom'
  )),
  reward_points INTEGER NOT NULL DEFAULT 10,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_plant_goals_plant ON user_plant_goals(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_milestones_plant ON plant_milestones(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_missions_plant ON plant_missions(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_missions_status ON plant_missions(status);

ALTER TABLE user_plant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read plant_goals" ON plant_goals;
DROP POLICY IF EXISTS "Anon read plant_goals" ON plant_goals;
CREATE POLICY "Authenticated read plant_goals" ON plant_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read plant_goals" ON plant_goals FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Users read own plant goals" ON user_plant_goals;
DROP POLICY IF EXISTS "Users insert own plant goals" ON user_plant_goals;
DROP POLICY IF EXISTS "Users update own plant goals" ON user_plant_goals;
DROP POLICY IF EXISTS "Users delete own plant goals" ON user_plant_goals;
CREATE POLICY "Users read own plant goals" ON user_plant_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plant goals" ON user_plant_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plant goals" ON user_plant_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plant goals" ON user_plant_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own milestones" ON plant_milestones;
DROP POLICY IF EXISTS "Users insert own milestones" ON plant_milestones;
DROP POLICY IF EXISTS "Users update own milestones" ON plant_milestones;
DROP POLICY IF EXISTS "Users delete own milestones" ON plant_milestones;
CREATE POLICY "Users read own milestones" ON plant_milestones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own milestones" ON plant_milestones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own milestones" ON plant_milestones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own milestones" ON plant_milestones FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own missions" ON plant_missions;
DROP POLICY IF EXISTS "Users insert own missions" ON plant_missions;
DROP POLICY IF EXISTS "Users update own missions" ON plant_missions;
DROP POLICY IF EXISTS "Users delete own missions" ON plant_missions;
CREATE POLICY "Users read own missions" ON plant_missions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own missions" ON plant_missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own missions" ON plant_missions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own missions" ON plant_missions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed plant_goals (idempotent)
INSERT INTO plant_goals (id, name, category, description, icon) VALUES
  ('keep-it-alive', 'Keep it alive', 'general', 'Build a simple routine that keeps your plant healthy.', '🌱'),
  ('low-maintenance', 'Low maintenance', 'general', 'Spend less time while still getting good results.', '☕'),
  ('faster-growth', 'Faster growth', 'general', 'Encourage vigorous new leaves and branches.', '🚀'),
  ('health-recovery', 'Health recovery', 'general', 'Bring a stressed plant back to strength.', '💚'),
  ('repot-later', 'Repot later', 'general', 'Plan the right time and method for repotting.', '🪴'),
  ('organic-care', 'Organic care', 'general', 'Use natural fertilizers and gentle pest control.', '🍃'),
  ('more-fruit', 'More fruit', 'fruit_trees', 'Maximize flower set and fruit production.', '🍊'),
  ('bigger-fruit', 'Bigger fruit', 'fruit_trees', 'Support larger, juicier harvests.', '🍑'),
  ('earlier-fruiting', 'Earlier fruiting', 'fruit_trees', 'Encourage fruit sooner in the season.', '⏰'),
  ('stronger-roots', 'Stronger roots', 'fruit_trees', 'Build a deep root system for long-term health.', '🌳'),
  ('more-flowers', 'More flowers', 'flowering', 'Increase bloom count throughout the season.', '🌸'),
  ('bigger-blooms', 'Bigger blooms', 'flowering', 'Help flowers open larger and brighter.', '🌺'),
  ('longer-bloom-season', 'Longer bloom season', 'flowering', 'Extend how long your plant flowers.', '📅'),
  ('pollinator-attraction', 'Pollinator attraction', 'flowering', 'Draw bees, butterflies, and hummingbirds.', '🐝'),
  ('more-shade', 'More shade', 'landscape', 'Develop a fuller canopy for cooling shade.', '🌤️'),
  ('privacy-screen', 'Privacy screen', 'landscape', 'Grow a dense, living screen.', '🧱'),
  ('stronger-structure', 'Stronger structure', 'landscape', 'Build sturdy branches and trunk.', '💪'),
  ('drought-tolerance', 'Drought tolerance', 'landscape', 'Reduce water needs over time.', '💧'),
  ('wind-resistance', 'Wind resistance', 'landscape', 'Strengthen against wind and storms.', '🌬️'),
  ('bonsai-training', 'Bonsai training', 'bonsai', 'Shape and refine your tree over seasons.', '✂️'),
  ('trunk-thickening', 'Trunk thickening', 'bonsai', 'Develop a powerful, tapered trunk.', '🪵'),
  ('smaller-leaves', 'Smaller leaves', 'bonsai', 'Encourage finer, proportionate foliage.', '🍂'),
  ('more-branching', 'More branching', 'bonsai', 'Create ramification and pad density.', '🌿'),
  ('styling-development', 'Styling development', 'bonsai', 'Progress toward your design vision.', '🎨'),
  ('show-preparation', 'Show preparation', 'bonsai', 'Get show-ready before an exhibition.', '🏆'),
  ('fuller-growth', 'Fuller growth', 'indoor', 'Encourage a bushy, balanced shape.', '🪴'),
  ('better-leaf-color', 'Better leaf color', 'indoor', 'Improve leaf color and vibrancy.', '🎨'),
  ('reduce-leaf-drop', 'Reduce leaf drop', 'indoor', 'Keep leaves on longer with stable care.', '📉'),
  ('pest-prevention', 'Pest prevention', 'indoor', 'Stay ahead of common indoor pests.', '🛡️')
ON CONFLICT (id) DO NOTHING;
