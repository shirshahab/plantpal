import type { PhotoQualityAssessment, PlantIdentificationResponse } from "@/lib/types/ai";
import { identifyWithPlantId, isPlantIdEnabled } from "@/lib/integrations/plantid";
import { isPlantNetKeyConfigured } from "@/lib/integrations/env-config";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";
import {
  enrichIdentification,
  mapSunToExposure,
  scoreToLevel,
} from "./enrich-identification";
import { buildFriendlyHeadline } from "@/lib/scanner/identification-copy";
import { estimateDataUrlBytes } from "@/lib/scanner/upload-limits";
import { isScannerDemoModeEnabled } from "@/lib/scanner/demo-mode";
import {
  IdentificationFailedError,
  type IdentifyDebugLog,
} from "./identify-errors";
import { LIVE_IDENTIFICATION_FAILED } from "./messages";

export type IdentifyPhotoRole = "whole" | "leaf" | "flower";

export interface IdentifyPlantOptions {
  /** Explicit demo from client profile or SCANNER_DEMO_MODE */
  forceDemo?: boolean;
}

function shouldUseDemoIdentification(forceDemo?: boolean): boolean {
  if (forceDemo || isScannerDemoModeEnabled()) return true;
  return !isOpenAIConfigured() && !isPlantIdEnabled();
}

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

function buildDebugBase(urls: string[]): IdentifyDebugLog {
  return {
    openaiKeyConfigured: isOpenAIConfigured(),
    plantnetKeyConfigured: isPlantNetKeyConfigured(),
    plantIdKeyConfigured: isPlantIdEnabled(),
    imageCount: urls.length,
    imageBytes: urls.map(estimateDataUrlBytes),
    responseSource: null,
    identificationProvider: null,
    fallbackReason: null,
    openaiRawPreview: null,
    openaiError: null,
    plantnetRawPreview: null,
  };
}

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

/** Placeholder only — used when no live API keys exist or SCANNER_DEMO_MODE is on. */
function buildDemoIdentification(debug: IdentifyDebugLog): PlantIdentificationResponse {
  debug.responseSource = "mock";
  debug.identificationProvider = "mock";
  debug.fallbackReason = debug.fallbackReason ?? "demo_mode_or_no_api_keys";

  const enriched = enrichIdentification({
    common_name: "Demo identification",
    scientific_name: "Connect OPENAI_API_KEY for live plant ID",
    confidence: "low",
    confidence_score: 0,
    identification_rationale:
      "This is placeholder demo data — not based on your photo. Add OPENAI_API_KEY to .env.local and restart the dev server for live identification.",
    top_matches: [],
    common_lookalikes: [],
    care_summary: "Demo mode — no real care data for this scan.",
    light_needs: "—",
    watering_needs: "—",
    toxicity: "—",
    care_difficulty: "Moderate",
    toxicity_warning: null,
    suggested_location: "either",
    suggested_sun: "partial_sun",
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
    not_fully_confident:
      result.source === "mock" ||
      result.confidence_score < 70 ||
      result.low_confidence,
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
  roles: IdentifyPhotoRole[] | undefined,
  debug: IdentifyDebugLog
): Promise<PlantIdentificationResponse> {
  if (!isOpenAIConfigured()) {
    throw new IdentificationFailedError(LIVE_IDENTIFICATION_FAILED, {
      ...debug,
      fallbackReason: "openai_not_configured",
    });
  }

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
      imageDataUrls,
      { detail: "auto" }
    );

    debug.openaiRawPreview = JSON.stringify(raw).slice(0, 500);
    console.info("[plant-identify] OpenAI raw before enrichment:", debug.openaiRawPreview);

    const photo_quality = normalizePhotoQuality(raw.photo_quality);
    const { photo_quality: _pq, ...rest } = raw;

    const enriched = enrichIdentification({
      ...rest,
      photo_quality,
      source: "ai",
      identification_provider: "openai",
    });

    debug.responseSource = "ai";
    debug.identificationProvider = "openai";
    debug.fallbackReason = null;

    return applyFriendlyCopy(enriched);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    debug.openaiError = message.slice(0, 300);
    debug.fallbackReason = "openai_failed";
    console.error("[plant-identify] OpenAI identification failed:", message);
    throw new IdentificationFailedError(LIVE_IDENTIFICATION_FAILED, debug);
  }
}

async function identifyWithPlantIdPipeline(
  imageDataUrl: string,
  debug: IdentifyDebugLog
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

  debug.responseSource = "ai";
  debug.identificationProvider = "plantid";
  debug.fallbackReason = null;

  return applyFriendlyCopy(enriched);
}

function sunLabelFromExposure(sun: ReturnType<typeof mapSunToExposure>): string {
  if (sun === "full_sun") return "Full sun (6+ hours direct light)";
  if (sun === "shade") return "Shade or bright indirect light";
  return "Partial sun (3–6 hours)";
}

export async function identifyPlantFromPhoto(
  imageDataUrl: string | string[],
  roles?: IdentifyPhotoRole[],
  options?: IdentifyPlantOptions
): Promise<PlantIdentificationResponse> {
  const urls = Array.isArray(imageDataUrl) ? imageDataUrl : [imageDataUrl];
  const primary = urls[0];
  const debug = buildDebugBase(urls);
  const useDemo = shouldUseDemoIdentification(options?.forceDemo);

  if (!primary) {
    if (useDemo) {
      debug.fallbackReason = "no_image_demo";
      return buildDemoIdentification(debug);
    }
    throw new IdentificationFailedError(LIVE_IDENTIFICATION_FAILED, {
      ...debug,
      fallbackReason: "no_image",
    });
  }

  if (useDemo) {
    debug.fallbackReason =
      options?.forceDemo || isScannerDemoModeEnabled()
        ? "explicit_demo_mode"
        : "no_api_keys";
    return buildDemoIdentification(debug);
  }

  if (isOpenAIConfigured()) {
    return identifyWithOpenAI(urls, roles, debug);
  }

  if (isPlantIdEnabled() && urls.length === 1) {
    const fromPlantId = await identifyWithPlantIdPipeline(primary, debug);
    if (fromPlantId) return fromPlantId;
    debug.fallbackReason = "plantid_empty";
    throw new IdentificationFailedError(LIVE_IDENTIFICATION_FAILED, debug);
  }

  debug.fallbackReason = "no_live_provider";
  throw new IdentificationFailedError(LIVE_IDENTIFICATION_FAILED, debug);
}

/** @deprecated Use identifyPlantFromPhoto */
export const identifyPlantFromPhotos = identifyPlantFromPhoto;
