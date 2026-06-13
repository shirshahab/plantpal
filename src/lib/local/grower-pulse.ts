/**
 * Local Grower Pulse — daily lines that feel alive without fake stats.
 */
import { lookupZipRecord } from "@/lib/location/usda-zones";
import { getDailySeed, seedIndex } from "@/lib/local/daily-seed";

export interface GrowerPulseLine {
  id: string;
  text: string;
  emoji: string;
}

export interface GrowerPulseResult {
  area: string;
  lines: GrowerPulseLine[];
  footer: string;
  usedRealData: boolean;
}

type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

const PULSE_POOL: Record<Season, string[]> = {
  spring: [
    "Feeding season is starting. Go easy at first.",
    "People are asking about yellow leaves again.",
    "New growth is showing up. So are aphids.",
    "Spring planting is in full swing near {area}.",
  ],
  summer: [
    "Dry stretch ahead. Pots may get crispy.",
    "Heat stress is the main villain this week.",
    "Container plants need extra attention this week.",
    "Spider mites love stressed plants. Rude, but true.",
    "Water deep and early. Midday sips do nothing.",
  ],
  fall: [
    "Cool nights mean less water. Do not panic-feed.",
    "Fall planting window is open for trees and shrubs.",
    "Powdery mildew questions are picking up.",
    "Citrus is having a {area} moment.",
  ],
  winter: [
    "Most plants are resting. Your watering can should too.",
    "Winter overwatering is still the top indoor killer.",
    "Yellow leaves often mean low light, not hunger.",
    "Hold off on fertilizer until spring wakes up.",
  ],
};

const HOT_LINES = [
  "Heat wave mode. Check pots before leaves crisp.",
  "Dry stretch ahead. Pots may get crispy.",
];

const FROST_LINES = [
  "Frost risk nearby. Cover tender plants tonight.",
  "Cold snap coming. Move pots in if you can.",
];

const RAIN_LINES = [
  "Rain on the way. Skip watering unless pots are dry.",
];

function mentionLine(topic: string): string {
  const key = topic.toLowerCase();
  if (key.includes("yellow")) return "People are asking about yellow leaves again.";
  if (key.includes("pest") || key.includes("mite")) return "Pest questions are trending in local chatter.";
  if (key.includes("water")) return "The internet is currently overwatering things.";
  if (key.includes("heat")) return "Heat stress is the main villain this week.";
  if (key.includes("citrus") || key.includes("lemon")) return "Citrus is having a local moment.";
  return `Growers are talking about ${topic} this week.`;
}

export interface GrowerPulseInput {
  zipCode: string;
  date?: Date;
  /** From /api/intelligence/insights */
  apiTitles?: string[];
  /** From F5Bot mention topics (with counts when available) */
  f5Topics?: { topic: string; count: number }[] | string[];
  /** Top problem types from stored mentions */
  topProblems?: string[];
  /** When true, footer cites plant chatter */
  hasIntelligenceData?: boolean;
  weatherHot?: boolean;
  weatherDry?: boolean;
  weatherFrost?: boolean;
  weatherRain?: boolean;
}

function problemLine(problem: string): string {
  const key = problem.toLowerCase();
  if (key.includes("overwater")) return "Overwatering questions are spiking in local chatter.";
  if (key.includes("underwater")) return "Underwatering is showing up in plant forums again.";
  if (key.includes("pest")) return "Pest questions are trending in local chatter.";
  if (key.includes("disease") || key.includes("mildew")) return "Fungal issues are on growers' minds this week.";
  if (key.includes("nutrient") || key.includes("yellow")) return "People are asking about yellow leaves again.";
  if (key.includes("weather") || key.includes("heat")) return "Heat stress is the main villain this week.";
  return `Growers are talking about ${problem} this week.`;
}

function normalizeTopicCounts(
  topics?: GrowerPulseInput["f5Topics"]
): { topic: string; count: number }[] {
  if (!topics?.length) return [];
  if (typeof topics[0] === "string") {
    return (topics as string[]).map((topic) => ({ topic, count: 1 }));
  }
  return topics as { topic: string; count: number }[];
}

export function buildGrowerPulse(input: GrowerPulseInput): GrowerPulseResult {
  const zip = input.zipCode?.trim().slice(0, 5) ?? "";
  const record = lookupZipRecord(zip);
  const area = record.city || "your area";
  const seed = getDailySeed(area, record.usdaZone, input.date);
  const season = currentSeason(input.date);

  const lines: GrowerPulseLine[] = [];
  let usedRealData = Boolean(input.hasIntelligenceData);

  if (input.weatherFrost) {
    lines.push({ id: "wx-frost", emoji: "❄️", text: FROST_LINES[seedIndex(`${seed}|frost`, FROST_LINES.length)]! });
    usedRealData = true;
  } else if (input.weatherHot || input.weatherDry) {
    lines.push({ id: "wx-heat", emoji: "🔥", text: HOT_LINES[seedIndex(`${seed}|heat`, HOT_LINES.length)]! });
    usedRealData = true;
  } else if (input.weatherRain) {
    lines.push({ id: "wx-rain", emoji: "🌧️", text: RAIN_LINES[0]! });
    usedRealData = true;
  }

  const topicCounts = normalizeTopicCounts(input.f5Topics);
  if (topicCounts.length) {
    const top = [...topicCounts].sort((a, b) => b.count - a.count)[0];
    if (top) {
      lines.push({ id: "f5-topic", emoji: "🌱", text: mentionLine(top.topic) });
      usedRealData = true;
    }
  }

  if (input.topProblems?.length) {
    const problem = input.topProblems[0];
    if (problem) {
      const text = problemLine(problem);
      if (!lines.some((l) => l.text === text)) {
        lines.push({ id: "f5-problem", emoji: "🔍", text });
        usedRealData = true;
      }
    }
  }

  if (input.apiTitles?.length) {
    for (const title of input.apiTitles.slice(0, 2)) {
      if (lines.length >= 5) break;
      if (!lines.some((l) => l.text === title)) {
        lines.push({ id: `api-${lines.length}`, emoji: "📍", text: title });
        usedRealData = true;
      }
    }
  }

  const pool = PULSE_POOL[season].map((t) => t.replaceAll("{area}", area));
  let poolIdx = seedIndex(`${seed}|pool`, pool.length);
  while (lines.length < 3 && pool.length > 0) {
    const text = pool[poolIdx % pool.length]!;
    if (!lines.some((l) => l.text === text)) {
      lines.push({ id: `season-${lines.length}`, emoji: "🗓️", text });
    }
    poolIdx++;
    if (poolIdx > pool.length * 2) break;
  }

  const hasChatter = usedRealData || Boolean(input.hasIntelligenceData);
  const footer = hasChatter
    ? "Based on weather, season, and plant chatter."
    : `Based on season and ${area} growing conditions.`;

  return {
    area,
    lines: lines.slice(0, 5),
    footer,
    usedRealData,
  };
}

export function getLocalAreaName(zipCode: string): string {
  const zip = zipCode?.trim().slice(0, 5);
  if (!zip) return "your area";
  return lookupZipRecord(zip).city || "your area";
}

/** @deprecated Honest fallback lines without fake user counts. */
export function getLocalGrowerInsights(zipCode: string): { emoji: string; text: string }[] {
  const pulse = buildGrowerPulse({ zipCode });
  return pulse.lines.map((l) => ({ emoji: l.emoji, text: l.text }));
}
