export type BetaFeedbackCategory =
  | "bug"
  | "confusing"
  | "wrong_plant_result"
  | "missing_feature"
  | "love_this";

export interface BetaFeedbackCategoryOption {
  id: BetaFeedbackCategory;
  label: string;
  emoji: string;
}

export const BETA_FEEDBACK_CATEGORIES: BetaFeedbackCategoryOption[] = [
  { id: "bug", label: "Bug", emoji: "🐛" },
  { id: "confusing", label: "Confusing", emoji: "🤔" },
  { id: "wrong_plant_result", label: "Wrong plant result", emoji: "🌿" },
  { id: "missing_feature", label: "Missing feature", emoji: "💡" },
  { id: "love_this", label: "Love this", emoji: "❤️" },
];

export interface BetaFeedbackInput {
  category?: BetaFeedbackCategory;
  tried?: string;
  confused?: string;
  improvement?: string;
  route?: string;
  email?: string;
}

export interface BetaFeedbackRecord extends BetaFeedbackInput {
  id: string;
  user_id?: string | null;
  feedback_type: "beta";
  message: string;
  created_at: string;
}

export const FEEDBACK_STORAGE_KEY = "plantpal-beta-feedback";

export function getCategoryLabel(category?: BetaFeedbackCategory): string {
  return BETA_FEEDBACK_CATEGORIES.find((c) => c.id === category)?.label ?? "General";
}
