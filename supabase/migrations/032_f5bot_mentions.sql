-- PHASE 45: F5Bot Reddit/social mention intelligence
-- Stores marketing intelligence from F5Bot JSON feed + webhooks.

CREATE TABLE IF NOT EXISTS f5bot_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'f5bot',
  platform TEXT NOT NULL DEFAULT 'reddit',
  keyword TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  full_text TEXT NOT NULL DEFAULT '',
  subreddit TEXT,
  detected_plant TEXT,
  detected_issue TEXT,
  detected_category TEXT,
  sentiment TEXT,
  opportunity_type TEXT,
  summary TEXT,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_f5bot_mentions_created
  ON f5bot_mentions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_f5bot_mentions_category
  ON f5bot_mentions (detected_category) WHERE detected_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_f5bot_mentions_issue
  ON f5bot_mentions (detected_issue) WHERE detected_issue IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_f5bot_mentions_plant
  ON f5bot_mentions (detected_plant) WHERE detected_plant IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_f5bot_mentions_keyword
  ON f5bot_mentions (keyword);
CREATE INDEX IF NOT EXISTS idx_f5bot_mentions_imported
  ON f5bot_mentions (imported_at DESC);

ALTER TABLE f5bot_mentions ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users (debug dashboards). Writes use service role.
DROP POLICY IF EXISTS "Authenticated read f5bot mentions" ON f5bot_mentions;
CREATE POLICY "Authenticated read f5bot mentions" ON f5bot_mentions
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
