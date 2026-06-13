import type { PlantyVariant } from "@/components/brand/planty";
import { getDailySeed, seedIndex } from "@/lib/local/daily-seed";

export type PlantyMood =
  | "happy"
  | "thinking"
  | "diagnosing"
  | "celebrating"
  | "warning"
  | "concerned"
  | "niceWork";

export type PlantyMessageContext =
  | "dashboard_greeting"
  | "dashboard_welcome"
  | "today_tasks"
  | "empty_today"
  | "plant_health"
  | "general";

export interface PlantyMessage {
  text: string;
  mood: PlantyMood;
  context: PlantyMessageContext;
  weight?: number;
  target?: string;
}

export function plantyMoodToVariant(mood: PlantyMood): PlantyVariant {
  switch (mood) {
    case "happy":
      return "happy";
    case "thinking":
      return "thinking";
    case "diagnosing":
      return "diagnosing";
    case "celebrating":
      return "celebrating";
    case "warning":
    case "concerned":
      return "uhOh";
    case "niceWork":
      return "niceWork";
    default:
      return "main";
  }
}

const TODAY_WITH_TASKS: PlantyMessage[] = [
  {
    text: "Planty reviewed the evidence. Here's what matters.",
    mood: "diagnosing",
    context: "today_tasks",
    target: "/today",
  },
  {
    text: "Your garden called. It wants five minutes.",
    mood: "happy",
    context: "today_tasks",
    target: "/today",
  },
  {
    text: "One small task for you. One giant win for your basil.",
    mood: "happy",
    context: "today_tasks",
    target: "/today",
  },
];

const TODAY_EMPTY: PlantyMessage[] = [
  {
    text: "Your plants have not filed any new complaints.",
    mood: "celebrating",
    context: "empty_today",
    target: "/calendar",
  },
  {
    text: "Your plants are mostly behaving.",
    mood: "celebrating",
    context: "empty_today",
    target: "/calendar",
  },
  {
    text: "No drama. Just the important stuff.",
    mood: "happy",
    context: "empty_today",
    target: "/calendar",
  },
];

const DASHBOARD_GREETINGS: PlantyMessage[] = [
  { text: "Planty clocked in. Let's keep something alive.", mood: "happy", context: "dashboard_greeting", target: "/today", weight: 2 },
  { text: "Your plants are dramatic. We brought notes.", mood: "diagnosing", context: "dashboard_greeting", target: "/today" },
  { text: "Good news. Your garden still has a chance.", mood: "happy", context: "dashboard_greeting" },
  { text: "Water first. Panic later.", mood: "thinking", context: "dashboard_greeting", target: "/today" },
  { text: "Today's goal: fewer crispy leaves.", mood: "happy", context: "dashboard_greeting", target: "/today" },
  { text: "Your plants can't text for help. That's why we're here.", mood: "thinking", context: "dashboard_greeting" },
  { text: "Check the soil. Save the drama.", mood: "diagnosing", context: "dashboard_greeting", target: "/scanner" },
  { text: "Planty believes in second chances.", mood: "happy", context: "dashboard_greeting" },
  { text: "Some heroes wear capes. You checked the soil.", mood: "niceWork", context: "dashboard_greeting", target: "/today" },
  { text: "If the leaves look sad, they probably are.", mood: "concerned", context: "dashboard_greeting", target: "/doctor" },
  { text: "This basil has concerns.", mood: "thinking", context: "plant_health", target: "/dashboard" },
  { text: "Leaves don't lie. Neither do we.", mood: "diagnosing", context: "dashboard_greeting", target: "/today" },
  { text: "Today's lesson beats guessing. Trust Planty.", mood: "thinking", context: "dashboard_greeting", target: "/academy" },
  { text: "Snap a growth pic. Future you will flex.", mood: "niceWork", context: "dashboard_greeting", target: "/scanner?tab=progress" },
];

const WELCOME_MESSAGES: PlantyMessage[] = [
  { text: "Add your first plant. I promise not to judge.", mood: "happy", context: "dashboard_welcome", target: "/plants/new" },
  { text: "Stop killing your plants.", mood: "warning", context: "dashboard_welcome", target: "/plants/new" },
  { text: "Good news. Your plants still have a chance.", mood: "happy", context: "dashboard_welcome", target: "/plants/new" },
  { text: "Planty clocked in. Let's keep something alive.", mood: "happy", context: "dashboard_welcome", target: "/plants/new" },
];

export const ALL_PLANTY_MESSAGES: PlantyMessage[] = [
  ...TODAY_WITH_TASKS,
  ...TODAY_EMPTY,
  ...DASHBOARD_GREETINGS,
  ...WELCOME_MESSAGES,
];

function pickFromPool(pool: PlantyMessage[], seed: string): PlantyMessage {
  const weighted: PlantyMessage[] = [];
  for (const msg of pool) {
    const w = msg.weight ?? 1;
    for (let i = 0; i < w; i++) weighted.push(msg);
  }
  return weighted[seedIndex(seed, weighted.length)] ?? pool[0]!;
}

export function pickPlantyMessage(
  context: PlantyMessageContext,
  options?: { taskCount?: number; city?: string; zone?: string; date?: Date }
): PlantyMessage {
  const date = options?.date ?? new Date();
  const seed = getDailySeed(options?.city ?? "local", options?.zone ?? "10a", date);

  if (context === "today_tasks") {
    const count = options?.taskCount ?? 0;
    if (count === 0) {
      return pickFromPool(TODAY_EMPTY, `${seed}|empty`);
    }
    return pickFromPool(TODAY_WITH_TASKS, `${seed}|tasks`);
  }

  if (context === "empty_today") {
    return pickFromPool(TODAY_EMPTY, `${seed}|empty`);
  }

  if (context === "dashboard_welcome") {
    return pickFromPool(WELCOME_MESSAGES, `${seed}|welcome`);
  }

  const pool = DASHBOARD_GREETINGS.filter((m) => m.context === context || context === "dashboard_greeting");
  return pickFromPool(pool.length ? pool : DASHBOARD_GREETINGS, `${seed}|dash`);
}

export function validatePlantyMessages(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const msg of ALL_PLANTY_MESSAGES) {
    if (!msg.text.trim()) errors.push("Empty Planty message text");
    if (!msg.mood) errors.push(`Missing mood: ${msg.text.slice(0, 40)}`);
    if (!msg.context) errors.push(`Missing context: ${msg.text.slice(0, 40)}`);
    plantyMoodToVariant(msg.mood);
  }
  return { ok: errors.length === 0, errors };
}
