/**
 * One-off integration probe — never prints secret values.
 * Usage: node scripts/probe-integrations.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnvFile() {
  if (!existsSync(envPath)) {
    console.error("No .env.local found");
    process.exit(1);
  }
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const VARS = [
  "OPENAI_API_KEY",
  "OPENWEATHER_API_KEY",
  "WEATHER_PROVIDER",
  "PERENUAL_API_KEY",
  "PLANTNET_API_KEY",
  "SERPAPI_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function envFound(name) {
  const v = process.env[name]?.trim() ?? "";
  return v.length > 0 && !v.includes("paste_");
}

async function probeOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { ok: false, reachable: false, error: "Key missing" };
  try {
    const res = await fetch("https://api.openai.com/v1/models?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return { ok: true, reachable: true, status: res.status };
    return { ok: false, reachable: true, status: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reachable: false, error: String(e.message || e) };
  }
}

async function probeOpenWeather() {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (!key) return { ok: false, reachable: false, error: "Key missing" };
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=London,uk&appid=${key}&units=imperial`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) return { ok: true, reachable: true, status: res.status };
    const body = await res.text();
    return { ok: false, reachable: true, status: res.status, error: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (e) {
    return { ok: false, reachable: false, error: String(e.message || e) };
  }
}

async function probePerenual() {
  const key = process.env.PERENUAL_API_KEY?.trim();
  if (!key) return { ok: false, reachable: false, error: "Key missing" };
  try {
    const url = `https://perenual.com/api/v2/species-data?key=${encodeURIComponent(key)}&q=rose&page=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) return { ok: true, reachable: true, status: res.status };
    const body = await res.text();
    return { ok: false, reachable: true, status: res.status, error: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (e) {
    return { ok: false, reachable: false, error: String(e.message || e) };
  }
}

async function probePlantNet() {
  const key = process.env.PLANTNET_API_KEY?.trim();
  if (!key) return { ok: false, reachable: false, error: "Key missing" };
  try {
    const url = `https://my-api.plantnet.org/v2/projects?api-key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) return { ok: true, reachable: true, status: res.status };
    return { ok: false, reachable: true, status: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reachable: false, error: String(e.message || e) };
  }
}

async function probeSerpApi() {
  const key = process.env.SERPAPI_KEY?.trim();
  if (!key) return { ok: false, reachable: false, error: "Key missing" };
  try {
    const url = `https://serpapi.com/account.json?api_key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) return { ok: true, reachable: true, status: res.status };
    const body = await res.text();
    return { ok: false, reachable: true, status: res.status, error: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (e) {
    return { ok: false, reachable: false, error: String(e.message || e) };
  }
}

async function probeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return { ok: false, reachable: false, error: "Env missing" };
  try {
    const res = await fetch(`${url}/rest/v1/plant_species?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return { ok: true, reachable: true, status: res.status };
    return { ok: false, reachable: true, status: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reachable: false, error: String(e.message || e) };
  }
}

console.log("=== Env vars (found yes/no only) ===");
for (const v of VARS) {
  console.log(`${v}: ${envFound(v) ? "YES" : "NO"}`);
}

console.log("\n=== Live API probes ===");
const probes = {
  openai: probeOpenAI,
  openweather: probeOpenWeather,
  perenual: probePerenual,
  plantnet: probePlantNet,
  serpapi: probeSerpApi,
  supabase: probeSupabase,
};

for (const [name, fn] of Object.entries(probes)) {
  const r = await fn();
  console.log(JSON.stringify({ service: name, ...r }));
}
