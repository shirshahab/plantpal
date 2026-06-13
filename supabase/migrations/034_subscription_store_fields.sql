-- Store billing fields for App Store / Play subscriptions

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_platform TEXT CHECK (store_platform IN ('ios', 'android', 'web')),
  ADD COLUMN IF NOT EXISTS store_product_id TEXT,
  ADD COLUMN IF NOT EXISTS store_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS store_purchase_token TEXT;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial_ends
  ON user_subscriptions (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

NOTIFY pgrst, 'reload schema';
