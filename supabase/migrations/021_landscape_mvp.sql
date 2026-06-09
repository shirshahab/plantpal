-- Phase 38: AI Landscape Designer MVP

-- Property profile (Step 1)
CREATE TABLE IF NOT EXISTS landscape_property_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  hardiness_zone TEXT,
  sun_exposure TEXT NOT NULL DEFAULT 'mixed',
  yard_size TEXT NOT NULL DEFAULT 'unknown',
  budget_tier TEXT NOT NULL DEFAULT 'tier_2' CHECK (
    budget_tier IN ('tier_1', 'tier_2', 'tier_3', 'tier_4')
  ),
  maintenance_preference TEXT NOT NULL DEFAULT 'medium' CHECK (
    maintenance_preference IN ('low', 'medium', 'high')
  ),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expand style goals to Phase 38 (9 MVP styles)
ALTER TABLE landscape_projects DROP CONSTRAINT IF EXISTS landscape_projects_style_goal_check;

ALTER TABLE landscape_projects ADD CONSTRAINT landscape_projects_style_goal_check
  CHECK (
    style_goal IN (
      'modern', 'japanese', 'cottage', 'mediterranean', 'tropical',
      'desert', 'edible_garden', 'family_friendly', 'pollinator_garden',
      -- legacy
      'fruit_garden', 'low_maintenance', 'native_garden', 'japanese_garden',
      'kids_family', 'pollinator', 'privacy', 'outdoor_living'
    )
  );

ALTER TABLE landscape_property_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY landscape_property_self ON landscape_property_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Landscape photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('landscape-photos', 'landscape-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Landscape photos public read" ON storage.objects;
CREATE POLICY "Landscape photos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'landscape-photos');

DROP POLICY IF EXISTS "Users upload landscape photos" ON storage.objects;
CREATE POLICY "Users upload landscape photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'landscape-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own landscape photos" ON storage.objects;
CREATE POLICY "Users update own landscape photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'landscape-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own landscape photos" ON storage.objects;
CREATE POLICY "Users delete own landscape photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'landscape-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

NOTIFY pgrst, 'reload schema';
