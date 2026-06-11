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

/**
 * Events that also feed the anonymous community intelligence layer
 * (aggregate counts by ZIP prefix, never tied to a user).
 */
const COMMUNITY_SIGNAL_OF_EVENT: Partial<Record<AnalyticsEventName, string>> = {
  plant_added: "plant_added",
  scan: "plant_scanned",
  care_plan_generated: "care_plan_generated",
  lesson_completed: "lesson_completed",
};

function forwardCommunitySignal(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null>
): void {
  const signalType = COMMUNITY_SIGNAL_OF_EVENT[event];
  if (!signalType) return;
  try {
    const profileRaw = localStorage.getItem("plantpal-user-profile");
    const zip = profileRaw ? (JSON.parse(profileRaw).zipCode as string | undefined) : undefined;
    void fetch("/api/intelligence/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signal_type: signalType,
        plant_species:
          typeof properties?.species === "string" ? properties.species : undefined,
        issue: typeof properties?.issue === "string" ? properties.issue : undefined,
        zip_code: zip,
      }),
      keepalive: true,
    });
  } catch {
    /* community signals are best-effort */
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
  forwardCommunitySignal(event, properties);
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
