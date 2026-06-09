import type { Plant } from "@/lib/types";
import type { ScoreLabel } from "@/lib/types/phase6";
import {
  calculatePlantHealthScore,
  getScoreLabel,
} from "./health-score";

export interface GardenScoreResult {
  score: number;
  label: ScoreLabel;
  topPlants: { plant: Plant; score: number }[];
  bottomPlants: { plant: Plant; score: number }[];
  recommendation: string;
}

export function calculateGardenScore(plants: Plant[]): GardenScoreResult {
  if (plants.length === 0) {
    return {
      score: 0,
      label: "Needs Attention",
      topPlants: [],
      bottomPlants: [],
      recommendation: "Add your first plant to start building your garden score.",
    };
  }

  const scored = plants.map((plant) => ({
    plant,
    score: calculatePlantHealthScore(plant),
  }));

  const avg =
    scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
  const score = Math.round(avg);
  const label = getScoreLabel(score);

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const topPlants = sorted.slice(0, 3);
  const bottomPlants = [...sorted].reverse().slice(0, 3);

  const needsCare = bottomPlants.filter((p) => p.score < 75);
  let recommendation = `Your garden score is ${score}. `;
  if (needsCare.length === 0) {
    recommendation += "Everything looks great — keep up the consistent care.";
  } else {
    const names = needsCare.map((p) => p.plant.name).join(" and ");
    const actions = needsCare.some((p) => p.score < 60)
      ? `Check on ${names} and log watering today.`
      : `Improve it by checking ${names}.`;
    recommendation += actions;
  }

  return { score, label, topPlants, bottomPlants, recommendation };
}
