-- ─── PHASE 40: Trust & Accuracy — diagnosis feedback loop ───────────────

CREATE TABLE IF NOT EXISTS diagnosis_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_report_id UUID REFERENCES pro_health_reports(id) ON DELETE SET NULL,
  issue_id TEXT,
  verdict TEXT CHECK (verdict IN ('correct', 'wrong')),
  outcome TEXT CHECK (outcome IN ('improved', 'worse')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_feedback_user_id ON diagnosis_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_feedback_issue ON diagnosis_feedback(issue_id);

ALTER TABLE diagnosis_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own diagnosis feedback" ON diagnosis_feedback;
DROP POLICY IF EXISTS "Users insert own diagnosis feedback" ON diagnosis_feedback;
DROP POLICY IF EXISTS "Users update own diagnosis feedback" ON diagnosis_feedback;
CREATE POLICY "Users read own diagnosis feedback" ON diagnosis_feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diagnosis feedback" ON diagnosis_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own diagnosis feedback" ON diagnosis_feedback
  FOR UPDATE USING (auth.uid() = user_id);
