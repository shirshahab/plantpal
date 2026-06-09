/**
 * Regenerate PlantPal PWA icons — full #2D6A4F square, white Living P mark only.
 * Preserves the existing logo stroke; removes outer white/transparent padding.
 *
 * Usage: node scripts/generate-app-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "app-icon.png");
const SOURCE_BACKUP = path.join(ROOT, "scripts", ".icon-source-backup.png");

const BRAND_GREEN = { r: 45, g: 106, b: 79 }; // #2D6A4F
const WHITE = { r: 255, g: 255, b: 255 };

/** Original icon green background — excludes white/gray padding pixels. */
function isSourceGreen(r, g, b, a) {
  if (a < 24) return false;
  if (r > 120 && g > 120 && b > 120) return false;
  return g > 90 && g > r + 35 && g > b + 15;
}

/** Near-white stroke pixel. */
function isNearWhite(r, g, b, a) {
  if (a < 24) return false;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return luminance >= 175 && chroma <= 55;
}

function buildOutputPixels(raw, width, height) {
  const size = width * height;
  const greenMask = new Uint8Array(size);
  const whiteMask = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    const r = raw[i * 4];
    const g = raw[i * 4 + 1];
    const b = raw[i * 4 + 2];
    const a = raw[i * 4 + 3];
    greenMask[i] = isSourceGreen(r, g, b, a) ? 1 : 0;
    whiteMask[i] = isNearWhite(r, g, b, a) ? 1 : 0;
  }

  // Logo white sits on the green squircle — keep white only near green and near center.
  const logoMask = new Uint8Array(size);
  const cx = width / 2;
  const cy = height / 2;
  const maxLogoDist = Math.min(width, height) * 0.39;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!whiteMask[i]) continue;

      const dist = Math.hypot(x - cx, y - cy);
      if (dist > maxLogoDist) continue;

      let nearGreen = false;
      for (let dy = -3; dy <= 3 && !nearGreen; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (greenMask[ny * width + nx]) {
            nearGreen = true;
            break;
          }
        }
      }
      logoMask[i] = nearGreen ? 1 : 0;
    }
  }

  const out = Buffer.alloc(size * 4);
  for (let i = 0; i < size; i++) {
    const color = logoMask[i] ? WHITE : BRAND_GREEN;
    out[i * 4] = color.r;
    out[i * 4 + 1] = color.g;
    out[i * 4 + 2] = color.b;
    out[i * 4 + 3] = 255;
  }
  return out;
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

async function writeIcon(master512, { file, size }) {
  const outPath = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const buf = await sharp(master512).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(outPath, buf);
}

function writeSvg(master512Base64) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="PlantPal">
  <image width="512" height="512" href="data:image/png;base64,${master512Base64}"/>
</svg>
`;
  fs.writeFileSync(path.join(ROOT, "public", "icon.svg"), svg, "utf8");
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing source icon: ${SOURCE}`);
  }

  if (!fs.existsSync(SOURCE_BACKUP)) {
    fs.copyFileSync(SOURCE, SOURCE_BACKUP);
    console.log(`Backed up source → ${path.relative(ROOT, SOURCE_BACKUP)}`);
  }

  const readPath = fs.existsSync(SOURCE_BACKUP) ? SOURCE_BACKUP : SOURCE;
  const img = sharp(readPath);
  const { width, height } = await img.metadata();
  if (!width || !height) throw new Error("Could not read source icon dimensions");

  const raw = await img.ensureAlpha().raw().toBuffer();
  const out = buildOutputPixels(raw, width, height);

  const master512 = await sharp(out, { raw: { width, height, channels: 4 } })
    .resize(512, 512, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const master512Base64 = master512.toString("base64");

  const ordered = [
    ...OUTPUTS.filter((output) => output.file !== "public/app-icon.png"),
    ...OUTPUTS.filter((output) => output.file === "public/app-icon.png"),
  ];

  for (const output of ordered) {
    await writeIcon(master512, output);
    console.log(`✓ ${output.file} (${output.size}×${output.size})`);
  }

  writeSvg(master512Base64);
  console.log("✓ public/icon.svg");

  // Keep legacy favicon.png aligned with 32px asset
  fs.writeFileSync(
    path.join(ROOT, "public", "favicon.png"),
    await sharp(master512).resize(32, 32).png().toBuffer()
  );
  console.log("✓ public/favicon.png (32×32)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
