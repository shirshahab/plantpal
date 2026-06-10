/**
 * Generates iOS splash screens from the brand master in public/icon.svg
 * (which embeds the 512px PNG produced by generate-app-icons.mjs).
 * Run after icons: node scripts/generate-splash.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const BRAND_GREEN = "#2D6A4F";

const svg = readFileSync(join(publicDir, "icon.svg"), "utf8");
const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
if (!match) {
  console.error("No embedded PNG found in public/icon.svg — run generate-app-icons.mjs first");
  process.exit(1);
}
const source = Buffer.from(match[1], "base64");

async function splash(width, height, file) {
  const iconSize = Math.round(Math.min(width, height) * 0.3);
  const art = await sharp(source).resize(iconSize, iconSize).png().toBuffer();
  await sharp({
    create: { width, height, channels: 4, background: BRAND_GREEN },
  })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(join(publicDir, file));
  console.log(`✓ ${file} (${width}x${height})`);
}

await splash(750, 1334, "splash-750x1334.png"); // iPhone SE / 8
await splash(1170, 2532, "splash-1170x2532.png"); // iPhone 12-14
await splash(1290, 2796, "splash-1290x2796.png"); // iPhone Pro Max
await splash(1536, 2048, "splash-1536x2048.png"); // iPad

console.log("Splash screens generated.");
