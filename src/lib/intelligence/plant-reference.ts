/**
 * Unified plant reference API.
 *
 * Order of trust: curated USDA-style dataset first (verified, offline),
 * Perenual live data where callers already use it. This module is the one
 * place app features ask "what do we actually know about this plant?".
 */

import type { PlantFact } from "./source-types";
import {
  findUsdaPlant,
  getUsdaPlantFact,
  type UsdaPlantRecord,
} from "./usda-plants";

export interface PlantReference {
  commonName: string;
  scientificName: string;
  family: string;
  nativeRange: string;
  growthHabit: string;
  duration: string;
  droughtTolerance: string;
  shadeTolerance: string;
  bloomPeriod: string;
  toxicity: string | null;
  sourceUrl: string;
  source: "usda";
}

function toReference(record: UsdaPlantRecord): PlantReference {
  return {
    commonName: record.common_name,
    scientificName: record.scientific_name,
    family: record.family,
    nativeRange: record.native_range,
    growthHabit: record.growth_habit,
    duration: record.duration,
    droughtTolerance: record.drought_tolerance,
    shadeTolerance: record.shade_tolerance,
    bloomPeriod: record.bloom_period,
    toxicity: record.toxicity,
    sourceUrl: record.official_source_url,
    source: "usda",
  };
}

/** Best available reference for a species/common name, or null. */
export function getPlantReference(species?: string | null): PlantReference | null {
  const record = findUsdaPlant(species);
  return record ? toReference(record) : null;
}

/** Reference-backed fact, or null when the plant isn't in the dataset. */
export function getReferenceFact(species?: string | null): PlantFact | null {
  return getUsdaPlantFact(species);
}
