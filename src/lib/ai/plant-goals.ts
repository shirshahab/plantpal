import type { Plant } from "@/lib/types";
import type { AIGoalPlanResponse, GoalPlanRequest } from "@/lib/types/ai";
import {
  generateGoalBasedCarePlan,
  generateMilestonesForPlant,
  generateMissionsForPlant,
  getCurrentStage,
  getNextMilestone,
} from "@/lib/plants/goal-care";
import { getGoalsByIds } from "@/lib/mock/plant-goals";
import { chatJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT, getCurrentSeasonName } from "./prompts";

const GOAL_PLAN_SCHEMA = `{
  "primary_goal": "string",
  "current_stage": "string",
  "next_milestone": { "title": "string", "description": "string", "target_hint": "string" },
  "missions": [{ "title": "string", "description": "string", "task_type": "water|fertilize|prune|inspect|photo|repot|custom", "season": "string" }],
  "care_adjustments": ["string"],
  "progress_tips": ["string"]
}`;

function mockGoalPlan(input: GoalPlanRequest): AIGoalPlanResponse {
  const goals = getGoalsByIds(input.goals);
  const primary = goals.find((g) => g.name === input.primaryGoal) ?? goals[0];

  const plant: Plant = {
    id: input.plantId,
    name: input.nickname,
    species: input.species,
    image: "",
    locationType: "outdoor",
    plantingType: "pot",
    zipCode: input.zipCode,
    sunExposure: "partial_sun",
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
    createdAt: input.createdAt,
  };

  const care = generateGoalBasedCarePlan(plant, goals, input.zipCode, input.healthStatus);
  const milestones = generateMilestonesForPlant(input.plantId, "local", plant, goals);
  const missions = generateMissionsForPlant(input.plantId, "local", plant, goals);
  const next = getNextMilestone(milestones);

  return {
    primary_goal: primary?.name ?? "Keep it alive",
    current_stage: getCurrentStage(plant, goals),
    next_milestone: next
      ? {
          title: next.title,
          description: next.description,
          target_hint: next.targetDate
            ? `Likely around ${new Date(next.targetDate).toLocaleDateString()}`
            : "Check progress in a few weeks",
        }
      : {
          title: "Getting started",
          description: "Complete your first care routine.",
          target_hint: "This week",
        },
    missions: missions.slice(0, 4).map((m) => ({
      title: m.title,
      description: m.description,
      task_type: m.taskType,
      season: m.season,
    })),
    care_adjustments: [
      care.wateringAdjustment,
      care.fertilizerAdjustment,
      care.pruningAdjustment,
    ].filter(Boolean),
    progress_tips: care.goalSpecificTips.slice(0, 4),
    source: "mock",
  };
}

export async function generateGoalPlan(
  input: GoalPlanRequest
): Promise<AIGoalPlanResponse> {
  if (!isOpenAIConfigured()) {
    return mockGoalPlan(input);
  }

  const season = getCurrentSeasonName();

  try {
    const raw = await chatJSON<Omit<AIGoalPlanResponse, "source">>(
      `${GARDENER_SYSTEM_PROMPT}\n\nCreate a goal-based plant journey. Return JSON:\n${GOAL_PLAN_SCHEMA}`,
      `Build a goal plan.

Plant: ${input.nickname} (${input.species})
ZIP: ${input.zipCode}
Health: ${input.healthStatus}
Notes: ${input.healthNotes || "none"}
Season: ${season}
Goals: ${input.goals.join(", ")}
Primary goal: ${input.primaryGoal || "not specified"}
Plant age: since ${input.createdAt}`
    );

    return { ...raw, source: "ai" };
  } catch {
    return mockGoalPlan(input);
  }
}
