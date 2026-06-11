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

export const CHALLENGE_TEMPLATES = [
  {
    challengeType: "water_streak" as const,
    title: "7-Day Watering Check",
    description: "Check your soil before watering, every day for a week",
    emoji: "💧",
    target: 7,
    unit: "days",
    rewardXp: 100,
    rewardBadge: "challenge_winner",
  },
  {
    challengeType: "growth_photos" as const,
    title: "First Growth Photo",
    description: "Snap your first progress photo. Future you says thanks",
    emoji: "📸",
    target: 1,
    unit: "photo",
    rewardXp: 25,
    rewardBadge: null,
  },
  {
    challengeType: "add_plants" as const,
    title: "Add 3 Plants",
    description: "Three plants, three care plans, zero excuses",
    emoji: "🌱",
    target: 3,
    unit: "plants",
    rewardXp: 50,
    rewardBadge: null,
  },
  {
    challengeType: "academy_lesson" as const,
    title: "Complete Watering Basics",
    description: "Learn why most plants die from love, not neglect",
    emoji: "📚",
    target: 1,
    unit: "lesson",
    rewardXp: 75,
    rewardBadge: "plant_mentor",
  },
  {
    challengeType: "custom" as const,
    title: "Pest Patrol",
    description: "Inspect 3 plants for pests before they throw a party",
    emoji: "🐛",
    target: 3,
    unit: "inspections",
    rewardXp: 60,
    rewardBadge: null,
  },
  {
    challengeType: "custom" as const,
    title: "Flower Power",
    description: "Deadhead or feed 5 blooms to keep the show going",
    emoji: "🌸",
    target: 5,
    unit: "blooms",
    rewardXp: 80,
    rewardBadge: null,
  },
  {
    challengeType: "harvest_count" as const,
    title: "Fruit Boost",
    description: "Log 3 harvests from your fruiting plants",
    emoji: "🍊",
    target: 3,
    unit: "harvests",
    rewardXp: 90,
    rewardBadge: "challenge_winner",
  },
];
