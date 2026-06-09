-- ═══════════════════════════════════════════════════════════════════════════
-- PlantPal — COMPLETE DATABASE SETUP (Phase 16 — safe to run repeatedly)
-- Uses IF NOT EXISTS / DROP POLICY IF EXISTS throughout.
-- ═══════════════════════════════════════════════════════════════════════════
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste ALL → Run
-- URL:   https://supabase.com/dashboard/project/fxmxkmqgxlhggqngsxja/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Helper functions ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Plants (matches Add Plant wizard + mapPlantInputToDb) ────────────────
-- Required on insert: user_id, nickname, species, location_type, container_type,
-- zip_code, sun_exposure, photo_url, health_status, water_frequency,
-- fertilizer_frequency, pruning_frequency, notes
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  species TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('indoor', 'outdoor')),
  container_type TEXT NOT NULL CHECK (container_type IN ('pot', 'ground')),
  zip_code TEXT NOT NULL,
  hardiness_zone TEXT,
  sun_exposure TEXT NOT NULL CHECK (sun_exposure IN ('full_sun', 'partial_sun', 'shade')),
  photo_url TEXT,
  health_status TEXT NOT NULL DEFAULT 'healthy'
    CHECK (health_status IN ('healthy', 'needs_attention', 'critical')),
  water_frequency INTEGER NOT NULL DEFAULT 7,
  fertilizer_frequency INTEGER NOT NULL DEFAULT 8,
  pruning_frequency TEXT NOT NULL DEFAULT 'Early spring',
  notes TEXT DEFAULT '',
  last_watered_at TIMESTAMPTZ,
  last_fertilized_at TIMESTAMPTZ,
  plant_species_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Migrate legacy Phase 1 column names if an older schema was applied
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plants' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plants' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE public.plants RENAME COLUMN name TO nickname;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plants' AND column_name = 'planting_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plants' AND column_name = 'container_type'
  ) THEN
    ALTER TABLE public.plants RENAME COLUMN planting_type TO container_type;
  END IF;
END $$;

ALTER TABLE plants ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS species TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS location_type TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS container_type TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS sun_exposure TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'healthy';
ALTER TABLE plants ADD COLUMN IF NOT EXISTS water_frequency INTEGER DEFAULT 7;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS fertilizer_frequency INTEGER DEFAULT 8;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS pruning_frequency TEXT DEFAULT 'Early spring';
ALTER TABLE plants ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_watered_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_fertilized_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS plant_species_id UUID;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE plants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Plant Photos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'profile'
    CHECK (photo_type IN ('profile', 'health_scan', 'growth', 'nursery_tag', 'identification')),
  notes TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE plant_photos ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'profile';
ALTER TABLE plant_photos ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE plant_photos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE plant_photos ALTER COLUMN plant_id DROP NOT NULL;

-- ─── Care Schedules ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS care_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL UNIQUE REFERENCES plants(id) ON DELETE CASCADE,
  watering_instructions TEXT,
  fertilizing_instructions TEXT,
  pruning_instructions TEXT,
  ai_generated_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE care_schedules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE care_schedules ADD COLUMN IF NOT EXISTS watering_instructions TEXT;
