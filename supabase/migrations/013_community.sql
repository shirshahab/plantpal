-- Phase 24: Community foundation — future-ready posts & reactions (no UI posting yet)

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  post_type TEXT NOT NULL CHECK (
    post_type IN ('tip', 'question', 'story', 'transformation', 'garden_showcase')
  ),
  image_url TEXT,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('cheer', 'helpful', 'love', 'wow')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, post_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON community_reactions(post_id);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read community posts" ON community_posts;
CREATE POLICY "Anyone can read community posts" ON community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own community posts" ON community_posts;
CREATE POLICY "Users insert own community posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own community posts" ON community_posts;
CREATE POLICY "Users update own community posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own community posts" ON community_posts;
CREATE POLICY "Users delete own community posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read community reactions" ON community_reactions;
CREATE POLICY "Anyone can read community reactions" ON community_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own community reactions" ON community_reactions;
CREATE POLICY "Users manage own community reactions" ON community_reactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS community_posts_updated_at ON community_posts;
CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

NOTIFY pgrst, 'reload schema';
