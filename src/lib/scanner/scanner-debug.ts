import sharp from "sharp";
import type { IdentifyPhotoRole } from "@/lib/ai/plant-identify";
import { GARDENER_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getOpenAIKey, isOpenAIKeyConfigured, isPlantNetKeyConfigured } from "@/lib/integrations/env-config";
import { isPlantIdEnabled } from "@/lib/integrations/plantid";
import { isScannerDemoModeEnabled } from "@/lib/scanner/demo-mode";
import {
  estimateDataUrlBytes,
  formatBytes,
  totalDataUrlBytes,
  SCAN_MAX_TOTAL_BYTES,
  validatePhotoPayload,
} from "@/lib/scanner/upload-limits";

const IDENTIFY_MODEL = "gpt-4o-mini";
const VERCEL_BODY_LIMIT = 4_500_000;

export interface ScannerImageDebug {
  index: number;
  role: IdentifyPhotoRole | null;
  mime: string;
  dataUrlChars: number;
  estimatedBytes: number;
  width: number | null;
  height: number | null;
  dimensionError: string | null;
}

export interface ScannerDebugReport {
  generatedAt: string;
  environment: {
    openaiKeyDetected: boolean;
    plantnetKeyDetected: boolean;
    plantIdKeyDetected: boolean;
    scannerDemoMode: boolean;
    nodeEnv: string;
    onVercel: boolean;
    openaiKeyPrefix: string | null;
    plantnetKeyPrefix: string | null;
  };
  images: ScannerImageDebug[];
  payload: {
    count: number;
    totalEstimatedBytes: number;
    totalFormatted: string;
    withinAppLimit: boolean;
    withinVercelLimit: boolean;
    validationError: string | null;
  };
  openai: {
    sent: boolean;
    success: boolean;
    model: string;
    error: string | null;
    durationMs: number | null;
    rawResponse: unknown | null;
  };
  plantnet: {
    sent: boolean;
    success: boolean;
    error: string | null;
    httpStatus: number | null;
    durationMs: number | null;
    rawResponse: unknown | null;
  };
  final: {
    success: boolean;
    confidence: number | null;
    species: string | null;
    commonName: string | null;
    source: string | null;
    failureReason: string | null;
  };
}

function parseMime(dataUrl: string): string {
  return dataUrl.match(/^data:([^;]+);/)?.[1] ?? "unknown";
}

async function imageDimensions(dataUrl: string): Promise<{
  width: number | null;
  height: number | null;
  error: string | null;
}> {
  try {
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
    const buf = Buffer.from(base64, "base64");
    const meta = await sharp(buf).metadata();
    return { width: meta.width ?? null, height: meta.height ?? null, error: null };
  } catch (e) {
    return {
      width: null,
      height: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function maskKey(key: string): string | null {
  if (!key || key.length < 8) return null;
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function plantNetOrganFromRoles(roles?: IdentifyPhotoRole[]): "leaf" | "flower" | "fruit" | "bark" | "habit" {
  if (roles?.includes("flower")) return "flower";
  if (roles?.includes("leaf")) return "leaf";
  return "habit";
}

const IDENTIFY_SCHEMA = `{
  "photo_quality": { "acceptable": "boolean", "issues": [], "message": "string or null" },
  "common_name": "string",
  "scientific_name": "string",
  "confidence": "high" | "medium" | "low",
  "confidence_score": "number 0-100",
  "identification_rationale": "string",
  "top_matches": [],
  "common_lookalikes": [],
  "care_summary": "string",
  "light_needs": "string",
  "watering_needs": "string",
  "toxicity": "string",
  "care_difficulty": "Easy" | "Moderate" | "Advanced",
  "toxicity_warning": "string or null",
  "suggested_location": "indoor" | "outdoor" | "either",
  "suggested_sun": "full_sun" | "partial_sun" | "shade"
}`;

function parseOpenAiJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1]!.trim());
    throw new Error(`Invalid JSON from OpenAI: ${trimmed.slice(0, 200)}`);
  }
}

