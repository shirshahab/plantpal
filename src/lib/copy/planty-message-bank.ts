/** Planty message bank — imported by planty-messages-system (no circular imports). */

type BankMessage = {
  id: string;
  text: string;
  mood: string;
  context: string;
  priority?: number;
  weight?: number;
  target?: string;
  cta?: string;
  triggers?: Record<string, number | boolean | undefined>;
};

function m(
  id: string,
  text: string,
  mood: string,
  context: string,
  extra?: Partial<Omit<BankMessage, "id" | "text" | "mood" | "context">>
): BankMessage {
  return { id, text, mood, context, priority: 50, ...extra };
}

/** Structured Planty content bank (60+ lines). */
export const PLANTY_MESSAGE_BANK: BankMessage[] = [
  m("gen-01", "Your garden called. It wants five minutes.", "happy", "general", { target: "/today", priority: 40 }),
  m("gen-02", "I ran the numbers. The plants still need you.", "thinking", "general", { target: "/today" }),
  m("gen-03", "One plant still counts. The court recognizes it.", "lawyer", "general", { triggers: { exactPlants: 1 } }),
  m("gen-04", "Good morning to everyone except underwatered roots.", "happy", "general"),
  m("gen-05", "Planty clocked in. Let's keep something alive.", "happy", "general", { target: "/today", weight: 2 }),
  m("gen-06", "Your plants are dramatic. We brought notes.", "diagnosing", "general", { target: "/today" }),
  m("gen-07", "Water first. Panic later.", "thinking", "general", { target: "/today" }),
  m("gen-08", "Today's goal: fewer crispy leaves.", "happy", "general", { target: "/today" }),
  m("gen-09", "Your plants can't text for help. That's why we're here.", "thinking", "general"),
  m("gen-10", "Check the soil. Save the drama.", "diagnosing", "general", { target: "/scanner" }),
  m("one-01", "One plant. One responsibility. No pressure.", "happy", "general", { triggers: { exactPlants: 1 } }),
  m("one-02", "Your entire garden fits in one pot. Efficient.", "proud", "general", { triggers: { exactPlants: 1 } }),
  m("one-03", "Solo plant on the docket. Full legal attention.", "lawyer", "general", { triggers: { exactPlants: 1 }, target: "/plants" }),
  m("many-01", "At this point, you are legally a greenhouse.", "celebrating", "general", { triggers: { minPlants: 6 } }),
  m("many-02", "Your plants are forming a committee.", "suspicious", "general", { triggers: { minPlants: 4 } }),
  m("many-03", "That's a lot of photosynthesis. Respect.", "proud", "general", { triggers: { minPlants: 8 } }),
  m("dash-01", "Good news. Your garden still has a chance.", "happy", "dashboard_greeting"),
  m("dash-02", "Some heroes wear capes. You checked the soil.", "niceWork", "dashboard_greeting", { target: "/today" }),
  m("dash-03", "If the leaves look sad, they probably are.", "concerned", "dashboard_greeting", { target: "/doctor" }),
  m("dash-04", "Leaves don't lie. Neither do we.", "diagnosing", "dashboard_greeting", { target: "/today" }),
  m("dash-05", "Snap a growth pic. Future you will flex.", "niceWork", "dashboard_greeting", { target: "/scanner?tab=progress", cta: "growth_photo" }),
  m("dash-06", "Today's lesson beats guessing. Trust Planty.", "thinking", "dashboard_greeting", { target: "/academy", cta: "lesson" }),
  m("wel-01", "Add your first plant. I promise not to judge.", "happy", "dashboard_welcome", { target: "/plants/new" }),
  m("wel-02", "Stop killing your plants.", "warning", "dashboard_welcome", { target: "/plants/new" }),
  m("wel-03", "Good news. Your plants still have a chance.", "happy", "dashboard_welcome", { target: "/plants/new" }),
  m("wel-04", "Planty clocked in. Let's keep something alive.", "happy", "dashboard_welcome", { target: "/plants/new" }),
  m("task-01", "Planty reviewed the evidence. Here's what matters.", "diagnosing", "today_tasks", { target: "/today" }),
  m("task-02", "Your garden called. It wants five minutes.", "happy", "today_tasks", { target: "/today" }),
  m("task-03", "One small task for you. One giant win for your basil.", "happy", "today_tasks", { target: "/today" }),
  m("task-04", "The docket is light but important. Handle it.", "lawyer", "today_tasks", { target: "/today" }),
  m("task-05", "Three tasks max. Your sanity thanks you.", "thinking", "today_tasks", { target: "/today" }),
  m("empty-01", "Your plants have not filed any new complaints.", "celebrating", "empty_today", { target: "/calendar" }),
  m("empty-02", "Your plants are mostly behaving.", "celebrating", "empty_today", { target: "/calendar" }),
  m("empty-03", "No drama. Just the important stuff.", "happy", "empty_today", { target: "/calendar" }),
  m("empty-04", "Nothing urgent. Suspiciously peaceful.", "suspicious", "empty_today", { target: "/calendar" }),
  m("empty-05", "Calendar's quiet. Enjoy the ceasefire.", "sleepy", "empty_today", { target: "/calendar" }),
  m("water-01", "Quick question. When was the last time this plant saw water?", "thinking", "watering", { target: "/today" }),
  m("water-02", "Plants drink. They do not enjoy drowning.", "warning", "watering"),
  m("water-03", "Hydration has entered the chat.", "happy", "watering", { target: "/today" }),
  m("water-04", "Dry soil is a confession. Water accordingly.", "detective", "watering"),
  m("fert-01", "Tiny plant buffet time.", "happy", "fertilizer", { target: "/today" }),
  m("fert-02", "Feed the plant before it starts eating your confidence.", "thinking", "fertilizer"),
  m("fert-03", "Nutrients now. Drama later.", "lawyer", "fertilizer"),
  m("week-01", "Routine inspection. Nothing personal.", "detective", "weekly_check", { target: "/today" }),
  m("week-02", "Planty Investigations is on the case.", "detective", "weekly_check"),
  m("week-03", "Leaf court is now in session.", "lawyer", "weekly_check", { target: "/today" }),
  m("health-01", "This leaf has concerns.", "concerned", "plant_health", { target: "/doctor", priority: 70 }),
  m("health-02", "The plant would like to enter this yellow leaf into evidence.", "lawyer", "plant_health", { target: "/doctor" }),
  m("health-03", "Good news. It is not dead yet.", "happy", "plant_health", { target: "/doctor" }),
  m("health-04", "Something looks off. Worth a closer look.", "diagnosing", "plant_health", { target: "/scanner" }),
  m("diag-01", "Exhibit A: that leaf. Exhibit B: your watering can.", "lawyer", "diagnosis", { target: "/doctor" }),
  m("diag-02", "I've seen worse. Not much worse.", "thinking", "diagnosis", { target: "/doctor" }),
  m("diag-03", "Case file open. Let's find the culprit.", "detective", "diagnosis", { target: "/doctor" }),
  m("wx-01", "Today's weather is sponsored by dehydration.", "weather", "weather", { priority: 65 }),
  m("wx-02", "The sky may be handling watering duties.", "weather", "weather"),
  m("wx-03", "The weather has chosen violence.", "shocked", "weather", { priority: 70 }),
  m("wx-04", "Check the forecast before you check the soil.", "thinking", "weather", { target: "/seasonal" }),
  m("fire-01", "Plants generally prefer not being near fire.", "warning", "fire_nearby", { priority: 95, triggers: { fireNearby: true } }),
  m("fire-02", "Smoke is bad for lungs. Also leaves.", "concerned", "fire_nearby", { priority: 95, triggers: { fireNearby: true } }),
  m("fire-03", "If fire is nearby, move potted plants away from heat and ash if safe.", "warning", "fire_nearby", { priority: 98, triggers: { fireNearby: true }, target: "/seasonal" }),
  m("heat-01", "It's hot. Your plants did not sign up for a sauna.", "shocked", "heat_wave", { priority: 90, triggers: { heatWave: true } }),
  m("heat-02", "Deep water before the heat hits. Trust me.", "weather", "heat_wave", { priority: 88, triggers: { heatWave: true }, target: "/today" }),
  m("heat-03", "Shade cloth exists for a reason.", "thinking", "heat_wave", { triggers: { heatWave: true } }),
  m("rain-01", "Rain incoming. Maybe skip the hose today.", "happy", "rain", { priority: 75, triggers: { rain: true } }),
  m("rain-02", "Free water from the sky. Accept the gift.", "celebrating", "rain", { triggers: { rain: true } }),
  m("wind-01", "Wind advisory. Stake the wobbly ones.", "warning", "wind", { priority: 80, triggers: { wind: true } }),
  m("wind-02", "Tall plants hate gusty days. You know who you are.", "concerned", "wind", { triggers: { wind: true } }),
  m("cold-01", "Your plants are filing a complaint regarding the temperature.", "shocked", "cold_frost", { priority: 92, triggers: { frost: true } }),
  m("cold-02", "Frost tonight. Your citrus would like a blanket.", "warning", "cold_frost", { priority: 94, triggers: { frost: true }, target: "/seasonal" }),
  m("cold-03", "Cover tender pots before bedtime. Court orders it.", "lawyer", "cold_frost", { triggers: { frost: true } }),
  m("str-01", "Streak alive. The plants noticed.", "celebrating", "streaks", { triggers: { minStreak: 3 } }),
  m("str-02", "Don't break the streak. Your fiddle leaf is watching.", "suspicious", "streaks", { triggers: { minStreak: 7 }, target: "/today" }),
  m("str-03", "Consistency beats perfection. Keep showing up.", "proud", "streaks", { triggers: { minStreak: 1 } }),
  m("xp-01", "XP stacking up. You're leveling up as a grower.", "proud", "xp", { triggers: { minXp: 100 } }),
  m("xp-02", "Every task earns XP. Even the boring ones.", "happy", "xp", { target: "/academy" }),
  m("les-01", "Five minutes of learning beats five hours of guessing.", "thinking", "lessons", { target: "/academy", cta: "lesson" }),
  m("les-02", "Today's lesson is waiting. No pop quiz. Yet.", "happy", "lessons", { target: "/academy" }),
  m("com-01", "Other growers are out there. Probably overwatering too.", "happy", "community", { target: "/community" }),
  m("com-02", "Share a win. Make someone else's day greener.", "niceWork", "community", { target: "/feed" }),
  m("loc-01", "Pasadena growers are talking about crispy leaves again.", "detective", "local_trends", { priority: 60 }),
  m("loc-02", "Spider mites remain deeply unpopular.", "suspicious", "local_trends", { priority: 55 }),
  m("loc-03", "Local growers are fussing about watering schedules.", "thinking", "local_trends"),
  m("sea-01", "Seasons change. So should your watering.", "weather", "seasonal", { target: "/seasonal" }),
  m("sea-02", "Spring energy is real. So is spring pest season.", "concerned", "seasonal", { target: "/seasonal" }),
  m("sea-03", "Fall means less water for most pots. Adjust accordingly.", "thinking", "seasonal"),
];
