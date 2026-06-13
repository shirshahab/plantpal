-- F5Bot / web mention intelligence storage (trend + content pipeline)

CREATE TABLE IF NOT EXISTS plant_intelligence_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'f5bot',
  source_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_type IN ('reddit', 'hackernews', 'web', 'unknown')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  author TEXT,
  content_snippet TEXT NOT NULL DEFAULT '',
  matched_keyword TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sentiment TEXT,
  topic TEXT,
  plant_type TEXT,
  problem_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plant_intel_mentions_source_url
  ON plant_intelligence_mentions (source, url);

CREATE INDEX IF NOT EXISTS idx_plant_intel_mentions_created
  ON plant_intelligence_mentions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_intel_mentions_topic
  ON plant_intelligence_mentions (topic) WHERE topic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plant_intel_mentions_plant_type
  ON plant_intelligence_mentions (plant_type) WHERE plant_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plant_intel_mentions_problem_type
  ON plant_intelligence_mentions (problem_type) WHERE problem_type IS NOT NULL;

ALTER TABLE plant_intelligence_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read plant intelligence mentions" ON plant_intelligence_mentions;
CREATE POLICY "Authenticated read plant intelligence mentions" ON plant_intelligence_mentions
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
