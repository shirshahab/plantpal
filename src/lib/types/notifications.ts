/** PlantPal notifications & retention engine types. */

export type AppNotificationType =
  | "water"
  | "fertilize"
  | "care"
  | "recovery"
  | "streak"
  | "friend"
  | "challenge"
  | "weather"
  | "pest_risk"
  | "system";

/** User-facing grouping for filters and settings. */
export type NotificationCategory =
  | "care"
  | "health"
  | "academy"
  | "friends"
  | "challenges"
  | "weather"
  | "system";

export const NOTIFICATION_CATEGORY_OF: Record<AppNotificationType, NotificationCategory> = {
  water: "care",
  fertilize: "care",
  care: "care",
  recovery: "health",
  pest_risk: "health",
  streak: "academy",
  friend: "friends",
  challenge: "challenges",
  weather: "weather",
  system: "system",
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  care: "Plant Care",
  health: "Plant Health",
  academy: "Academy",
  friends: "Friends",
  challenges: "Challenges",
  weather: "Weather",
  system: "System",
};

export interface AppNotification {
  /** Stable per-day id (e.g. "water-due-2026-06-09") so read state persists. */
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  href: string;
  /** Short CTA from the copy engine (e.g. "Check soil"). */
  actionLabel?: string;
  priority: "normal" | "high";
  createdAt: string;
  read: boolean;
}

export interface NotificationPrefs {
  /** Master switch — pauses every notification when true. */
  paused: boolean;
  friendActivity: boolean;
  weatherAlerts: boolean;
  pestAlerts: boolean;
  academyStreak: boolean;
  challengeUpdates: boolean;
  marketingUpdates: boolean;
  /** Email a daily digest when push isn't available. */
  emailFallback: boolean;
  emailAddress: string;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  paused: false,
  friendActivity: true,
  weatherAlerts: true,
  pestAlerts: true,
  academyStreak: true,
  challengeUpdates: true,
  marketingUpdates: false,
  emailFallback: false,
  emailAddress: "",
};

/** A notification that has left the live list and entered local history. */
export interface NotificationHistoryEntry {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: string;
}
