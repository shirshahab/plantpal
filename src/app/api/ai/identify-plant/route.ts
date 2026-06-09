import { identifyPlantFromPhoto } from "@/lib/ai/plant-identify";
import type { IdentifyPhotoRole } from "@/lib/ai/plant-identify";
import { NextResponse } from "next/server";
import { finalizeIdentification } from "@/lib/ai/identification-consensus";
import {
  identifyPlantFromImage as identifyWithPlantNet,
  isPlantNetEnabled,
} from "@/lib/integrations/plantnet";
import {
  aiError,
  aiSuccess,
  getAuthUserId,
} from "@/lib/ai/route-utils";
import {
  IdentificationFailedError,
  logIdentifyDebug,
} from "@/lib/ai/identify-errors";
import { parseJsonBody } from "@/lib/ai/parse-request-body";
import { isOpenAIConfigured, OPENAI_VISION_MODEL } from "@/lib/ai/openai";
import type { AIApiResponse } from "@/lib/types/ai";
import { isPlantIdEnabled } from "@/lib/integrations/plantid";
import { isScannerDemoModeEnabled } from "@/lib/scanner/demo-mode";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dataUrlToBlob } from "@/lib/storage/plant-photos";
import { uploadPlantPhotoServer } from "@/lib/storage/plant-photos-server";
import {
  checkRateLimit,
  dailyLimitKey,
  getClientKey,
  RATE_LIMITS,
} from "@/lib/api/rate-limit";
import { recordDataSource } from "@/lib/data-sources/runtime";
import { formatBytes, totalDataUrlBytes, validatePhotoPayload } from "@/lib/scanner/upload-limits";
import {
  ImageNormalizeError,
  normalizeDataUrlsForVision,
} from "@/lib/scanner/normalize-image";
import { redactSecrets } from "@/lib/ai/redact-secrets";
import { probeOpenAI } from "@/lib/integrations/probe";
import { isOpenAIKeyConfigured, isPlantNetKeyConfigured } from "@/lib/integrations/env-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROUTE = "api/ai/identify-plant";

function parseImages(body: Record<string, unknown>): {
  urls: string[];
  roles?: IdentifyPhotoRole[];
} {
  const roles = Array.isArray(body.photoRoles)
    ? (body.photoRoles.filter((r) =>
        r === "whole" || r === "leaf" || r === "flower"
      ) as IdentifyPhotoRole[])
    : undefined;

  if (Array.isArray(body.imageDataUrls)) {
    const urls = body.imageDataUrls.filter(
      (u): u is string => typeof u === "string" && u.startsWith("data:")
    );
    if (urls.length > 0) return { urls: urls.slice(0, 3), roles };
  }

  const single = body.imageDataUrl;
  if (typeof single === "string" && single.startsWith("data:")) {
    return { urls: [single], roles: roles?.length ? roles.slice(0, 1) : ["whole"] };
  }

  return { urls: [] };
}

