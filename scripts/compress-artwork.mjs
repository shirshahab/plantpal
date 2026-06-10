import sharp from "sharp";
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "artwork");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return name.endsWith(".png") ? [full] : [];
  });
}

for (const file of walk(root)) {
  const out = file.replace(/\.png$/, ".webp");
  await sharp(file).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  unlinkSync(file);
  console.log("compressed", out);
}
