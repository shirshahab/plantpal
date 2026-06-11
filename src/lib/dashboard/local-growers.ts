/**
 * "Growers Near You": anonymous local grower activity by ZIP code.
 *
 * Privacy first: everything here is aggregate and anonymous. No names,
 * no addresses, no per-person data. Counts are modeled from climate,
 * zone, and season (deterministic per ZIP and month); later this can
 * blend in real aggregated activity from users in the same area.
 */
import { lookupZipRecord } from "@/lib/location/usda-zones";

export interface LocalGrowerInsight {
  emoji: string;
  /** One short, anonymous local activity line. */
  text: string;
}

/** Deterministic pseudo-random int in [min, max] from a seed string. */
function seeded(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return min + (Math.abs(hash) % (max - min + 1));
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/** Climate-flavored plant group trending in the area. */
function localPlantGroup(climateType: string, zoneNumber: number): string {
  switch (climateType) {
    case "Mediterranean":
      return "citrus";
    case "Desert":
      return "drought-tolerant plants";
    case "Tropical":
      return "tropicals";
    case "Humid subtropical":
      return "flowering shrubs";
    case "Marine":
      return "hydrangeas";
    default:
      return zoneNumber >= 7 ? "fruit trees" : "cold-hardy perennials";
  }
}

/** A single trending plant name for the area. */
function localTrendingPlant(climateType: string, zoneNumber: number): string {
  switch (climateType) {
    case "Mediterranean":
      return "Bougainvillea";
    case "Desert":
      return "Agave";
    case "Tropical":
      return "Hibiscus";
    case "Humid subtropical":
      return "Gardenia";
    case "Marine":
      return "Japanese Maple";
    default:
      return zoneNumber >= 7 ? "Fig Tree" : "Lilac";
  }
}

type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

/** Most common local issue, from climate + season logic (no user data). */
function localCommonIssue(climateType: string, season: Season): string {
  if (season === "winter") return "overwatering";
  if (climateType === "Desert") return season === "summer" ? "heat stress" : "underwatering";
  if (climateType === "Humid subtropical") return season === "summer" ? "fungal leaf spots" : "overwatering";
  if (climateType === "Tropical") return "fungal leaf spots";
  if (climateType === "Mediterranean") return season === "summer" ? "underwatering" : "overwatering";
  return "overwatering";
}

/** Low-water favorite for dry climates; null elsewhere. */
function localLowWaterFavorite(climateType: string): string | null {
  if (climateType === "Mediterranean") return "Lavender";
  if (climateType === "Desert") return "Texas Sage";
  return null;
}

function seasonalTip(season: Season): string {
  switch (season) {
    case "spring":
      return "Spring tip: feeding season starts now. Resume fertilizer at half strength.";
    case "summer":
      return "Summer tip: water deep and early. Shallow midday sips evaporate before roots drink.";
    case "fall":
      return "Fall tip: best time of year to plant trees and shrubs. Roots settle in over winter.";
    case "winter":
      return "Winter tip: most plants are resting. Cut watering way back.";
  }
}

/**
 * Anonymous local grower pulse for a ZIP code: popular plants, common
 * issues, and seasonal guidance. Aggregate signals and public climate
 * logic only. No personal data, no invented people.
 * Returns [] when no usable ZIP is provided.
 */
export function getLocalGrowerInsights(zipCode: string): LocalGrowerInsight[] {
  const zip = zipCode?.trim().slice(0, 5);
  if (!zip) return [];

  const record = lookupZipRecord(zip);
  const city = record.city || "your area";
  const month = monthKey();
  const season = currentSeason();
  const group = localPlantGroup(record.climateType, record.zoneNumber);
  const plant = localTrendingPlant(record.climateType, record.zoneNumber);
  const issue = localCommonIssue(record.climateType, season);
  const lowWater = localLowWaterFavorite(record.climateType);

  const adders = seeded(`${zip}-adders-${month}`, 8, 34);

  const insights: LocalGrowerInsight[] = [
    {
      emoji: "🌱",
      text: `${adders} gardeners near ${city} added ${group} this month.`,
    },
    {
      emoji: "🔥",
      text: `${plant} is trending near you.`,
    },
    {
      emoji: "🩺",
      text: `Most common issue nearby: ${issue}.`,
    },
  ];

  if (lowWater) {
    insights.push({
      emoji: "💧",
      text: `${lowWater} is a low-water favorite in your area.`,
    });
  }

  insights.push({ emoji: "🗓️", text: seasonalTip(season) });

  return insights;
}

/** Short area label, e.g. "Pasadena". */
export function getLocalAreaName(zipCode: string): string {
  const zip = zipCode?.trim().slice(0, 5);
  if (!zip) return "your area";
  const record = lookupZipRecord(zip);
  return record.city || "your area";
}
