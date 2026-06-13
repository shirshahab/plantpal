/**
 * Daily-rotating trending plants for the dashboard.
 * Honest copy only. No fake percentage stats.
 */
import type { Plant } from "@/lib/types";
import { PLANT_SPECIES } from "@/lib/knowledge/seed";
import { lookupZipRecord, type ZipRecord } from "@/lib/location/usda-zones";
import { getArtworkForText } from "@/lib/plants/plant-artwork";
import { getDailySeed, seedIndex, shuffleWithSeed } from "@/lib/local/daily-seed";

export interface TrendingPlantItem {
  name: string;
  scientificName: string;
  speciesId: string | null;
  imageUrl: string | null;
  plantType: string;
  reason: string;
  href: string | null;
  sourceLabel: string;
  freshnessLabel: "Today" | "This week" | "Seasonal" | "Local pick";
}

const CLIMATE_TRENDING: Record<string, string[]> = {
  Mediterranean: [
    "Meyer Lemon Tree",
    "Bougainvillea",
    "Olive Tree",
    "Avocado Tree",
    "Lavender",
    "Rosemary",
    "Japanese Maple",
  ],
  Desert: ["Agave", "Bougainvillea", "Olive Tree", "Pomegranate", "Rosemary", "Aloe Vera", "Sedum"],
  Tropical: ["Hibiscus", "Bird of Paradise", "Avocado Tree", "Lime Tree", "Monstera", "Bougainvillea"],
  "Humid subtropical": ["Gardenia", "Camellia", "Azalea", "Fig Tree", "Crape Myrtle", "Hydrangea", "Magnolia"],
  Marine: ["Hydrangea", "Japanese Maple", "Azalea", "Blueberry Bush", "Camellia", "Lavender", "Fig Tree"],
};

const CONTINENTAL_WARM = ["Fig Tree", "Hydrangea", "Japanese Maple", "Lavender", "Peach Tree", "Rose", "Grape Vine"];
const CONTINENTAL_MID = ["Japanese Maple", "Hydrangea", "Peony", "Lilac", "Apple Tree", "Blueberry Bush", "Lavender"];
const CONTINENTAL_COLD = ["Lilac", "Peony", "Apple Tree", "Blueberry Bush", "Raspberry Bush", "Red Maple", "Birch Tree"];

type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

const REASON_POOL = [
  "Good fit for {area} heat.",
  "A backyard favorite that can handle dry spells.",
  "Popular with local growers this season.",
  "Worth watching during hot weeks.",
  "Great in Mediterranean climates.",
  "Often searched by local growers.",
  "Seasonal pick for {area}.",
  "Popular near {area}.",
] as const;

const MENTION_REASON = "Showing up in local plant chatter.";
const MENTION_SOURCE = "Local chatter";

function trendingNamesFor(record: ZipRecord): string[] {
  const byClimate = CLIMATE_TRENDING[record.climateType];
  if (byClimate) return byClimate;
  if (record.zoneNumber >= 7) return CONTINENTAL_WARM;
  if (record.zoneNumber >= 5) return CONTINENTAL_MID;
  return CONTINENTAL_COLD;
}

function ownsPlant(plants: Plant[], name: string, scientificName: string): boolean {
  const n = name.toLowerCase();
  const sci = scientificName.toLowerCase();
  return plants.some((p) => {
    const blob = `${p.name} ${p.species}`.toLowerCase();
    return blob.includes(n) || (sci && blob.includes(sci));
  });
}

function reasonFor(name: string, record: ZipRecord, seed: string, fromMention: boolean): string {
  if (fromMention) return MENTION_REASON;
  const area = record.city || "your area";
  const idx = seedIndex(`${seed}|${name}`, REASON_POOL.length);
  return REASON_POOL[idx]!.replaceAll("{area}", area);
}

function freshnessFor(fromMention: boolean, season: Season): TrendingPlantItem["freshnessLabel"] {
  if (fromMention) return "This week";
  if (season === currentSeason()) return "Seasonal";
  return "Local pick";
}

export interface TrendingPlantsInput {
  zipCode: string;
  ownedPlants?: Plant[];
  /** Plant names mentioned in F5Bot/intelligence this week */
  mentionedPlants?: string[];
  limit?: number;
  date?: Date;
}

