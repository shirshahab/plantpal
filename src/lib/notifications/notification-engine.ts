/**
 * Notification engine — builds the day's alerts from real app state.
 * Pure function: no storage, no network. IDs are stable per day so
 * read-state survives rebuilds.
 */

import type { PlantTask, TaskGroups, ReminderSettings } from "@/lib/types/tasks";
import type { Plant } from "@/lib/types";
import type { WeatherSnapshot } from "@/lib/types/phase6";
import type {
  AppNotification,
  AppNotificationType,
  NotificationPrefs,
} from "@/lib/types/notifications";
import { isRecoveryTask } from "@/lib/health/recovery-tasks";

export interface NotificationEngineInput {
  todayKey: string; // local YYYY-MM-DD
  taskGroups: TaskGroups;
  plants: Plant[];
  streak: { current: number; lastActiveDate: string | null };
  friendUnread: number;
  weather: WeatherSnapshot | null;
  reminders: ReminderSettings;
  prefs: NotificationPrefs;
}

function plural(n: number, word: string, pluralWord?: string): string {
  return `${n} ${n === 1 ? word : (pluralWord ?? `${word}s`)}`;
}

function uniquePlantNames(tasks: PlantTask[]): string[] {
  return [...new Set(tasks.map((t) => t.plantName).filter(Boolean))];
}

function namePreview(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

/** Seasonal pest/disease risk heuristics — cautious, regional-season based. */
function pestRiskForToday(
  month: number, // 0-11
  weather: WeatherSnapshot | null,
  hasOutdoorHint: boolean
): { title: string; body: string } | null {
  const humid = (weather?.humidity ?? 50) >= 65;
  const hot = (weather?.tempF ?? 70) >= 88;
  const rainy = (weather?.rainChance ?? 0) >= 60;

  if (hot && !humid) {
    return {
      title: "Spider mite conditions",
      body: "Hot, dry stretches favor spider mites. Check leaf undersides for fine webbing or stippling.",
    };
  }
  if (humid || rainy) {
    return {
      title: "Fungal risk is elevated",
      body: "High humidity favors powdery mildew and leaf spot. Improve airflow and avoid wetting foliage.",
    };
  }
  if (month >= 2 && month <= 5) {
    return {
      title: "Aphid season check",
      body: "Spring growth attracts aphids. Scan new shoots and buds for clusters this week.",
    };
  }
  if (month >= 8 && month <= 10 && hasOutdoorHint) {
    return {
      title: "Fall pest sweep",
      body: "Pests hitchhike indoors as nights cool. Inspect plants before moving them inside.",
    };
  }
  return null;
}

export function buildAppNotifications(input: NotificationEngineInput): AppNotification[] {
  const { todayKey, taskGroups, plants, streak, friendUnread, weather, reminders, prefs } =
    input;
  const now = new Date().toISOString();
  const out: AppNotification[] = [];

  const push = (
    type: AppNotificationType,
    idSuffix: string,
    title: string,
    body: string,
    href: string,
    priority: "normal" | "high" = "normal"
  ) => {
    out.push({
      id: `${type}-${idSuffix}-${todayKey}`,
      type,
      title,
      body,
      href,
      priority,
      createdAt: now,
      read: false,
    });
  };

  const active = [...taskGroups.overdue, ...taskGroups.dueToday].filter(
    (t) => t.status === "pending"
  );

  // 1. Water reminders
  if (reminders.watering) {
    const water = active.filter((t) => t.taskType === "water" && !isRecoveryTask(t));
    if (water.length > 0) {
      const names = uniquePlantNames(water);
      const overdueCount = taskGroups.overdue.filter(
        (t) => t.taskType === "water" && t.status === "pending"
      ).length;
      push(
        "water",
        "due",
        names.length === 1 ? `${names[0]} needs water` : `${plural(names.length, "plant")} need water`,
        overdueCount > 0
          ? `${namePreview(names)} — ${plural(overdueCount, "task is", "tasks are")} overdue.`
          : `${namePreview(names)} ${names.length === 1 ? "is" : "are"} due for water today.`,
        "/today",
        overdueCount > 0 ? "high" : "normal"
      );
    }
  }

  // 2. Fertilizer reminders
  if (reminders.fertilizer) {
    const feed = active.filter((t) => t.taskType === "fertilize" && !isRecoveryTask(t));
    if (feed.length > 0) {
      const names = uniquePlantNames(feed);
      push(
        "fertilize",
        "due",
        names.length === 1 ? `Feed ${names[0]}` : `${plural(names.length, "plant")} due for feeding`,
        `${namePreview(names)} ${names.length === 1 ? "is" : "are"} ready for nutrients.`,
        "/today"
      );
    }
  }

  // 3. Recovery follow-up reminders
  const recovery = active.filter((t) => isRecoveryTask(t));
  if (recovery.length > 0) {
    const names = uniquePlantNames(recovery);
    push(
      "recovery",
      "followup",
      "Recovery check-in due",
      `${plural(recovery.length, "follow-up step")} for ${namePreview(names)}. A quick check keeps treatment on track.`,
      "/today",
      "high"
    );
  }

  // 4. Academy streak reminders
  if (
    prefs.academyStreak &&
    streak.current >= 2 &&
    streak.lastActiveDate !== null &&
    streak.lastActiveDate !== todayKey
  ) {
    push(
      "streak",
      "risk",
      `Keep your ${streak.current}-day streak alive`,
      "One quick lesson today protects your Academy streak.",
      "/academy"
    );
  }

  // 5. Friend activity alerts
  if (prefs.friendActivity && friendUnread > 0) {
    push(
      "friend",
      "activity",
      friendUnread === 1 ? "New friend activity" : `${friendUnread} new friend updates`,
      "Friends have been active in your garden circle.",
      "/friends"
    );
  }

  // 6. Weather alerts
  if (prefs.weatherAlerts && weather) {
    for (const alert of weather.alerts) {
      push(
        "weather",
        alert.type,
        alert.title,
        alert.wateringAdjustment ? `${alert.message} ${alert.wateringAdjustment}` : alert.message,
        "/dashboard",
        alert.severity === "critical" ? "high" : "normal"
      );
    }
  }

  // 7. Pest/disease risk alerts (only when the user has plants to protect)
  if (prefs.pestAlerts && plants.length > 0) {
    const month = new Date().getMonth();
    const hasOutdoorHint = plants.some((p) =>
      `${p.locationType ?? ""}`.toLowerCase().includes("outdoor")
    );
    const risk = pestRiskForToday(month, weather, hasOutdoorHint);
    if (risk) {
      push("pest_risk", "seasonal", risk.title, `${risk.body}`, "/doctor");
    }
  }

  // High priority first, then most recent type ordering as built.
  return out.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));
}
