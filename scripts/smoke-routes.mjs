/**
 * End-to-end route smoke tests — no secrets printed.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const BASE = process.argv[2] || "http://127.0.0.1:3000";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const json = await res.json();
  return { status: res.status, json };
}

console.log("=== Route smoke tests ===\n");

const weather = await post("/api/weather", { zip_code: "91107" });
console.log("WEATHER:", {
  http: weather.status,
  ok: weather.json.ok,
  source: weather.json.data?.source,
  location: weather.json.data?.location,
  fallback: weather.json.data?.source !== "live",
});

const plants = await post("/api/plants/search", { query: "monstera", limit: 10 });
const perenualHits = plants.json.data?.results?.filter((r) => r.resultSource === "perenual") ?? [];
console.log("PLANT SEARCH:", {
  http: plants.status,
  ok: plants.json.ok,
  total: plants.json.data?.results?.length,
  perenualCount: plants.json.data?.sources?.perenual,
  hasPerenualBadge: perenualHits.length > 0,
  sources: plants.json.data?.sources,
});

const prices = await post("/api/prices/search", {
  plantName: "Meyer lemon",
  size: "3 gallon",
  zipCode: "91107",
});
console.log("PRICE SEARCH:", {
  http: prices.status,
  ok: prices.json.ok,
  source: prices.json.data?.source,
  resultCount: prices.json.data?.results?.length,
  firstRetailer: prices.json.data?.results?.[0]?.retailer,
  fallback: prices.json.data?.source !== "live",
});

const dataSources = await fetch(`${BASE}/api/debug/data-sources`, {
  signal: AbortSignal.timeout(30000),
}).then((r) => r.json());
console.log("DATA SOURCES SUMMARY:", dataSources.summary);

console.log("\nDone.");
