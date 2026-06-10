/** PlantPal notifications & retention engine types. */

export type AppNotificationType =
  | "water"
  | "fertilize"
  | "recovery"
  | "streak"
  | "friend"
  | "weather"
  | "pest_risk";

export interface AppNotification {
  /** Stable per-day id (e.g. "water-2026-06-09") so read state persists. */
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  href: string;
  priority: "normal" | "high";
  createdAt: string;
  read: boolean;
}

export interface NotificationPrefs {
  friendActivity: boolean;
  weatherAlerts: boolean;
  pestAlerts: boolean;
  academyStreak: boolean;
  /** Email a daily digest when push isn't available. */
  emailFallback: boolean;
  emailAddress: string;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  friendActivity: true,
  weatherAlerts: true,
  pestAlerts: true,
  academyStreak: true,
  emailFallback: false,
  emailAddress: "",
};
