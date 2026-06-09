/**
 * Live identify test — chrysanthemum / garden mum.
 * Usage: node scripts/test-chrysanthemum-identify.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const CHRYSANTHEMUM_URLS = [
  "https://upload.wikimedia.org/wikipedia/commons/4/4f/Chrysanthemum_morbifolium_001.jpg",
  "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800&q=80",
];

async function fetchAsDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main() {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  let imageDataUrl;
  for (const url of CHRYSANTHEMUM_URLS) {
    try {
      imageDataUrl = await fetchAsDataUrl(url);
      console.log("Using image:", url);
      break;
    } catch (e) {
      console.warn("Skip image:", url, e.message);
    }
  }
  if (!imageDataUrl) throw new Error("No test images could be fetched");

  console.log("POST", `${base}/api/ai/identify-plant`);
  const res = await fetch(`${base}/api/ai/identify-plant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDataUrl,
      photoRoles: ["flower"],
      demoMode: false,
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text.slice(0, 200));
    process.exit(1);
  }

  if (!res.ok) {
    console.error("FAILED", res.status, json.error ?? json);
    process.exit(1);
  }

  const data = json.data ?? json;
  const name = `${data.common_name} (${data.scientific_name})`;
  const source = data.source;
  const provider = data.identification_provider;
  const plantnet = data.plantnet_second_opinion?.[0];

  console.log("OK", name);
  console.log("source:", source, "| provider:", provider);
  console.log("confidence:", data.confidence_score);
  if (plantnet) {
    console.log(
      "Pl@ntNet top:",
      plantnet.commonNames?.[0] ?? plantnet.species,
      plantnet.score + "%"
    );
  }

  const lower = name.toLowerCase();
  const isMum =
    lower.includes("chrysanthemum") ||
    lower.includes("garden mum") ||
    lower.includes("mum");
  const isMeyer = lower.includes("meyer") || lower.includes("lemon");

  if (source === "mock") {
    console.error("FAIL: got demo/mock instead of live AI");
    process.exit(1);
  }
  if (isMeyer) {
    console.error("FAIL: Meyer Lemon fallback detected");
    process.exit(1);
  }
  if (!isMum) {
    console.warn("WARN: expected chrysanthemum/garden mum — got:", name);
  } else {
    console.log("PASS: chrysanthemum family match");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
