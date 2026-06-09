-- PlantPal Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Plants
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('indoor', 'outdoor')),
  planting_type TEXT NOT NULL CHECK (planting_type IN ('pot', 'ground')),
  zip_code TEXT NOT NULL,
  sun_exposure TEXT NOT NULL CHECK (sun_exposure IN ('full_sun', 'partial_sun', 'shade')),
  photo_url TEXT,
  needs_attention BOOLEAN DEFAULT FALSE NOT NULL,
  last_watered_at TIMESTAMPTZ,
  last_fertilized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Plant Photos
CREATE TABLE IF NOT EXISTS plant_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Care Schedules
CREATE TABLE IF NOT EXISTS care_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL UNIQUE REFERENCES plants(id) ON DELETE CASCADE,
  watering_frequency_days INTEGER,
  watering_instructions TEXT,
  fertilizing_frequency_weeks INTEGER,
  fertilizing_instructions TEXT,
  pruning_frequency TEXT,
  pruning_instructions TEXT,
  ai_generated_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Plant Health Reports
CREATE TABLE IF NOT EXISTS plant_health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_health TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Chat History
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_plant_id ON care_schedules(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_health_reports_user_id ON plant_health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_health_reports_plant_id ON plant_health_reports(plant_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_plant_id ON chat_history(plant_id);

-- Auto-create profile on signup
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

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER care_schedules_updated_at
  BEFORE UPDATE ON care_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Plants policies
CREATE POLICY "Users can view own plants" ON plants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plants" ON plants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plants" ON plants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plants" ON plants
  FOR DELETE USING (auth.uid() = user_id);

-- Plant photos policies
CREATE POLICY "Users can view own plant photos" ON plant_photos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plant photos" ON plant_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own plant photos" ON plant_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Care schedules policies
CREATE POLICY "Users can view own care schedules" ON care_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM plants WHERE plants.id = care_schedules.plant_id AND plants.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own care schedules" ON care_schedules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM plants WHERE plants.id = care_schedules.plant_id AND plants.user_id = auth.uid())
  );
CREATE POLICY "Users can update own care schedules" ON care_schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM plants WHERE plants.id = care_schedules.plant_id AND plants.user_id = auth.uid())
  );

-- Health reports policies
CREATE POLICY "Users can view own health reports" ON plant_health_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health reports" ON plant_health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat history policies
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat history" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for plant photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload plant photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view plant photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos');

CREATE POLICY "Users can delete own plant photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
