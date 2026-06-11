/**
 * Search/discussion trend intelligence.
 *
 * Providers, in order:
 *   1. serpapi  — Google Trends via SerpAPI when SERPAPI_KEY is set (real data)
 *   2. internal — community signals when available (real aggregate data)
 *   3. manual   — curated seasonal model (estimated; never shows percents)
 *
 * Rule: estimated signals NEVER carry percentChange. The UI says
 * "gaining interest", not "up 42%", unless real data backs the number.
 */

import { getLocationProfile } from "@/lib/location/location-service";
import type { CommunitySignal, SourceConfidence, TrendSignal } from "./source-types";

/** Terms we track for gardeners. */
export const TRACKED_TREND_TERMS = [
  "lemon tree",
  "avocado tree",
  "bougainvillea",
  "lavender plant",
  "rosemary plant",
  "japanese maple",
  "tomato plant",
  "powdery mildew",
  "yellow leaves",
  "spider mites",
  "overwatering",
  "plant care",
] as const;

export type TrendProvider = "serpapi" | "internal" | "manual";

export function isSerpApiTrendsEnabled(): boolean {
  return Boolean(process.env.SERPAPI_KEY);
}

interface SerpApiTimelinePoint {
  values?: { extracted_value?: number }[];
}

interface SerpApiTrendsResponse {
  interest_over_time?: { timeline_data?: SerpApiTimelinePoint[] };
}

