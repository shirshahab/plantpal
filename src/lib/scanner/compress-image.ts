/** Max longest edge before upload (identify, diagnose, tag). */
export const SCAN_MAX_EDGE_PX = 1600;
/** JPEG quality for scanner uploads (0–1). */
export const SCAN_JPEG_QUALITY = 0.75;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function scaleToMaxEdge(width: number, height: number, maxEdge: number) {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  if (width >= height) {
    return {
      width: maxEdge,
      height: Math.round(height * (maxEdge / width)),
    };
  }
  return {
    width: Math.round(width * (maxEdge / height)),
    height: maxEdge,
  };
}

/** Resize to max edge and encode as JPEG before scanner upload. */
export async function compressImageFile(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  return canvasToJpegDataUrl(drawToCanvas(img, img.width, img.height));
}

function drawToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
): HTMLCanvasElement {
  const { width, height } = scaleToMaxEdge(sourceWidth, sourceHeight, SCAN_MAX_EDGE_PX);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare image");
  }

  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", SCAN_JPEG_QUALITY);
}

/** Capture a live camera frame, resize, and encode as JPEG. */
export async function compressVideoFrame(video: HTMLVideoElement): Promise<string> {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("Camera is still starting. Wait a moment and try again.");
  }
  return canvasToJpegDataUrl(drawToCanvas(video, video.videoWidth, video.videoHeight));
}
