/**
 * Notification engine — builds the day's alerts from real app state.
 * Pure function: no storage, no network. IDs are stable per day so
 * read-state survives rebuilds. All wording comes from the copy engine
 * so notifications read like a plant coach, not app spam.
 */

import type { PlantTask, TaskGroups, ReminderSettings } from "@/lib/types/tasks";
import type { Plant } from "@/lib/types";
import type { WeatherSnapshot } from "@/lib/types/phase6";
import type { SocialChallenge } from "@/lib/social/types";
import type {
  AppNotification,
  AppNotificationType,
  NotificationPrefs,
} from "@/lib/types/notifications";
import { isRecoveryTask } from "@/lib/health/recovery-tasks";
import {
  generateNotificationCopy,
  type NotificationCopy,
} from "@/lib/notifications/copy-engine";

/** Minimal health-report context the engine needs for recovery copy. */
export interface ActiveHealthReportSummary {
  id: string;
  species: string;
  issueLabel: string;
  createdAt: string;
}

export interface NotificationEngineInput {
  todayKey: string; // local YYYY-MM-DD
  taskGroups: TaskGroups;
  plants: Plant[];
  streak: { current: number; lastActiveDate: string | null };
  friendUnread: number;
  challenges?: SocialChallenge[];
  activeHealthReports?: ActiveHealthReportSummary[];
  weather: WeatherSnapshot | null;
  reminders: ReminderSettings;
  prefs: NotificationPrefs;
}

/** Reminder-class types covered by the daily anti-spam cap. */
const CARE_REMINDER_TYPES: AppNotificationType[] = [
  "water",
  "fertilize",
  "care",
  "recovery",
];

/** Max care reminders shown per day, and max urgent across everything. */
const MAX_CARE_REMINDERS_PER_DAY = 3;
const MAX_URGENT_PER_DAY = 1;

/**
 * Priority score for ordering the day's notifications:
 * health follow-up > weather alert > care task > academy > social.
 */
const PRIORITY_SCORE: Record<AppNotificationType, number> = {
  recovery: 6,
  pest_risk: 5,
  weather: 4,
  water: 3,
  fertilize: 3,
  care: 3,
  streak: 2,
  friend: 1,
  challenge: 1,
  system: 0,
};

/**
 * Anti-spam pass: cap care reminders at 3/day and keep at most one
 * notification marked urgent. Event-driven items (friends, challenges)
 * and weather alerts are informational and not capped.
 */
function applyDailyCaps(list: AppNotification[]): AppNotification[] {
  let careCount = 0;
  let urgentCount = 0;
  const out: AppNotification[] = [];

  for (const n of list) {
    if (CARE_REMINDER_TYPES.includes(n.type)) {
      if (careCount >= MAX_CARE_REMINDERS_PER_DAY) continue;
      careCount += 1;
    }
    if (n.priority === "high") {
      if (urgentCount >= MAX_URGENT_PER_DAY) {
        out.push({ ...n, priority: "normal" });
        continue;
      }
      urgentCount += 1;
    }
    out.push(n);
  }
  return out;
}

function uniquePlantNames(tasks: PlantTask[]): string[] {
  return [...new Set(tasks.map((t) => t.plantName).filter(Boolean))];
}

