import type { PlantyVariant } from "@/components/brand/planty";
import { getDailySeed, getPlantySeed, seedIndex } from "@/lib/local/daily-seed";
import { PLANTY_MESSAGE_BANK } from "./planty-message-bank";

export type PlantyMood =
  | "happy"
  | "thinking"
  | "diagnosing"
  | "celebrating"
  | "warning"
  | "concerned"
  | "niceWork"
  | "detective"
  | "lawyer"
  | "weather"
  | "sleepy"
  | "proud"
  | "shocked"
  | "suspicious";

export type PlantyMessageContext =
  | "general"
  | "dashboard_greeting"
  | "dashboard_welcome"
  | "today_tasks"
  | "empty_today"
  | "watering"
  | "fertilizer"
  | "weekly_check"
  | "plant_health"
  | "diagnosis"
  | "weather"
  | "fire_nearby"
  | "heat_wave"
  | "rain"
  | "wind"
  | "cold_frost"
  | "streaks"
  | "xp"
  | "lessons"
  | "community"
  | "local_trends"
  | "seasonal";

export type PlantyGreetingCta = "today_task" | "scan" | "growth_photo" | "lesson";

export interface PlantyMessageTriggers {
  exactPlants?: number;
  minPlants?: number;
  maxPlants?: number;
  fireNearby?: boolean;
  heatWave?: boolean;
  frost?: boolean;
  rain?: boolean;
  wind?: boolean;
  healthConcern?: boolean;
  minStreak?: number;
  minXp?: number;
}

export interface PlantyMessage {
  id: string;
  text: string;
  mood: PlantyMood;
  context: PlantyMessageContext;
  priority?: number;
  weight?: number;
  target?: string;
  cta?: PlantyGreetingCta;
  triggers?: PlantyMessageTriggers;
}

export interface PlantySignals {
  fireNearby?: boolean;
  heatWave?: boolean;
  frost?: boolean;
  rain?: boolean;
  wind?: boolean;
  healthConcern?: boolean;
  localTrend?: boolean;
  plantCount?: number;
  streakDays?: number;
  xp?: number;
}

export interface PlantyPickOptions {
  taskCount?: number;
  plantCount?: number;
  city?: string;
  zone?: string;
  date?: Date;
  userId?: string;
  signals?: PlantySignals;
}

const ALERT_CONTEXT_PRIORITY: PlantyMessageContext[] = [
  "fire_nearby",
  "cold_frost",
  "heat_wave",
  "rain",
  "wind",
  "weather",
  "plant_health",
  "diagnosis",
  "local_trends",
  "seasonal",
];

export function plantyMoodToVariant(mood: PlantyMood): PlantyVariant {
  switch (mood) {
    case "happy":
      return "happy";
    case "thinking":
    case "weather":
    case "sleepy":
      return "thinking";
    case "diagnosing":
    case "detective":
    case "lawyer":
    case "suspicious":
      return "diagnosing";
    case "celebrating":
      return "celebrating";
    case "warning":
    case "concerned":
    case "shocked":
      return "uhOh";
    case "niceWork":
    case "proud":
      return "niceWork";
    default:
      return "main";
  }
}

export const ALL_PLANTY_MESSAGES: PlantyMessage[] = PLANTY_MESSAGE_BANK as PlantyMessage[];

function matchesTriggers(msg: PlantyMessage, signals: PlantySignals): boolean {
  const t = msg.triggers;
  if (!t) return true;
  const count = signals.plantCount ?? 0;
  if (t.exactPlants != null && count !== t.exactPlants) return false;
  if (t.minPlants != null && count < t.minPlants) return false;
  if (t.maxPlants != null && count > t.maxPlants) return false;
  if (t.fireNearby && !signals.fireNearby) return false;
  if (t.heatWave && !signals.heatWave) return false;
  if (t.frost && !signals.frost) return false;
  if (t.rain && !signals.rain) return false;
  if (t.wind && !signals.wind) return false;
  if (t.healthConcern && !signals.healthConcern) return false;
  if (t.minStreak != null && (signals.streakDays ?? 0) < t.minStreak) return false;
  if (t.minXp != null && (signals.xp ?? 0) < t.minXp) return false;
  return true;
}

function pickFromPool(pool: PlantyMessage[], seed: string): PlantyMessage {
  if (pool.length === 0) {
    return (PLANTY_MESSAGE_BANK[0] as PlantyMessage)!;
  }
  const weighted: PlantyMessage[] = [];
  for (const msg of pool) {
    const w = msg.weight ?? 1;
    for (let i = 0; i < w; i++) weighted.push(msg);
  }
  return weighted[seedIndex(seed, weighted.length)] ?? pool[0]!;
}

function poolForContext(context: PlantyMessageContext): PlantyMessage[] {
  return PLANTY_MESSAGE_BANK.filter((m) => m.context === context) as PlantyMessage[];
}

