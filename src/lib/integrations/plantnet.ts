/**
 * Pl@ntNet identification — second opinion and OpenAI fallback.
 * Docs: https://my.plantnet.org/
 */

import type { PlantNetSuggestion } from "@/lib/types/integrations";
import { getPlantNetKey, isPlantNetKeyConfigured } from "@/lib/integrations/env-config";

const DEFAULT_PROJECT = "all";
const LOG = "[plantnet]";

export interface PlantNetIdentifyParams {
  imageDataUrl: string;
  organ?: "leaf" | "flower" | "fruit" | "bark" | "habit";
}

export interface PlantNetIdentifyResult {
  suggestions: PlantNetSuggestion[];
  httpStatus: number | null;
  error: string | null;
  errorBody: unknown | null;
  durationMs: number | null;
}

interface PlantNetApiResult {
  results?: {
    score: number;
    species: {
      scientificNameWithoutAuthor: string;
      commonNames?: string[];
    };
  }[];
  message?: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = Buffer.from(base64 ?? "", "base64");
  return new Blob([binary], { type: mime });
}

export function isPlantNetEnabled(): boolean {
  return isPlantNetKeyConfigured();
}

function mapResults(json: PlantNetApiResult): PlantNetSuggestion[] {
  return (json.results ?? []).slice(0, 5).map((r) => ({
    species: r.species.scientificNameWithoutAuthor,
    commonNames: r.species.commonNames ?? [],
    score: Math.round(r.score * 100),
  }));
}

/** Identify plant — returns suggestions plus HTTP/error metadata for logging and debug. */
export async function identifyPlantFromImageDetailed(
  params: PlantNetIdentifyParams
): Promise<PlantNetIdentifyResult> {
  const base: PlantNetIdentifyResult = {
    suggestions: [],
    httpStatus: null,
    error: null,
    errorBody: null,
    durationMs: null,
  };

  const key = getPlantNetKey();
  if (!key) {
    return { ...base, error: "PLANTNET_API_KEY missing in production env" };
  }

  const started = Date.now();
  try {
    const blob = dataUrlToBlob(params.imageDataUrl);
    const form = new FormData();
    form.append("images", blob, "plant.jpg");
    form.append("organs", params.organ ?? "leaf");

    const url = `https://my-api.plantnet.org/v2/identify/${DEFAULT_PROJECT}?api-key=${key}`;
    console.info(`${LOG} request`, {
      organ: params.organ ?? "leaf",
      imageBytes: blob.size,
      project: DEFAULT_PROJECT,
    });

    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    base.durationMs = Date.now() - started;
    base.httpStatus = res.status;

    const text = await res.text();
    let json: PlantNetApiResult;
    try {
      json = JSON.parse(text) as PlantNetApiResult;
    } catch {
      json = { message: text.slice(0, 400) };
    }

    if (!res.ok) {
      const errMsg = json.message ?? text.slice(0, 400);
      console.error(`${LOG} identify failed`, {
        httpStatus: res.status,
        error: errMsg,
        errorBody: json,
        durationMs: base.durationMs,
      });
      return {
        ...base,
        error: `PlantNet HTTP ${res.status}: ${errMsg}`,
        errorBody: json,
      };
    }

    const suggestions = mapResults(json);
    console.info(`${LOG} identify ok`, {
      httpStatus: res.status,
      matchCount: suggestions.length,
      top: suggestions[0]?.species ?? null,
      durationMs: base.durationMs,
    });

    if (suggestions.length === 0) {
      return { ...base, error: "PlantNet returned no matches for this photo" };
    }

    return { ...base, suggestions };
  } catch (e) {
    base.durationMs = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    const error = msg.includes("abort")
      ? "PlantNet request timed out (30s)"
      : `PlantNet error: ${msg}`;
    console.error(`${LOG} identify error`, { error, durationMs: base.durationMs });
    return { ...base, error };
  }
}

/** Identify plant from image — returns empty array when key missing or on failure. */
export async function identifyPlantFromImage(
  params: PlantNetIdentifyParams
): Promise<PlantNetSuggestion[]> {
  const result = await identifyPlantFromImageDetailed(params);
  return result.suggestions;
}

/** @deprecated Use identifyPlantFromImage */
export const identifyWithPlantNet = identifyPlantFromImage;