function daysBetween(fromIso: string, toKey: string): number {
  const from = new Date(fromIso.slice(0, 10));
  const to = new Date(toKey);
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
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
  const {
    todayKey,
    taskGroups,
    plants,
    streak,
    friendUnread,
    challenges = [],
    activeHealthReports = [],
    weather,
    reminders,
    prefs,
  } = input;

  // Master pause: the user asked for silence.
  if (prefs.paused) return [];

  const now = new Date().toISOString();
  const out: AppNotification[] = [];
  const locationName = weather?.location ?? null;

  const push = (
    type: AppNotificationType,
    idSuffix: string,
    copy: NotificationCopy,
    priority: "normal" | "high" = "normal"
  ) => {
    out.push({
      id: `${type}-${idSuffix}-${todayKey}`,
      type,
      title: copy.title,
      body: copy.body,
      href: copy.actionUrl,
      actionLabel: copy.actionLabel,
      priority,
      createdAt: now,
      read: false,
    });
  };

  const plantById = (id: string | null): Plant | null =>
    id ? (plants.find((p) => p.id === id) ?? null) : null;

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
        generateNotificationCopy({
          notificationType: "water",
          plant: names.length === 1 ? plantById(water[0].plantId) : null,
          plantNames: names,
          overdueCount,
          weather,
          locationName,
          seed: todayKey,
        }),
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
        generateNotificationCopy({
          notificationType: "fertilize",
          plant: names.length === 1 ? plantById(feed[0].plantId) : null,
          plantNames: names,
          seed: todayKey,
        })
      );
    }
  }

  // 2b. Other care reminders — pruning, repotting, harvest, seasonal & inspections
  const otherCare = active.filter(
    (t) =>
      !isRecoveryTask(t) &&
      t.taskType !== "water" &&
      t.taskType !== "fertilize"
  );
  if (otherCare.length > 0) {
    push(
      "care",
      "due",
      generateNotificationCopy({
        notificationType: "care",
        task: otherCare.length === 1 ? otherCare[0] : null,
        plantNames: uniquePlantNames(otherCare),
        seed: todayKey,
      })
    );
  }

  // 3. Recovery follow-up reminders — tied to the active diagnosis when known
  const recovery = active.filter((t) => isRecoveryTask(t));
  if (recovery.length > 0) {
    const reportId = recovery[0].metadata?.healthReportId as string | undefined;
    const report = activeHealthReports.find((r) => r.id === reportId) ?? null;
    push(
      "recovery",
      "followup",
      generateNotificationCopy({
        notificationType: "recovery",
        plantNames: uniquePlantNames(recovery),
        healthReport: report
          ? {
              species: report.species,
              issueLabel: report.issueLabel,
              daysSinceDiagnosis: daysBetween(report.createdAt, todayKey),
            }
          : null,
        seed: todayKey,
      }),
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
      generateNotificationCopy({
        notificationType: "streak",
        academyProgress: { currentStreak: streak.current },
        seed: todayKey,
      })
    );
  }

  // 5. Friend activity alerts (aggregate fallback — provider prefers real rows)
  if (prefs.friendActivity && friendUnread > 0) {
    push(
      "friend",
      "activity",
      generateNotificationCopy({ notificationType: "friend", seed: todayKey })
    );
  }

  // 5b. Challenge updates — ending soon or completed today
  if (prefs.challengeUpdates) {
    for (const c of challenges) {
      if (c.completedAt) {
        if (c.completedAt.startsWith(todayKey)) {
          push(
            "challenge",
            `done-${c.id}`,
            generateNotificationCopy({
              notificationType: "challenge",
              challenge: {
                title: c.title,
                daysLeft: 0,
                rewardXp: c.rewardXp,
                completed: true,
              },
              seed: todayKey,
            })
          );
        }
        continue;
      }
      const msLeft = new Date(c.endsAt).getTime() - Date.now();
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      if (daysLeft >= 0 && daysLeft <= 2) {
        push(
          "challenge",
          `ending-${c.id}`,
          generateNotificationCopy({
            notificationType: "challenge",
            challenge: {
              title: c.title,
              daysLeft,
              rewardXp: c.rewardXp,
              completed: false,
            },
            seed: todayKey,
          })
        );
      }
    }
  }

  // 6. Weather alerts
  if (prefs.weatherAlerts && weather) {
    for (const alert of weather.alerts) {
      push(
        "weather",
        alert.type,
        generateNotificationCopy({
          notificationType: "weather",
          weatherAlert: alert,
          weather,
          locationName,
          seed: todayKey,
        }),
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
      push(
        "pest_risk",
        "seasonal",
        generateNotificationCopy({
          notificationType: "pest_risk",
          pestRisk: risk,
          seed: todayKey,
        })
      );
    }
  }

  // Urgent first, then by priority score (health > weather > care > academy >
  // social), then apply daily anti-spam caps.
  const sorted = out.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
    return PRIORITY_SCORE[b.type] - PRIORITY_SCORE[a.type];
  });
  return applyDailyCaps(sorted);
}
