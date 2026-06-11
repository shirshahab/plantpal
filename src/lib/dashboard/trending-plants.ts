/**
 * "Trending near you" — local trend intelligence by ZIP code.
 *
 * Trend reasons are currently modeled from climate, USDA zone, and season
 * (mock trend intelligence); later this can blend in real aggregated scan,
 * add, and search activity from users in the same area.
 */
import type { Plant } from "@/lib/types";
import { PLANT_SPECIES } from "@/lib/knowledge/seed";
import { lookupZipRecord, type ZipRecord } from "@/lib/location/usda-zones";
import { getArtworkForText } from "@/lib/plants/plant-artwork";

export interface TrendingPlant {
  name: string;
  scientificName: string;
  speciesId: string | null;
  imageUrl: string | null;
  plantType: string;
  /** Why this plant is trending locally, e.g. "Gaining interest with growers near Pasadena." */
  reason: string;
}

/** Plant names per climate — must match seed common names for images/links. */
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
  Desert: [
    "Agave",
    "Bougainvillea",
    "Olive Tree",
    "Pomegranate",
    "Rosemary",
    "Aloe Vera",
    "Sedum",
  ],
  Tropical: [
    "Hibiscus",
    "Bird of Paradise",
    "Avocado Tree",
    "Lime Tree",
    "Palm Tree",
    "Monstera",
    "Bougainvillea",
  ],
  "Humid subtropical": [
    "Gardenia",
    "Camellia",
    "Azalea",
    "Fig Tree",
    "Crape Myrtle",
    "Hydrangea",
    "Magnolia",
  ],
  Marine: [
    "Hydrangea",
    "Japanese Maple",
    "Azalea",
    "Blueberry Bush",
    "Camellia",
    "Lavender",
    "Fig Tree",
  ],
};

const CONTINENTAL_WARM = [
  "Fig Tree",
  "Hydrangea",
  "Japanese Maple",
  "Lavender",
  "Peach Tree",
  "Rose",
  "Grape Vine",
];

const CONTINENTAL_MID = [
  "Japanese Maple",
  "Hydrangea",
  "Peony",
  "Lilac",
  "Apple Tree",
  "Blueberry Bush",
  "Lavender",
];

const CONTINENTAL_COLD = [
  "Lilac",
  "Peony",
  "Apple Tree",
  "Blueberry Bush",
  "Raspberry Bush",
  "Red Maple",
  "Birch Tree",
];

type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

// Note: never show exact percent stats here. These reasons are estimated
// (climate-modeled), and estimated data must use soft language like
// "gaining interest", never fabricated numbers.

/**
 * Curated trend reasons. `{area}` is replaced with the city name.
 * Plants without a curated entry get a modeled reason below.
 */
const CURATED_REASONS: Record<string, string> = {
  Bougainvillea: "Thriving in the {area} heat right now.",
  "Olive Tree": "A drought-tolerant favorite for {area} landscapes.",
  "Avocado Tree": "One of the fastest-growing backyard trees in {area}.",
  Rosemary: "Low-water favorite for {area} gardens.",
  "Japanese Maple": "Popular ornamental tree among local gardeners.",
  Agave: "Thrives on almost no water in the {area} climate.",
  Pomegranate: "Heat-loving fruit tree that does well in {area}.",
  "Aloe Vera": "Easy-care succulent suited to dry {area} summers.",
  Hibiscus: "Loving the warm, humid weather near {area}.",
  "Bird of Paradise": "Statement tropical that grows well in {area}.",
  Monstera: "The most-added houseplant in your area this month.",
  Gardenia: "Fragrant favorite among {area} gardeners.",
  Hydrangea: "A standout bloomer in {area} yards this season.",
  "Crape Myrtle": "Long summer blooms make it a local favorite.",
  Magnolia: "Classic southern tree, popular across {area}.",
  "Blueberry Bush": "Backyard berries are taking off in {area}.",
  Peony: "Show-stopping spring blooms loved by local gardeners.",
  Lilac: "Cold-hardy and fragrant, a regional classic.",
  "Apple Tree": "A reliable backyard fruit tree for your zone.",
  "Raspberry Bush": "Easy berries that handle your winters well.",
};

