import type { PlantIdentificationResponse } from "@/lib/types/ai";

export const SOURCE_BADGE = {
  liveAi: "PlantPal Vision",
  plantNet: "Pl@ntNet",
  unidentified: "Unidentified",
} as const;

export function getPrimarySourceLabel(result: PlantIdentificationResponse): string {
  if (result.source === "mock" || result.identification_provider === "mock") {
    return SOURCE_BADGE.unidentified;
  }
  return SOURCE_BADGE.liveAi;
}

export function getPlantNetSourceLabel(configured: boolean): string | null {
  if (!configured) return null;
  return SOURCE_BADGE.plantNet;
}

export function getConsensusLabel(providersDisagree: boolean): string | null {
  if (providersDisagree) return "Sources disagree. Review both results";
  return null;
}
