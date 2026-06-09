/** Remove plant-scoped data from localStorage (mock / offline). */
export function cleanupLocalPlantData(plantId: string): void {
  if (typeof window === "undefined") return;

  try {
    const plantsRaw = localStorage.getItem("plantpal-plants");
    if (plantsRaw) {
      const plants = JSON.parse(plantsRaw) as { id: string }[];
      localStorage.setItem(
        "plantpal-plants",
        JSON.stringify(plants.filter((p) => p.id !== plantId))
      );
    }
  } catch {
    /* ignore */
  }

  const listKeys = [
    "plantpal-user-plant-goals",
    "plantpal-plant-milestones",
    "plantpal-plant-missions",
    "plantpal-care-logs",
    "plantpal-growth",
    "plantpal-harvest",
  ];

  for (const key of listKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        localStorage.setItem(
          key,
          JSON.stringify(data.filter((item: { plantId?: string }) => item.plantId !== plantId))
        );
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const statesRaw = localStorage.getItem("plantpal-task-states");
    if (statesRaw) {
      const states = JSON.parse(statesRaw) as Record<string, unknown>;
      const next: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(states)) {
        if (!k.includes(plantId)) next[k] = v;
      }
      localStorage.setItem("plantpal-task-states", JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }

  try {
    const aiRaw = localStorage.getItem("plantpal-ai-results");
    if (aiRaw) {
      const store = JSON.parse(aiRaw) as {
        carePlans?: Record<string, unknown>;
        goalPlans?: Record<string, unknown>;
      };
      if (store.carePlans) delete store.carePlans[plantId];
      if (store.goalPlans) delete store.goalPlans[plantId];
      localStorage.setItem("plantpal-ai-results", JSON.stringify(store));
    }
  } catch {
    /* ignore */
  }

  try {
    const genomeRaw = localStorage.getItem("plantpal-plant-genomes");
    if (genomeRaw) {
      const genomes = JSON.parse(genomeRaw) as Record<string, unknown>;
      delete genomes[plantId];
      localStorage.setItem("plantpal-plant-genomes", JSON.stringify(genomes));
    }
  } catch {
    /* ignore */
  }
}
