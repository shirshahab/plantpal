export const PLANT_PHOTOS_BUCKET = "plant-photos";

export type PhotoUploadCategory =
  | "profile"
  | "health_scan"
  | "growth"
  | "nursery_tag"
  | "identification";

function extensionFromFile(file: Blob): string {
  if (file instanceof File && file.name.includes(".")) {
    return file.name.split(".").pop()!.toLowerCase();
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/** Upload from browser (authenticated user). Returns public URL or null. */
export async function uploadPlantPhotoClient(
  supabase: {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          file: Blob,
          opts?: { contentType?: string; upsert?: boolean }
        ) => Promise<{ error: { message: string } | null }>;
        getPublicUrl: (path: string) => { data: { publicUrl: string } };
      };
    };
  },
  userId: string,
  file: Blob | File,
  category: PhotoUploadCategory
): Promise<string | null> {
  const ext = extensionFromFile(file);
  const path = `${userId}/${category}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(PLANT_PHOTOS_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    console.error("Photo upload failed:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Convert data URL to Blob for upload. Works in browser and Node. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) {
    throw new Error("Invalid data URL — missing base64 payload");
  }
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

  if (typeof Buffer !== "undefined") {
    const bytes = Buffer.from(base64, "base64");
    return new Blob([bytes], { type: mime });
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
