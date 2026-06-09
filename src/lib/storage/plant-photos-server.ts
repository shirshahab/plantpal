import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PLANT_PHOTOS_BUCKET,
  type PhotoUploadCategory,
} from "./plant-photos";

function extensionFromBlob(blob: Blob): string {
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/webp") return "webp";
  return "jpg";
}

/** Server-side upload helper for API routes. */
export async function uploadPlantPhotoServer(
  supabase: SupabaseClient,
  userId: string,
  file: Blob,
  category: PhotoUploadCategory
): Promise<string | null> {
  const ext = extensionFromBlob(file);
  const path = `${userId}/${category}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(PLANT_PHOTOS_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    console.error("Server photo upload failed:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
