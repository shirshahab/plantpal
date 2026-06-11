/**
 * Crop the official Planty concept sheet (assets/brand/planty-source.png)
 * into individual mood assets with transparent backgrounds.
 *
 * The attached artwork is the source of truth. Do not redesign Planty.
 *
 * Output: public/assets/mascot/planty-*.png
 * Usage:  node scripts/crop-mascot.mjs
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "assets", "brand", "planty-source.png");
const OUT_DIR = path.join(ROOT, "public", "assets", "mascot");

/** Crop boxes on the 1024x1024 sheet. Tuned to exclude labels. */
const CROPS = {
  main: { left: 40, top: 20, width: 440, height: 550 },
  happy: { left: 535, top: 60, width: 235, height: 285 },
  thinking: { left: 780, top: 70, width: 230, height: 275 },
  celebrating: { left: 515, top: 375, width: 270, height: 255 },
  diagnosing: { left: 775, top: 380, width: 245, height: 250 },
  "nice-work": { left: 530, top: 650, width: 240, height: 285 },
  "uh-oh": { left: 770, top: 672, width: 254, height: 263 },
};

/** Squared color distance. */
function dist2(r1, g1, b1, r2, g2, b2) {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

/**
 * Remove the cream sheet background: flood fill from the borders, clearing
 * pixels close to the background color. Interior whites (eye highlights,
 * chest logo) are safe because they aren't connected to the border.
 */
function removeBackground(data, width, height) {
  // Sample background color from the four corners.
  const corners = [0, (width - 1) * 4, (height - 1) * width * 4, (height * width - 1) * 4];
  let br = 0, bg = 0, bb = 0;
  for (const i of corners) {
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
  }
  br /= 4; bg /= 4; bb /= 4;

  const HARD = 42 ** 2;  // definitely background
  const SOFT = 80 ** 2;  // edge feather zone
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    queue.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width, y * width + width - 1);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;
    const p = idx * 4;
    const d = dist2(data[p], data[p + 1], data[p + 2], br, bg, bb);
    if (d >= HARD) {
      // Feather the edge instead of leaving a cream halo.
      if (d < SOFT) {
        const t = (Math.sqrt(d) - Math.sqrt(HARD)) / (Math.sqrt(SOFT) - Math.sqrt(HARD));
        data[p + 3] = Math.min(data[p + 3], Math.round(255 * t));
      }
      continue;
    }
    data[p + 3] = 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) queue.push(idx - 1);
    if (x < width - 1) queue.push(idx + 1);
    if (y > 0) queue.push(idx - width);
    if (y < height - 1) queue.push(idx + width);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [name, box] of Object.entries(CROPS)) {
    const { data, info } = await sharp(SOURCE)
      .extract(box)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    removeBackground(data, info.width, info.height);

    const file = path.join(OUT_DIR, `planty-${name}.png`);
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim()
      .png()
      .toFile(file);
    console.log(`✓ ${path.relative(ROOT, file)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
