/**
 * USDA-style plant reference lookups.
 *
 * Backed by src/data/usda-plants-lite.json (curated seed set) because live
 * USDA PLANTS API access is inconsistent. Swap the dataset for a live import
 * later without changing callers. Missing data never blocks the app: every
 * function returns null/[] when a species isn't in the dataset.
 */

import dataset from "@/data/usda-plants-lite.json";
import type { PlantFact } from "./source-types";

export interface UsdaPlantRecord {
  common_name: string;
  scientific_name: string;
  family: string;
  native_range: string;
  usda_symbol: string | null;
  growth_habit: string;
  duration: string;
  active_growth_period: string;
  flower_color: string;
  bloom_period: string;
  drought_tolerance: string;
  shade_tolerance: string;
  fire_resistance: string | null;
  toxicity: string | null;
  official_source_url: string;
}

const PLANTS: UsdaPlantRecord[] = dataset.plants;

/** Find a record by fuzzy common/scientific name match. */
export function findUsdaPlant(species?: string | null): UsdaPlantRecord | null {
  if (!species) return null;
  const q = species.toLowerCase().trim();
  if (q.length < 3) return null;

  return (
    PLANTS.find((p) => {
      const common = p.common_name.toLowerCase();
      const sci = p.scientific_name.toLowerCase();
      return (
        common === q ||
        sci === q ||
        q.includes(common) ||
        common.includes(q) ||
        q.includes(sci) ||
        sci.includes(q)
      );
    }) ?? null
  );
}

export function getOfficialPlantDetails(species?: string | null): UsdaPlantRecord | null {
  return findUsdaPlant(species);
}

export function getPlantNativeRange(species?: string | null): string | null {
  return findUsdaPlant(species)?.native_range ?? null;
}

export function getGrowthHabit(species?: string | null): string | null {
  return findUsdaPlant(species)?.growth_habit ?? null;
}

/**
 * One reference-backed fact about a plant, phrased for Planty.
 * Rotates through available record fields by day so it doesn't repeat.
 */
export function getUsdaPlantFact(species?: string | null): PlantFact | null {
  const record = findUsdaPlant(species);
  if (!record) return null;

  const facts: string[] = [
    `${record.common_name} (${record.scientific_name}) is native to ${record.native_range}.`,
  ];
  if (/high/i.test(record.drought_tolerance)) {
    facts.push(
      `${record.common_name} is drought tolerant by design. Overwatering is the bigger risk.`
    );
  }
  if (/low/i.test(record.drought_tolerance)) {
    facts.push(
      `${record.common_name} has low drought tolerance. Dry spells hit it before other plants.`
    );
  }
  if (/tolerant/i.test(record.shade_tolerance) && !/intolerant/i.test(record.shade_tolerance)) {
    facts.push(`${record.common_name} handles shade better than most. Harsh sun is the enemy.`);
  }
  if (record.toxicity && /toxic to (pets|dogs|many)/i.test(record.toxicity)) {
    facts.push(`Heads up: ${record.common_name.toLowerCase()} is ${record.toxicity.toLowerCase()}.`);
  }
  if (record.bloom_period && !/rarely|does not/i.test(record.bloom_period)) {
    facts.push(`Bloom window for ${record.common_name.toLowerCase()}: ${record.bloom_period.toLowerCase()}.`);
  }

  const day = Math.floor(Date.now() / 86_400_000);
  return {
    plant: record.common_name,
    scientificName: record.scientific_name,
    fact: facts[day % facts.length],
    source: "usda",
    confidence: "high",
    sourceUrl: record.official_source_url,
  };
}

export function getUsdaDatasetCount(): number {
  return PLANTS.length;
}
