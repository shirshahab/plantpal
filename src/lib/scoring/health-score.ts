import type { Plant } from "@/lib/types";
import type { ScoreLabel } from "@/lib/types/phase6";
import { needsWaterToday } from "@/lib/plant-utils";

const BASE: Record<Plant["healthStatus"], number> = {
  healthy: 90,
  needs_attention: 70,
  critical: 40,
};

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 90) return "Thriving";
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Needs Attention";
  return "Critical";
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBg(score: number): string {
  if (score >= 90) return "bg-emerald-50 text-emerald-700";
  if (score >= 75) return "bg-green-50 text-green-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export function calculatePlantHealthScore(plant: Plant): number {
  let score = BASE[plant.healthStatus];

  if (plant.lastWateredAt) {
    const daysSince =
      (Date.now() - new Date(plant.lastWateredAt).getTime()) / 86400000;
    if (daysSince <= 2) score += 5;
  }

  if (needsWaterToday(plant)) score -= 10;
  if (plant.healthStatus === "needs_attention") score -= 10;
  if (plant.healthStatus === "critical") score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}
