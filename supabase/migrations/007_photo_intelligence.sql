-- Phase 11: Photo intelligence — plant_photos metadata & nullable plant_id

ALTER TABLE plant_photos ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'profile';
ALTER TABLE plant_photos ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE plant_photos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE plant_photos ALTER COLUMN plant_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plant_photos_photo_type_check'
  ) THEN
    ALTER TABLE plant_photos ADD CONSTRAINT plant_photos_photo_type_check
      CHECK (photo_type IN ('profile', 'health_scan', 'growth', 'nursery_tag', 'identification'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