function signalContexts(signals: PlantySignals): PlantyMessageContext[] {
  const out: PlantyMessageContext[] = [];
  if (signals.fireNearby) out.push("fire_nearby");
  if (signals.frost) out.push("cold_frost");
  if (signals.heatWave) out.push("heat_wave");
  if (signals.rain) out.push("rain");
  if (signals.wind) out.push("wind");
  if (signals.healthConcern) out.push("plant_health");
  if (signals.localTrend) out.push("local_trends");
  return out;
}

function pickContextual(
  contexts: PlantyMessageContext[],
  seed: string,
  signals: PlantySignals
): PlantyMessage | null {
  const ordered = [...new Set(contexts)].sort((a, b) => {
    const ai = ALERT_CONTEXT_PRIORITY.indexOf(a);
    const bi = ALERT_CONTEXT_PRIORITY.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const ctx of ordered) {
    const pool = poolForContext(ctx).filter((m) => matchesTriggers(m, signals));
    if (pool.length > 0) {
      const topPriority = Math.max(...pool.map((m) => m.priority ?? 50));
      const top = pool.filter((m) => (m.priority ?? 50) >= topPriority - 5);
      return pickFromPool(top, `${seed}|${ctx}`);
    }
  }
  return null;
}

export function pickPlantyMessage(
  context: PlantyMessageContext,
  options?: PlantyPickOptions
): PlantyMessage {
  const date = options?.date ?? new Date();
  const city = options?.city ?? "local";
  const zone = options?.zone ?? "10a";
  const signals: PlantySignals = {
    plantCount: options?.plantCount ?? 0,
    ...options?.signals,
  };
  const seed = getPlantySeed(city, zone, date, {
    userId: options?.userId,
    plantCount: options?.plantCount,
  });

  if (context === "today_tasks") {
    const count = options?.taskCount ?? 0;
    if (count === 0) {
      return pickFromPool(
        poolForContext("empty_today").filter((m) => matchesTriggers(m, signals)),
        `${seed}|empty`
      );
    }
    const alert = pickContextual(signalContexts(signals), seed, signals);
    if (alert) return alert;
    return pickFromPool(
      poolForContext("today_tasks").filter((m) => matchesTriggers(m, signals)),
      `${seed}|tasks`
    );
  }

  if (context === "empty_today") {
    return pickFromPool(
      poolForContext("empty_today").filter((m) => matchesTriggers(m, signals)),
      `${seed}|empty`
    );
  }

  if (context === "dashboard_welcome") {
    return pickFromPool(poolForContext("dashboard_welcome"), `${seed}|welcome`);
  }

  if (context === "dashboard_greeting") {
    const alertCtx = signalContexts(signals);
    const contextual = pickContextual(
      [...alertCtx, "general", "dashboard_greeting", "seasonal", "streaks", "xp", "lessons"],
      seed,
      signals
    );
    if (contextual) return contextual;

    const generalPool = [
      ...poolForContext("dashboard_greeting"),
      ...poolForContext("general"),
    ].filter((m) => matchesTriggers(m, signals));

    return pickFromPool(generalPool, `${seed}|dash`);
  }

  const pool = poolForContext(context).filter((m) => matchesTriggers(m, signals));
  return pickFromPool(pool.length ? pool : poolForContext("general"), `${seed}|${context}`);
}

export function validatePlantyMessages(): { ok: boolean; errors: string[]; count: number } {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const msg of ALL_PLANTY_MESSAGES) {
    if (!msg.id) errors.push("Missing id");
    if (ids.has(msg.id)) errors.push(`Duplicate id: ${msg.id}`);
    ids.add(msg.id);
    if (!msg.text.trim()) errors.push(`Empty text: ${msg.id}`);
    if (!msg.mood) errors.push(`Missing mood: ${msg.id}`);
    if (!msg.context) errors.push(`Missing context: ${msg.id}`);
    plantyMoodToVariant(msg.mood);
  }
  if (ALL_PLANTY_MESSAGES.length < 60) {
    errors.push(`Expected 60+ messages, got ${ALL_PLANTY_MESSAGES.length}`);
  }
  return { ok: errors.length === 0, errors, count: ALL_PLANTY_MESSAGES.length };
}

export function buildPlantySignalsFromWeather(
  alerts: Array<{ type: string }>,
  extras?: Partial<PlantySignals>
): PlantySignals {
  return {
    fireNearby: alerts.some((a) => a.type === "fire" || a.type === "smoke"),
    heatWave: alerts.some((a) => a.type === "heat"),
    frost: alerts.some((a) => a.type === "frost"),
    rain: alerts.some((a) => a.type === "rain"),
    wind: alerts.some((a) => a.type === "wind"),
    ...extras,
  };
}
