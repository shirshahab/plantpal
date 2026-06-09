import type { TagScanResponse } from "@/lib/types/ai";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const SCHEMA = `{
  "plant_name": "string",
  "variety": "string or null",
  "size": "string or null — pot size or height",
  "sun_needs": "string or null",
  "water_needs": "string or null",
  "hardiness_zone": "string or null",
  "price": "string or null — include $ if visible",
  "care_instructions": "string or null",
  "scientific_name": "string or null",
  "suggested_sun_exposure": "full_sun" | "partial_sun" | "shade" | null,
  "suggested_location": "indoor" | "outdoor" | null
}`;

function mockTagScan(): TagScanResponse {
  return {
    plant_name: "Dracaena Marginata",
    variety: "Colorama",
    size: '6" pot',
    sun_needs: "Bright indirect light",
    water_needs: "Water when top 1-2 inches dry",
    hardiness_zone: "10-11",
    price: "$14.98",
    care_instructions:
      "Keep away from cold drafts. Wipe leaves monthly. Feed lightly in spring and summer.",
    scientific_name: "Dracaena marginata",
    suggested_sun_exposure: "partial_sun",
    suggested_location: "indoor",
    source: "mock",
  };
}

export async function scanNurseryTag(
  imageDataUrl: string
): Promise<TagScanResponse> {
  if (!isOpenAIConfigured()) {
    return mockTagScan();
  }

  try {
    const raw = await visionJSON<Omit<TagScanResponse, "source">>(
      `${GARDENER_SYSTEM_PROMPT}\n\nExtract all readable text from this nursery or store plant tag. Infer missing fields when reasonable. Return JSON:\n${SCHEMA}`,
      "Read this plant tag photo (Home Depot, Lowe's, nursery, etc.). Extract plant name, care info, and price if visible.",
      imageDataUrl
    );
    return { ...raw, source: "ai" };
  } catch {
    return mockTagScan();
  }
}
