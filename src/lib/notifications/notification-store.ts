/**
 * Client-side storage for notification read state and alert preferences.
 * Notifications regenerate from app state each day; we only persist which
 * stable IDs the user has seen, plus their preference toggles.
 */

import {
  DEFAULT_NOTIFICATION_PREFS,
  type AppNotification,
  type NotificationHistoryEntry,
  type NotificationPrefs,
} from "@/lib/types/notifications";

const READS_KEY = "plantpal-notification-reads";
const DISMISSED_KEY = "plantpal-notification-dismissed";
const HISTORY_KEY = "plantpal-notification-history";
const PREFS_KEY = "plantpal-notification-prefs";
const PUSH_DIGEST_KEY = "plantpal-push-digest-day";
const EMAIL_DIGEST_KEY = "plantpal-email-digest-day";

const HISTORY_MAX_ENTRIES = 100;
const HISTORY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const NOTIFICATIONS_CHANGED_EVENT = "plantpal:notifications-changed";

const isBrowser = () => typeof window !== "undefined";

/** Map of notification id -> ISO timestamp it was read. */
export function getReadMap(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(READS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markNotificationsRead(ids: string[]): void {
  if (!isBrowser() || ids.length === 0) return;
  const map = getReadMap();
  const now = new Date().toISOString();
  for (const id of ids) map[id] = now;

  // Prune entries older than 14 days — daily IDs never come back.
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  for (const [id, at] of Object.entries(map)) {
    if (new Date(at).getTime() < cutoff) delete map[id];
  }

  localStorage.setItem(READS_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

/** Map of dismissed (deleted) notification id -> ISO timestamp. */
export function getDismissedMap(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function dismissNotifications(ids: string[]): void {
  if (!isBrowser() || ids.length === 0) return;
  const map = getDismissedMap();
  const now = new Date().toISOString();
  for (const id of ids) map[id] = now;

  // Daily IDs never come back — prune old entries.
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  for (const [id, at] of Object.entries(map)) {
    if (new Date(at).getTime() < cutoff) delete map[id];
  }

  localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

/** Rolling 30-day local history of every notification the user has seen. */
export function getNotificationHistory(): NotificationHistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as NotificationHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendNotificationHistory(notifications: AppNotification[]): void {
  if (!isBrowser() || notifications.length === 0) return;
  const existing = getNotificationHistory();
  const known = new Set(existing.map((e) => e.id));
  const additions = notifications
    .filter((n) => !known.has(n.id))
    .map<NotificationHistoryEntry>((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      createdAt: n.createdAt,
    }));
  if (additions.length === 0) return;

  const cutoff = Date.now() - HISTORY_MAX_AGE_MS;
  const next = [...additions, ...existing]
    .filter((e) => new Date(e.createdAt).getTime() >= cutoff)
    .slice(0, HISTORY_MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function getNotificationPrefs(): NotificationPrefs {
  if (!isBrowser()) return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw
      ? { ...DEFAULT_NOTIFICATION_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) }
      : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(patch: Partial<NotificationPrefs>): NotificationPrefs {
  const next = { ...getNotificationPrefs(), ...patch };
  if (isBrowser()) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
  return next;
}

/** Returns true if the daily digest was already pushed for `dayKey`. */
export function wasDigestSent(kind: "push" | "email", dayKey: string): boolean {
  if (!isBrowser()) return true;
  return localStorage.getItem(kind === "push" ? PUSH_DIGEST_KEY : EMAIL_DIGEST_KEY) === dayKey;
}

export function markDigestSent(kind: "push" | "email", dayKey: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(kind === "push" ? PUSH_DIGEST_KEY : EMAIL_DIGEST_KEY, dayKey);
}
