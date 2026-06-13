import {
  pickPlantyMessage,
  type PlantyPickOptions,
  type PlantyMessage,
} from "./planty-messages-system";

export type PlantyGreetingCta = "today_task" | "scan" | "growth_photo" | "lesson";

export interface PlantyGreeting extends PlantyMessage {
  cta?: PlantyGreetingCta;
}

function deriveCta(msg: PlantyMessage): PlantyGreetingCta | undefined {
  if (msg.cta) return msg.cta;
  if (msg.target === "/today") return "today_task";
  if (msg.target === "/scanner") return "scan";
  if (msg.target?.startsWith("/scanner?tab=progress")) return "growth_photo";
  if (msg.target === "/academy") return "lesson";
  return undefined;
}

/** Daily greeting: text, mood, and CTA from the same message object. */
export function pickPlantyGreeting(options?: PlantyPickOptions): PlantyGreeting {
  const msg = pickPlantyMessage("dashboard_greeting", options);
  return { ...msg, cta: deriveCta(msg) };
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