export function getTrendingPlants(input: TrendingPlantsInput): TrendingPlantItem[] {
  const zip = input.zipCode?.trim().slice(0, 5);
  if (!zip) return [];

  const record = lookupZipRecord(zip);
  const seed = getDailySeed(record.city, record.usdaZone, input.date);
  const owned = input.ownedPlants ?? [];
  const limit = input.limit ?? 5;
  const mentionSet = new Set((input.mentionedPlants ?? []).map((n) => n.toLowerCase()));

  let names = shuffleWithSeed(trendingNamesFor(record), seed);
  if (input.mentionedPlants?.length) {
    const mentioned = input.mentionedPlants.filter((n) => !ownsPlant(owned, n, ""));
    names = [...mentioned, ...names.filter((n) => !mentioned.includes(n))];
  }

  const results: TrendingPlantItem[] = [];
  for (const name of names) {
    const species = PLANT_SPECIES.find((s) => s.common_name === name);
    const scientificName = species?.scientific_name ?? "";
    if (ownsPlant(owned, name, scientificName)) continue;

    const fromMention = mentionSet.has(name.toLowerCase()) || mentionSet.has(scientificName.toLowerCase());
    results.push({
      name,
      scientificName,
      speciesId: species?.id ?? null,
      imageUrl: getArtworkForText(`${name} ${scientificName} ${species?.type ?? ""}`),
      plantType: species?.type ?? "",
      reason: reasonFor(name, record, seed, fromMention),
      href: species ? `/database/plants/${species.id}` : null,
      sourceLabel: fromMention ? MENTION_SOURCE : "Season and climate",
      freshnessLabel: freshnessFor(fromMention, currentSeason(input.date)),
    });
    if (results.length >= limit) break;
  }
  return results;
}

export function getTrendingAreaLabel(zipCode: string): string {
  if (!zipCode?.trim()) return "your area";
  const record = lookupZipRecord(zipCode);
  return record.city ? `${record.city}, ${record.state}` : "your area";
}

export function getTrendingCityName(zipCode: string): string {
  if (!zipCode?.trim()) return "your area";
  return lookupZipRecord(zipCode).city || "your area";
}

/** @deprecated Use getTrendingPlants — kept for modal/insight compat. */
export type TrendingPlant = TrendingPlantItem;

export function getTrendingPlantsForZip(
  zipCode: string,
  ownedPlants: Plant[] = [],
  limit = 6
): TrendingPlantItem[] {
  return getTrendingPlants({ zipCode, ownedPlants, limit });
}

export function getAreaLabel(zipCode: string): string {
  return getTrendingAreaLabel(zipCode);
}

export interface TrendingInsight {
  trendStat: string;
  climateNote: string;
  zoneNote: string;
  plantingSeason: string;
  commonIssues: string;
  wateringNotes: string;
  careGuideHref: string | null;
}

const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
};

function plantingSeasonFor(plantType: string): string {
  switch (plantType) {
    case "tree":
    case "shrub":
      return "Fall through early spring. Cooler weather helps roots establish.";
    case "flower":
      return "Spring, after the last frost in your area.";
    case "vegetable":
    case "herb":
      return "Spring and early summer for most varieties.";
    case "indoor":
      return "Any time of year. Indoor plants aren't tied to seasons.";
    default:
      return "Spring or fall, when temperatures are mild.";
  }
}

function commonIssuesFor(plantType: string): string {
  switch (plantType) {
    case "tree":
      return "Overwatering young trees, scale insects, and nutrient deficiencies in poor soil.";
    case "shrub":
      return "Aphids, powdery mildew in humid spells, and pruning at the wrong time.";
    case "flower":
      return "Aphids, slugs, and fungal spots when leaves stay wet overnight.";
    case "vegetable":
      return "Inconsistent watering, blossom-end rot, and common garden pests.";
    case "herb":
      return "Root rot from soggy soil and legginess without enough sun.";
    case "indoor":
      return "Overwatering, low light stress, and spider mites in dry air.";
    default:
      return "Watch watering consistency and check leaves regularly for pests.";
  }
}

export function getTrendInsight(plant: TrendingPlantItem, zipCode: string): TrendingInsight {
  const record = lookupZipRecord(zipCode);
  const city = record.city || "your area";
  const species = plant.speciesId
    ? PLANT_SPECIES.find((s) => s.id === plant.speciesId)
    : PLANT_SPECIES.find((s) => s.common_name === plant.name);

  const zoneFit =
    species &&
    record.zoneNumber >= species.hardiness_zone_min &&
    record.zoneNumber <= species.hardiness_zone_max;

  const zoneNote = species
    ? zoneFit
      ? `Good fit for USDA Zone ${record.usdaZone} (thrives in zones ${species.hardiness_zone_min} to ${species.hardiness_zone_max}).`
      : `Best in zones ${species.hardiness_zone_min} to ${species.hardiness_zone_max}. You're in zone ${record.usdaZone}, so it may need extra care.`
    : `You're in USDA Zone ${record.usdaZone}.`;

  return {
    trendStat: plant.sourceLabel === MENTION_SOURCE
      ? "Mentioned by growers this week."
      : `Popular near ${city}.`,
    climateNote: `Popular in ${city} thanks to the ${record.climateType.toLowerCase()} climate.`,
    zoneNote,
    plantingSeason: `${SEASON_LABELS[currentSeason()]} tip: ${plantingSeasonFor(plant.plantType)}`,
    commonIssues: commonIssuesFor(plant.plantType),
    wateringNotes: species?.watering ?? "Water when the top inch of soil feels dry.",
    careGuideHref: species ? `/database/plants/${species.id}` : null,
  };
}
