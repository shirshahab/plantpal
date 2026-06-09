import sharp from "sharp";

export const SUPPORTED_SCANNER_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type SupportedScannerMime = (typeof SUPPORTED_SCANNER_MIMES)[number];

export interface NormalizedScanImage {
  dataUrl: string;
  mime: "image/jpeg";
  width: number;
  height: number;
  bytes: number;
  converted: boolean;
  originalMime: string;
}

export class ImageNormalizeError extends Error {
  readonly step = "image_encoding" as const;

  constructor(message: string) {
    super(message);
    this.name = "ImageNormalizeError";
  }
}

function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
  const match = dataUrl.replace(/\s/g, "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new ImageNormalizeError(
      "Invalid image format — expected a base64 data URL (data:image/jpeg;base64,...)."
    );
  }
  return { mime: match[1]!.toLowerCase(), base64: match[2]! };
}

function isSupportedMime(mime: string): mime is SupportedScannerMime {
  return (SUPPORTED_SCANNER_MIMES as readonly string[]).includes(mime);
}

/** Decode, validate, and normalize scanner uploads to JPEG for OpenAI Vision + PlantNet. */
export async function normalizeDataUrlForVision(dataUrl: string): Promise<NormalizedScanImage> {
  const { mime, base64 } = parseDataUrl(dataUrl);

  if (!isSupportedMime(mime)) {
    throw new ImageNormalizeError(
      `Invalid image format "${mime}". Supported: jpg, jpeg, png, webp.`
    );
  }

  let input: Buffer;
  try {
    input = Buffer.from(base64, "base64");
  } catch {
    throw new ImageNormalizeError("Image encoding failed — could not decode base64 payload.");
  }

  if (input.length === 0) {
    throw new ImageNormalizeError("Image encoding failed — empty image data.");
  }

  try {
    const image = sharp(input, { failOn: "error" });
    const meta = await image.metadata();

    if (!meta.width || !meta.height) {
      throw new ImageNormalizeError("Invalid image format — could not read dimensions.");
    }

    const alreadyJpeg = mime === "image/jpeg" || mime === "image/jpg";
    const jpegBuf = alreadyJpeg
      ? input
      : await image.jpeg({ quality: 85, mozjpeg: true }).toBuffer();

    const outBase64 = jpegBuf.toString("base64");
    return {
      dataUrl: `data:image/jpeg;base64,${outBase64}`,
      mime: "image/jpeg",
      width: meta.width,
      height: meta.height,
      bytes: jpegBuf.length,
      converted: !alreadyJpeg,
      originalMime: mime,
    };
  } catch (e) {
    if (e instanceof ImageNormalizeError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new ImageNormalizeError(`Invalid image format — ${msg}`);
  }
}

export async function normalizeDataUrlsForVision(
  dataUrls: string[]
): Promise<NormalizedScanImage[]> {
  return Promise.all(dataUrls.map((url) => normalizeDataUrlForVision(url)));
}
