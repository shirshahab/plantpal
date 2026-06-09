import { estimateDataUrlBytes } from "@/lib/scanner/upload-limits";

/** Max decoded size for offline scan-history preview (~30 KB). */
export const SCAN_HISTORY_THUMBNAIL_MAX_BYTES = 30 * 1024;
const THUMBNAIL_MAX_EDGE = 96;

function scaleToMaxEdge(width: number, height: number, maxEdge: number) {
  if (width <= maxEdge && height <= maxEdge) return { width, height };
  if (width >= height) {
    return { width: maxEdge, height: Math.round(height * (maxEdge / width)) };
  }
  return { width: Math.round(width * (maxEdge / height)), height: maxEdge };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for thumbnail"));
    img.src = dataUrl;
  });
}

/** Tiny JPEG preview for offline scan history — null if it cannot fit under 30 KB. */
export async function buildScanHistoryThumbnail(dataUrl: string): Promise<string | null> {
  if (typeof window === "undefined" || !dataUrl.startsWith("data:")) return null;

  try {
    const img = await loadImage(dataUrl);
    const { width, height } = scaleToMaxEdge(img.width, img.height, THUMBNAIL_MAX_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.5, 0.4, 0.3, 0.2, 0.12]) {
      const thumb = canvas.toDataURL("image/jpeg", quality);
      if (estimateDataUrlBytes(thumb) <= SCAN_HISTORY_THUMBNAIL_MAX_BYTES) {
        return thumb;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function isLocalPreviewSizeOk(dataUrl: string): boolean {
  return (
    dataUrl.startsWith("data:") &&
    estimateDataUrlBytes(dataUrl) <= SCAN_HISTORY_THUMBNAIL_MAX_BYTES
  );
}
