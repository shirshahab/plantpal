-- PHASE 44: Storage audit — indexes, scan history, task validation metadata.

-- ── Scan history (metadata only; photos live in plant_photos bucket) ────────
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  scan_type TEXT NOT NULL DEFAULT 'identify'
    CHECK (scan_type IN ('identify', 'diagnose', 'tag', 'progress')),
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_description TEXT,
  symptom_chips TEXT[] DEFAULT '{}',
  plant_id_guess TEXT,
  plant_id_confidence TEXT,
  diagnosis_result JSONB,
  confidence TEXT,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_created
  ON scan_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_plant
  ON scan_history (plant_id) WHERE plant_id IS NOT NULL;

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own scan history" ON scan_history;
CREATE POLICY "Users manage own scan history" ON scan_history
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Task validation metadata (action-based completion) ────────────────────
ALTER TABLE plant_tasks
  ADD COLUMN IF NOT EXISTS validation_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS validation_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── Scale indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plant_photos_user_created
  ON plant_photos (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_care_logs_user_created
  ON plant_care_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_plant_created
  ON health_reports (plant_id, created_at DESC) WHERE plant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plant_journal_user_created
  ON plant_journal_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_health_reports_user_created
  ON pro_health_reports (user_id, created_at DESC);

-- ── Storage UPDATE policy for plant-photos (parity with landscape) ────────
DROP POLICY IF EXISTS "Users update own photos storage" ON storage.objects;
CREATE POLICY "Users update own photos storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'plant-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
