export type AnalyticsEventName =
  | "signup"
  | "scan"
  | "lesson_completed"
  | "plant_added"
  | "session_start"
  | "onboarding_complete"
  | "referral_redeemed"
  | "page_view"
  | "feedback_submitted";

export interface AnalyticsEventPayload {
  event: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  route?: string;
  userId?: string | null;
  sessionId?: string;
  timestamp?: string;
}

export const ANALYTICS_QUEUE_KEY = "plantpal-analytics-queue";
export const ANALYTICS_SESSION_KEY = "plantpal-analytics-session";
export const ANALYTICS_LAST_SESSION_KEY = "plantpal-analytics-last-session";
