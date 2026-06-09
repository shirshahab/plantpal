import { scanNurseryTag } from "@/lib/ai/scan-tag";
import {
  aiError,
  aiSuccess,
  getAuthUserId,
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

const ROUTE = "api/ai/scan-tag";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, ROUTE);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { body, payloadBytes } = parsed.data;
  const imageDataUrl = requireString(body, "imageDataUrl");
  if (!imageDataUrl) return aiError("imageDataUrl is required");

  console.info(`[${ROUTE}] scanning tag, payload ${formatBytes(payloadBytes)}`);

  try {
    const result = await scanNurseryTag(imageDataUrl);

    let saved = false;
    const userId = await getAuthUserId();
    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      const blob = dataUrlToBlob(imageDataUrl);
      const photoUrl = await uploadPlantPhotoServer(supabase, userId, blob, "nursery_tag");
      if (photoUrl) {
        const { error } = await supabase.from("plant_photos").insert({
          user_id: userId,
          plant_id: null,
          photo_url: photoUrl,
          photo_type: "nursery_tag",
          notes: result.plant_name,
          metadata: result,
          is_primary: false,
        });
        saved = !error;
      }
    }

    return aiSuccess(result, saved);
  } catch (e) {
    return handleAnalysisRouteError(ROUTE, e, payloadBytes);
  }
}
