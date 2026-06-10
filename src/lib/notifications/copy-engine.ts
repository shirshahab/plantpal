/**
 * Notification copy engine — turns raw app state into copy that reads like
 * a calm plant coach, not app spam.
 *
 * Voice rules:
 * - cautious words: may, likely, consider, check, looks like
 * - never alarmist: no "dying", no "urgent" framing, no guaranteed outcomes
 * - specific: plant names, local context, and a clear next action
 *
 * Pure function, no I/O. Copy variants rotate deterministically by `seed`
 * (the local day key) so a notification reads the same all day.
 */

import type { Plant } from "@/lib/types";
import type { PlantTask } from "@/lib/types/tasks";
import type { WeatherAlert, WeatherSnapshot } from "@/lib/types/phase6";
import type { AppNotificationType } from "@/lib/types/notifications";

export type NotificationTone = "helpful" | "calm" | "encouraging" | "celebratory";

export interface NotificationCopy {
  title: string;
  body: string;
  tone: NotificationTone;
  actionLabel: string;
  actionUrl: string;
}

export interface NotificationCopyInput {
  notificationType: AppNotificationType;
  /** Single plant the notification is about (preferred when only one). */
  plant?: Plant | null;
  /** All plant names involved when more than one. */
  plantNames?: string[];
  /** How many of the involved tasks are overdue. */
  overdueCount?: number;
  userProfile?: { displayName?: string | null; zipCode?: string | null } | null;
  /** City/area name for local context (e.g. "Pasadena"). */
  locationName?: string | null;
  weather?: WeatherSnapshot | null;
  /** The specific alert a weather notification is about. */
  weatherAlert?: WeatherAlert | null;
  academyProgress?: { currentStreak: number } | null;
  healthReport?: {
    species: string;
    issueLabel: string;
    daysSinceDiagnosis: number;
  } | null;
  task?: PlantTask | null;
  /** Pre-composed social event (server rows already carry good copy). */
  friendActivity?: { title: string; body: string } | null;
  challenge?: {
    title: string;
    daysLeft: number;
    rewardXp: number;
    completed: boolean;
  } | null;
  pestRisk?: { title: string; body: string } | null;
  /** Stable per-day seed (local YYYY-MM-DD) for variant rotation. */
  seed?: string;
}

