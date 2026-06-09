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
  const { width, height } = scaleToMaxEdge(img.width, img.height, SCAN_MAX_EDGE_PX);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare image");
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", SCAN_JPEG_QUALITY);
}
