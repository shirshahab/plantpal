import type { PhotoQualityAssessment, PlantIdentificationResponse } from "@/lib/types/ai";
import { identifyWithPlantId, isPlantIdEnabled } from "@/lib/integrations/plantid";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";
import {
  enrichIdentification,
  matchDatabaseSpecies,
  mapSunToExposure,
  scoreToLevel,
} from "./enrich-identification";
import { buildFriendlyHeadline } from "@/lib/scanner/identification-copy";

export type IdentifyPhotoRole = "whole" | "leaf" | "flower";

const SCHEMA = `{
  "photo_quality": {
    "acceptable": "boolean — false if blurry, too dark, extreme close-up, or missing visible leaves/stem/flower",
    "issues": ["blurry" | "dark" | "too_close" | "missing_leaves" | "missing_stem" | "missing_flower"],
    "message": "string or null — short reason if not acceptable"
  },
  "common_name": "string",
  "scientific_name": "string",
  "confidence": "high" | "medium" | "low",
  "confidence_score": "number 0-100",
  "identification_rationale": "string — 2-3 sentences explaining visible features that led to this ID",
  "top_matches": [
    { "common_name": "string", "scientific_name": "string", "confidence_score": "number 0-100" }
  ],
  "common_lookalikes": ["string — 2-4 plants often confused with this one"],
  "care_summary": "string — 2-3 sentences",
  "light_needs": "string — e.g. Full sun (6+ hours)",
  "watering_needs": "string — how often to water",
  "toxicity": "string — pets/children safety",
  "care_difficulty": "Easy" | "Moderate" | "Advanced",
  "toxicity_warning": "string or null",
  "suggested_location": "indoor" | "outdoor" | "either",
  "suggested_sun": "full_sun" | "partial_sun" | "shade"
}`;

function normalizePhotoQuality(raw?: {
  acceptable?: boolean;
  issues?: string[];
  message?: string | null;
}): PhotoQualityAssessment {
  const issues = (raw?.issues ?? []).filter(Boolean);
  const acceptable = raw?.acceptable ?? issues.length === 0;
  return {
    acceptable,
    issues,
    message: acceptable ? undefined : raw?.message ?? "PlantPal needs a clearer photo.",
  };
}

function mockIdentify(): PlantIdentificationResponse {
  const enriched = enrichIdentification({
    common_name: "Meyer Lemon",
    scientific_name: "Citrus × meyeri",
    confidence: "medium",
    confidence_score: 72,
    identification_rationale:
      "Glossy oval leaves, compact branching, and deep green foliage match Meyer lemon — a common patio citrus with sweeter fruit than Eureka.",
    top_matches: [
      { common_name: "Meyer Lemon", scientific_name: "Citrus × meyeri", confidence_score: 72 },
      { common_name: "Eureka Lemon", scientific_name: "Citrus limon", confidence_score: 16 },
      { common_name: "Lime Tree", scientific_name: "Citrus aurantiifolia", confidence_score: 8 },
    ],
    common_lookalikes: ["Eureka lemon", "Key lime", "Kumquat"],
    care_summary:
      "A compact citrus tree that prefers full sun and deep, infrequent watering. Feed during active growth and protect from hard frost.",
    light_needs: "Full sun (6+ hours direct light)",
    watering_needs: "Deep water weekly; allow top inch to dry between waterings",
    toxicity: "Citrus leaves can be mildly irritating to pets if ingested",
    care_difficulty: "Moderate",
    toxicity_warning: "Citrus leaves and stems can be mildly irritating if ingested by pets.",
    suggested_location: "outdoor",
    suggested_sun: "full_sun",
    source: "mock",
    identification_provider: "mock",
    photo_quality: { acceptable: true, issues: [] },
  });

  return applyFriendlyCopy(enriched);
}

function applyFriendlyCopy(result: PlantIdentificationResponse): PlantIdentificationResponse {
  return {
    ...result,
    friendly_headline: buildFriendlyHeadline(result),
    not_fully_confident: result.confidence_score < 70 || result.low_confidence,
  };
}

