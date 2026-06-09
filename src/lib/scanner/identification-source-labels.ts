import type { PlantIdentificationResponse } from "@/lib/types/ai";

export const SOURCE_BADGE = {
  liveAi: "Live AI",
  plantNet: "Pl@ntNet",
  demo: "Demo",
} as const;

export function getPrimarySourceLabel(result: PlantIdentificationResponse): string {
  if (result.source === "mock" || result.identification_provider === "mock") {
    return SOURCE_BADGE.demo;
  }
  return SOURCE_BADGE.liveAi;
}

export function getPlantNetSourceLabel(configured: boolean): string | null {
  if (!configured) return null;
  return SOURCE_BADGE.plantNet;
}

export function getConsensusLabel(providersDisagree: boolean): string | null {
  if (providersDisagree) return "Sources disagree — review both results";
  return null;
}
