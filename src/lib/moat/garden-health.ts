import type { GardenSpace } from "./garden-map-types";
import type { Plant } from "@/lib/types";

export interface GardenHealthBreakdown {
  score: number;
  wateringConsistency: number;
  plantHealth: number;
  tasksCompleted: number;
  growthTracking: number;
  label: string;
}

export function calculateGardenMapHealth(
  spaces: GardenSpace[],
  plants: Plant[],
  tasksCompletedThisWeek = 0,
  growthPhotosThisMonth = 0
): GardenHealthBreakdown {
  const placements = spaces.flatMap((s) => s.placements);
  const avgPlacementHealth =
    placements.length > 0
      ? placements.reduce((sum, p) => sum + p.healthScore, 0) / placements.length
      : plants.length > 0
        ? 70
        : 50;

  const healthyPlants = plants.filter((p) => p.healthStatus === "healthy").length;
  const plantHealth =
    plants.length > 0 ? Math.round((healthyPlants / plants.length) * 100) : avgPlacementHealth;

  const wateringConsistency = Math.min(
    100,
    Math.round(60 + tasksCompletedThisWeek * 8 + (plants.length > 0 ? 10 : 0))
  );
  const tasksCompleted = Math.min(100, tasksCompletedThisWeek * 20);
  const growthTracking = Math.min(100, growthPhotosThisMonth * 15);

  const score = Math.round(
    plantHealth * 0.35 +
      wateringConsistency * 0.3 +
      tasksCompleted * 0.2 +
      growthTracking * 0.15
  );

  const label =
    score >= 85 ? "Thriving" : score >= 70 ? "Healthy" : score >= 50 ? "Needs Care" : "At Risk";

  return {
    score,
    wateringConsistency,
    plantHealth,
    tasksCompleted,
    growthTracking,
    label,
  };
}