/** Deterministic small hash for stable per-day copy variant selection. */
function pick<T>(variants: T[], seed: string, salt: string): T {
  const s = `${seed}:${salt}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return variants[Math.abs(h) % variants.length];
}

function namePreview(names: string[]): string {
  if (names.length === 0) return "your plants";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

/** "your Meyer Lemon" — lowercase-friendly possessive that reads naturally. */
function yourPlant(plant?: Plant | null, fallback = "your plant"): string {
  const name = plant?.name?.trim() || plant?.species?.trim();
  return name ? `your ${name}` : fallback;
}

function isYoungPlant(plant?: Plant | null): boolean {
  if (!plant) return false;
  if (plant.estimatedAgeMonths !== null && plant.estimatedAgeMonths !== undefined) {
    return plant.estimatedAgeMonths <= 18;
  }
  const planted = plant.plantedDate ?? plant.createdAt;
  if (!planted) return false;
  const months = (Date.now() - new Date(planted).getTime()) / (30 * 24 * 60 * 60 * 1000);
  return months <= 18;
}

function isPotted(plant?: Plant | null): boolean {
  return plant?.plantingType === "pot" || plant?.sizeType === "pot_diameter";
}

// ── Per-type copy builders ───────────────────────────────────────────────────

function waterCopy(input: NotificationCopyInput): NotificationCopy {
  const { plant, plantNames = [], overdueCount = 0, weather, locationName, seed = "" } = input;
  const city = locationName || weather?.location || "";
  const hot = (weather?.tempHighF ?? weather?.tempF ?? 0) >= 88;
  const rainSoon = (weather?.rainChance ?? 0) >= 60;

  if (plantNames.length <= 1) {
    const who = yourPlant(plant, plantNames[0] ? `your ${plantNames[0]}` : "your plant");
    const Who = who.charAt(0).toUpperCase() + who.slice(1);

    if (rainSoon) {
      return {
        title: `Rain may cover ${who} today`,
        body: city
          ? `Rain is likely in ${city}. Check the soil before watering — you may get to skip it.`
          : "Rain is likely today. Check the soil before watering — you may get to skip it.",
        tone: "helpful",
        actionLabel: "Check soil first",
        actionUrl: "/today",
      };
    }
    if (hot) {
      const young = isYoungPlant(plant) || isPotted(plant);
      return {
        title: `${Who} may need water today`,
        body: city
          ? `${city} is warming up. ${young ? "Young and potted plants dry out fastest — consider a deep soak." : "Warm days dry soil faster — a deep soak now helps."}`
          : "Warm weather dries soil faster — consider a deep soak today.",
        tone: "helpful",
        actionLabel: "Water now",
        actionUrl: "/today",
      };
    }
    const days = plant?.waterFrequencyDays;
    const bodies = [
      days
        ? `It's been about ${days} days. Check if the top inch of soil is dry before watering.`
        : "Check if the top inch of soil is dry before watering.",
      "Many plants like to dry out a little between waterings — a quick soil check tells you for sure.",
      "A quick soil check now keeps the watering rhythm on track.",
    ];
    return {
      title: `${Who} may need water today`,
      body: overdueCount > 0
        ? "This one slipped past its usual day — a check-in now gets it back on schedule."
        : pick(bodies, seed, "water-body"),
      tone: "helpful",
      actionLabel: "Check soil",
      actionUrl: "/today",
    };
  }

  return {
    title: `${plantNames.length} plants may need water today`,
    body:
      overdueCount > 0
        ? `${namePreview(plantNames)} — ${overdueCount} slipped past their usual day. A quick round now catches them up.`
        : `${namePreview(plantNames)} ${hot && city ? `— ${city} is warming up, so consider deeper soaks.` : "are due for a soil check."}`,
    tone: "helpful",
    actionLabel: "Open today's tasks",
    actionUrl: "/today",
  };
}

function fertilizeCopy(input: NotificationCopyInput): NotificationCopy {
  const { plant, plantNames = [], seed = "" } = input;

  if (plantNames.length <= 1) {
    const who = yourPlant(plant, plantNames[0] ? `your ${plantNames[0]}` : "your plant");
    const Who = who.charAt(0).toUpperCase() + who.slice(1);
    const bodies = [
      "Steady nutrients now support the next round of growth.",
      "A light feeding today keeps leaves green and growth steady.",
      "It looks like feeding day — follow the plan and skip if you fed recently.",
    ];
    return {
      title: `${Who} is likely ready for nutrients`,
      body: pick(bodies, seed, "feed-body"),
      tone: "helpful",
      actionLabel: "View feeding plan",
      actionUrl: "/today",
    };
  }

  return {
    title: `${plantNames.length} plants are due for feeding`,
    body: `${namePreview(plantNames)} are likely ready for nutrients. Skip any you fed recently.`,
    tone: "helpful",
    actionLabel: "View feeding plan",
    actionUrl: "/today",
  };
}

function careCopy(input: NotificationCopyInput): NotificationCopy {
  const { task, plantNames = [] } = input;

  if (task) {
    return {
      title: task.title,
      body:
        task.description ||
        (task.plantName
          ? `A small step that keeps your ${task.plantName} on track.`
          : "A small step that keeps your garden on track."),
      tone: "helpful",
      actionLabel: "See the task",
      actionUrl: "/today",
    };
  }

  return {
    title:
      plantNames.length === 1
        ? `Time to check your ${plantNames[0]}`
        : "A few care steps are waiting",
    body:
      plantNames.length > 0
        ? `${namePreview(plantNames)} ${plantNames.length === 1 ? "has" : "have"} small care steps today — nothing heavy.`
        : "A couple of quick garden tasks today — nothing heavy.",
    tone: "helpful",
    actionLabel: "Open today's tasks",
    actionUrl: "/today",
  };
}

