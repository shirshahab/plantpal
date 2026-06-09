import { isOpenAIConfigured, chatJSON } from "@/lib/ai/openai";
import { GARDENER_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { enrichPlantSpecies } from "@/lib/knowledge/defaults";
import type { PlantSearchHit } from "@/lib/types/integrations";
import type { PlantSpeciesType } from "@/lib/knowledge/types";

const SCHEMA = `{
  "common_name": "string",
  "scientific_name": "string",
  "type": "tree|shrub|flower|vegetable|herb|indoor|succulent|vine|grass",
  "description": "string — one sentence",
  "sunlight": "string",
  "watering": "string",
  "confidence_score": "number 0-100"
}`;

export async function suggestPlantFromOpenAI(
  query: string
): Promise<PlantSearchHit | null> {
  if (!isOpenAIConfigured() || query.trim().length < 3) return null;

  try {
    const raw = await chatJSON<{
      common_name: string;
      scientific_name: string;
      type: PlantSpeciesType;
      description: string;
      sunlight: string;
      watering: string;
      confidence_score: number;
    }>(
      `${GARDENER_SYSTEM_PROMPT}\n\nSuggest the most likely plant species for a gardener searching: "${query}". Return JSON:\n${SCHEMA}`,
      "Return a single best-match plant suggestion. Use hedged language in description if uncertain."
    );

    const enriched = enrichPlantSpecies({
      id: `ai-suggest-${query.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
      common_name: raw.common_name,
      scientific_name: raw.scientific_name,
      family: "Unknown",
      type: raw.type ?? "shrub",
      description: raw.description,
      sunlight: raw.sunlight ?? "Varies",
      watering: raw.watering ?? "Varies",
      soil_preference: "",
      hardiness_zone_min: 0,
      hardiness_zone_max: 0,
      mature_height: "",
      mature_width: "",
      growth_rate: "",
      toxicity: "Verify before pets/children",
      maintenance_level: "Moderate",
      image_url: "",
      source: "ai",
    });

    return { ...enriched, resultSource: "ai" as const };
  } catch {
    return null;
  }
}
