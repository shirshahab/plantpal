-- PlantPal Knowledge Engine Schema (Phase 5)
-- Run after 002_phase2_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Reference: Plant Species ─────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_plant_species_common_name ON plant_species(common_name);
CREATE INDEX IF NOT EXISTS idx_plant_species_scientific_name ON plant_species(scientific_name);
CREATE INDEX IF NOT EXISTS idx_plant_species_type ON plant_species(type);

-- ─── Soil Types ─────────────────────────────────────────────
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

-- ─── Fertilizers ────────────────────────────────────────────
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

-- ─── Pests ──────────────────────────────────────────────────
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

-- ─── Diseases ───────────────────────────────────────────────
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

-- ─── Care Guides ────────────────────────────────────────────
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

-- ─── Match / Risk Tables ────────────────────────────────────
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

-- Link user plants to species (optional)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS plant_species_id UUID REFERENCES plant_species(id) ON DELETE SET NULL;

-- Updated_at triggers
DROP TRIGGER IF EXISTS plant_species_updated_at ON plant_species;
CREATE TRIGGER plant_species_updated_at
  BEFORE UPDATE ON plant_species
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS plant_care_guides_updated_at ON plant_care_guides;
CREATE TRIGGER plant_care_guides_updated_at
  BEFORE UPDATE ON plant_care_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: reference data readable by all authenticated users
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

CREATE POLICY "Authenticated read plant_species" ON plant_species FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read soil_types" ON soil_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read fertilizers" ON fertilizers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read pests" ON pests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read diseases" ON diseases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read care_guides" ON plant_care_guides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read soil_matches" ON plant_soil_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read fertilizer_matches" ON plant_fertilizer_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read pest_risks" ON plant_pest_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read disease_risks" ON plant_disease_risks FOR SELECT TO authenticated USING (true);

-- Allow anon read for mock/dev (optional — enables public database browse when logged in via mock)
CREATE POLICY "Anon read plant_species" ON plant_species FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read soil_types" ON soil_types FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read fertilizers" ON fertilizers FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read pests" ON pests FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read diseases" ON diseases FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read care_guides" ON plant_care_guides FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read soil_matches" ON plant_soil_matches FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read fertilizer_matches" ON plant_fertilizer_matches FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read pest_risks" ON plant_pest_risks FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read disease_risks" ON plant_disease_risks FOR SELECT TO anon USING (true);
