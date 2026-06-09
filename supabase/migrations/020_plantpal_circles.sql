-- Phase 37: PlantPal Circles & Social Garden

-- ─── Profile discovery (friend search) ───────────────────────────────────────

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users discover profiles" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- ─── Friends & requests ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ─── Garden groups (family, neighbors, clubs — future-ready) ─────────────────

CREATE TABLE IF NOT EXISTS garden_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  group_type TEXT NOT NULL DEFAULT 'family' CHECK (
    group_type IN ('family', 'neighbors', 'club', 'community_garden', 'custom')
  ),
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_plants INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES garden_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  display_name TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- ─── Activity feed ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'plant_added', 'lesson_completed', 'badge_earned', 'growth_photo',
      'streak_milestone', 'harvest_logged', 'diagnosis_completed',
      'group_milestone', 'journal_entry', 'challenge_completed', 'task_completed'
    )
  ),
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (
    visibility IN ('private', 'friends', 'circle', 'public')
  ),
  group_id UUID REFERENCES garden_groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  emoji TEXT DEFAULT '🌱',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('growing_strong', 'beautiful', 'great_harvest', 'nice_work')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feed_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Challenges ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'personal' CHECK (scope IN ('personal', 'family', 'group')),
  group_id UUID REFERENCES garden_groups(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  challenge_type TEXT NOT NULL CHECK (
    challenge_type IN (
      'water_streak', 'lesson_path', 'growth_photos', 'add_plants',
      'academy_lesson', 'harvest_count', 'custom'
    )
  ),
  target INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'tasks',
  reward_xp INTEGER NOT NULL DEFAULT 50,
  reward_badge TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

-- ─── Plant journals ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plant_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('photo', 'note', 'milestone')),
  body TEXT DEFAULT '',
  photo_url TEXT,
  milestone_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (
    visibility IN ('private', 'friends', 'circle', 'public')
  ),
  feed_event_id UUID REFERENCES activity_feed(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Social badges & notifications ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_social_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'friend_accepted', 'comment', 'reaction', 'challenge_completed',
      'group_update', 'friend_request'
    )
  ),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_garden_groups_owner ON garden_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_group ON activity_feed(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_feed ON activity_reactions(feed_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_feed ON activity_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_challenges_group ON challenges(group_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_journal_plant ON plant_journal_entries(plant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id, created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

-- Friend requests
CREATE POLICY friend_requests_select ON friend_requests FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY friend_requests_insert ON friend_requests FOR INSERT WITH CHECK (
  auth.uid() = from_user_id
);
CREATE POLICY friend_requests_update ON friend_requests FOR UPDATE USING (
  auth.uid() = to_user_id OR auth.uid() = from_user_id
);

-- Friends
CREATE POLICY friends_select ON friends FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY friends_insert ON friends FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY friends_delete ON friends FOR DELETE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Blocked users
CREATE POLICY blocked_self ON blocked_users FOR ALL USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- Garden groups
CREATE POLICY garden_groups_select ON garden_groups FOR SELECT USING (
  auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY garden_groups_insert ON garden_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY garden_groups_update ON garden_groups FOR UPDATE USING (
  auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'editor')
  )
);

-- Group members
CREATE POLICY group_members_select ON group_members FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
  )
);
CREATE POLICY group_members_manage ON group_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM garden_groups g
    WHERE g.id = group_id AND (
      g.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'owner'
      )
    )
  )
) WITH CHECK (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM garden_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()
));

-- Activity feed (visible based on visibility + friendship/group)
CREATE POLICY activity_feed_select ON activity_feed FOR SELECT USING (
  user_id = auth.uid()
  OR visibility = 'public'
  OR (
    visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friends f
      WHERE (f.user_id = auth.uid() AND f.friend_id = activity_feed.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = activity_feed.user_id)
    )
  )
  OR (
    visibility = 'circle' AND group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = activity_feed.group_id AND gm.user_id = auth.uid()
    )
  )
);
CREATE POLICY activity_feed_insert ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY activity_feed_delete ON activity_feed FOR DELETE USING (auth.uid() = user_id);

-- Reactions & comments
CREATE POLICY activity_reactions_all ON activity_reactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY activity_reactions_read ON activity_reactions FOR SELECT USING (true);

CREATE POLICY activity_comments_insert ON activity_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY activity_comments_select ON activity_comments FOR SELECT USING (true);
CREATE POLICY activity_comments_delete ON activity_comments FOR DELETE USING (auth.uid() = user_id);

-- Challenges
CREATE POLICY challenges_select ON challenges FOR SELECT USING (
  scope = 'personal' AND created_by = auth.uid()
  OR scope IN ('family', 'group') AND group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = challenges.group_id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY challenges_insert ON challenges FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY challenge_participants_self ON challenge_participants FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY challenge_participants_read ON challenge_participants FOR SELECT USING (true);

-- Plant journal
CREATE POLICY plant_journal_owner ON plant_journal_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY plant_journal_read ON plant_journal_entries FOR SELECT USING (
  user_id = auth.uid() OR visibility IN ('public', 'friends', 'circle')
);

-- Social badges & notifications
CREATE POLICY user_social_badges_self ON user_social_badges FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_social_badges_read ON user_social_badges FOR SELECT USING (true);

CREATE POLICY social_notifications_self ON social_notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Household RLS gaps (Phase 31)
CREATE POLICY households_member_read ON households FOR SELECT USING (
  EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = id AND hm.user_id = auth.uid())
);
CREATE POLICY family_challenges_member_read ON family_challenges FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = family_challenges.household_id AND hm.user_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS garden_groups_updated_at ON garden_groups;
CREATE TRIGGER garden_groups_updated_at
  BEFORE UPDATE ON garden_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

NOTIFY pgrst, 'reload schema';