function recoveryCopy(input: NotificationCopyInput): NotificationCopy {
  const { healthReport, plantNames = [], seed = "" } = input;

  if (healthReport) {
    const { species, issueLabel, daysSinceDiagnosis } = healthReport;
    const issue = issueLabel.toLowerCase();
    const bodies = [
      `Look for whether the ${issue} signs are fading, holding steady, or spreading.`,
      `Day ${Math.max(daysSinceDiagnosis, 1)} of the recovery plan — a quick photo can show if things are improving.`,
      `Check the same leaves as last time. Improvement usually shows within a few days.`,
    ];
    return {
      title: `Time to check your ${species} again`,
      body: pick(bodies, seed, `recovery-${daysSinceDiagnosis}`),
      tone: "calm",
      actionLabel: "Start check-in",
      actionUrl: "/today",
    };
  }

  return {
    title:
      plantNames.length === 1
        ? `Recovery check-in for your ${plantNames[0]}`
        : "Recovery check-in due",
    body: "A quick look at how treatment is going keeps the plan on track.",
    tone: "calm",
    actionLabel: "Start check-in",
    actionUrl: "/today",
  };
}

function streakCopy(input: NotificationCopyInput): NotificationCopy {
  const streak = input.academyProgress?.currentStreak ?? 0;
  const seed = input.seed ?? "";

  if (streak >= 2) {
    const bodies = [
      "Today's lesson takes about 3 minutes — a quick read keeps it going.",
      "One short lesson today and the streak lives on.",
      "You've built real momentum. Three minutes protects it.",
    ];
    return {
      title: `Keep your ${streak}-day learning streak alive`,
      body: pick(bodies, seed, "streak-body"),
      tone: "encouraging",
      actionLabel: "Open today's lesson",
      actionUrl: "/academy",
    };
  }

  return {
    title: "A quick lesson is ready for you",
    body: "Planty saved a 3-minute lesson that fits your garden.",
    tone: "encouraging",
    actionLabel: "Open Academy",
    actionUrl: "/academy",
  };
}

function weatherCopy(input: NotificationCopyInput): NotificationCopy {
  const { weatherAlert, weather, locationName } = input;
  const city = locationName || weather?.location || "";
  const inCity = city ? ` in ${city}` : "";

  switch (weatherAlert?.type) {
    case "heat": {
      const high = weather?.tempHighF ? ` near ${Math.round(weather.tempHighF)}°F` : "";
      return {
        title: `Heat alert${inCity}`,
        body: `Highs${high} expected. Young citrus and potted plants may need extra attention — consider a deep morning soak.`,
        tone: "calm",
        actionLabel: "See watering tips",
        actionUrl: "/dashboard",
      };
    }
    case "frost": {
      const low = weather?.tempLowF ? ` near ${Math.round(weather.tempLowF)}°F` : "";
      return {
        title: `Frost watch tonight${inCity}`,
        body: `Overnight lows${low} possible. Consider covering sensitive citrus and tender plants before dark.`,
        tone: "calm",
        actionLabel: "See what to cover",
        actionUrl: "/dashboard",
      };
    }
    case "wind": {
      const gusts = weather?.windSpeedMph
        ? `Gusts up to ${Math.round(weather.windSpeedMph)} mph possible. `
        : "";
      return {
        title: "High winds are coming",
        body: `${gusts}Check young tree stakes and consider moving light containers somewhere sheltered.`,
        tone: "calm",
        actionLabel: "Review your garden",
        actionUrl: "/dashboard",
      };
    }
    case "rain": {
      const chance = weather?.rainChance ? `${Math.round(weather.rainChance)}% chance of rain` : "Rain is likely";
      return {
        title: `Rain expected${inCity}`,
        body: `${chance} today. You can likely skip manual watering — check the soil tomorrow instead.`,
        tone: "helpful",
        actionLabel: "Adjust watering",
        actionUrl: "/dashboard",
      };
    }
    case "humidity":
      return {
        title: "Humid stretch ahead",
        body: "High humidity favors mildew on dense foliage. Consider improving airflow and avoid wetting leaves.",
        tone: "calm",
        actionLabel: "See prevention tips",
        actionUrl: "/dashboard",
      };
    case "drought":
      return {
        title: `Dry spell${inCity}`,
        body: "Hot, dry days with no rain in sight. Deep morning watering and a layer of mulch help soil hold moisture.",
        tone: "calm",
        actionLabel: "See watering tips",
        actionUrl: "/dashboard",
      };
    default:
      return {
        title: weatherAlert?.title ?? `Weather update${inCity}`,
        body:
          weatherAlert
            ? `${weatherAlert.message}${weatherAlert.wateringAdjustment ? ` ${weatherAlert.wateringAdjustment}` : ""}`
            : "Conditions are shifting — a quick look at local care tips may help.",
        tone: "calm",
        actionLabel: "See local tips",
        actionUrl: "/dashboard",
      };
  }
}

