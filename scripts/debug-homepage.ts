/**
 * Public homepage / marketing copy debug checks.
 * Usage: npm run debug:homepage
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const PUBLIC_PREFIXES = [
  "src/app/(marketing)/",
  "src/components/marketing/",
  "src/app/page.tsx",
  "src/app/login/",
  "src/app/signup/",
  "src/app/onboarding/",
];

const APP_PREFIXES = [
  "src/app/(app)/",
  "src/components/sidebar.tsx",
  "src/components/mobile/",
  "src/components/dashboard/",
  "src/components/scanner/",
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function classify(file: string): "public" | "app" | "other" {
  const r = rel(file);
  if (PUBLIC_PREFIXES.some((p) => r.startsWith(p) || r === p.replace(/\/$/, ""))) return "public";
  if (APP_PREFIXES.some((p) => r.startsWith(p) || r === p)) return "app";
  return "other";
}

function findMatches(pattern: RegExp): { file: string; line: number; text: string; scope: string }[] {
  const hits: { file: string; line: number; text: string; scope: string }[] = [];
  for (const file of walk(SRC)) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        hits.push({
          file: rel(file),
          line: i + 1,
          text: line.trim(),
          scope: classify(file),
        });
      }
    });
  }
  return hits;
}

function main() {
  console.log("=== PlantPal homepage / marketing debug ===\n");

  const scanHits = findMatches(/Scan a Plant/);
  const publicScan = scanHits.filter((h) => h.scope === "public");
  const appScan = scanHits.filter((h) => h.scope === "app");

  console.log(`"Scan a Plant" — total: ${scanHits.length}, public: ${publicScan.length}, app: ${appScan.length}`);
  for (const h of scanHits) {
    console.log(`  [${h.scope}] ${h.file}:${h.line} — ${h.text.slice(0, 80)}`);
  }
  assert.equal(
    publicScan.length,
    0,
    "Public marketing pages must not show \"Scan a Plant\""
  );
  console.log("✓ No \"Scan a Plant\" on public marketing pages\n");

  const betaBadgeHits = findMatches(/BetaBadge|<BetaBadge/);
  const publicBetaBadge = betaBadgeHits.filter((h) => h.scope === "public" || h.scope === "app");
  console.log(`BetaBadge usage — total: ${betaBadgeHits.length}`);
  for (const h of betaBadgeHits) {
    console.log(`  [${h.scope}] ${h.file}:${h.line}`);
  }
  assert.equal(publicBetaBadge.length, 0, "No BetaBadge in public or app headers");
  console.log("✓ No BetaBadge in public/app UI\n");

  const betaLabelHits = findMatches(/>\s*BETA\s*<\/|"BETA"|'BETA'/);
  const publicBetaLabels = betaLabelHits.filter((h) => h.scope === "public" || h.scope === "app");
  console.log(`Hardcoded BETA label — total: ${betaLabelHits.length}, public/app: ${publicBetaLabels.length}`);
  for (const h of betaLabelHits) {
    console.log(`  [${h.scope}] ${h.file}:${h.line} — ${h.text.slice(0, 80)}`);
  }
  assert.equal(publicBetaLabels.length, 0, "No hardcoded BETA labels in public/app UI");
  console.log("✓ No hardcoded BETA labels in public/app UI\n");

  const home = read("src/components/marketing/marketing-home-page.tsx");
  assert.match(home, /Get Started Free/);
  assert.match(home, /See How It Works/);
  assert.match(home, /href="\/features"/);
  assert.doesNotMatch(home, /Scan a Plant/);
  console.log("✓ Homepage hero: Get Started Free + See How It Works → /features");

  const header = read("src/components/marketing/marketing-header.tsx");
  assert.doesNotMatch(header, /BetaBadge/);
  assert.doesNotMatch(header, /BETA/);
  console.log("✓ Marketing header has no beta badge");

  const waitlist = read("src/components/marketing/marketing-home-page.tsx");
  assert.doesNotMatch(waitlist, /Join the beta/i);
  console.log("✓ Homepage has no \"Join the beta\" copy");

  console.log("\nHomepage debug OK.");
}

main();
