import { compressImageFile } from "@/lib/scanner/compress-image";

export const LANDSCAPE_PHOTOS_BUCKET = "landscape-photos";

export type YardPhotoSlot = "front_yard" | "back_yard" | "side_yard";

export async function uploadLandscapePhoto(
  file: File,
  slot: YardPhotoSlot
): Promise<{ storageUrl: string | null; dataUrl: string }> {
  // Compress before anything else — raw mobile camera photos (3–8MB each)
  // blow past serverless body limits and localStorage quota.
  let dataUrl: string;
  try {
    dataUrl = await compressImageFile(file);
  } catch {
    dataUrl = await readFileAsDataUrl(file);
  }

  try {
    const form = new FormData();
    form.append("file", file);
    form.append("slot", slot);
    const res = await fetch("/api/landscape/photos", { method: "POST", body: form });
    const json = (await res.json()) as { ok: boolean; url?: string };
    if (json.ok && json.url) {
      return { storageUrl: json.url, dataUrl };
    }
  } catch {
    /* local fallback */
  }

  return { storageUrl: null, dataUrl };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
