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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return aiError("Invalid JSON body");
  }

  const { urls, roles } = parseImages(body);
  if (urls.length === 0) {
    return aiError("At least one image (imageDataUrl or imageDataUrls) is required");
  }

  const primaryUrl = urls[0];

  try {
    const result = await identifyPlantFromPhoto(urls, roles);
    if (result.source === "ai") {
      recordDataSource("openai", "real_api");
    } else {
      recordDataSource("openai", "mock", { fallback: true });
    }

    const plantnetEnabled = isPlantNetEnabled();
    const plantnetSecondOpinion = plantnetEnabled
      ? await identifyWithPlantNet({ imageDataUrl: primaryUrl })
      : [];

    if (plantnetSecondOpinion.length > 0) {
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
    recordDataSource("openai", "mock", { fallback: true, error: "Identification failed" });
    return aiError(e instanceof Error ? e.message : "Identification failed", 500);
  }
}
