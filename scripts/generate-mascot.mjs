/**
 * Generate Planty mascot PNG assets from the canonical SVG faces.
 * Output: public/assets/mascot/planty-*.png (512x512, brand green tile).
 *
 * Keep these in sync with src/components/brand/planty.tsx.
 *
 * Usage: node scripts/generate-mascot.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "mascot");

const BRAND_GREEN = "#2D6A4F";
const SIZE = 512;

/** Face overlays per variant (40x40 coordinate space, white line art). */
const FACES = {
  main: `
    <circle cx="16" cy="17" r="1.5" fill="white"/>
    <circle cx="24" cy="17" r="1.5" fill="white"/>
    <path d="M16 22q4 3 8 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,
  happy: `
    <path d="M14 17.5q2-2.5 4 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22 17.5q2-2.5 4 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M15.5 21.5q4.5 4 9 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,
  thinking: `
    <path d="M14.5 16.5l3 1" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="24" cy="17" r="1.5" fill="white"/>
    <path d="M17 22.5h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="30" cy="10" r="1.2" fill="white"/>
    <circle cx="33" cy="7" r="0.8" fill="white"/>
  `,
  diagnosing: `
    <circle cx="16" cy="17" r="3.4" stroke="white" stroke-width="1.5"/>
    <circle cx="16" cy="17" r="1.2" fill="white"/>
    <path d="M18.6 19.6l2.6 2.6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="24.5" cy="16.5" r="1.5" fill="white"/>
    <path d="M18 24.5q3 1.5 6 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,
  "nice-work": `
    <path d="M14 17.5q2-2.5 4 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22 17.5q2-2.5 4 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M15.5 21q4.5 4.5 9 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="7" cy="9" r="1" fill="white"/>
    <circle cx="33" cy="11" r="1" fill="white"/>
    <circle cx="30" cy="5" r="0.8" fill="white"/>
  `,
  "uh-oh": `
    <circle cx="16" cy="17" r="1.5" fill="white"/>
    <circle cx="24" cy="17" r="1.5" fill="white"/>
    <path d="M16.5 23.5q3.5-2.5 7 0" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M31 8q1.5 2.5 0 4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,
};

function svgFor(face) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="9" fill="${BRAND_GREEN}"/>
  <path d="M20 6C14 6 10 12 10 18c0 6 4 12 10 16 6-4 10-10 10-16 0-6-4-12-10-12z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 34V22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  ${face}
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [variant, face] of Object.entries(FACES)) {
    const file = path.join(OUT_DIR, `planty-${variant}.png`);
    await sharp(Buffer.from(svgFor(face))).png().toFile(file);
    console.log(`✓ ${path.relative(ROOT, file)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
