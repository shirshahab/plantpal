import type {
  ActivityReactionType,
  FeedEventType,
  FeedFilter,
  SocialBadgeId,
} from "./types";

export const REACTION_OPTIONS: {
  id: ActivityReactionType;
  emoji: string;
  label: string;
}[] = [
  { id: "growing_strong", emoji: "🌱", label: "Growing Strong" },
  { id: "beautiful", emoji: "🌸", label: "Beautiful" },
  { id: "great_harvest", emoji: "🍅", label: "Great Harvest" },
  { id: "nice_work", emoji: "👏", label: "Nice Work" },
];

export const FEED_FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All Activity" },
  { id: "friends", label: "Friends" },
  { id: "family", label: "Family" },
  { id: "groups", label: "Groups" },
  { id: "mine", label: "My Activity" },
  { id: "photos", label: "Photos" },
  { id: "achievements", label: "Achievements" },
];

export const VISIBILITY_OPTIONS: {
  id: "private" | "friends" | "circle" | "public";
  label: string;
  description: string;
}[] = [
  { id: "private", label: "Private", description: "Only you" },
  { id: "friends", label: "Friends", description: "PlantPal friends" },
  { id: "circle", label: "Circle", description: "Family or group" },
  { id: "public", label: "Public", description: "All PlantPal users" },
];

export const EVENT_EMOJI: Record<FeedEventType, string> = {
  plant_added: "🌱",
  lesson_completed: "📚",
  badge_earned: "🏅",
  growth_photo: "📸",
  streak_milestone: "🔥",
  harvest_logged: "🍅",
  diagnosis_completed: "🩺",
  group_milestone: "👨‍👩‍👧",
  journal_entry: "📓",
  challenge_completed: "🏆",
  task_completed: "✅",
};

export const SOCIAL_BADGES: Record<
  SocialBadgeId,
  { title: string; description: string; emoji: string }
> = {
  helpful_gardener: {
    title: "Helpful Gardener",
    description: "Left encouraging comments for friends",
    emoji: "💬",
  },
  plant_mentor: {
    title: "Plant Mentor",
    description: "Shared knowledge and tips with your circle",
    emoji: "🎓",
  },
  family_champion: {
    title: "Family Champion",
    description: "Top of the family leaderboard",
    emoji: "👑",
  },
  challenge_winner: {
    title: "Challenge Winner",
    description: "Completed a group challenge",
    emoji: "🏆",
  },
  garden_historian: {
    title: "Garden Historian",
    description: "Documented 10+ journal milestones",
    emoji: "📜",
  },
  community_builder: {
    title: "Community Builder",
    description: "Invited friends and grew your circle",
    emoji: "🤝",
  },
};

export const DEMO_FEED_EVENTS = [
  {
    actorName: "Shahab",
    eventType: "plant_added" as FeedEventType,
    title: "added Meyer Lemon",
    emoji: "🌱",
  },
  {
    actorName: "Sabina",
    eventType: "lesson_completed" as FeedEventType,
    title: "completed Soil Basics",
    emoji: "📚",
  },
  {
    actorName: "Alex",
    eventType: "badge_earned" as FeedEventType,
    title: "earned Bug Hunter Badge",
    emoji: "🏅",
  },
  {
    actorName: "Sarah",
    eventType: "growth_photo" as FeedEventType,
    title: "uploaded a growth photo",
    emoji: "📸",
  },
  {
    actorName: "John",
    eventType: "streak_milestone" as FeedEventType,
    title: "completed a 7 day streak",
    emoji: "🔥",
  },
  {
    actorName: "Lisa",
    eventType: "harvest_logged" as FeedEventType,
    title: "harvested tomatoes",
    emoji: "🍅",
  },
  {
    actorName: "Mike",
    eventType: "diagnosis_completed" as FeedEventType,
    title: "diagnosed aphids",
    emoji: "🩺",
  },
  {
    actorName: "Family Garden",
    eventType: "group_milestone" as FeedEventType,
    title: "reached 100 plants",
    emoji: "👨‍👩‍👧",
  },
];

export const CHALLENGE_TEMPLATES = [
  {
    challengeType: "water_streak" as const,
    title: "Water plants 7 days",
    description: "Keep your garden hydrated all week",
    target: 7,
    unit: "days",
    rewardXp: 100,
    rewardBadge: "challenge_winner",
  },
  {
    challengeType: "lesson_path" as const,
    title: "Complete Soil Path",
    description: "Finish all lessons in the Soil Basics path",
    target: 5,
    unit: "lessons",
    rewardXp: 150,
    rewardBadge: "plant_mentor",
  },
  {
    challengeType: "growth_photos" as const,
    title: "Upload 5 growth photos",
    description: "Document your plants' progress",
    target: 5,
    unit: "photos",
    rewardXp: 75,
    rewardBadge: "garden_historian",
  },
  {
    challengeType: "add_plants" as const,
    title: "Add 3 new plants",
    description: "Expand your digital garden",
    target: 3,
    unit: "plants",
    rewardXp: 50,
    rewardBadge: null,
  },
];
