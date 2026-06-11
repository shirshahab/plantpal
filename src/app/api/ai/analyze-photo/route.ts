import { analyzePlantPhoto, toDoctorReportPayload } from "@/lib/ai/analyze-photo";
import { saveDoctorReport } from "@/lib/ai/persist";
import {
  aiError,
  aiSuccess,
  getAuthUserId,
  optionalString,
  requireString,
} from "@/lib/ai/route-utils";
import {
  handleAnalysisRouteError,
  parseJsonBody,
} from "@/lib/ai/parse-request-body";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dataUrlToBlob } from "@/lib/storage/plant-photos";
import { uploadPlantPhotoServer } from "@/lib/storage/plant-photos-server";
import {
  estimateDataUrlBytes,
  formatBytes,
  validatePhotoPayload,
} from "@/lib/scanner/upload-limits";
import { normalizeDataUrlsForVision } from "@/lib/scanner/normalize-image";

export const dynamic = "force-dynamic";

const ROUTE = "api/ai/analyze-photo";

function parseStringArray(body: Record<string, unknown>, key: string): string[] {
  const value = body[key];
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, ROUTE);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { body, payloadBytes } = parsed.data;

  // Accept multi-photo payloads while staying compatible with single-photo clients.
  const multiUrls = parseStringArray(body, "imageDataUrls");
  const singleUrl = requireString(body, "imageDataUrl");
  const rawUrls = multiUrls.length > 0 ? multiUrls : singleUrl ? [singleUrl] : [];
  if (rawUrls.length === 0) return aiError("imageDataUrl is required");

  const payloadError = validatePhotoPayload(rawUrls);
  if (payloadError) return aiError(payloadError, 413);

  const plantId = optionalString(body, "plantId");
  const nickname = optionalString(body, "nickname");
  const species = optionalString(body, "species");
  const zipCode = optionalString(body, "zipCode");
  const locationType = optionalString(body, "locationType");
  const userDescription = optionalString(body, "userDescription");
  const symptoms = parseStringArray(body, "symptoms").slice(0, 12);
  const lastWateredAt = optionalString(body, "lastWateredAt");
  const lastFertilizedAt = optionalString(body, "lastFertilizedAt");

  // Scanner reliability log — no image data, no secrets.
  console.info(`[${ROUTE}] diagnosis request`, {
    payload: formatBytes(payloadBytes),
    imageCount: rawUrls.length,
    imageTypes: rawUrls.map((u) => u.slice(5, u.indexOf(";")) || "unknown"),
    imageBytes: rawUrls.map(estimateDataUrlBytes),
    hasDescription: Boolean(userDescription?.trim()),
    symptomChips: symptoms,
    speciesKnown: Boolean(species),
    openaiConfigured: isOpenAIConfigured(),
  });

  try {
    const normalized = await normalizeDataUrlsForVision(rawUrls);
    const urls = normalized.map((img) => img.dataUrl);

    const report = await analyzePlantPhoto(urls, {
      nickname,
      species,
      zipCode,
      locationType,
      userDescription,
      symptoms,
      lastWateredAt,
      lastFertilizedAt,
    });

    console.info(`[${ROUTE}] diagnosis result`, {
      source: report.source,
      plantIdConfidence: report.plant_id_confidence,
      diagnosisConfidence: report.confidence,
      severity: report.severity,
      infoNeeded: report.info_needed.length,
    });

    let saved = false;
    let photoUrl = "";
    const userId = await getAuthUserId();
    const primaryUrl = urls[0]!;

    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      const blob = dataUrlToBlob(primaryUrl);
      photoUrl =
        (await uploadPlantPhotoServer(supabase, userId, blob, "health_scan")) ?? "";

      if (plantId) {
        saved = await saveDoctorReport(
          supabase,
          userId,
          plantId,
          photoUrl,
          toDoctorReportPayload(report)
        );

        if (photoUrl) {
          await supabase.from("plant_photos").insert({
            user_id: userId,
            plant_id: plantId,
            photo_url: photoUrl,
            photo_type: "health_scan",
            notes: report.issue_detected,
            metadata: report,
            is_primary: false,
          });
        }
      } else if (photoUrl) {
        await supabase.from("plant_photos").insert({
          user_id: userId,
          plant_id: null,
          photo_url: photoUrl,
          photo_type: "health_scan",
          notes: report.issue_detected,
          metadata: report,
          is_primary: false,
        });
        saved = true;
      }
    }

    return aiSuccess(report, saved);
  } catch (e) {
    return handleAnalysisRouteError(ROUTE, e, payloadBytes);
  }
}
