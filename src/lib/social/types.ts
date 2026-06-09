export type FeedVisibility = "private" | "friends" | "circle" | "public";

export type FeedEventType =
  | "plant_added"
  | "lesson_completed"
  | "badge_earned"
  | "growth_photo"
  | "streak_milestone"
  | "harvest_logged"
  | "diagnosis_completed"
  | "group_milestone"
  | "journal_entry"
  | "challenge_completed"
  | "task_completed";

export type ActivityReactionType =
  | "growing_strong"
  | "beautiful"
  | "great_harvest"
  | "nice_work";

export type FeedFilter =
  | "all"
  | "friends"
  | "family"
  | "groups"
  | "mine"
  | "photos"
  | "achievements";

export type GroupRole = "owner" | "editor" | "viewer";

export type GroupType =
  | "family"
  | "neighbors"
  | "club"
  | "community_garden"
  | "custom";

export type ChallengeType =
  | "water_streak"
  | "lesson_path"
  | "growth_photos"
  | "add_plants"
  | "academy_lesson"
  | "harvest_count"
  | "custom";

export type JournalEntryType = "photo" | "note" | "milestone";

export type SocialBadgeId =
  | "helpful_gardener"
  | "plant_mentor"
  | "family_champion"
  | "challenge_winner"
  | "garden_historian"
  | "community_builder";

export type NotificationType =
  | "friend_accepted"
  | "comment"
  | "reaction"
  | "challenge_completed"
  | "group_update"
  | "friend_request";

export interface SocialProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  profile?: SocialProfile;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  profile: SocialProfile;
}

export interface GardenGroup {
  id: string;
  name: string;
  description: string;
  groupType: GroupType;
  inviteCode: string;
  ownerId: string;
  totalPlants: number;
  memberCount?: number;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  displayName: string;
  avatar: string | null;
  joinedAt: string;
}

export interface ActivityFeedEvent {
  id: string;
  userId: string;
  eventType: FeedEventType;
  visibility: FeedVisibility;
  groupId: string | null;
  title: string;
  body: string;
  emoji: string;
  payload: Record<string, unknown>;
  createdAt: string;
  actor?: SocialProfile;
  reactionCounts?: Partial<Record<ActivityReactionType, number>>;
  commentCount?: number;
  userReaction?: ActivityReactionType | null;
}

export interface ActivityComment {
  id: string;
  feedId: string;
  userId: string;
  body: string;
  createdAt: string;
  author?: SocialProfile;
}

export interface SocialChallenge {
  id: string;
  scope: "personal" | "family" | "group";
  groupId: string | null;
  title: string;
  description: string;
  challengeType: ChallengeType;
  target: number;
  unit: string;
  rewardXp: number;
  rewardBadge: string | null;
  startsAt: string;
  endsAt: string;
  progress?: number;
  completedAt?: string | null;
}

export interface PlantJournalEntry {
  id: string;
  plantId: string;
  userId: string;
  entryType: JournalEntryType;
  body: string;
  photoUrl: string | null;
  milestoneType: string | null;
  visibility: FeedVisibility;
  feedEventId: string | null;
  createdAt: string;
}

export interface SocialNotification {
  id: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface FamilyLeaderboardEntry {
  userId: string;
  displayName: string;
  avatar: string | null;
  xp: number;
  streak: number;
  plants: number;
  lessons: number;
  harvests: number;
}
