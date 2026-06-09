import sharp from "sharp";
import type { IdentifyPhotoRole } from "@/lib/ai/plant-identify";
import { OPENAI_VISION_MODEL } from "@/lib/ai/openai";
import { GARDENER_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  getOpenAIKey,
  isOpenAIKeyConfigured,
  isPlantNetKeyConfigured,
} from "@/lib/integrations/env-config";
import { probeOpenAI } from "@/lib/integrations/probe";
import { isPlantIdEnabled } from "@/lib/integrations/plantid";
import { identifyPlantFromImageDetailed } from "@/lib/integrations/plantnet";
import { isScannerDemoModeEnabled } from "@/lib/scanner/demo-mode";
import {
  normalizeDataUrlsForVision,
  SUPPORTED_SCANNER_MIMES,
  type NormalizedScanImage,
} from "@/lib/scanner/normalize-image";
import {
  estimateDataUrlBytes,
  formatBytes,
  totalDataUrlBytes,
  SCAN_MAX_TOTAL_BYTES,
  validatePhotoPayload,
} from "@/lib/scanner/upload-limits";

const VERCEL_BODY_LIMIT = 4_500_000;

export interface ScannerImageDebug {
  index: number;
  role: IdentifyPhotoRole | null;
  mime: string;
  originalMime: string;
  converted: boolean;
  dataUrlChars: number;
  estimatedBytes: number;
  width: number | null;
  height: number | null;
  dimensionError: string | null;
  base64Valid: boolean;
}

export interface ScannerEnvDebug {
  openaiKeyDetected: boolean;
  openaiKeyAvailable: boolean;
  openaiAuthOk: boolean | null;
  openaiAuthError: string | null;
  plantnetKeyDetected: boolean;
  plantnetKeyAvailable: boolean;
  plantIdKeyDetected: boolean;
  scannerDemoMode: boolean;
  nodeEnv: string;
  onVercel: boolean;
  vercelEnv: string | null;
  openaiKeyPrefix: string | null;
  plantnetKeyPrefix: string | null;
  supportedFormats: readonly string[];
  visionModel: string;
}

export interface ScannerDebugReport {
  generatedAt: string;
  environment: ScannerEnvDebug;
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
    httpStatus: number | null;
    error: string | null;
    errorBody: unknown | null;
    durationMs: number | null;
    rawResponse: unknown | null;
  };
  plantnet: {
    sent: boolean;
    success: boolean;
    error: string | null;
    httpStatus: number | null;
    errorBody: unknown | null;
    durationMs: number | null;
    rawResponse: unknown | null;
  };
  final: {
    success: boolean;
    confidence: number | null;
    species: string | null;
    commonName: string | null;
    source: string | null;
    provider: string | null;
    failureReason: string | null;
    failureStep: string | null;
  };
}

function parseMime(dataUrl: string): string {
  return dataUrl.match(/^data:([^;]+);/)?.[1] ?? "unknown";
}

