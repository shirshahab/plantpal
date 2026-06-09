import type { PhotoQualityAssessment } from "@/lib/types/ai";

export const PHOTO_QUALITY_TIPS = [
  "Take photo in natural light",
  "Include leaves and stem",
  "Include flowers or fruit if available",
  "Avoid extreme close-ups",
  "Take 2 to 3 angles",
] as const;

export type PhotoQualityIssue =
  | "blurry"
  | "dark"
  | "too_close"
  | "missing_features";

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Fast client-side photo check before sending to AI. */
export async function assessPhotoQualityClient(
  dataUrl: string
): Promise<PhotoQualityAssessment> {
  try {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement("canvas");
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { acceptable: true, issues: [] };
    }

    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    let sum = 0;
    let sumSq = 0;
    let edgeSum = 0;
    const pixels = size * size;

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
    }

    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const idx = (y * size + x) * 4;
        const center =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const rightIdx = (y * size + x + 1) * 4;
        const right =
          0.299 * data[rightIdx] +
          0.587 * data[rightIdx + 1] +
          0.114 * data[rightIdx + 2];
        const downIdx = ((y + 1) * size + x) * 4;
        const down =
          0.299 * data[downIdx] +
          0.587 * data[downIdx + 1] +
          0.114 * data[downIdx + 2];
        edgeSum += Math.abs(center - right) + Math.abs(center - down);
      }
    }

    const mean = sum / pixels;
    const variance = sumSq / pixels - mean * mean;
    const edgeAvg = edgeSum / ((size - 2) * (size - 2) * 2);

    const issues: PhotoQualityIssue[] = [];

    if (mean < 55) issues.push("dark");
    if (edgeAvg < 8 || variance < 120) issues.push("blurry");
    if (img.width < 400 || img.height < 400) issues.push("too_close");
    if (edgeAvg < 5 && variance < 80) issues.push("missing_features");

    const acceptable = issues.length === 0;

    return {
      acceptable,
      issues,
      message: acceptable ? undefined : "PlantPal needs a clearer photo.",
    };
  } catch {
    return { acceptable: true, issues: [] };
  }
}

export function mergePhotoQuality(
  client: PhotoQualityAssessment | null,
  server: PhotoQualityAssessment | undefined
): PhotoQualityAssessment {
  if (!server && !client) return { acceptable: true, issues: [] };
  if (!server) return client ?? { acceptable: true, issues: [] };
  if (!client) return server;

  const issues = Array.from(new Set([...client.issues, ...server.issues]));
  const acceptable = server.acceptable && client.acceptable;

  return {
    acceptable,
    issues,
    message: acceptable ? undefined : "PlantPal needs a clearer photo.",
  };
}