function pestRiskCopy(input: NotificationCopyInput): NotificationCopy {
  return {
    title: input.pestRisk?.title ?? "Seasonal pest check",
    body:
      input.pestRisk?.body ??
      "Conditions this week favor common pests. A quick look at leaves and stems catches problems early.",
    tone: "calm",
    actionLabel: "Open Plant Doctor",
    actionUrl: "/doctor",
  };
}

function friendCopy(input: NotificationCopyInput): NotificationCopy {
  if (input.friendActivity) {
    return {
      title: input.friendActivity.title,
      body: input.friendActivity.body || "See what's growing in your circle.",
      tone: "celebratory",
      actionLabel: "See activity",
      actionUrl: "/friends",
    };
  }
  return {
    title: "Your garden circle was active",
    body: "Friends shared new updates — take a peek at what's growing.",
    tone: "celebratory",
    actionLabel: "See friends",
    actionUrl: "/friends",
  };
}

function challengeCopy(input: NotificationCopyInput): NotificationCopy {
  const c = input.challenge;
  if (!c) {
    return {
      title: "Challenge update",
      body: "Check how your active challenge is going.",
      tone: "encouraging",
      actionLabel: "View challenges",
      actionUrl: "/friends",
    };
  }
  if (c.completed) {
    return {
      title: "Challenge complete!",
      body: `You finished "${c.title}" — ${c.rewardXp} XP earned. Nice work.`,
      tone: "celebratory",
      actionLabel: "Claim your progress",
      actionUrl: "/friends",
    };
  }
  return {
    title:
      c.daysLeft === 0
        ? `Last day for ${c.title}`
        : `${c.daysLeft} day${c.daysLeft === 1 ? "" : "s"} left in ${c.title}`,
    body: `Finish before it ends to earn ${c.rewardXp} XP — you're closer than you think.`,
    tone: "encouraging",
    actionLabel: "Continue challenge",
    actionUrl: "/friends",
  };
}

function systemCopy(): NotificationCopy {
  return {
    title: "PlantPal update",
    body: "Something new is ready in your garden.",
    tone: "helpful",
    actionLabel: "Take a look",
    actionUrl: "/dashboard",
  };
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function generateNotificationCopy(input: NotificationCopyInput): NotificationCopy {
  switch (input.notificationType) {
    case "water":
      return waterCopy(input);
    case "fertilize":
      return fertilizeCopy(input);
    case "care":
      return careCopy(input);
    case "recovery":
      return recoveryCopy(input);
    case "streak":
      return streakCopy(input);
    case "weather":
      return weatherCopy(input);
    case "pest_risk":
      return pestRiskCopy(input);
    case "friend":
      return friendCopy(input);
    case "challenge":
      return challengeCopy(input);
    case "system":
      return systemCopy();
  }
}
