-- Phase 23: PlantPal Concierge — guided recovery plans

CREATE TABLE IF NOT EXISTS concierge_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issue TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'serious')),
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_concierge_plans_user_id ON concierge_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_plans_plant_id ON concierge_plans(plant_id);
CREATE INDEX IF NOT EXISTS idx_concierge_plans_status ON concierge_plans(status);

ALTER TABLE concierge_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own concierge plans" ON concierge_plans;
CREATE POLICY "Users manage own concierge plans" ON concierge_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS concierge_plans_updated_at ON concierge_plans;
CREATE TRIGGER concierge_plans_updated_at
  BEFORE UPDATE ON concierge_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

NOTIFY pgrst, 'reload schema';
