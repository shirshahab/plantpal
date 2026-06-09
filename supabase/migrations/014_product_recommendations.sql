-- Phase 25: Marketplace product recommendations (future affiliate-ready)

CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'plants', 'soil', 'fertilizer', 'pots', 'irrigation',
      'pruning_tools', 'pest_control', 'bonsai_supplies'
    )
  ),
  description TEXT NOT NULL DEFAULT '',
  best_for TEXT NOT NULL DEFAULT '',
  price_range TEXT NOT NULL DEFAULT '',
  affiliate_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_category
  ON product_recommendations(category);

ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read product recommendations" ON product_recommendations;
CREATE POLICY "Anyone can read product recommendations" ON product_recommendations
  FOR SELECT USING (true);

-- Inserts/updates via service role or admin only for now (no public write policy)

NOTIFY pgrst, 'reload schema';
