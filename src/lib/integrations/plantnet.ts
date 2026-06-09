/**
 * Pl@ntNet identification backup — second opinion alongside OpenAI Vision.
 * Docs: https://my.plantnet.org/
 */

import type { PlantNetSuggestion } from "@/lib/types/integrations";
import { getPlantNetKey, isPlantNetKeyConfigured } from "@/lib/integrations/env-config";

const DEFAULT_PROJECT = "all";

export interface PlantNetIdentifyParams {
  imageDataUrl: string;
  organ?: "leaf" | "flower" | "fruit" | "bark" | "habit";
}

interface PlantNetApiResult {
  results?: {
    score: number;
    species: {
      scientificNameWithoutAuthor: string;
      commonNames?: string[];
    };
  }[];
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = Buffer.from(base64, "base64");
  return new Blob([binary], { type: mime });
}

export function isPlantNetEnabled(): boolean {
  return isPlantNetKeyConfigured();
}

/** Identify plant from image — returns empty array when key missing or on failure. */
export async function identifyPlantFromImage(
  params: PlantNetIdentifyParams
): Promise<PlantNetSuggestion[]> {
  const key = getPlantNetKey();
  if (!key) return [];

  try {
    const blob = dataUrlToBlob(params.imageDataUrl);
    const form = new FormData();
    form.append("images", blob, "plant.jpg");
    form.append("organs", params.organ ?? "leaf");

    const url = `https://my-api.plantnet.org/v2/identify/${DEFAULT_PROJECT}?api-key=${key}`;
    const res = await fetch(url, { method: "POST", body: form });

    if (!res.ok) {
      console.error("[plantnet] identify failed:", res.status);
      return [];
    }

    const json = (await res.json()) as PlantNetApiResult;
    return (json.results ?? []).slice(0, 5).map((r) => ({
      species: r.species.scientificNameWithoutAuthor,
      commonNames: r.species.commonNames ?? [],
      score: Math.round(r.score * 100),
    }));
  } catch (e) {
    console.error("[plantnet] identify error:", e);
    return [];
  }
}

/** @deprecated Use identifyPlantFromImage */
export const identifyWithPlantNet = identifyPlantFromImage;
