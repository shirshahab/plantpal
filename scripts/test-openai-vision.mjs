import { readFileSync, existsSync } from "fs";
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const key = process.env.OPENAI_API_KEY;
console.log("key configured:", Boolean(key && key.length > 10));

try {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return JSON only" },
        {
          role: "user",
          content: [
            { type: "text", text: 'Identify plant. Return {"common_name":"test"}' },
            { type: "image_url", image_url: { url: PNG, detail: "low" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await res.json();
  console.log("status:", res.status);
  if (!res.ok) {
    console.log("error:", JSON.stringify(body).slice(0, 500));
  } else {
    console.log("content:", body.choices?.[0]?.message?.content?.slice(0, 200));
  }
} catch (e) {
  console.error("fetch failed:", e.message);
}