function buildMultiPhotoPrompt(roles?: IdentifyPhotoRole[]): string {
  if (!roles?.length || roles.length === 1) {
    return "Identify this plant from the photo. If unsure between similar species, pick the most likely and set confidence_score below 70 if uncertain. Assess photo_quality first.";
  }
  const labels = roles.map((r, i) => {
    if (r === "whole") return `Image ${i + 1}: whole plant`;
    if (r === "leaf") return `Image ${i + 1}: leaf close-up`;
    return `Image ${i + 1}: flower, fruit, or stem detail`;
  });
  return `You have ${roles.length} photos of the same plant:\n${labels.join("\n")}\nUse all photos together for identification. Assess photo_quality across all images. If unsure, set confidence_score below 70.`;
}

async function identifyWithOpenAI(
  imageDataUrls: string[],
  roles?: IdentifyPhotoRole[]
): Promise<PlantIdentificationResponse | null> {
  if (!isOpenAIConfigured() || imageDataUrls.length === 0) return null;

  try {
    const raw = await visionJSON<
      Omit<
        PlantIdentificationResponse,
        | "source"
        | "database_species_id"
        | "identification_provider"
        | "low_confidence"
        | "providers_disagree"
        | "plantnet_available"
        | "friendly_headline"
        | "not_fully_confident"
      > & {
        photo_quality?: {
          acceptable?: boolean;
          issues?: string[];
          message?: string | null;
        };
      }
    >(
      `${GARDENER_SYSTEM_PROMPT}\n\nIdentify the plant in these photo(s). Return structured care fields. Assess whether photos are clear enough (not blurry, dark, extreme close-up, or missing leaves/stem). Use hedged language in care_summary. Return JSON:\n${SCHEMA}`,
      buildMultiPhotoPrompt(roles),
      imageDataUrls
    );

    const photo_quality = normalizePhotoQuality(raw.photo_quality);
    const { photo_quality: _pq, ...rest } = raw;

    const enriched = enrichIdentification({
      ...rest,
      photo_quality,
      source: "ai",
      identification_provider: "openai",
    });

    return applyFriendlyCopy(enriched);
  } catch (e) {
    console.error("[plant-identify] OpenAI identification failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function identifyWithPlantIdPipeline(
  imageDataUrl: string
): Promise<PlantIdentificationResponse | null> {
  const plantId = await identifyWithPlantId(imageDataUrl);
  if (!plantId) return null;

  const confidence = scoreToLevel(plantId.confidenceScore);
  const suggestedSun = mapSunToExposure(plantId.sunlight);

  const enriched = enrichIdentification({
    common_name: plantId.commonName,
    scientific_name: plantId.scientificName,
    confidence,
    confidence_score: plantId.confidenceScore,
    care_summary: `Identified as ${plantId.commonName} (${plantId.scientificName}).`,
    light_needs: plantId.sunlight ?? sunLabelFromExposure(suggestedSun),
    watering_needs: plantId.watering ?? "Check soil moisture regularly",
    toxicity: plantId.toxicity ?? "Verify toxicity for pets and children",
    care_difficulty: "Moderate",
    toxicity_warning: plantId.toxicity,
    suggested_location: suggestedSun === "shade" ? "indoor" : "either",
    suggested_sun: suggestedSun,
    source: "ai",
    identification_provider: "plantid",
    plantid_suggestions: plantId.suggestions,
    photo_quality: { acceptable: true, issues: [] },
  });

  return applyFriendlyCopy(enriched);
}

function sunLabelFromExposure(sun: ReturnType<typeof mapSunToExposure>): string {
  if (sun === "full_sun") return "Full sun (6+ hours direct light)";
  if (sun === "shade") return "Shade or bright indirect light";
  return "Partial sun (3–6 hours)";
}

export async function identifyPlantFromPhoto(
  imageDataUrl: string | string[],
  roles?: IdentifyPhotoRole[]
): Promise<PlantIdentificationResponse> {
  const urls = Array.isArray(imageDataUrl) ? imageDataUrl : [imageDataUrl];
  const primary = urls[0];
  if (!primary) return mockIdentify();

  if (isPlantIdEnabled() && urls.length === 1) {
    const fromPlantId = await identifyWithPlantIdPipeline(primary);
    if (fromPlantId) return fromPlantId;
  }

  const fromOpenAI = await identifyWithOpenAI(urls, roles);
  if (fromOpenAI) return fromOpenAI;

  return mockIdentify();
}

/** @deprecated Use identifyPlantFromPhoto */
export const identifyPlantFromPhotos = identifyPlantFromPhoto;
