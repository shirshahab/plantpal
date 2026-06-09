import type { PlantIdentificationResponse } from "@/lib/types/ai";
import { searchPlantSpecies } from "@/lib/knowledge";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const SCHEMA = `{
  "common_name": "string",
  "scientific_name": "string",
  "confidence": "high" | "medium" | "low",
  "care_summary": "string — 2-3 sentences",
  "toxicity_warning": "string or null — pets/children if relevant",
  "suggested_location": "indoor" | "outdoor" | "either",
  "suggested_sun": "full_sun" | "partial_sun" | "shade"
}`;

function matchDatabaseSpecies(commonName: string): string | null {
  const hits = searchPlantSpecies({ query: commonName });
  if (hits.length === 0) return null;
  const exact = hits.find(
    (s) => s.common_name.toLowerCase() === commonName.toLowerCase()
  );
  return (exact ?? hits[0]).id;
}

function mockIdentify(): PlantIdentificationResponse {
  return {
    common_name: "Meyer Lemon",
    scientific_name: "Citrus × meyeri",
    confidence: "medium",
    care_summary:
      "A compact citrus tree that prefers full sun and deep, infrequent watering. Feed during active growth and protect from hard frost.",
    toxicity_warning: "Citrus leaves and stems can be mildly irritating if ingested by pets.",
    suggested_location: "outdoor",
    suggested_sun: "full_sun",
    database_species_id: matchDatabaseSpecies("Meyer Lemon"),
    source: "mock",
  };
}

export async function identifyPlantFromPhoto(
  imageDataUrl: string
): Promise<PlantIdentificationResponse> {
  if (!isOpenAIConfigured()) {
    return mockIdentify();
  }

  try {
    const raw = await visionJSON<Omit<PlantIdentificationResponse, "source" | "database_species_id">>(
      `${GARDENER_SYSTEM_PROMPT}\n\nIdentify the plant in this photo. Use hedged language in care_summary. Return JSON:\n${SCHEMA}`,
      "Identify this plant from the photo. If unsure between similar species, pick the most likely and set confidence accordingly."
    , imageDataUrl);

    return {
      ...raw,
      database_species_id: matchDatabaseSpecies(raw.common_name),
      source: "ai",
    };
  } catch {
    return mockIdentify();
  }
}
