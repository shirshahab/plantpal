/** Fetch Next.js integration health endpoint */
const url = process.argv[2] || "http://127.0.0.1:3000/api/integrations/health";
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
}
