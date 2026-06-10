-- ─── PHASE 39: Pro Health Intelligence ──────────────────────────────────
-- Advanced diagnosis reports + expert review request waitlist.

CREATE TABLE IF NOT EXISTS pro_health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  species TEXT NOT NULL,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  environment JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb,
  remedy_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  prognosis JSONB NOT NULL DEFAULT '{}'::jsonb,
  commercial_context JSONB,
  severity TEXT NOT NULL DEFAULT 'moderate'
    CHECK (severity IN ('mild', 'moderate', 'severe')),
  confidence INTEGER NOT NULL DEFAULT 50
    CHECK (confidence BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'monitoring', 'improved', 'resolved', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS expert_review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_report_id UUID REFERENCES pro_health_reports(id) ON DELETE SET NULL,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  urgency TEXT NOT NULL DEFAULT 'medium'
    CHECK (urgency IN ('low', 'medium', 'high')),
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pro_health_reports_user_id ON pro_health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_health_reports_status ON pro_health_reports(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expert_review_requests_user_id ON expert_review_requests(user_id);

ALTER TABLE pro_health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own pro health reports" ON pro_health_reports;
DROP POLICY IF EXISTS "Users insert own pro health reports" ON pro_health_reports;
DROP POLICY IF EXISTS "Users update own pro health reports" ON pro_health_reports;
CREATE POLICY "Users read own pro health reports" ON pro_health_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pro health reports" ON pro_health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pro health reports" ON pro_health_reports
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own expert requests" ON expert_review_requests;
DROP POLICY IF EXISTS "Users insert own expert requests" ON expert_review_requests;
CREATE POLICY "Users read own expert requests" ON expert_review_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own expert requests" ON expert_review_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
