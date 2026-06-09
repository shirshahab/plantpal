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
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dataUrlToBlob } from "@/lib/storage/plant-photos";
import { uploadPlantPhotoServer } from "@/lib/storage/plant-photos-server";
import { formatBytes } from "@/lib/scanner/upload-limits";

export const dynamic = "force-dynamic";

const ROUTE = "api/ai/analyze-photo";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, ROUTE);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { body, payloadBytes } = parsed.data;
  const imageDataUrl = requireString(body, "imageDataUrl");
  if (!imageDataUrl) return aiError("imageDataUrl is required");

  const plantId = optionalString(body, "plantId");
  const nickname = optionalString(body, "nickname");
  const species = optionalString(body, "species");
  const zipCode = optionalString(body, "zipCode");
  const locationType = optionalString(body, "locationType");

  console.info(`[${ROUTE}] analyzing photo, payload ${formatBytes(payloadBytes)}`);

  try {
    const report = await analyzePlantPhoto(imageDataUrl, {
      nickname,
      species,
      zipCode,
      locationType,
    });

    let saved = false;
    let photoUrl = "";
    const userId = await getAuthUserId();

    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      const blob = dataUrlToBlob(imageDataUrl);
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
