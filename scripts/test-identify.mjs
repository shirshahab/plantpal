// Minimal 1x1 red PNG
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const res = await fetch("http://127.0.0.1:3000/api/ai/identify-plant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageDataUrl: PNG }),
  signal: AbortSignal.timeout(90000),
});
const json = await res.json();
console.log(JSON.stringify({
  http: res.status,
  ok: json.ok,
  source: json.data?.source,
  provider: json.data?.identification_provider,
  common_name: json.data?.common_name,
  plantnet_available: json.data?.plantnet_available,
  plantnet_configured: json.data?.plantnet_configured,
  error: json.error,
}, null, 2));
