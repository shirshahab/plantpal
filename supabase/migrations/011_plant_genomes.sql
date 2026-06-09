-- Phase 22: Plant Genome / Digital Twin — structured genome fields

ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS age_months INTEGER;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS growth_trend TEXT;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS health_trend TEXT;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS fruiting_stage TEXT;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS blooming_stage TEXT;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS dormancy_stage TEXT;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS next_milestone TEXT;
ALTER TABLE plant_genomes ADD COLUMN IF NOT EXISTS forecast JSONB DEFAULT '{}'::jsonb;

-- Ensure core table exists for fresh installs
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

NOTIFY pgrst, 'reload schema';
