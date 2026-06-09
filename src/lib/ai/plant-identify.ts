import type { PhotoQualityAssessment, PlantIdentificationResponse } from "@/lib/types/ai";
import { identifyWithPlantId, isPlantIdEnabled } from "@/lib/integrations/plantid";
import {
  identifyPlantFromImageDetailed,
  isPlantNetEnabled,
} from "@/lib/integrations/plantnet";
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
import {
  IdentificationFailedError,
  type IdentifyDebugLog,
} from "./identify-errors";
import { LIVE_IDENTIFICATION_FAILED } from "./messages";
import { redactSecrets } from "./redact-secrets";

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
    plantnetError: null,
    failureStep: null,
  };
}

function plantNetOrganFromRoles(
  roles?: IdentifyPhotoRole[]
): "leaf" | "flower" | "fruit" | "bark" | "habit" {
  if (roles?.includes("flower")) return "flower";
  if (roles?.includes("leaf")) return "leaf";
  return "habit";
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
    throw new IdentificationFailedError("OPENAI_API_KEY missing in production env", {
      ...debug,
      fallbackReason: "openai_not_configured",
      failureStep: "openai_config",
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
      common_name: rest.common_name ?? undefined,
      scientific_name: rest.scientific_name ?? undefined,
      photo_quality,
      source: "ai",
      identification_provider: "openai",
    });

    debug.responseSource = "ai";
    debug.identificationProvider = "openai";
    debug.fallbackReason = null;

    return applyFriendlyCopy(enriched);
  } catch (e) {
    const message = redactSecrets(e instanceof Error ? e.message : String(e));
    debug.openaiError = message.slice(0, 500);
    debug.fallbackReason = "openai_failed";
    debug.failureStep = "openai_vision";
    console.error("[plant-identify] OpenAI identification failed:", message);
    throw new IdentificationFailedError(
      message.includes("OpenAI") || message.includes("OPENAI")
        ? message
        : `OpenAI request failed: ${message}`,
      debug
    );
  }
}

async function identifyWithPlantNetPipeline(
  imageDataUrl: string,
  roles: IdentifyPhotoRole[] | undefined,
  debug: IdentifyDebugLog,
  openAiFailure?: string
): Promise<PlantIdentificationResponse | null> {
  const result = await identifyPlantFromImageDetailed({
    imageDataUrl,
    organ: plantNetOrganFromRoles(roles),
  });

  debug.plantnetRawPreview = JSON.stringify(result.suggestions.slice(0, 3)).slice(0, 500);

  if (result.error) {
    debug.plantnetError = result.error;
    console.error("[plant-identify] PlantNet fallback failed:", result.error);
    return null;
  }

  const top = result.suggestions[0];
  if (!top) return null;

  const commonName = top.commonNames[0] ?? top.species;
  const confidence = scoreToLevel(top.score);

  const enriched = enrichIdentification({
    common_name: commonName,
    scientific_name: top.species,
    confidence,
    confidence_score: top.score,
    identification_rationale: openAiFailure
      ? `OpenAI unavailable (${openAiFailure.slice(0, 120)}). Identified via Pl@ntNet from visible features.`
      : `Identified via Pl@ntNet from visible leaf/plant features.`,
    top_matches: result.suggestions.slice(0, 3).map((s) => ({
      common_name: s.commonNames[0] ?? s.species,
      scientific_name: s.species,
      confidence_score: s.score,
    })),
    common_lookalikes: [],
    care_summary: `Identified as ${commonName} (${top.species}). Care details are general — verify for your climate.`,
    light_needs: "Check species-specific light requirements",
    watering_needs: "Water when top inch of soil is dry unless species needs differ",
    toxicity: "Verify toxicity for pets and children",
    care_difficulty: "Moderate",
    toxicity_warning: null,
    suggested_location: "either",
    suggested_sun: "partial_sun",
    source: "ai",
    identification_provider: "plantnet",
    plantnet_available: true,
    photo_quality: { acceptable: true, issues: [] },
  });

  debug.responseSource = "ai";
  debug.identificationProvider = "plantnet";
  debug.fallbackReason = openAiFailure ? "openai_failed_plantnet_fallback" : "plantnet_primary";
  debug.failureStep = null;

  console.info("[plant-identify] PlantNet identification ok", {
    species: top.species,
    score: top.score,
    fallback: Boolean(openAiFailure),
  });

  return applyFriendlyCopy(enriched);
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
  roles?: IdentifyPhotoRole[]
): Promise<PlantIdentificationResponse> {
  const urls = Array.isArray(imageDataUrl) ? imageDataUrl : [imageDataUrl];
  const primary = urls[0];
  const debug = buildDebugBase(urls);

  if (!primary) {
    throw new IdentificationFailedError(LIVE_IDENTIFICATION_FAILED, {
      ...debug,
      fallbackReason: "no_image",
    });
  }

  if (isOpenAIConfigured()) {
    try {
      return await identifyWithOpenAI(urls, roles, debug);
    } catch (e) {
      if (e instanceof IdentificationFailedError && isPlantNetEnabled()) {
        const fromPlantNet = await identifyWithPlantNetPipeline(
          primary,
          roles,
          e.debug,
          e.debug.openaiError ?? e.message
        );
        if (fromPlantNet) return fromPlantNet;

        throw new IdentificationFailedError(
          e.debug.plantnetError
            ? `OpenAI failed and PlantNet fallback failed: ${e.debug.plantnetError}`
            : e.message,
          {
            ...e.debug,
            failureStep: "plantnet_fallback",
          }
        );
      }
      throw e;
    }
  }

  if (isPlantNetEnabled()) {
    const fromPlantNet = await identifyWithPlantNetPipeline(primary, roles, debug);
    if (fromPlantNet) return fromPlantNet;
    debug.failureStep = "plantnet_primary";
    throw new IdentificationFailedError(
      debug.plantnetError ?? "PlantNet identification returned no matches",
      debug
    );
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
