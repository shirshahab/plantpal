export type PlantyGreetingCta =
  | "today_task"
  | "scan"
  | "growth_photo"
  | "lesson";

export interface PlantyGreeting {
  text: string;
  cta?: PlantyGreetingCta;
}

export const PLANTY_GREETINGS: PlantyGreeting[] = [
  { text: "Planty clocked in. Let's keep something alive.", cta: "today_task" },
  { text: "Your plants are dramatic. We brought notes.", cta: "today_task" },
  { text: "Good news. Your garden still has a chance." },
  { text: "Water first. Panic later.", cta: "today_task" },
  { text: "Today's goal: fewer crispy leaves.", cta: "today_task" },
  { text: "Your plants can't text for help. That's why we're here." },
  { text: "One small task for you. One giant win for your basil.", cta: "today_task" },
  { text: "Plant murder rate: hopefully zero." },
  { text: "Your garden command center is online." },
  { text: "The tomatoes are watching." },
  { text: "Compost is not the goal." },
  { text: "Nice. You opened the app before the plant died." },
  { text: "Your plants like consistency. Annoying, but true.", cta: "today_task" },
  { text: "Check the soil. Save the drama.", cta: "scan" },
  { text: "Growth is happening. Slowly. Plants are not impressed by hustle culture." },
  { text: "Your plant has needs. Unfortunately, you are the adult here.", cta: "today_task" },
  { text: "Let's make the neighbors jealous." },
  { text: "Tiny leaves. Big expectations." },
  { text: "Planty believes in second chances." },
  { text: "Some heroes wear capes. You checked the soil.", cta: "today_task" },
  { text: "Morning sun. Afternoon shade. Same drama, new day." },
  { text: "If the leaves look sad, they probably are.", cta: "scan" },
  { text: "Your basil is not being passive aggressive. Probably." },
  { text: "Thumb status: green enough for government work." },
  { text: "Today's vibe: hydrated and slightly smug.", cta: "growth_photo" },
  { text: "We see you showing up for the ficus again." },
  { text: "No wilting on Planty's watch. Well, we'll try.", cta: "today_task" },
  { text: "The pothos is thriving. The rest is a group project." },
  { text: "Sunlight is free. Overwatering is expensive." },
  { text: "Your garden called. It wants five minutes.", cta: "today_task" },
  { text: "Planty ran the numbers. You can do one task.", cta: "today_task" },
  { text: "Leaves don't lie. Neither do we.", cta: "scan" },
  { text: "Fresh app open. Fresh chance to not kill the mint." },
  { text: "Roots down. Vibes up. Maybe." },
  { text: "Every expert gardener killed a plant once. Or twelve." },
  { text: "Snap a growth pic. Future you will flex.", cta: "growth_photo" },
  { text: "Today's lesson beats guessing. Trust Planty.", cta: "lesson" },
  { text: "The spider plant is judging your calendar. Fair.", cta: "today_task" },
  { text: "Yellow leaf? Could be drama. Could be science.", cta: "lesson" },
  { text: "You + one task = garden that looks intentional.", cta: "today_task" },
  { text: "Planty is optimistic. Your succulent is not." },
  { text: "Water, wait, observe. Repeat until harvest.", cta: "today_task" },
  { text: "Big leaves. Small ego. Good combo." },
  { text: "Your neighbors' lawn is not your problem. Your pots are.", cta: "today_task" },
  { text: "Scan first. Panic never.", cta: "scan" },
  { text: "Planty likes your commitment. The fern is still thinking about it." },
];

const LAST_KEY = "plantpal-planty-greeting-last";
const INDEX_KEY = "plantpal-planty-greeting-index";

function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
}

/** Pick a greeting that rotates daily and never repeats twice in a row. */
export function pickPlantyGreeting(): PlantyGreeting {
  if (typeof window === "undefined") return PLANTY_GREETINGS[0]!;

  try {
    const lastIdx = Number(sessionStorage.getItem(LAST_KEY) ?? "-1");
    const storedDay = sessionStorage.getItem(INDEX_KEY);
    const seed = daySeed();
    let idx = storedDay === String(seed)
      ? Number(sessionStorage.getItem(LAST_KEY) ?? "0")
      : (seed + performance.now()) % PLANTY_GREETINGS.length;

    idx = Math.floor(Math.abs(idx)) % PLANTY_GREETINGS.length;
    if (idx === lastIdx && PLANTY_GREETINGS.length > 1) {
      idx = (idx + 1) % PLANTY_GREETINGS.length;
    }

    sessionStorage.setItem(LAST_KEY, String(idx));
    sessionStorage.setItem(INDEX_KEY, String(seed));
    return PLANTY_GREETINGS[idx]!;
  } catch {
    return PLANTY_GREETINGS[Math.floor(Math.random() * PLANTY_GREETINGS.length)]!;
  }
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