/** Real Google Trends data for one term via SerpAPI. Null on any failure. */
export async function fetchSerpApiTrend(
  term: string,
  geo = "US"
): Promise<TrendSignal | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;

  try {
    const url =
      `https://serpapi.com/search.json?engine=google_trends` +
      `&q=${encodeURIComponent(term)}&geo=${geo}&data_type=TIMESERIES&api_key=${key}`;
    const res = await fetch(url, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SerpApiTrendsResponse;
    const points = data.interest_over_time?.timeline_data ?? [];
    if (points.length < 4) return null;

    const values = points
      .map((p) => p.values?.[0]?.extracted_value)
      .filter((v): v is number => typeof v === "number");
    if (values.length < 4) return null;

    const recent = values.slice(-2);
    const prior = values.slice(0, -2);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length || 1;
    const change = Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
    const direction: TrendSignal["direction"] =
      change > 10 ? "up" : change < -10 ? "down" : "flat";

    return {
      term,
      location: geo,
      percentChange: change,
      direction,
      reason: `Google search interest is ${direction === "up" ? "rising" : direction === "down" ? "cooling" : "steady"}.`,
      confidence: "high",
      source: "serpapi",
      estimated: false,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Turn real community aggregates into trend signals. */
export function trendsFromCommunitySignals(signals: CommunitySignal[]): TrendSignal[] {
  return signals
    .filter((s) => s.count >= 3 && !s.estimated)
    .map((s) => ({
      term: s.plantSpecies ?? s.issue ?? s.signalType.replace(/_/g, " "),
      location: s.city ?? s.zipPrefix ?? undefined,
      direction: "up" as const,
      reason:
        s.signalType === "issue_detected"
          ? "More local growers are running into this."
          : "More local growers are picking this up.",
      confidence: "medium" as SourceConfidence,
      source: "community" as const,
      estimated: false,
      createdAt: new Date().toISOString(),
    }));
}

type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

/**
 * Manual fallback: seasonal model of what gardeners search for.
 * Estimated. Direction only, no percents, no fake users.
 */
function manualSeasonalTrends(zipCode: string, season: Season): TrendSignal[] {
  const profile = getLocationProfile(zipCode);
  const area = profile.city ? `${profile.city}, ${profile.state}` : "your area";
  const warm = /mediterranean|desert|subtropic|tropical/i.test(profile.climateType);

  const bySeason: Record<Season, { term: string; reason: string }[]> = {
    spring: [
      { term: "tomato plant", reason: "Spring planting season drives tomato interest everywhere." },
      { term: "powdery mildew", reason: "Mild damp spring weather kicks off mildew questions." },
      ...(warm
        ? [{ term: "lemon tree", reason: `Citrus planting picks up in ${area} in spring.` }]
        : [{ term: "plant care", reason: "Everyone's plants wake up at once in spring." }]),
    ],
    summer: [
      { term: "spider mites", reason: "Hot dry stretches are spider mite season." },
      { term: "yellow leaves", reason: "Summer watering stress shows up as yellow leaves." },
      ...(warm
        ? [{ term: "bougainvillea", reason: `Bougainvillea is in full color across ${area}.` }]
        : [{ term: "tomato plant", reason: "Peak tomato care and troubleshooting season." }]),
    ],
    fall: [
      { term: "japanese maple", reason: "Fall color puts Japanese maples on every wish list." },
      { term: "overwatering", reason: "Cooling weather means plants need less water than people give." },
      ...(warm
        ? [{ term: "lavender plant", reason: `Fall is prime planting time for lavender in ${area}.` }]
        : [{ term: "plant care", reason: "Houseplant season ramps up as gardens wind down." }]),
    ],
    winter: [
      { term: "overwatering", reason: "Winter overwatering is the top indoor plant killer." },
      { term: "plant care", reason: "Indoor growing peaks while gardens sleep." },
      ...(warm
        ? [{ term: "avocado tree", reason: `Bare-root and citrus planting season approaches in ${area}.` }]
        : [{ term: "yellow leaves", reason: "Low winter light triggers yellow leaf questions." }]),
    ],
  };

  return bySeason[season].map((entry) => ({
    term: entry.term,
    location: area,
    direction: "up" as const,
    reason: entry.reason,
    confidence: "estimated" as const,
    source: "climate-model" as const,
    estimated: true,
    createdAt: new Date().toISOString(),
  }));
}

export interface TrendQueryOptions {
  zipCode: string;
  /** Real community aggregates, when available. */
  communitySignals?: CommunitySignal[];
  limit?: number;
}

/**
 * Best-available trend signals for a location.
 * SerpAPI (rotating subset to control cost) → community → seasonal model.
 */
export async function getTrendSignals(options: TrendQueryOptions): Promise<TrendSignal[]> {
  const { zipCode, communitySignals = [], limit = 4 } = options;
  const signals: TrendSignal[] = [];

  if (isSerpApiTrendsEnabled()) {
    // Rotate two tracked terms per day to keep SerpAPI usage sane.
    const day = Math.floor(Date.now() / 86_400_000);
    const terms = [
      TRACKED_TREND_TERMS[day % TRACKED_TREND_TERMS.length],
      TRACKED_TREND_TERMS[(day + 5) % TRACKED_TREND_TERMS.length],
    ];
    const results = await Promise.all(terms.map((t) => fetchSerpApiTrend(t)));
    for (const r of results) {
      if (r && r.direction !== "flat") signals.push(r);
    }
  }

  signals.push(...trendsFromCommunitySignals(communitySignals));

  if (signals.length < limit) {
    const manual = manualSeasonalTrends(zipCode, currentSeason());
    for (const m of manual) {
      if (signals.length >= limit) break;
      if (!signals.some((s) => s.term === m.term)) signals.push(m);
    }
  }

  return signals.slice(0, limit);
}

/** UI-safe phrasing: estimated signals never show numbers. */
export function describeTrend(signal: TrendSignal): string {
  if (!signal.estimated && typeof signal.percentChange === "number") {
    const pct = Math.abs(signal.percentChange);
    return signal.direction === "up" ? `up ${pct}% in searches` : `down ${pct}% in searches`;
  }
  return signal.direction === "up"
    ? "gaining interest"
    : signal.direction === "down"
      ? "cooling off"
      : "holding steady";
}

export function getTrendProviderStatus(): { provider: TrendProvider; detail: string } {
  if (isSerpApiTrendsEnabled()) {
    return { provider: "serpapi", detail: "SerpAPI Google Trends active (rotating daily terms)" };
  }
  return { provider: "manual", detail: "Seasonal model fallback (estimated, no percents shown)" };
}