function plantNetOrganFromRoles(roles?: IdentifyPhotoRole[]): "leaf" | "flower" | "fruit" | "bark" | "habit" {
  if (roles?.includes("flower")) return "flower";
  if (roles?.includes("leaf")) return "leaf";
  return "habit";
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  const clientKey = getClientKey(request, userId);
  const daily = checkRateLimit(
    dailyLimitKey("ai-scan", clientKey),
    RATE_LIMITS.aiScanDaily,
    24 * 60 * 60 * 1000
  );
  if (!daily.allowed) {
    return aiError("Daily plant scan limit reached. Try again tomorrow.", 429);
  }

  const burst = checkRateLimit(`ai-scan-burst:${clientKey}`, 5, 60_000);
  if (!burst.allowed) {
    return aiError("Too many scans — wait a minute and try again.", 429);
  }

  const parsed = await parseJsonBody(request, ROUTE);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { body, payloadBytes } = parsed.data;
  const { urls: rawUrls, roles } = parseImages(body);
  if (rawUrls.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "At least one image (imageDataUrl or imageDataUrls) is required",
        failureReason: "No image data in request",
        failureStep: "request_validation",
      },
      { status: 400 }
    );
  }

  const payloadError = validatePhotoPayload(rawUrls);
  if (payloadError) {
    return NextResponse.json(
      {
        ok: false,
        error: payloadError,
        failureReason: payloadError,
        failureStep: "payload_validation",
      },
      { status: 413 }
    );
  }

  let urls: string[];
  let imageMeta: Awaited<ReturnType<typeof normalizeDataUrlsForVision>>;
  try {
    imageMeta = await normalizeDataUrlsForVision(rawUrls);
    urls = imageMeta.map((img) => img.dataUrl);
  } catch (e) {
    const message =
      e instanceof ImageNormalizeError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Image encoding failed";
    console.error(`[${ROUTE}] image normalize failed`, { error: message });
    return NextResponse.json(
      {
        ok: false,
        error: message,
        failureReason: message,
        failureStep: "image_encoding",
      },
      { status: 400 }
    );
  }

  const primaryUrl = urls[0]!;

  const openaiKeyPresent = isOpenAIKeyConfigured();
  const plantnetKeyPresent = isPlantNetKeyConfigured();
  const openaiProbe = openaiKeyPresent ? await probeOpenAI() : null;

  console.info(`[${ROUTE}] start`, {
    openaiKeyPresent,
    openaiAuthOk: openaiProbe?.authOk ?? null,
    plantnetKeyPresent,
    plantId: isPlantIdEnabled(),
    model: OPENAI_VISION_MODEL,
    imageCount: urls.length,
    images: imageMeta.map((img, i) => ({
      index: i,
      originalMime: img.originalMime,
      converted: img.converted,
      width: img.width,
      height: img.height,
      bytes: img.bytes,
    })),
    totalImageBytes: totalDataUrlBytes(urls),
    payload: formatBytes(payloadBytes),
  });

  const forceDemo =
    body.demoMode === true || isScannerDemoModeEnabled();

  try {
    const result = await identifyPlantFromPhoto(urls, roles, { forceDemo });

    logIdentifyDebug(ROUTE, {
      openaiKeyConfigured: isOpenAIConfigured(),
      plantnetKeyConfigured: isPlantNetEnabled(),
      plantIdKeyConfigured: isPlantIdEnabled(),
      imageCount: urls.length,
      imageBytes: imageMeta.map((img) => img.bytes),
      responseSource: result.source,
      identificationProvider: result.identification_provider,
      fallbackReason: result.source === "mock" ? "demo_or_no_keys" : null,
      openaiRawPreview: null,
      openaiError: null,
      plantnetRawPreview: null,
      plantnetError: null,
      failureStep: null,
    });

    if (result.source === "ai") {
      recordDataSource(
        result.identification_provider === "plantnet" ? "plantnet" : "openai",
        "real_api"
      );
    } else {
      recordDataSource("openai", "mock", { fallback: true });
    }

    const plantnetEnabled = isPlantNetEnabled();
    const plantnetSecondOpinion =
      plantnetEnabled && result.identification_provider !== "plantnet"
        ? await identifyWithPlantNet({
            imageDataUrl: primaryUrl,
            organ: plantNetOrganFromRoles(roles),
          })
        : [];

    if (plantnetSecondOpinion.length > 0) {
      console.info(
        `[${ROUTE}] Pl@ntNet second opinion:`,
        JSON.stringify(plantnetSecondOpinion.slice(0, 3)).slice(0, 500)
      );
      recordDataSource("plantnet", "real_api");
    } else if (plantnetEnabled && result.identification_provider !== "plantnet") {
      recordDataSource("plantnet", "real_api", { error: "No matches returned" });
    }

    const enriched = finalizeIdentification(
      {
        ...result,
        ...(plantnetSecondOpinion.length > 0
          ? { plantnet_second_opinion: plantnetSecondOpinion }
          : {}),
      },
      plantnetSecondOpinion,
      plantnetEnabled
    );

    console.info(`[${ROUTE}] success`, {
      source: enriched.source,
      provider: enriched.identification_provider,
      common_name: enriched.common_name,
      scientific_name: enriched.scientific_name,
      providers_disagree: enriched.providers_disagree,
    });

    let saved = false;
    if (userId && isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const blob = dataUrlToBlob(primaryUrl);
        const photoUrl = await uploadPlantPhotoServer(supabase, userId, blob, "identification");
        if (photoUrl) {
          const { error } = await supabase.from("plant_photos").insert({
            user_id: userId,
            plant_id: null,
            photo_url: photoUrl,
            photo_type: "identification",
            notes: `Identified as ${enriched.common_name}`,
            metadata: {
              ...enriched,
              photo_count: urls.length,
              added_to_garden: false,
            },
            is_primary: false,
          });
          saved = !error;
          if (error) {
            console.error(`[${ROUTE}] scan history save failed:`, error.message);
          }
        }
      } catch (saveErr) {
        console.error(`[${ROUTE}] photo save failed after successful ID:`, saveErr);
      }
    }

    return aiSuccess(enriched, saved);
  } catch (e) {
    if (e instanceof IdentificationFailedError) {
      logIdentifyDebug(ROUTE, e.debug);
      recordDataSource("openai", "mock", {
        fallback: true,
        error: e.debug.fallbackReason ?? "identification_failed",
      });
      const failureReason = redactSecrets(
        e.debug.plantnetError ??
          e.debug.openaiError ??
          e.debug.fallbackReason ??
          e.message
      );
      const failureStep = e.debug.failureStep ?? "identification";
      console.error(`[${ROUTE}] identification failed`, {
        failureStep,
        failureReason,
        openaiError: e.debug.openaiError,
        plantnetError: e.debug.plantnetError,
        imageCount: e.debug.imageCount,
        imageBytes: e.debug.imageBytes,
      });
      return NextResponse.json(
        {
          ok: false,
          error: redactSecrets(e.message),
          failureReason,
          failureStep,
          debug: e.debug,
        } satisfies AIApiResponse<never> & {
          failureReason: string;
          failureStep: string;
          debug: typeof e.debug;
        },
        { status: 502 }
      );
    }

    recordDataSource("openai", "mock", { fallback: true, error: "Identification failed" });
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[${ROUTE}] unexpected error`, { error: message });
    return NextResponse.json(
      {
        ok: false,
        error: message,
        failureReason: message,
        failureStep: "unexpected",
      },
      { status: 502 }
    );
  }
}
