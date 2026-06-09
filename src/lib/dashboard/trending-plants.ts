/**
 * "Trending near you" — climate-based plant suggestions by ZIP code.
 * Currently driven by local climate rules; later this can use real
 * aggregated data from users in the same area.
 */
import type { Plant } from "@/lib/types";
import { PLANT_SPECIES } from "@/lib/knowledge/seed";
import { lookupZipRecord } from "@/lib/location/usda-zones";

export interface TrendingPlant {
  name: string;
  scientificName: string;
  speciesId: string | null;
  imageUrl: string | null;
  plantType: string;
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
  limit = 7
): TrendingPlant[] {
  if (!zipCode?.trim()) return [];

  const results: TrendingPlant[] = [];
  for (const name of trendingNamesFor(zipCode)) {
    const species = PLANT_SPECIES.find((s) => s.common_name === name);
    const scientificName = species?.scientific_name ?? "";
    if (ownsPlant(ownedPlants, name, scientificName)) continue;
    results.push({
      name,
      scientificName,
      speciesId: species?.id ?? null,
      imageUrl: species?.image_url ?? null,
      plantType: species?.type ?? "",
    });
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
