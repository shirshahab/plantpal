import type { PlantGenomeState } from "./types";

export function genomeToDbPayload(plantId: string, state: PlantGenomeState) {
  return {
    plant_id: plantId,
    age_months: state.ageMonths,
    growth_trend: state.growthTrend.direction,
    health_trend: state.healthTrend.direction,
    recovery_score: state.recoveryScore,
    risk_score: state.riskScore,
    fruiting_stage: state.fruitStage,
    blooming_stage: state.bloomStage,
    dormancy_stage: state.dormancyStatus,
    next_milestone: state.nextMilestone,
    forecast: {
      forecast30: state.forecast30,
      forecast90: state.forecast90,
      forecastSeason: state.forecastSeason,
      upcomingMilestones: state.upcomingMilestones,
    },
    intelligence_score: state.intelligenceScore,
    computed_state: state,
    last_computed_at: state.computedAt,
    version: state.version,
  };
}

export async function syncGenomeToRemote(
  plantId: string,
  state: PlantGenomeState
): Promise<void> {
  try {
    await fetch("/api/plant-genomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantId, genome: state }),
    });
  } catch {
    /* local-only fallback */
  }
}
