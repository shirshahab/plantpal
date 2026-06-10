/**
 * Species-specific base care — builds care values from real plant data
 * (PlantPal database, Perenual, or AI suggestion) instead of generic defaults.
 */
import type { SpeciesCareInput, SpeciesCareSource } from "@/lib/types";
import { defaultCareForSpecies } from "./care-defaults";

export const CARE_SOURCE_LABELS: Record<SpeciesCareSource, string> = {
  plantpal: "PlantPal database",
  perenual: "Perenual",
  ai: "PlantPal care library",
  fallback: "Basic fallback",
};

/** Minimal species fields needed to derive base care. */
export interface SpeciesCareFields {
  common_name: string;
  scientific_name: string;
  type?: string;
  sunlight?: string;
  watering?: string;
  soil_preference?: string;
}

/** Normalized care guide text from either PlantPal or Perenual guides. */
export interface NormalizedCareGuide {
  watering?: string;
  fertilizer?: string;
  pruning?: string;
}

/** Derive a watering interval (days) from watering description text. */
function waterDaysFromText(watering: string | undefined, fallback: number): number {
  if (!watering) return fallback;
  const w = watering.toLowerCase();
  if (w.includes("dry between") || w.includes("dry out") || w.includes("drought") || w.includes("infrequent") || w.includes("minimum")) {
    return Math.max(fallback, 8);
  }
  if (w.includes("consistently moist") || w.includes("evenly moist") || w.includes("keep moist") || w.includes("frequent")) {
    return Math.min(fallback, 3);
  }
  if (w.includes("deep")) return Math.min(Math.max(fallback, 4), 7);
  return fallback;
}

function firstSentences(text: string | undefined, max = 2): string | null {
  if (!text?.trim()) return null;
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .slice(0, max)
    .join(" ");
  return sentences.length > 240 ? `${sentences.slice(0, 237)}…` : sentences;
}

/**
 * Build species-specific base care.
 * Uses keyword defaults for frequencies, then overrides instructions with
 * real species/care-guide text when available.
 */
export function buildBaseCareFromSpecies(
  species: SpeciesCareFields,
  careGuide: NormalizedCareGuide | null,
  source: SpeciesCareSource
): SpeciesCareInput {
  const keywordBase = defaultCareForSpecies(
    `${species.common_name} ${species.scientific_name} ${species.type ?? ""}`
  );

  const wateringText =
    firstSentences(careGuide?.watering) ?? firstSentences(species.watering);
  const fertilizerText = firstSentences(careGuide?.fertilizer);
  const pruningText = firstSentences(careGuide?.pruning);

  const hasRealData = Boolean(wateringText || fertilizerText || pruningText);

  return {
    waterFrequencyDays: waterDaysFromText(
      careGuide?.watering ?? species.watering,
      keywordBase.waterFrequencyDays
    ),
    fertilizeFrequencyWeeks: keywordBase.fertilizeFrequencyWeeks,
    pruneSchedule: keywordBase.pruneSchedule,
    wateringInstructions: wateringText ?? keywordBase.wateringInstructions,
    fertilizingInstructions: fertilizerText ?? keywordBase.fertilizingInstructions,
    pruningInstructions: pruningText ?? keywordBase.pruningInstructions,
    source: hasRealData ? source : source === "ai" ? "ai" : "fallback",
  };
}

/** Basic fallback care when the user types a species without selecting one. */
export function fallbackCareForTypedSpecies(species: string): SpeciesCareInput {
  return { ...defaultCareForSpecies(species), source: "fallback" };
}
