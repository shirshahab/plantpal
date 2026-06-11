/**
 * Local insights engine: combines weather, trends, community aggregates,
 * reference data, and climate logic into dashboard-ready insights.
 *
 * Blend order when data is thin (per product rules):
 *   real weather (NOAA) → real community aggregates → public trend data →
 *   climate/seasonal model (estimated). Never fake users.
 *
 * Server-side only.
 */

import { getLocationProfile } from "@/lib/location/location-service";
import { getWeatherByZip } from "@/lib/integrations/weather";
import type { WeatherInsights } from "@/lib/types/integrations";
import { getCommunityAggregates } from "./community-intelligence";
import { getRedditPulseInsight } from "./reddit-intelligence";
import { getReferenceFact } from "./plant-reference";
import { getTrendSignals, describeTrend } from "./trend-intelligence";
import { getWeatherRisks } from "./weather-intelligence";
import {
  expiresInHours,
  insightId,
  type CommunitySignal,
  type LocalPlantInsight,
  type TrendSignal,
  type WeatherRisk,
} from "./source-types";

export type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

export interface LocalInsightsInput {
  zip: string;
  city?: string;
  state?: string;
  /** Minimal plant info; species drives reference facts. */
  plants?: { name: string; species: string }[];
  /** Pre-fetched data; anything missing is fetched here. */
  weather?: WeatherInsights | null;
  trends?: TrendSignal[];
  communitySignals?: CommunitySignal[];
  season?: Season;
}

export interface LocalInsightsBundle {
  area: string;
  season: Season;
  /** Ordered, dashboard-ready insight cards. */
  insights: LocalPlantInsight[];
  risks: WeatherRisk[];
  trends: TrendSignal[];
  communitySignals: CommunitySignal[];
}

const SEASONAL_TASKS: Record<Season, string> = {
  spring: "Feeding season starts now. Most plants wake up hungry.",
  summer: "Check containers more often. Summer heat dries pots fast.",
  fall: "Ease off watering and fertilizer. Growth is slowing down.",
  winter: "Water roughly half as often. Winter overwatering kills more plants than cold.",
};

function riskToInsight(risk: WeatherRisk, area: string): LocalPlantInsight {
  return {
    id: insightId("wx"),
    type: "weather_risk",
    title: risk.title,
    summary: `${risk.message} ${risk.action}`,
    source: risk.source,
    confidence: risk.confidence,
    estimated: risk.confidence === "estimated",
    location: area,
    createdAt: new Date().toISOString(),
    expiresAt: risk.endsAt ?? expiresInHours(48),
    emoji: { heat: "🔥", frost: "❄️", wind: "💨", rain: "🌧️", humidity: "💧", dry_spell: "🌵" }[risk.kind],
  };
}

function communityToInsight(signal: CommunitySignal, area: string): LocalPlantInsight {
  const subject = signal.plantSpecies ?? signal.issue ?? "plant care";
  const title =
    signal.signalType === "issue_detected"
      ? `${capitalize(subject)} is the most reported issue nearby.`
      : signal.signalType === "plant_added"
        ? `More local gardeners are adding ${subject} this month.`
        : signal.signalType === "plant_scanned"
          ? `${capitalize(subject)} scans are up with local growers.`
          : `Local growers are busy with ${subject}.`;
  return {
    id: insightId("cm"),
    type: "community",
    title,
    summary: `Based on anonymous PlantPal activity near you this week.`,
    source: "community",
    confidence: "medium",
    estimated: false,
    location: area,
    plant: signal.plantSpecies ?? undefined,
    createdAt: new Date().toISOString(),
    expiresAt: signal.periodEnd,
    emoji: signal.signalType === "issue_detected" ? "🩺" : "🌱",
  };
}

function trendToInsight(signal: TrendSignal, area: string): LocalPlantInsight {
  return {
    id: insightId("tr"),
    type: "trend",
    title: `${capitalize(signal.term)} is ${describeTrend(signal)}${signal.location ? ` near ${signal.location}` : ""}.`,
    summary: signal.reason,
    source: signal.source,
    confidence: signal.confidence,
    estimated: signal.estimated,
    location: area,
    createdAt: signal.createdAt,
    expiresAt: expiresInHours(7 * 24),
    emoji: "📈",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The one-stop local intelligence call. Fetches anything not provided,
 * fails soft on every source, and always returns at least seasonal insights.
 */
export async function getLocalInsights(input: LocalInsightsInput): Promise<LocalInsightsBundle> {
  const season = input.season ?? currentSeason();
  const profile = getLocationProfile(input.zip);
  const area =
    input.city && input.state
      ? `${input.city}, ${input.state}`
      : profile.city
        ? `${profile.city}, ${profile.state}`
        : "your area";

  // Fetch missing pieces in parallel; every source fails soft.
  const [communitySignals, weather] = await Promise.all([
    input.communitySignals
      ? Promise.resolve(input.communitySignals)
      : getCommunityAggregates(input.zip).catch(() => [] as CommunitySignal[]),
    input.weather !== undefined
      ? Promise.resolve(input.weather)
      : getWeatherByZip(input.zip).catch(() => null),
  ]);

  const [{ risks }, trends] = await Promise.all([
    getWeatherRisks(input.zip, weather).catch(() => ({ risks: [] as WeatherRisk[], provider: "none" as const })),
    input.trends
      ? Promise.resolve(input.trends)
      : getTrendSignals({ zipCode: input.zip, communitySignals }).catch(() => [] as TrendSignal[]),
  ]);

  const insights: LocalPlantInsight[] = [];

  // 1. Weather risks: most actionable, always first.
  for (const risk of risks.slice(0, 2)) {
    insights.push(riskToInsight(risk, area));
  }

  // 2. Real community aggregates (only above the privacy threshold).
  for (const signal of communitySignals.slice(0, 2)) {
    insights.push(communityToInsight(signal, area));
  }

  // 3. Trend signals (real first, estimated phrased softly).
  for (const trend of trends.slice(0, 2)) {
    insights.push(trendToInsight(trend, area));
  }

  // 4. Community chatter pulse (estimated, weekly rotation).
  const reddit = getRedditPulseInsight(season);
  if (reddit) insights.push({ ...reddit, location: area });

  // 5. Reference fact about one of the user's plants.
  const firstSpecies = input.plants?.find((p) => p.species)?.species;
  const fact = getReferenceFact(firstSpecies);
  if (fact) {
    insights.push({
      id: insightId("fact"),
      type: "plant_fact",
      title: fact.fact,
      summary: `Reference: ${fact.plant} (${fact.scientificName}).`,
      source: fact.source,
      confidence: fact.confidence,
      estimated: false,
      plant: fact.plant,
      createdAt: new Date().toISOString(),
      actionUrl: fact.sourceUrl,
      emoji: "🌿",
    });
  }

  // 6. Seasonal task: always available, keeps the section alive on day one.
  insights.push({
    id: insightId("season"),
    type: "seasonal",
    title: SEASONAL_TASKS[season],
    summary: `${capitalize(season)} guidance for ${area} (${profile.climateType} climate, zone ${profile.usdaZone}).`,
    source: "climate-model",
    confidence: "estimated",
    estimated: true,
    location: area,
    createdAt: new Date().toISOString(),
    expiresAt: expiresInHours(7 * 24),
    emoji: "🗓️",
  });

  return { area, season, insights, risks, trends, communitySignals };
}