ALTER TABLE care_schedules ADD COLUMN IF NOT EXISTS fertilizing_instructions TEXT;
ALTER TABLE care_schedules ADD COLUMN IF NOT EXISTS pruning_instructions TEXT;
ALTER TABLE care_schedules ADD COLUMN IF NOT EXISTS ai_generated_data JSONB;
ALTER TABLE care_schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Health Reports ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_health TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Knowledge Engine: reference tables ───────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  family TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'tree','shrub','flower','vegetable','herb','indoor','succulent','vine','grass'
  )),
  description TEXT,
  sunlight TEXT,
  watering TEXT,
  soil_preference TEXT,
  hardiness_zone_min INTEGER,
  hardiness_zone_max INTEGER,
  mature_height TEXT,
  mature_width TEXT,
  growth_rate TEXT,
  toxicity TEXT,
  maintenance_level TEXT,
  image_url TEXT,
  source TEXT DEFAULT 'plantpal_seed',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS soil_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  texture TEXT,
  drainage TEXT,
  ph_min DECIMAL(3,1),
  ph_max DECIMAL(3,1),
  best_for TEXT,
  description TEXT,
  amendments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS fertilizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type IN ('organic','synthetic','slow_release','liquid','granular')),
  npk_ratio TEXT,
  best_for TEXT,
  application_frequency TEXT,
  season TEXT,
  warning_notes TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  signs TEXT,
  affected_plants TEXT,
  treatment TEXT,
  prevention TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS diseases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  symptoms TEXT,
  causes TEXT,
  affected_plants TEXT,
  treatment TEXT,
  prevention TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS plant_care_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_species_id UUID NOT NULL UNIQUE REFERENCES plant_species(id) ON DELETE CASCADE,
  watering_guide TEXT,
  sunlight_guide TEXT,
  soil_guide TEXT,
  fertilizer_guide TEXT,
  pruning_guide TEXT,
  repotting_guide TEXT,
  seasonal_care TEXT,
  common_problems TEXT,
  beginner_tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS plant_soil_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_species_id UUID NOT NULL REFERENCES plant_species(id) ON DELETE CASCADE,
  soil_type_id UUID NOT NULL REFERENCES soil_types(id) ON DELETE CASCADE,
  suitability TEXT DEFAULT 'recommended',
  notes TEXT,
  UNIQUE (plant_species_id, soil_type_id)
);

CREATE TABLE IF NOT EXISTS plant_fertilizer_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_species_id UUID NOT NULL REFERENCES plant_species(id) ON DELETE CASCADE,
  fertilizer_id UUID NOT NULL REFERENCES fertilizers(id) ON DELETE CASCADE,
  suitability TEXT DEFAULT 'recommended',
  notes TEXT,
  UNIQUE (plant_species_id, fertilizer_id)
);

CREATE TABLE IF NOT EXISTS plant_pest_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_species_id UUID NOT NULL REFERENCES plant_species(id) ON DELETE CASCADE,
  pest_id UUID NOT NULL REFERENCES pests(id) ON DELETE CASCADE,
  risk_level TEXT DEFAULT 'medium',
  notes TEXT,
  UNIQUE (plant_species_id, pest_id)
);

CREATE TABLE IF NOT EXISTS plant_disease_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_species_id UUID NOT NULL REFERENCES plant_species(id) ON DELETE CASCADE,
  disease_id UUID NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  risk_level TEXT DEFAULT 'medium',
  notes TEXT,
  UNIQUE (plant_species_id, disease_id)
);

