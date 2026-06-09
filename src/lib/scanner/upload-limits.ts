/** Scanner upload limits — shared by identify, diagnose, and tag flows. */
export const SCAN_MAX_PHOTOS = 3;
export const SCAN_MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB

export const SCAN_UPLOAD_LIMIT_LABEL = `Maximum ${SCAN_MAX_PHOTOS} photos, 10MB total`;

/** Approximate decoded byte size of a data URL (base64 payload). */
export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function totalDataUrlBytes(dataUrls: string[]): number {
  return dataUrls.reduce((sum, url) => sum + estimateDataUrlBytes(url), 0);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** Returns a user-facing error message, or null if within limits. */
export function validatePhotoPayload(dataUrls: string[]): string | null {
  if (dataUrls.length > SCAN_MAX_PHOTOS) {
    return `Maximum ${SCAN_MAX_PHOTOS} photos allowed.`;
  }
  const total = totalDataUrlBytes(dataUrls);
  if (total > SCAN_MAX_TOTAL_BYTES) {
    return "Photos are too large. Try again with smaller images.";
  }
  return null;
}
