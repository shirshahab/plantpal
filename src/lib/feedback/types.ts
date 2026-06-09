export interface BetaFeedbackInput {
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
