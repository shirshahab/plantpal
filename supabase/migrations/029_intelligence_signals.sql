-- Data intelligence layer: anonymous community signals, cached trend
-- signals, and a local insights cache.
--
-- Privacy: aggregate counts only. No names, photos, exact addresses, or
-- user identity. Location is at most a 3-digit ZIP prefix + city/state.

-- 1. Aggregate community activity signals (one row per bucket per week).
CREATE TABLE IF NOT EXISTS community_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'plant_added', 'plant_scanned', 'issue_detected', 'care_plan_generated',
    'lesson_completed', 'garden_design_created', 'trend_viewed'
  )),
  plant_species TEXT,
  issue TEXT,
  zip_prefix TEXT CHECK (zip_prefix IS NULL OR zip_prefix ~ '^\d{3}$'),
  city TEXT,
  state TEXT,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_signals_period
  ON community_signals (period_start, signal_type);
CREATE INDEX IF NOT EXISTS idx_community_signals_zip
  ON community_signals (zip_prefix, period_start);

-- 2. Cached trend signals (from SerpAPI or other providers).
CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  location TEXT,
  percent_change NUMERIC,
  direction TEXT NOT NULL DEFAULT 'flat' CHECK (direction IN ('up', 'down', 'flat')),
  reason TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'estimated',
  source TEXT NOT NULL DEFAULT 'manual',
  estimated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trend_signals_term ON trend_signals (term, created_at DESC);

-- 3. Local insights cache (computed insight bundles per ZIP).
CREATE TABLE IF NOT EXISTS local_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL CHECK (zip_code ~ '^\d{5}$'),
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (zip_code)
);

CREATE INDEX IF NOT EXISTS idx_local_insights_cache_zip ON local_insights_cache (zip_code);

-- RLS: signed-in users may READ aggregates; only the service role writes.
ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_insights_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read community signals" ON community_signals;
CREATE POLICY "Authenticated read community signals" ON community_signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read trend signals" ON trend_signals;
CREATE POLICY "Authenticated read trend signals" ON trend_signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read local insights cache" ON local_insights_cache;
CREATE POLICY "Authenticated read local insights cache" ON local_insights_cache
  FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies: writes go through the service role,
-- which bypasses RLS. Client sessions cannot modify these tables.
