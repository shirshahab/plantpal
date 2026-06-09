const res = await fetch("http://127.0.0.1:3000/api/setup/check", { signal: AbortSignal.timeout(90000) });
const json = await res.json();
const integrations = json.data?.integrations ?? [];
console.log("SETUP overall:", json.data?.overall);
console.log("Integration summary:", json.data?.integrationSummary);
for (const i of integrations) {
  console.log(JSON.stringify({
    id: i.id,
    configured: i.configured,
    reachable: i.reachable,
    usingLive: i.usingLive,
    fallbackActive: i.fallbackActive,
    status: i.status,
    message: i.message,
  }));
}
