/**
 * Regenerate PlantPal PWA icons from assets/brand/logo-source.png.
 * Output: full-bleed #2D6A4F square, white Living P mark only, no corner gaps.
 *
 * Usage: node scripts/generate-app-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "assets", "brand", "logo-source.png");

const BRAND_GREEN = { r: 45, g: 106, b: 79 }; // #2D6A4F
const CANVAS = 512;
/** Logo occupies ~68% of canvas — bold on Android/iOS home screens. */
const LOGO_SCALE = 0.68;

const OUTPUTS = [
  { file: "public/app-icon.png", size: 512 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/android-chrome-512x512.png", size: 512 },
  { file: "public/icon-192.png", size: 192 },
  { file: "public/android-chrome-192x192.png", size: 192 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/favicon-32x32.png", size: 32 },
  { file: "public/favicon-16x16.png", size: 16 },
  { file: "src/app/icon.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 180 },
];

function isLogoWhite(r, g, b) {
  return r > 210 && g > 210 && b > 210;
}

function isCornerWhite(r, g, b, x, y, w, h) {
  if (!isLogoWhite(r, g, b)) return false;
  const edge = Math.min(w, h) * 0.08;
  const nearEdge =
    x < edge || y < edge || x >= w - edge || y >= h - edge;
  return nearEdge;
}

/** Extract white Living P strokes; returns tight crop around the mark only. */
async function extractLogoLayer(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  /** Pixels that belong to the white mark (not outer corner padding). */
  const isMark = (x, y) => {
    const i = (y * width + x) * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return (
      isLogoWhite(r, g, b) && !isCornerWhite(r, g, b, x, y, width, height)
    );
  };

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isMark(x, y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX <= minX || maxY <= minY) {
    throw new Error("Could not detect white Living P mark in logo-source.png");
  }

  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const logo = Buffer.alloc(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const sx = minX + x;
      const sy = minY + y;
      const oi = (y * cropW + x) * 4;
      if (isMark(sx, sy)) {
        logo[oi] = 255;
        logo[oi + 1] = 255;
        logo[oi + 2] = 255;
        logo[oi + 3] = 255;
      } else {
        logo[oi + 3] = 0;
      }
    }
  }

  return sharp(logo, { raw: { width: cropW, height: cropH, channels: 4 } }).png();
}

async function buildMaster512(logoLayer) {
  const meta = await logoLayer.metadata();
  const target = Math.round(CANVAS * LOGO_SCALE);
  const scale = target / Math.max(meta.width, meta.height);
  const logoW = Math.round(meta.width * scale);
  const logoH = Math.round(meta.height * scale);

  const resizedLogo = await logoLayer
    .resize(logoW, logoH, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const left = Math.round((CANVAS - logoW) / 2);
  const top = Math.round((CANVAS - logoH) / 2);

  const bg = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 3,
      background: BRAND_GREEN,
    },
  })
    .png()
    .toBuffer();

  return sharp(bg)
    .composite([{ input: resizedLogo, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function writeIcon(master512, { file, size }) {
  const outPath = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const kernel = size <= 32 ? sharp.kernel.cubic : sharp.kernel.lanczos3;
  const buf = await sharp(master512)
    .resize(size, size, { kernel })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  fs.writeFileSync(outPath, buf);
}

async function writeSvgFromMaster(master512) {
  const svgPath = path.join(ROOT, "public", "icon.svg");
  const embedded = master512.toString("base64");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="PlantPal">
  <image width="512" height="512" href="data:image/png;base64,${embedded}"/>
</svg>`;
  fs.writeFileSync(svgPath, svg, "utf8");
}

async function verifyMaster(master512) {
  const corners = [
    [0, 0],
    [CANVAS - 1, 0],
    [0, CANVAS - 1],
    [CANVAS - 1, CANVAS - 1],
  ];
  const { data } = await sharp(master512).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (const [x, y] of corners) {
    const i = (y * CANVAS + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const greenOk =
      Math.abs(r - BRAND_GREEN.r) < 8 &&
      Math.abs(g - BRAND_GREEN.g) < 8 &&
      Math.abs(b - BRAND_GREEN.b) < 8;
    if (!greenOk || a < 255) {
      throw new Error(`Corner (${x},${y}) is not solid #2D6A4F (rgba=${r},${g},${b},${a})`);
    }
  }

  let white = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) white++;
  }
  const pct = Math.round((white / (CANVAS * CANVAS)) * 100);
  console.log(`  Corner check: all four corners solid #2D6A4F`);
  console.log(`  Logo coverage: ${pct}% white on 512px master (target ~12–18%)`);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Missing source logo: ${SOURCE}`);
    process.exit(1);
  }

  console.log(`Source: assets/brand/logo-source.png`);
  const logoLayer = await extractLogoLayer(SOURCE);
  const master512 = await buildMaster512(logoLayer);

  for (const output of OUTPUTS) {
    await writeIcon(master512, output);
    console.log(`✓ ${output.file} (${output.size}×${output.size})`);
  }

  await writeSvgFromMaster(master512);
  console.log("✓ public/icon.svg");

  fs.writeFileSync(
    path.join(ROOT, "public", "favicon.png"),
    await sharp(master512).resize(32, 32).png().toBuffer()
  );
  console.log("✓ public/favicon.png (32×32)");

  await verifyMaster(master512);
  console.log("\nDone — full-bleed #2D6A4F square, white Living P from brand source.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
