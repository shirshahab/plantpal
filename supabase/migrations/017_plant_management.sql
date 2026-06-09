-- Phase 33: Plant management — size, photo status, placeholders

ALTER TABLE plants ADD COLUMN IF NOT EXISTS placeholder_image_type TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS photo_status TEXT DEFAULT 'needs_photo';
ALTER TABLE plants ADD COLUMN IF NOT EXISTS size_type TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS nursery_container_size TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS height_feet NUMERIC;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS height_inches NUMERIC;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS pot_diameter_inches NUMERIC;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS trunk_diameter_inches NUMERIC;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS estimated_age_months INTEGER;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS planted_date DATE;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS purchase_store TEXT;

COMMENT ON COLUMN plants.photo_status IS 'real_photo | placeholder | needs_photo';