const SEASONAL_REASONS: Record<Season, Record<string, string>> = {
  spring: {
    Lavender: "Highly recommended for spring planting.",
    Rose: "Spring is prime rose-planting season in {area}.",
    Tomato: "Local gardeners are starting tomatoes now.",
  },
  summer: {
    Lavender: "Highly recommended for summer planting.",
    Rose: "Blooming all over {area} right now.",
  },
  fall: {
    Lavender: "Fall planting gives lavender a head start.",
    Rose: "Fall is a great time to establish roses in {area}.",
  },
  winter: {
    Lavender: "Plan ahead: a spring favorite in {area}.",
    Rose: "Bare-root season: the best time to plant roses.",
  },
};

/** Modeled fallback reasons, rotated deterministically per plant. */
function modeledReason(name: string, record: ZipRecord, index: number): string {
  const patterns = [
    `Gaining interest with growers near {area}.`,
    `A natural fit for zone ${record.usdaZone} gardens.`,
    `A great match for your ${record.climateType.toLowerCase()} climate.`,
    `A popular pick for {area} this season.`,
  ];
  return patterns[index % patterns.length];
}

function reasonFor(name: string, record: ZipRecord, index: number): string {
  const seasonal = SEASONAL_REASONS[currentSeason()][name];
  const raw = seasonal ?? CURATED_REASONS[name] ?? modeledReason(name, record, index);
  return raw.replaceAll("{area}", record.city || "your area");
}

function trendingNamesFor(zipCode: string): string[] {
  const record = lookupZipRecord(zipCode);
  const byClimate = CLIMATE_TRENDING[record.climateType];
  if (byClimate) return byClimate;
  // Continental (and anything unmapped) falls back to zone buckets
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

/** Climate-appropriate plant suggestions for a ZIP, excluding owned plants. */
export function getTrendingPlantsForZip(
  zipCode: string,
  ownedPlants: Plant[] = [],
  limit = 6
): TrendingPlant[] {
  if (!zipCode?.trim()) return [];

  const record = lookupZipRecord(zipCode);
  const results: TrendingPlant[] = [];
  let index = 0;
  for (const name of trendingNamesFor(zipCode)) {
    const species = PLANT_SPECIES.find((s) => s.common_name === name);
    const scientificName = species?.scientific_name ?? "";
    if (ownsPlant(ownedPlants, name, scientificName)) {
      index++;
      continue;
    }
    results.push({
      name,
      scientificName,
      speciesId: species?.id ?? null,
      // PlantPal artwork keeps the section consistent and never blank.
      imageUrl: getArtworkForText(`${name} ${scientificName} ${species?.type ?? ""}`),
      plantType: species?.type ?? "",
      reason: reasonFor(name, record, index),
    });
    index++;
    if (results.length >= limit) break;
  }
  return results;
}

/** Friendly area label for the trending header, e.g. "Pasadena, CA". */
export function getAreaLabel(zipCode: string): string {
  if (!zipCode?.trim()) return "your area";
  const record = lookupZipRecord(zipCode);
  return record.city ? `${record.city}, ${record.state}` : "your area";
}

/* ----------------------------- Trend insights ---------------------------- */

export interface TrendingInsight {
  trendStat: string;
  climateNote: string;
  zoneNote: string;
  plantingSeason: string;
  commonIssues: string;
  wateringNotes: string;
  /** Care guide route when the plant exists in the database. */
  careGuideHref: string | null;
}

const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
};

/** Best planting window by plant type (general guidance). */
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

/** Typical issues by plant type (general guidance). */
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

/** Local intelligence details for a trending plant. */
export function getTrendInsight(plant: TrendingPlant, zipCode: string): TrendingInsight {
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
      ? `Good fit for USDA Zone ${record.usdaZone} (thrives in zones ${species.hardiness_zone_min}–${species.hardiness_zone_max}).`
      : `Best in zones ${species.hardiness_zone_min}–${species.hardiness_zone_max}. You're in zone ${record.usdaZone}, so it may need extra care.`
    : `You're in USDA Zone ${record.usdaZone}.`;

  return {
    trendStat: `Gaining interest with growers near ${city}.`,
    climateNote: `Popular in ${city} thanks to the ${record.climateType.toLowerCase()} climate.`,
    zoneNote,
    plantingSeason: `${SEASON_LABELS[currentSeason()]} tip: ${plantingSeasonFor(plant.plantType)}`,
    commonIssues: commonIssuesFor(plant.plantType),
    wateringNotes: species?.watering ?? "Water when the top inch of soil feels dry.",
    careGuideHref: species ? `/database/plants/${species.id}` : null,
  };
}
