import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics/events";
import {
  ANALYTICS_LAST_SESSION_KEY,
  ANALYTICS_QUEUE_KEY,
  ANALYTICS_SESSION_KEY,
} from "@/lib/analytics/events";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(ANALYTICS_SESSION_KEY, id);
  }
  return id;
}

function enqueue(payload: AnalyticsEventPayload): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ANALYTICS_QUEUE_KEY);
    const queue: AnalyticsEventPayload[] = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    /* ignore */
  }
}

async function flushToServer(payload: AnalyticsEventPayload): Promise<void> {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* offline — queue only */
  }
}

export function trackEvent(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null>,
  options?: { userId?: string | null; route?: string }
): void {
  if (typeof window === "undefined") return;

  const payload: AnalyticsEventPayload = {
    event,
    properties,
    route: options?.route ?? window.location.pathname,
    userId: options?.userId ?? null,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };

  enqueue(payload);
  void flushToServer(payload);
}

/** Once per calendar day — used for retention tracking. */
export function trackDailySession(userId?: string | null): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(ANALYTICS_LAST_SESSION_KEY);
  if (last === today) return;
  localStorage.setItem(ANALYTICS_LAST_SESSION_KEY, today);
  trackEvent("session_start", { day: today }, { userId });
}
