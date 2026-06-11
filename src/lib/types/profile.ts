export type GrowType =
  | "indoor"
  | "fruit_trees"
  | "flowers"
  | "vegetables"
  | "bonsai"
  | "full_yard";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type MainGoal =
  | "keep_alive"
  | "more_fruit"
  | "more_flowers"
  | "better_landscape"
  | "learn_care";

/** Who sees your garden activity by default. Privacy first: default is private. */
export type SocialSharingLevel = "private" | "friends" | "local" | "public";

export interface UserProfile {
  onboardingComplete: boolean;
  /** Set when user adds their first plant. */
  firstPlantAdded?: boolean;
  /** User chose "I'll add a plant later" during onboarding. */
  firstPlantSkipped?: boolean;
  growTypes: GrowType[];
  experienceLevel: ExperienceLevel | null;
  zipCode: string;
  mainGoal: MainGoal | null;
  completedAt: string | null;
  /** Unique invite code for referral program. */
  referralCode?: string;
  /** Referral code used at signup, if any. */
  referredBy?: string;
  /** Founder Mode — unrestricted access for testing (local only). */
  founderMode?: boolean;
  /** Default visibility for garden activity. Defaults to private. */
  socialSharing?: SocialSharingLevel;
}

export const DEFAULT_PROFILE: UserProfile = {
  onboardingComplete: false,
  growTypes: [],
  experienceLevel: null,
  zipCode: "",
  mainGoal: null,
  completedAt: null,
};

export const GROW_TYPE_OPTIONS: { id: GrowType; label: string; icon: string }[] = [
  { id: "indoor", label: "Indoor plants", icon: "🪴" },
  { id: "fruit_trees", label: "Fruit trees", icon: "🍋" },
  { id: "flowers", label: "Flowers", icon: "🌸" },
  { id: "vegetables", label: "Vegetables", icon: "🥬" },
  { id: "bonsai", label: "Bonsai", icon: "🌳" },
  { id: "full_yard", label: "Full yard", icon: "🏡" },
];

export const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: "beginner", label: "Beginner", desc: "New to plant care. I want guidance." },
  { id: "intermediate", label: "Intermediate", desc: "I know the basics but want better results." },
  { id: "advanced", label: "Advanced", desc: "Experienced. I want precision tools." },
];

export const MAIN_GOAL_OPTIONS: { id: MainGoal; label: string; icon: string }[] = [
  { id: "keep_alive", label: "Keep plants alive", icon: "💚" },
  { id: "more_fruit", label: "More fruit", icon: "🍊" },
  { id: "more_flowers", label: "More flowers", icon: "🌺" },
  { id: "better_landscape", label: "Better landscape", icon: "🏡" },
  { id: "learn_care", label: "Learn plant care", icon: "📚" },
];

export const SOCIAL_SHARING_OPTIONS: {
  id: SocialSharingLevel;
  label: string;
  description: string;
}[] = [
  { id: "private", label: "Private", description: "Your garden, your business. Only you see your activity." },
  { id: "friends", label: "Friends", description: "Friends see your garden wins and milestones." },
  { id: "local", label: "Local community", description: "Friends plus your local grower circle." },
  { id: "public", label: "Public", description: "Any PlantPal user can see your activity." },
];
