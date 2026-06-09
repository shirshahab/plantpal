-- PlantPal Phase 2 Schema
-- Run this in Supabase: SQL Editor → New query → Paste → Run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Plants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  species TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('indoor', 'outdoor')),
  container_type TEXT NOT NULL CHECK (container_type IN ('pot', 'ground')),
  zip_code TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Plant Photos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plant_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Care Schedules (AI-generated details, Phase 3) ─────────
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

-- ─── Health Reports ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_health TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_plant_id ON care_schedules(plant_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);

-- ─── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Plants
DROP POLICY IF EXISTS "Users read own plants" ON plants;
DROP POLICY IF EXISTS "Users insert own plants" ON plants;
DROP POLICY IF EXISTS "Users update own plants" ON plants;
DROP POLICY IF EXISTS "Users delete own plants" ON plants;
CREATE POLICY "Users read own plants" ON plants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plants" ON plants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plants" ON plants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plants" ON plants
  FOR DELETE USING (auth.uid() = user_id);

-- Plant photos
DROP POLICY IF EXISTS "Users read own photos" ON plant_photos;
DROP POLICY IF EXISTS "Users insert own photos" ON plant_photos;
DROP POLICY IF EXISTS "Users delete own photos" ON plant_photos;
CREATE POLICY "Users read own photos" ON plant_photos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own photos" ON plant_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own photos" ON plant_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Care schedules
DROP POLICY IF EXISTS "Users read own schedules" ON care_schedules;
DROP POLICY IF EXISTS "Users insert own schedules" ON care_schedules;
DROP POLICY IF EXISTS "Users update own schedules" ON care_schedules;
CREATE POLICY "Users read own schedules" ON care_schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own schedules" ON care_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own schedules" ON care_schedules
  FOR UPDATE USING (auth.uid() = user_id);

-- Health reports
DROP POLICY IF EXISTS "Users read own reports" ON health_reports;
DROP POLICY IF EXISTS "Users insert own reports" ON health_reports;
CREATE POLICY "Users read own reports" ON health_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Storage bucket for plant photos ────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload plant photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone view plant photos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own photos storage" ON storage.objects;

CREATE POLICY "Users upload plant photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone view plant photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos');

CREATE POLICY "Users delete own photos storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
