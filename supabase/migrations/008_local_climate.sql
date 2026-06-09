-- Phase 12: Local climate — hardiness zone on plants

ALTER TABLE plants ADD COLUMN IF NOT EXISTS hardiness_zone TEXT;

NOTIFY pgrst, 'reload schema';
