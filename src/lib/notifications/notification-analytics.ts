/** Client helper: record notification lifecycle events (best effort). */

import { trackEvent } from "@/lib/analytics/track";

export type NotificationLifecycleEvent = "sent" | "opened" | "completed";

export function recordNotificationEvent(
  event: NotificationLifecycleEvent,
  notificationId: string,
  notificationType: string
): void {
  trackEvent(
    event === "sent"
      ? "notification_sent"
      : event === "opened"
        ? "notification_opened"
        : "reminder_completed",
    { notificationId, notificationType }
  );

  if (typeof window === "undefined") return;
  void fetch("/api/notifications/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, notificationId, notificationType }),
    keepalive: true,
  }).catch(() => {
    /* best effort */
  });
}
