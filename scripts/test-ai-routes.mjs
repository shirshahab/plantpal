const tests = [
  {
    name: "doctor",
    path: "/api/ai/doctor",
    body: {
      plantName: "Tomato",
      species: "Solanum lycopersicum",
      issue: "Yellow leaves",
      zipCode: "91107",
    },
  },
  {
    name: "price-checker",
    path: "/api/ai/price-checker",
    body: {
      plantName: "Meyer lemon",
      size: "3 gallon",
      zipCode: "91107",
      storeType: "any",
      condition: "healthy",
    },
  },
];

for (const t of tests) {
  const res = await fetch(`http://127.0.0.1:3000${t.path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t.body),
    signal: AbortSignal.timeout(90000),
  });
  const json = await res.json();
  console.log(t.name, {
    http: res.status,
    ok: json.ok,
    source: json.data?.source,
    error: json.error,
  });
}
