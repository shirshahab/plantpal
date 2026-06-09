/**
 * Regenerate PlantPal PWA icons — full #2D6A4F square, solid white Living P mark.
 * Optimized for Android home screen visibility at 48px (Duolingo-style bold silhouette).
 *
 * Usage: node scripts/generate-app-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BRAND_GREEN = "#2D6A4F";
const WHITE = "#FFFFFF";
const CANVAS = 512;

/**
 * Solid filled Living P — stem + leaf bowl forming letter P (evenodd counter).
 * No outlines, no transparency, centered at ~74% of canvas for small-size legibility.
 */
function buildLivingPMarkSvg(size = CANVAS) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${CANVAS} ${CANVAS}" role="img" aria-label="PlantPal">
  <rect width="${CANVAS}" height="${CANVAS}" fill="${BRAND_GREEN}"/>
  <g transform="translate(256 262) scale(1.22) translate(-256 -262)">
    <!-- Stem -->
    <rect x="146" y="98" width="54" height="318" rx="27" fill="${WHITE}"/>
    <!-- Pointed leaf bowl + P counter -->
    <path fill="${WHITE}" fill-rule="evenodd" d="
      M 200 98
      C 262 76 346 78 394 136
      C 422 178 408 262 346 312
      C 296 348 236 342 200 302
      L 200 98
      Z
      M 228 128
      C 282 112 324 140 328 188
      C 332 234 292 272 244 272
      C 216 272 200 248 200 218
      C 200 178 208 142 228 128
      Z
    "/>
  </g>
</svg>`;
  return svg;
}

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

async function renderMaster(svg) {
  return sharp(Buffer.from(svg)).resize(CANVAS, CANVAS).png({ compressionLevel: 9 }).toBuffer();
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

function writeSvg(svg) {
  fs.writeFileSync(path.join(ROOT, "public", "icon.svg"), svg, "utf8");
}

async function verifySmallSize(master512) {
  const buf48 = await sharp(master512).resize(48, 48).png().toBuffer();
  const { data } = await sharp(buf48).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let white = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) white++;
  }
  const pct = Math.round((white / (48 * 48)) * 100);
  console.log(`  48px check: ${pct}% white mark coverage (target 18–25%)`);
}

async function main() {
  const svg = buildLivingPMarkSvg();
  const master512 = await renderMaster(svg);

  for (const output of OUTPUTS) {
    await writeIcon(master512, output);
    console.log(`✓ ${output.file} (${output.size}×${output.size})`);
  }

  writeSvg(svg);
  console.log("✓ public/icon.svg (vector source)");

  fs.writeFileSync(
    path.join(ROOT, "public", "favicon.png"),
    await sharp(master512).resize(32, 32).png().toBuffer()
  );
  console.log("✓ public/favicon.png (32×32)");

  await verifySmallSize(master512);
  console.log("\nDone — solid white Living P on full #2D6A4F square.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
