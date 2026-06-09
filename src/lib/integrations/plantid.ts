/**
 * Plant.id identification — primary provider when PLANT_ID_API_KEY is set.
 * Docs: https://plant.id/docs/
 */

export interface PlantIdSuggestion {
  scientificName: string;
  commonNames: string[];
  probability: number;
}

export interface PlantIdIdentifyResult {
  commonName: string;
  scientificName: string;
  confidenceScore: number;
  suggestions: PlantIdSuggestion[];
  watering: string | null;
  sunlight: string | null;
  toxicity: string | null;
}

function extractBase64(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
}

export function isPlantIdEnabled(): boolean {
  return Boolean(process.env.PLANT_ID_API_KEY?.trim());
}

export async function identifyWithPlantId(
  imageDataUrl: string
): Promise<PlantIdIdentifyResult | null> {
  const key = process.env.PLANT_ID_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch("https://api.plant.id/v3/identification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": key,
      },
      body: JSON.stringify({
        images: [extractBase64(imageDataUrl)],
        similar_images: true,
        plant_details: [
          "common_names",
          "watering",
          "toxicity",
          "sunlight",
        ],
      }),
    });

    if (!res.ok) {
      console.error("[plantid] identify failed:", res.status);
      return null;
    }

    const json = (await res.json()) as {
      result?: {
        classification?: {
          suggestions?: {
            name: string;
            probability: number;
            details?: {
              common_names?: string[];
              watering?: { min?: number; max?: number } | string;
              toxicity?: string;
              sunlight?: string;
            };
          }[];
        };
      };
    };

    const suggestions = json.result?.classification?.suggestions ?? [];
    if (suggestions.length === 0) return null;

    const top = suggestions[0];
    const details = top.details;
    const commonNames = details?.common_names ?? [];

    const wateringRaw = details?.watering;
    let watering: string | null = null;
    if (typeof wateringRaw === "string") {
      watering = wateringRaw;
    } else if (wateringRaw && typeof wateringRaw === "object") {
      const min = wateringRaw.min;
      const max = wateringRaw.max;
      if (min != null && max != null) {
        watering = `Watering level ${min}–${max} (Plant.id scale)`;
      }
    }

    return {
      commonName: commonNames[0] ?? top.name.split(" ").slice(-2).join(" ") ?? top.name,
      scientificName: top.name,
      confidenceScore: Math.round(top.probability * 100),
      suggestions: suggestions.slice(0, 5).map((s) => ({
        scientificName: s.name,
        commonNames: s.details?.common_names ?? [],
        probability: Math.round(s.probability * 100),
      })),
      watering,
      sunlight: typeof details?.sunlight === "string" ? details.sunlight : null,
      toxicity: typeof details?.toxicity === "string" ? details.toxicity : null,
    };
  } catch (e) {
    console.error("[plantid] identify error:", e);
    return null;
  }
}
