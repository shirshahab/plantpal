import type { Plant } from "@/lib/types";
import type { AICarePlanResponse, CarePlanRequest } from "@/lib/types/ai";
import { generateGoalBasedCarePlan } from "@/lib/plants/goal-care";
import { getGoalsByIds } from "@/lib/mock/plant-goals";
import { chatJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT, getCurrentSeasonName } from "./prompts";

const CARE_PLAN_SCHEMA = `{
  "watering_schedule": "string — how often and how to water",
  "fertilizer_schedule": "string — when and what to feed",
  "pruning_schedule": "string — when and how to prune",
  "soil_recommendation": "string",
  "seasonal_tasks": ["string"],
  "goal_adjustments": ["string — one per user goal"],
  "warning_signs": ["string — what to watch for"],
  "next_7_days": ["string — daily or grouped actions"],
  "next_30_days": ["string — weekly milestones"]
}`;

function mockCarePlan(input: CarePlanRequest): AICarePlanResponse {
  const plant: Plant = {
    id: input.plantId,
    name: input.nickname,
    species: input.species,
    image: "",
    locationType: input.locationType,
    plantingType: input.plantingType,
    zipCode: input.zipCode,
    sunExposure: input.sunExposure,
    healthStatus: input.healthStatus,
    healthNotes: input.healthNotes ?? "",
    waterFrequencyDays: 7,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "Early spring",
    wateringInstructions: "",
    fertilizingInstructions: "",
    pruningInstructions: "",
    lastWateredAt: null,
    lastFertilizedAt: null,
    createdAt: new Date().toISOString(),
    photoStatus: "real_photo",
    placeholderImageType: null,
    sizeType: "unknown",
    nurseryContainerSize: null,
    heightFeet: null,
    heightInches: null,
    potDiameterInches: null,
    trunkDiameterInches: null,
    estimatedAgeMonths: null,
    plantedDate: null,
    purchaseDate: null,
    purchasePrice: null,
    purchaseStore: null,
  };

  const goals = getGoalsByIds(input.goals);
  const plan = generateGoalBasedCarePlan(
    plant,
    goals,
    input.zipCode,
    input.healthStatus
  );

  return {
    watering_schedule: `Every ${plan.waterFrequencyDays} days. ${plan.wateringInstructions} ${plan.wateringAdjustment}`,
    fertilizer_schedule: `Every ${plan.fertilizeFrequencyWeeks} weeks. ${plan.fertilizingInstructions} ${plan.fertilizerAdjustment}`,
    pruning_schedule: `${plan.pruneSchedule}. ${plan.pruningInstructions} ${plan.pruningAdjustment}`,
    soil_recommendation: plan.soilAdjustment,
    seasonal_tasks: plan.seasonalTasks,
    goal_adjustments: [
      input.primaryGoal
        ? `Primary goal "${input.primaryGoal}": ${plan.goalSpecificTips[0] ?? plan.fertilizerAdjustment}`
        : plan.fertilizerAdjustment,
      ...plan.goalSpecificTips.slice(1, 3),
    ].filter(Boolean),
    warning_signs: plan.warnings.length ? plan.warnings : ["Check leaves weekly for color or droop changes."],
    next_7_days: [
      "Check soil moisture before watering.",
      plan.goalSpecificTips[0] ?? "Inspect new growth at branch tips.",
      "Log anything unusual in health notes.",
    ],
    next_30_days: [
      `Follow ${plan.pruneSchedule} pruning guidance.`,
      "Take a growth photo from the same angle.",
      ...plan.seasonalTasks.slice(0, 2),
    ],
    source: "mock",
  };
}

export async function generatePlantCarePlan(
  input: CarePlanRequest
): Promise<AICarePlanResponse> {
  if (!isOpenAIConfigured()) {
    return mockCarePlan(input);
  }

  const season = input.season ?? getCurrentSeasonName();

  try {
    const raw = await chatJSON<Omit<AICarePlanResponse, "source">>(
      `${GARDENER_SYSTEM_PROMPT}\n\nReturn JSON matching:\n${CARE_PLAN_SCHEMA}`,
      `Create a personalized care plan.

Plant: ${input.nickname} (${input.species})
ZIP: ${input.zipCode}
Location: ${input.locationType}, ${input.plantingType}
Sun: ${input.sunExposure}
Health: ${input.healthStatus}
Notes: ${input.healthNotes || "none"}
Season: ${season}
Goals: ${input.goals.join(", ") || "keep it alive"}
Primary goal: ${input.primaryGoal || "not specified"}
${input.sizeContext ? `Size & purchase context: ${input.sizeContext}` : ""}`
    );

    return { ...raw, source: "ai" };
  } catch {
    return mockCarePlan(input);
  }
}
