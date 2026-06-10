/**
 * Client-side storage for notification read state and alert preferences.
 * Notifications regenerate from app state each day; we only persist which
 * stable IDs the user has seen, plus their preference toggles.
 */

import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from "@/lib/types/notifications";

const READS_KEY = "plantpal-notification-reads";
const PREFS_KEY = "plantpal-notification-prefs";
const PUSH_DIGEST_KEY = "plantpal-push-digest-day";
const EMAIL_DIGEST_KEY = "plantpal-email-digest-day";

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
