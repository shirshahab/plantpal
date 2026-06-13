import {
  pickPlantyMessage,
  type PlantyMessage,
  type PlantyMood,
} from "@/lib/copy/planty-messages-system";
import { getDailySeed, seedIndex } from "@/lib/local/daily-seed";

export type PlantyGreetingCta = "today_task" | "scan" | "growth_photo" | "lesson";

export interface PlantyGreeting extends PlantyMessage {
  cta?: PlantyGreetingCta;
}

/** Legacy flat list — moods assigned from CTA/context. */
const LEGACY_GREETINGS: Omit<PlantyGreeting, "mood" | "context">[] = [
  { text: "Planty clocked in. Let's keep something alive.", cta: "today_task", target: "/today" },
  { text: "Your plants are dramatic. We brought notes.", cta: "today_task", target: "/today" },
  { text: "Good news. Your garden still has a chance." },
  { text: "Water first. Panic later.", cta: "today_task", target: "/today" },
  { text: "Today's goal: fewer crispy leaves.", cta: "today_task", target: "/today" },
  { text: "Your plants can't text for help. That's why we're here." },
  { text: "One small task for you. One giant win for your basil.", cta: "today_task", target: "/today" },
  { text: "Your garden called. It wants five minutes.", cta: "today_task", target: "/today" },
  { text: "Check the soil. Save the drama.", cta: "scan", target: "/scanner" },
  { text: "Today's lesson beats guessing. Trust Planty.", cta: "lesson", target: "/academy" },
  { text: "Snap a growth pic. Future you will flex.", cta: "growth_photo", target: "/scanner?tab=progress" },
];

function moodForCta(cta?: PlantyGreetingCta, text?: string): PlantyMood {
  if (text?.includes("evidence")) return "diagnosing";
  if (cta === "scan") return "diagnosing";
  if (cta === "growth_photo") return "niceWork";
  if (cta === "lesson") return "thinking";
  if (cta === "today_task") return "happy";
  return "happy";
}

const PLANTY_GREETINGS: PlantyGreeting[] = LEGACY_GREETINGS.map((g) => ({
  ...g,
  mood: moodForCta(g.cta, g.text),
  context: "dashboard_greeting" as const,
}));

export { PLANTY_GREETINGS };

/** Daily greeting with matched mood (never random emote vs caption). */
export function pickPlantyGreeting(city = "local", zone = "10a"): PlantyGreeting {
  const seed = getDailySeed(city, zone);
  const fromSystem = pickPlantyMessage("dashboard_greeting", { city, zone });
  const idx = seedIndex(`${seed}|greet`, PLANTY_GREETINGS.length);
  const legacy = PLANTY_GREETINGS[idx]!;
  const merged: PlantyGreeting = {
    ...fromSystem,
    cta: legacy.cta ?? (fromSystem.target === "/today" ? "today_task" : undefined),
  };
  return merged;
}

export function ctaForGreeting(cta?: PlantyGreetingCta): { label: string; href: string } | null {
  switch (cta) {
    case "today_task":
      return { label: "Start today's task", href: "/today" };
    case "scan":
      return { label: "Scan a plant", href: "/scanner" };
    case "growth_photo":
      return { label: "Add growth photo", href: "/scanner?tab=progress" };
    case "lesson":
      return { label: "Take today's lesson", href: "/academy" };
    default:
      return null;
  }
}
