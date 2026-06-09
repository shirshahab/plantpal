import { identifyPlantFromPhoto } from "@/lib/ai/plant-identify";
import type { IdentifyPhotoRole } from "@/lib/ai/plant-identify";
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
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { LIVE_IDENTIFICATION_FAILED } from "@/lib/ai/messages";
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
import { formatBytes, totalDataUrlBytes } from "@/lib/scanner/upload-limits";

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
  const { urls, roles } = parseImages(body);
  if (urls.length === 0) {
    return aiError("At least one image (imageDataUrl or imageDataUrls) is required");
  }

  const primaryUrl = urls[0];

  console.info(`[${ROUTE}] keys`, {
    openai: isOpenAIConfigured(),
    plantnet: isPlantNetEnabled(),
    plantId: isPlantIdEnabled(),
    imageCount: urls.length,
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
      imageBytes: urls.map((u) => Math.round(u.length * 0.75)),
      responseSource: result.source,
      identificationProvider: result.identification_provider,
      fallbackReason: result.source === "mock" ? "demo_or_no_keys" : null,
      openaiRawPreview: null,
      openaiError: null,
      plantnetRawPreview: null,
    });

    if (result.source === "ai") {
      recordDataSource("openai", "real_api");
    } else {
      recordDataSource("openai", "mock", { fallback: true });
    }

    const plantnetEnabled = isPlantNetEnabled();
    const plantnetSecondOpinion = plantnetEnabled
      ? await identifyWithPlantNet({
          imageDataUrl: primaryUrl,
          organ: plantNetOrganFromRoles(roles),
        })
      : [];

    if (plantnetSecondOpinion.length > 0) {
      console.info(
        `[${ROUTE}] Pl@ntNet raw:`,
        JSON.stringify(plantnetSecondOpinion.slice(0, 3)).slice(0, 500)
      );
      recordDataSource("plantnet", "real_api");
    } else if (plantnetEnabled) {
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

    console.info(`[${ROUTE}] final`, {
      source: enriched.source,
      provider: enriched.identification_provider,
      common_name: enriched.common_name,
      scientific_name: enriched.scientific_name,
      providers_disagree: enriched.providers_disagree,
    });

    let saved = false;
    if (userId && isSupabaseConfigured()) {
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
      return aiError(e.message, 502);
    }

    recordDataSource("openai", "mock", { fallback: true, error: "Identification failed" });
    console.error(`[${ROUTE}] unexpected error`, e);
    return aiError(LIVE_IDENTIFICATION_FAILED, 502);
  }
}