-- FK from plants → plant_species (after both tables exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plants_plant_species_id_fkey'
  ) THEN
    ALTER TABLE plants
      ADD CONSTRAINT plants_plant_species_id_fkey
      FOREIGN KEY (plant_species_id) REFERENCES plant_species(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_plant_id ON care_schedules(plant_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_species_common_name ON plant_species(common_name);
CREATE INDEX IF NOT EXISTS idx_plant_species_scientific_name ON plant_species(scientific_name);
CREATE INDEX IF NOT EXISTS idx_plant_species_type ON plant_species(type);

-- ─── Triggers ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS plants_updated_at ON plants;
CREATE TRIGGER plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS care_schedules_updated_at ON care_schedules;
CREATE TRIGGER care_schedules_updated_at
  BEFORE UPDATE ON care_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS plant_species_updated_at ON plant_species;
CREATE TRIGGER plant_species_updated_at
  BEFORE UPDATE ON plant_species
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS plant_care_guides_updated_at ON plant_care_guides;
CREATE TRIGGER plant_care_guides_updated_at
  BEFORE UPDATE ON plant_care_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Row Level Security: user-owned tables ──────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users read own plants" ON plants;
DROP POLICY IF EXISTS "Users insert own plants" ON plants;
DROP POLICY IF EXISTS "Users update own plants" ON plants;
DROP POLICY IF EXISTS "Users delete own plants" ON plants;
CREATE POLICY "Users read own plants" ON plants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plants" ON plants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plants" ON plants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plants" ON plants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own photos" ON plant_photos;
DROP POLICY IF EXISTS "Users insert own photos" ON plant_photos;
DROP POLICY IF EXISTS "Users delete own photos" ON plant_photos;
CREATE POLICY "Users read own photos" ON plant_photos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own photos" ON plant_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own photos" ON plant_photos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own schedules" ON care_schedules;
DROP POLICY IF EXISTS "Users insert own schedules" ON care_schedules;
DROP POLICY IF EXISTS "Users update own schedules" ON care_schedules;
CREATE POLICY "Users read own schedules" ON care_schedules
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own schedules" ON care_schedules
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own schedules" ON care_schedules
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own reports" ON health_reports;
DROP POLICY IF EXISTS "Users insert own reports" ON health_reports;
CREATE POLICY "Users read own reports" ON health_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON health_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── RLS: knowledge / reference tables (read-only for users) ──────────────
ALTER TABLE plant_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_care_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_soil_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_fertilizer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_pest_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_disease_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read plant_species" ON plant_species;
DROP POLICY IF EXISTS "Anon read plant_species" ON plant_species;
CREATE POLICY "Authenticated read plant_species" ON plant_species FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read plant_species" ON plant_species FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read soil_types" ON soil_types;
DROP POLICY IF EXISTS "Anon read soil_types" ON soil_types;
CREATE POLICY "Authenticated read soil_types" ON soil_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read soil_types" ON soil_types FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read fertilizers" ON fertilizers;
DROP POLICY IF EXISTS "Anon read fertilizers" ON fertilizers;
CREATE POLICY "Authenticated read fertilizers" ON fertilizers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read fertilizers" ON fertilizers FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read pests" ON pests;
DROP POLICY IF EXISTS "Anon read pests" ON pests;
CREATE POLICY "Authenticated read pests" ON pests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read pests" ON pests FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read diseases" ON diseases;
DROP POLICY IF EXISTS "Anon read diseases" ON diseases;
CREATE POLICY "Authenticated read diseases" ON diseases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read diseases" ON diseases FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read care_guides" ON plant_care_guides;
DROP POLICY IF EXISTS "Anon read care_guides" ON plant_care_guides;
CREATE POLICY "Authenticated read care_guides" ON plant_care_guides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read care_guides" ON plant_care_guides FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read soil_matches" ON plant_soil_matches;
DROP POLICY IF EXISTS "Anon read soil_matches" ON plant_soil_matches;
CREATE POLICY "Authenticated read soil_matches" ON plant_soil_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read soil_matches" ON plant_soil_matches FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read fertilizer_matches" ON plant_fertilizer_matches;
DROP POLICY IF EXISTS "Anon read fertilizer_matches" ON plant_fertilizer_matches;
CREATE POLICY "Authenticated read fertilizer_matches" ON plant_fertilizer_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read fertilizer_matches" ON plant_fertilizer_matches FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read pest_risks" ON plant_pest_risks;
DROP POLICY IF EXISTS "Anon read pest_risks" ON plant_pest_risks;
CREATE POLICY "Authenticated read pest_risks" ON plant_pest_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read pest_risks" ON plant_pest_risks FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read disease_risks" ON plant_disease_risks;
DROP POLICY IF EXISTS "Anon read disease_risks" ON plant_disease_risks;
CREATE POLICY "Authenticated read disease_risks" ON plant_disease_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read disease_risks" ON plant_disease_risks FOR SELECT TO anon USING (true);

-- ─── Storage: plant photo uploads ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload plant photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone view plant photos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own photos storage" ON storage.objects;

CREATE POLICY "Users upload plant photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone view plant photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos');

CREATE POLICY "Users delete own photos storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── Phase 8: Goal-Based Plant Care ─────────────────────────────────────────
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

ALTER TABLE user_plant_goals ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_plant_goals ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_user_plant_goals_plant ON user_plant_goals(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_milestones_plant ON plant_milestones(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_missions_plant ON plant_missions(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_missions_status ON plant_missions(status);

ALTER TABLE plant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_missions ENABLE ROW LEVEL SECURITY;

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

-- ─── Phase 10: Daily tasks & care logs ─────────────────────────────────────

ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_pruned_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_repotted_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_health_scan_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_growth_photo_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS plant_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  task_key TEXT,
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
  snoozed_until TIMESTAMPTZ,
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

-- ─── Phase 12: Local climate ────────────────────────────────────────────────
ALTER TABLE plants ADD COLUMN IF NOT EXISTS hardiness_zone TEXT;

-- ─── Phase 13: Supabase sync ────────────────────────────────────────────────
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

-- ─── Plant Genomes (digital twin state — separate from species reference) ───
CREATE TABLE IF NOT EXISTS plant_genomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL UNIQUE REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_months INTEGER,
  growth_trend TEXT,
  health_trend TEXT,
  recovery_score INTEGER,
  risk_score INTEGER,
  fruiting_stage TEXT,
  blooming_stage TEXT,
  dormancy_stage TEXT,
  next_milestone TEXT,
  forecast JSONB DEFAULT '{}'::jsonb,
  telemetry JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_state JSONB,
  intelligence_score INTEGER,
  last_computed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plant_genomes_user_id ON plant_genomes(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_genomes_plant_id ON plant_genomes(plant_id);

ALTER TABLE plant_genomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own plant genomes" ON plant_genomes;
CREATE POLICY "Users manage own plant genomes" ON plant_genomes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS plant_genomes_updated_at ON plant_genomes;
CREATE TRIGGER plant_genomes_updated_at
  BEFORE UPDATE ON plant_genomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Waitlist signups (marketing) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  zip_code TEXT,
  grow_types TEXT[] DEFAULT '{}',
  biggest_problem TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups(created_at DESC);

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist_signups;
CREATE POLICY "Anyone can join waitlist" ON waitlist_signups
  FOR INSERT WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies for anon — only service role can read signups.

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

-- ─── Landscape projects (Phase 21) ───────────────────────────────────────────
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

-- ─── Concierge plans (Phase 23) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS concierge_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issue TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'serious')),
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_concierge_plans_user_id ON concierge_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_plans_plant_id ON concierge_plans(plant_id);
CREATE INDEX IF NOT EXISTS idx_concierge_plans_status ON concierge_plans(status);

ALTER TABLE concierge_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own concierge plans" ON concierge_plans;
CREATE POLICY "Users manage own concierge plans" ON concierge_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS concierge_plans_updated_at ON concierge_plans;
CREATE TRIGGER concierge_plans_updated_at
  BEFORE UPDATE ON concierge_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Community (Phase 24) — future-ready posts & reactions ───────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  post_type TEXT NOT NULL CHECK (
    post_type IN ('tip', 'question', 'story', 'transformation', 'garden_showcase')
  ),
  image_url TEXT,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('cheer', 'helpful', 'love', 'wow')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, post_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON community_reactions(post_id);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read community posts" ON community_posts;
CREATE POLICY "Anyone can read community posts" ON community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own community posts" ON community_posts;
CREATE POLICY "Users insert own community posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own community posts" ON community_posts;
CREATE POLICY "Users update own community posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own community posts" ON community_posts;
CREATE POLICY "Users delete own community posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read community reactions" ON community_reactions;
CREATE POLICY "Anyone can read community reactions" ON community_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own community reactions" ON community_reactions;
CREATE POLICY "Users manage own community reactions" ON community_reactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS community_posts_updated_at ON community_posts;
CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Product recommendations (Phase 25) — marketplace / affiliate-ready ───────
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'plants', 'soil', 'fertilizer', 'pots', 'irrigation',
      'pruning_tools', 'pest_control', 'bonsai_supplies'
    )
  ),
  description TEXT NOT NULL DEFAULT '',
  best_for TEXT NOT NULL DEFAULT '',
  price_range TEXT NOT NULL DEFAULT '',
  affiliate_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_category
  ON product_recommendations(category);

ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read product recommendations" ON product_recommendations;
CREATE POLICY "Anyone can read product recommendations" ON product_recommendations
  FOR SELECT USING (true);

-- ─── User subscriptions (Phase 26) — billing-ready, mock status first ────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'family')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'mock' CHECK (
    status IN ('active', 'trialing', 'canceled', 'expired', 'mock')
  ),
  trial_ends_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscription" ON user_subscriptions;
CREATE POLICY "Users read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own subscription" ON user_subscriptions;
CREATE POLICY "Users update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own subscription" ON user_subscriptions;
CREATE POLICY "Users insert own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Reload PostgREST schema cache ──────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'plants';
