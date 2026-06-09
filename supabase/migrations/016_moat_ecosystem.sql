-- Phase 31: PlantPal Moat Ecosystem
-- Garden Map, Family, Missions, Seasonal, Design Studio, Marketplace

-- ─── Garden Map (Digital Twin) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS garden_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  space_type TEXT NOT NULL CHECK (space_type IN (
    'front_yard', 'backyard', 'side_yard', 'balcony',
    'indoor', 'greenhouse', 'orchard', 'vegetable_garden'
  )),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS garden_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES garden_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  x NUMERIC(5,4) NOT NULL DEFAULT 0,
  y NUMERIC(5,4) NOT NULL DEFAULT 0,
  width NUMERIC(5,4) NOT NULL DEFAULT 0.2,
  height NUMERIC(5,4) NOT NULL DEFAULT 0.2,
  sun_exposure TEXT NOT NULL DEFAULT 'partial_sun',
  shade_hours SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS garden_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES garden_spaces(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES garden_zones(id) ON DELETE SET NULL,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  sun_exposure TEXT NOT NULL DEFAULT 'partial_sun',
  water_schedule TEXT,
  fertilizer_schedule TEXT,
  health_score SMALLINT NOT NULL DEFAULT 80 CHECK (health_score BETWEEN 0 AND 100),
  x NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  y NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  growth_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Family / Households ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  invite_code TEXT NOT NULL UNIQUE,
  total_family_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'roommate')),
  display_name TEXT NOT NULL,
  avatar TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  plants_maintained INTEGER NOT NULL DEFAULT 0,
  watering_streak INTEGER NOT NULL DEFAULT 0,
  badges_earned INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS family_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'tasks',
  reward_xp INTEGER NOT NULL DEFAULT 100,
  reward_badge TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

-- ─── Community Missions & Streaks ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly')),
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'claimed')),
  period_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, mission_id, period_key)
);

CREATE TABLE IF NOT EXISTS user_mission_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE
);

-- ─── Seasonal Tasks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seasonal_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_key TEXT,
  UNIQUE (user_id, task_id, location_key)
);

-- ─── Design Studio Projects ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS design_studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_label TEXT NOT NULL,
  style TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  concept JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Marketplace (affiliate-ready) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price_range TEXT,
  affiliate_source TEXT CHECK (affiliate_source IN ('amazon', 'home_depot', 'local_nursery', 'serpapi')),
  affiliate_url TEXT,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS marketplace_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES marketplace_products(id),
  reason TEXT,
  plant_pattern TEXT,
  score NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS (enable + basic owner policies) ─────────────────────────────────────

ALTER TABLE garden_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY garden_spaces_owner ON garden_spaces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY garden_zones_owner ON garden_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM garden_spaces s WHERE s.id = space_id AND s.user_id = auth.uid())
);
CREATE POLICY garden_placements_owner ON garden_placements FOR ALL USING (
  EXISTS (SELECT 1 FROM garden_spaces s WHERE s.id = space_id AND s.user_id = auth.uid())
);
CREATE POLICY household_members_self ON household_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_missions_self ON user_mission_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_streaks_self ON user_mission_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY seasonal_completions_self ON seasonal_task_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY design_studio_self ON design_studio_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY marketplace_recs_self ON marketplace_recommendations FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_garden_spaces_user ON garden_spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_placements_space ON garden_placements(space_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_period ON user_mission_progress(user_id, period_key);
