import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split("\n")) {
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

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const SCHEMA = `{
  "photo_quality": { "acceptable": "boolean", "issues": [], "message": "string or null" },
  "common_name": "string",
  "scientific_name": "string",
  "confidence": "high" | "medium" | "low",
  "confidence_score": "number 0-100",
  "identification_rationale": "string",
  "top_matches": [],
  "common_lookalikes": [],
  "care_summary": "string",
  "light_needs": "string",
  "watering_needs": "string",
  "toxicity": "string",
  "care_difficulty": "Easy" | "Moderate" | "Advanced",
  "toxicity_warning": "string or null",
  "suggested_location": "indoor" | "outdoor" | "either",
  "suggested_sun": "full_sun" | "partial_sun" | "shade"
}`;

const system = `You are an expert gardener helping home plant owners through PlantPal.

Rules:
- Return ONLY valid JSON matching the requested schema — no markdown, no extra keys.`;

const userText =
  "Identify this plant from the photo. If unsure between similar species, pick the most likely and set confidence_score below 70 if uncertain. Assess photo_quality first.";

const key = process.env.OPENAI_API_KEY;

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `${system}\n\nIdentify the plant in these photo(s). Return structured care fields. Return JSON:\n${SCHEMA}` },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: PNG, detail: "auto" } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.35,
    max_tokens: 1600,
  }),
  signal: AbortSignal.timeout(90000),
});

const body = await res.json();
console.log("status:", res.status);
if (!res.ok) {
  console.log("error:", JSON.stringify(body).slice(0, 800));
  process.exit(1);
}

const content = body.choices?.[0]?.message?.content;
console.log("content preview:", content?.slice(0, 300));
try {
  JSON.parse(content);
  console.log("JSON parse: OK");
} catch (e) {
  console.log("JSON parse FAILED:", e.message);
}