async function callOpenAiDebug(
  urls: string[],
  roles?: IdentifyPhotoRole[]
): Promise<ScannerDebugReport["openai"]> {
  const base = {
    sent: false,
    success: false,
    model: IDENTIFY_MODEL,
    error: null as string | null,
    durationMs: null as number | null,
    rawResponse: null as unknown | null,
  };

  if (!isOpenAIKeyConfigured()) {
    return { ...base, error: "OPENAI_API_KEY not configured or invalid on server" };
  }

  const labels =
    roles?.map((r, i) => {
      if (r === "whole") return `Image ${i + 1}: whole plant`;
      if (r === "leaf") return `Image ${i + 1}: leaf close-up`;
      return `Image ${i + 1}: flower, fruit, or stem detail`;
    }) ?? [];

  const userText =
    roles && roles.length > 1
      ? `You have ${roles.length} photos:\n${labels.join("\n")}\nIdentify the plant. Assess photo_quality first.`
      : "Identify this plant from the photo. Assess photo_quality first.";

  const started = Date.now();
  base.sent = true;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAIKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IDENTIFY_MODEL,
        messages: [
          {
            role: "system",
            content: `${GARDENER_SYSTEM_PROMPT}\n\nIdentify the plant. Return JSON:\n${IDENTIFY_SCHEMA}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              ...urls.map((url) => ({
                type: "image_url" as const,
                image_url: { url, detail: "auto" as const },
              })),
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.35,
        max_tokens: 1600,
      }),
      signal: AbortSignal.timeout(55_000),
    });

    base.durationMs = Date.now() - started;
    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      const errMsg =
        (body.error as { message?: string } | undefined)?.message ??
        JSON.stringify(body).slice(0, 400);
      return {
        ...base,
        error: `HTTP ${res.status}: ${errMsg}`,
        rawResponse: body,
      };
    }

    const content = (body.choices as { message?: { content?: string } }[] | undefined)?.[0]
      ?.message?.content;
    if (!content) {
      return { ...base, error: "Empty content in OpenAI response", rawResponse: body };
    }

    const parsed = parseOpenAiJson(content);
    return {
      ...base,
      success: true,
      rawResponse: parsed,
    };
  } catch (e) {
    base.durationMs = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ...base,
      error: msg.includes("abort") ? "OpenAI request timed out (55s)" : msg,
    };
  }
}

async function callPlantNetDebug(
  primaryUrl: string,
  roles?: IdentifyPhotoRole[]
): Promise<ScannerDebugReport["plantnet"]> {
  const base = {
    sent: false,
    success: false,
    error: null as string | null,
    httpStatus: null as number | null,
    durationMs: null as number | null,
    rawResponse: null as unknown | null,
  };

  const key = process.env.PLANTNET_API_KEY?.trim();
  if (!isPlantNetKeyConfigured() || !key) {
    return { ...base, error: "PLANTNET_API_KEY not configured or invalid on server" };
  }

  const [header, base64] = primaryUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(base64 ?? "", "base64");
  const blob = new Blob([bytes], { type: mime });

  const form = new FormData();
  form.append("images", blob, "plant.jpg");
  form.append("organs", plantNetOrganFromRoles(roles));

  const started = Date.now();
  base.sent = true;

  try {
    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${key}`;
    const res = await fetch(url, { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
    base.durationMs = Date.now() - started;
    base.httpStatus = res.status;

    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { rawText: text.slice(0, 500) };
    }

    if (!res.ok) {
      return {
        ...base,
        error: `HTTP ${res.status}: ${text.slice(0, 400)}`,
        rawResponse: json,
      };
    }

    return {
      ...base,
      success: true,
      rawResponse: json,
    };
  } catch (e) {
    base.durationMs = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ...base,
      error: msg.includes("abort") ? "PlantNet request timed out (30s)" : msg,
    };
  }
}

export async function runScannerDebug(
  urls: string[],
  roles?: IdentifyPhotoRole[]
): Promise<ScannerDebugReport> {
  const images: ScannerImageDebug[] = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    const dims = await imageDimensions(url);
    images.push({
      index: i,
      role: roles?.[i] ?? null,
      mime: parseMime(url),
      dataUrlChars: url.length,
      estimatedBytes: estimateDataUrlBytes(url),
      width: dims.width,
      height: dims.height,
      dimensionError: dims.error,
    });
  }

  const totalEstimatedBytes = totalDataUrlBytes(urls);
  const validationError = validatePhotoPayload(urls);

  const openai = await callOpenAiDebug(urls, roles);
  const plantnet = await callPlantNetDebug(urls[0] ?? "", roles);

  let success = openai.success;
  let failureReason: string | null = null;

  if (!openai.success) {
    failureReason = openai.error;
  } else if (validationError) {
    failureReason = validationError;
    success = false;
  } else if (images.some((img) => img.dimensionError)) {
    failureReason = `Invalid image data: ${images.find((img) => img.dimensionError)?.dimensionError}`;
    success = false;
  }

  const openaiRaw = openai.rawResponse as Record<string, unknown> | null;
  const commonName =
    typeof openaiRaw?.common_name === "string"
      ? openaiRaw.common_name
      : openaiRaw?.common_name === null
        ? null
        : null;
  const species =
    typeof openaiRaw?.scientific_name === "string" ? openaiRaw.scientific_name : null;
  const confidence =
    typeof openaiRaw?.confidence_score === "number" ? openaiRaw.confidence_score : null;

  return {
    generatedAt: new Date().toISOString(),
    environment: {
      openaiKeyDetected: isOpenAIKeyConfigured(),
      plantnetKeyDetected: isPlantNetKeyConfigured(),
      plantIdKeyDetected: isPlantIdEnabled(),
      scannerDemoMode: isScannerDemoModeEnabled(),
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      onVercel: Boolean(process.env.VERCEL),
      openaiKeyPrefix: maskKey(getOpenAIKey()),
      plantnetKeyPrefix: maskKey(process.env.PLANTNET_API_KEY?.trim() ?? ""),
    },
    images,
    payload: {
      count: urls.length,
      totalEstimatedBytes,
      totalFormatted: formatBytes(totalEstimatedBytes),
      withinAppLimit: totalEstimatedBytes <= SCAN_MAX_TOTAL_BYTES,
      withinVercelLimit: totalEstimatedBytes * 1.34 <= VERCEL_BODY_LIMIT,
      validationError,
    },
    openai,
    plantnet,
    final: {
      success,
      confidence,
      species,
      commonName,
      source: openai.success ? "openai" : null,
      failureReason,
    },
  };
}
