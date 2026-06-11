-- Expert review system: extend expert_review_requests (created in 022) to
-- the full request shape. Requests are stored now; the expert network comes
-- later, so statuses cover the full lifecycle.

ALTER TABLE expert_review_requests ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE expert_review_requests ADD COLUMN IF NOT EXISTS crop_type TEXT;
ALTER TABLE expert_review_requests ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE expert_review_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Widen status values: pending → reviewing → answered → closed
-- (completed/cancelled kept for rows created before this migration).
ALTER TABLE expert_review_requests DROP CONSTRAINT IF EXISTS expert_review_requests_status_check;
ALTER TABLE expert_review_requests ADD CONSTRAINT expert_review_requests_status_check
  CHECK (status IN ('pending', 'reviewing', 'answered', 'closed', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_expert_review_requests_status
  ON expert_review_requests(user_id, status);
