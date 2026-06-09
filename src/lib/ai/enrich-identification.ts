import type { PlantIdentificationResponse, IdentificationMatch } from "@/lib/types/ai";
import { getPlantSpeciesById, searchPlantSpecies } from "@/lib/knowledge";
import type { SunExposure } from "@/lib/types";

export type CareDifficulty = "Easy" | "Moderate" | "Advanced";

function scoreToLevel(score: number): PlantIdentificationResponse["confidence"] {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function mapSunToExposure(sun: string | null | undefined): SunExposure {
  const s = (sun ?? "").toLowerCase();
  if (s.includes("full") || s.includes("direct") || s.includes("6")) return "full_sun";
  if (s.includes("shade") || s.includes("low light") || s.includes("indirect")) return "shade";
  return "partial_sun";
}

function mapMaintenance(maintenance: string | null | undefined): CareDifficulty {
  const m = (maintenance ?? "").toLowerCase();
  if (m.includes("low") || m.includes("easy")) return "Easy";
  if (m.includes("high") || m.includes("advanced") || m.includes("difficult")) return "Advanced";
  return "Moderate";
}

export function matchDatabaseSpecies(commonName: string | null | undefined): string | null {
  const name = commonName?.trim();
  if (!name) return null;
  const hits = searchPlantSpecies({ query: name });
  if (hits.length === 0) return null;
  const exact = hits.find((s) => s.common_name.toLowerCase() === name.toLowerCase());
  return (exact ?? hits[0]).id;
}

export function enrichIdentification(
  partial: Omit<
    PlantIdentificationResponse,
    | "database_species_id"
    | "confidence_score"
    | "low_confidence"
    | "top_matches"
    | "identification_rationale"
    | "common_lookalikes"
    | "providers_disagree"
    | "plantnet_available"
    | "friendly_headline"
    | "not_fully_confident"
  > & {
    confidence_score?: number;
    database_species_id?: string | null;
    top_matches?: IdentificationMatch[];
    identification_rationale?: string;
    common_lookalikes?: string[];
    providers_disagree?: boolean;
    plantnet_available?: boolean;
    photo_quality?: import("@/lib/types/ai").PhotoQualityAssessment;
  }
): PlantIdentificationResponse {
  const commonName = partial.common_name?.trim() || "Unknown plant";
  const scientificName = partial.scientific_name?.trim() || "Species unknown";

  const dbId =
    partial.database_species_id ?? matchDatabaseSpecies(commonName);
  const species = dbId ? getPlantSpeciesById(dbId) : null;

  const confidenceScore =
    partial.confidence_score ??
    (partial.confidence === "high" ? 85 : partial.confidence === "medium" ? 58 : 32);

  const lightNeeds =
    partial.light_needs?.trim() ||
    species?.sunlight ||
    sunLabelFromExposure(partial.suggested_sun);

  const wateringNeeds =
    partial.watering_needs?.trim() ||
    species?.watering ||
    "Water when top inch of soil feels dry";

  const toxicity =
    partial.toxicity ??
    partial.toxicity_warning ??
    species?.toxicity ??
    "Verify toxicity before pets or children handle this plant";

  const careDifficulty =
    partial.care_difficulty ?? mapMaintenance(species?.maintenance_level);

  const suggestedSun = partial.suggested_sun ?? mapSunToExposure(lightNeeds);
  const confidence = partial.confidence ?? scoreToLevel(confidenceScore);

  return {
    ...partial,
    common_name: commonName,
    scientific_name: scientificName,
    confidence,
    confidence_score: confidenceScore,
    low_confidence: confidenceScore < 70,
    top_matches: (partial.top_matches ?? [
      {
        common_name: commonName,
        scientific_name: scientificName,
        confidence_score: confidenceScore,
      },
    ]).map((m) => ({
      common_name: m.common_name?.trim() || commonName,
      scientific_name: m.scientific_name?.trim() || scientificName,
      confidence_score: m.confidence_score ?? confidenceScore,
    })),
    identification_rationale:
      partial.identification_rationale?.trim() ||
      `Visual features in your photo best align with ${commonName}.`,
    common_lookalikes: partial.common_lookalikes ?? [],
    providers_disagree: partial.providers_disagree ?? false,
    plantnet_available: partial.plantnet_available ?? false,
    light_needs: lightNeeds,
    watering_needs: wateringNeeds,
    toxicity,
    care_difficulty: careDifficulty,
    toxicity_warning: partial.toxicity_warning ?? (toxicity.includes("Non-toxic") ? null : toxicity),
    suggested_sun: suggestedSun,
    database_species_id: dbId,
    care_summary:
      partial.care_summary?.trim() ||
      `${commonName} prefers ${lightNeeds.toLowerCase()} and ${wateringNeeds.toLowerCase()}.`,
  };
}

function sunLabelFromExposure(sun: SunExposure): string {
  if (sun === "full_sun") return "Full sun (6+ hours direct light)";
  if (sun === "shade") return "Shade or bright indirect light";
  return "Partial sun (3–6 hours)";
}

export { scoreToLevel, mapSunToExposure, mapMaintenance };