function isValidBase64DataUrl(dataUrl: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(
    dataUrl.replace(/\s/g, "")
  );
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

export async function probeScannerEnvironment(): Promise<ScannerEnvDebug> {
  const openaiKeyDetected = isOpenAIKeyConfigured();
  const plantnetKeyDetected = isPlantNetKeyConfigured();
  const openaiProbe = openaiKeyDetected ? await probeOpenAI() : null;

  return {
    openaiKeyDetected,
    openaiKeyAvailable: openaiKeyDetected,
    openaiAuthOk: openaiProbe?.authOk ?? null,
    openaiAuthError: openaiProbe?.error ?? null,
    plantnetKeyDetected,
    plantnetKeyAvailable: plantnetKeyDetected,
    plantIdKeyDetected: isPlantIdEnabled(),
    scannerDemoMode: isScannerDemoModeEnabled(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    onVercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    openaiKeyPrefix: openaiKeyDetected ? maskKey(getOpenAIKey()) : null,
    plantnetKeyPrefix: maskKey(process.env.PLANTNET_API_KEY?.trim() ?? ""),
    supportedFormats: SUPPORTED_SCANNER_MIMES,
    visionModel: OPENAI_VISION_MODEL,
  };
}

async function callOpenAiDebug(
  urls: string[],
  roles?: IdentifyPhotoRole[]
): Promise<ScannerDebugReport["openai"]> {
  const base = {
    sent: false,
    success: false,
    model: OPENAI_VISION_MODEL,
    httpStatus: null as number | null,
    error: null as string | null,
    errorBody: null as unknown | null,
    durationMs: null as number | null,
    rawResponse: null as unknown | null,
  };

  if (!isOpenAIKeyConfigured()) {
    return { ...base, error: "OPENAI_API_KEY missing in production env" };
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
        model: OPENAI_VISION_MODEL,
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
    base.httpStatus = res.status;
    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      const errMsg =
        (body.error as { message?: string } | undefined)?.message ??
        JSON.stringify(body).slice(0, 400);
      return {
        ...base,
        error: `OpenAI HTTP ${res.status}: ${errMsg}`,
        errorBody: body,
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
  const result = await identifyPlantFromImageDetailed({
    imageDataUrl: primaryUrl,
    organ: plantNetOrganFromRoles(roles),
  });

  return {
    sent: isPlantNetKeyConfigured(),
    success: result.suggestions.length > 0 && !result.error,
    error: result.error,
    httpStatus: result.httpStatus,
    errorBody: result.error ? result.errorBody : null,
    durationMs: result.durationMs,
    rawResponse: result.suggestions.length > 0 ? result.suggestions : result.errorBody,
  };
}

function buildImageDebug(
  normalized: NormalizedScanImage[],
  roles?: IdentifyPhotoRole[]
): ScannerImageDebug[] {
  return normalized.map((img, i) => ({
    index: i,
    role: roles?.[i] ?? null,
    mime: img.mime,
    originalMime: img.originalMime,
    converted: img.converted,
    dataUrlChars: img.dataUrl.length,
    estimatedBytes: img.bytes,
    width: img.width,
    height: img.height,
    dimensionError: null,
    base64Valid: isValidBase64DataUrl(img.dataUrl),
  }));
}

export async function runScannerDebug(
  rawUrls: string[],
  roles?: IdentifyPhotoRole[]
): Promise<ScannerDebugReport> {
  const environment = await probeScannerEnvironment();

  let normalized: NormalizedScanImage[];
  try {
    normalized = await normalizeDataUrlsForVision(rawUrls);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      generatedAt: new Date().toISOString(),
      environment,
      images: rawUrls.map((url, i) => ({
        index: i,
        role: roles?.[i] ?? null,
        mime: parseMime(url),
        originalMime: parseMime(url),
        converted: false,
        dataUrlChars: url.length,
        estimatedBytes: estimateDataUrlBytes(url),
        width: null,
        height: null,
        dimensionError: msg,
        base64Valid: isValidBase64DataUrl(url),
      })),
      payload: {
        count: rawUrls.length,
        totalEstimatedBytes: totalDataUrlBytes(rawUrls),
        totalFormatted: formatBytes(totalDataUrlBytes(rawUrls)),
        withinAppLimit: false,
        withinVercelLimit: false,
        validationError: msg,
      },
      openai: {
        sent: false,
        success: false,
        model: OPENAI_VISION_MODEL,
        httpStatus: null,
        error: null,
        errorBody: null,
        durationMs: null,
        rawResponse: null,
      },
      plantnet: {
        sent: false,
        success: false,
        error: null,
        httpStatus: null,
        errorBody: null,
        durationMs: null,
        rawResponse: null,
      },
      final: {
        success: false,
        confidence: null,
        species: null,
        commonName: null,
        source: null,
        provider: null,
        failureReason: msg,
        failureStep: "image_encoding",
      },
    };
  }

  const urls = normalized.map((n) => n.dataUrl);
  const images = buildImageDebug(normalized, roles);
  const totalEstimatedBytes = normalized.reduce((sum, img) => sum + img.bytes, 0);
  const validationError = validatePhotoPayload(urls);

  const openai = await callOpenAiDebug(urls, roles);
  const plantnet = await callPlantNetDebug(urls[0] ?? "", roles);

  let success = openai.success || plantnet.success;
  let failureReason: string | null = null;
  let failureStep: string | null = null;
  let source: string | null = null;
  let provider: string | null = null;

  if (openai.success) {
    source = "openai";
    provider = "openai";
  } else if (plantnet.success) {
    source = "ai";
    provider = "plantnet";
    failureStep = "openai_vision";
    failureReason = openai.error;
  } else if (!openai.success) {
    failureStep = "openai_vision";
    failureReason = openai.error;
    success = false;
  }

  if (validationError) {
    failureReason = validationError;
    failureStep = "payload_validation";
    success = false;
  }

  if (images.some((img) => img.dimensionError)) {
    failureReason = `Invalid image data: ${images.find((img) => img.dimensionError)?.dimensionError}`;
    failureStep = "image_encoding";
    success = false;
  }

  if (!openai.success && !plantnet.success && plantnet.error) {
    failureReason = plantnet.error;
    failureStep = "plantnet_identify";
    success = false;
  }

  const openaiRaw = openai.rawResponse as Record<string, unknown> | null;
  const plantnetRaw = plantnet.rawResponse as { species?: string; commonNames?: string[]; score?: number }[] | null;

  const commonName = openai.success
    ? typeof openaiRaw?.common_name === "string"
      ? openaiRaw.common_name
      : null
    : plantnetRaw?.[0]?.commonNames?.[0] ?? null;

  const species = openai.success
    ? typeof openaiRaw?.scientific_name === "string"
      ? openaiRaw.scientific_name
      : null
    : plantnetRaw?.[0]?.species ?? null;

  const confidence = openai.success
    ? typeof openaiRaw?.confidence_score === "number"
      ? openaiRaw.confidence_score
      : null
    : plantnetRaw?.[0]?.score ?? null;

  return {
    generatedAt: new Date().toISOString(),
    environment,
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
      source,
      provider,
      failureReason,
      failureStep,
    },
  };
}
