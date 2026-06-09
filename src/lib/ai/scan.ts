import type { ScanResult } from "@/lib/types";
import { requestAnalyzePhoto } from "./client";

/** Health scan via vision API — used by legacy callers. */
export async function analyzePlantPhoto(
  imageDataUrl: string,
  context?: {
    plantId?: string;
    nickname?: string;
    species?: string;
    zipCode?: string;
    locationType?: string;
  }
): Promise<ScanResult> {
  const res = await requestAnalyzePhoto({
    imageDataUrl,
    plantId: context?.plantId,
    nickname: context?.nickname,
    species: context?.species,
    zipCode: context?.zipCode,
    locationType: context?.locationType as "indoor" | "outdoor" | undefined,
  });

  if (!res.ok) {
    throw new Error(res.error);
  }

  const d = res.data;
  return {
    issue: d.issue_detected,
    likelyCause: d.likely_causes.join("; "),
    confidence: d.confidence,
    recommendedAction: d.what_to_do_today,
  };
}
