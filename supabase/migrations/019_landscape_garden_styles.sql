-- Phase 36: AI Landscape Designer — six garden styles

ALTER TABLE landscape_projects DROP CONSTRAINT IF EXISTS landscape_projects_style_goal_check;

ALTER TABLE landscape_projects ADD CONSTRAINT landscape_projects_style_goal_check
  CHECK (
    style_goal IN (
      'modern', 'japanese', 'cottage', 'tropical', 'desert', 'edible_garden',
      -- legacy values (existing rows)
      'fruit_garden', 'low_maintenance', 'native_garden', 'mediterranean',
      'japanese_garden', 'kids_family', 'pollinator', 'privacy', 'outdoor_living'
    )
  );

NOTIFY pgrst, 'reload schema';
