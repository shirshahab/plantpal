import { identifyPlantFromPhoto } from "@/lib/ai/plant-identify";
import { identifyPlantFromImage as identifyWithPlantNet } from "@/lib/integrations/plantnet";
import {
  aiError,
  aiSuccess,
  getAuthUserId,
  requireString,
} from "@/lib/ai/route-utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dataUrlToBlob } from "@/lib/storage/plant-photos";
import { uploadPlantPhotoServer } from "@/lib/storage/plant-photos-server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return aiError("Invalid JSON body");
  }

  const imageDataUrl = requireString(body, "imageDataUrl");
  if (!imageDataUrl) return aiError("imageDataUrl is required");

  try {
    const result = await identifyPlantFromPhoto(imageDataUrl);
    const plantnetSecondOpinion = await identifyWithPlantNet({ imageDataUrl });
    const enriched = {
      ...result,
      ...(plantnetSecondOpinion.length > 0
        ? { plantnet_second_opinion: plantnetSecondOpinion }
        : {}),
    };

    let saved = false;
    const userId = await getAuthUserId();
    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      const blob = dataUrlToBlob(imageDataUrl);
      const photoUrl = await uploadPlantPhotoServer(supabase, userId, blob, "identification");
      if (photoUrl) {
        const { error } = await supabase.from("plant_photos").insert({
          user_id: userId,
          plant_id: null,
          photo_url: photoUrl,
          photo_type: "identification",
          notes: `Identified as ${enriched.common_name}`,
          metadata: enriched,
          is_primary: false,
        });
        saved = !error;
      }
    }

    return aiSuccess(enriched, saved);
  } catch (e) {
    return aiError(e instanceof Error ? e.message : "Identification failed", 500);
  }
}
