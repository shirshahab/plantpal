import type { PlantIdentificationResponse } from "@/lib/types/ai";

const CONFIDENT_THRESHOLD = 85;
const LIKELY_THRESHOLD = 70;

export function buildFriendlyHeadline(result: PlantIdentificationResponse): string {
  const name = result.common_name;

  if (result.photo_quality && !result.photo_quality.acceptable) {
    return "PlantPal needs a clearer photo before identifying this plant.";
  }

  if (result.confidence_score >= CONFIDENT_THRESHOLD) {
    return `PlantPal is confident this is a ${name}.`;
  }

  if (result.confidence_score >= LIKELY_THRESHOLD) {
    return `PlantPal thinks this is likely a ${name}.`;
  }

  return `PlantPal thinks this may be a ${name}, but needs another photo to be sure.`;
}

export function isNotFullyConfident(result: PlantIdentificationResponse): boolean {
  return (
    result.confidence_score < LIKELY_THRESHOLD ||
    result.low_confidence ||
    result.providers_disagree
  );
}

export const LOW_CONFIDENCE_PROMPTS = [
  "Take another photo",
  "Add a leaf close-up",
  "Add a flower or fruit photo",
  "Save as Unknown",
] as const;
