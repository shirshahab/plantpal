export type AnalyticsEventName =
  | "signup"
  | "login"
  | "scan"
  | "lesson_completed"
  | "plant_added"
  | "care_plan_generated"
  | "session_start"
  | "onboarding_complete"
  | "referral_redeemed"
  | "page_view"
  | "feedback_submitted"
  | "notification_sent"
  | "notification_opened"
  | "reminder_completed";

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
