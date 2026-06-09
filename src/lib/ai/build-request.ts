import type { Plant } from "@/lib/types";
import type { PlantGoal } from "@/lib/types/care-goals";
import type {
  CarePlanRequest,
  DoctorRequest,
  GoalPlanRequest,
} from "@/lib/types/ai";
import { buildSizeContextForAi } from "@/lib/plants/plant-size";
import type { ConciergePlanRequest } from "@/lib/concierge/types";

export function buildCarePlanRequest(
  plant: Plant,
  goals: PlantGoal[],
  primary: PlantGoal | null
): CarePlanRequest {
  return {
    plantId: plant.id,
    nickname: plant.name,
    species: plant.species,
    zipCode: plant.zipCode,
    locationType: plant.locationType,
    plantingType: plant.plantingType,
    sunExposure: plant.sunExposure,
    healthStatus: plant.healthStatus,
    healthNotes: plant.healthNotes,
    goals: goals.map((g) => g.name),
    primaryGoal: primary?.name,
    sizeContext: buildSizeContextForAi(plant),
  };
}

export function buildDoctorRequest(
  plant: Plant,
  issue: string,
  goals: PlantGoal[],
  primary: PlantGoal | null
): DoctorRequest {
  return {
    plantId: plant.id,
    nickname: plant.name,
    species: plant.species,
    zipCode: plant.zipCode,
    locationType: plant.locationType,
    healthStatus: plant.healthStatus,
    healthNotes: plant.healthNotes,
    goals: goals.map((g) => g.name),
    primaryGoal: primary?.name,
    issue,
    photoUrl: plant.image,
  };
}

export function buildConciergeRequest(
  plant: Plant,
  issue: string,
  goals: PlantGoal[],
  primary: PlantGoal | null,
  extras?: {
    imageDataUrl?: string;
    tasksCompleted?: number;
    healthScanCount?: number;
    careHistorySummary?: string;
  }
): ConciergePlanRequest {
  return {
    plantId: plant.id,
    nickname: plant.name,
    species: plant.species,
    zipCode: plant.zipCode,
    locationType: plant.locationType,
    healthStatus: plant.healthStatus,
    healthNotes: plant.healthNotes,
    goals: goals.map((g) => g.name),
    primaryGoal: primary?.name,
    issue,
    imageDataUrl: extras?.imageDataUrl,
    lastWateredAt: plant.lastWateredAt,
    lastFertilizedAt: plant.lastFertilizedAt,
    tasksCompleted: extras?.tasksCompleted,
    healthScanCount: extras?.healthScanCount,
    careHistorySummary: extras?.careHistorySummary,
  };
}

export function buildGoalPlanRequest(
  plant: Plant,
  goals: PlantGoal[],
  primary: PlantGoal | null
): GoalPlanRequest {
  return {
    plantId: plant.id,
    nickname: plant.name,
    species: plant.species,
    zipCode: plant.zipCode,
    healthStatus: plant.healthStatus,
    healthNotes: plant.healthNotes,
    goals: goals.map((g) => g.name),
    primaryGoal: primary?.name,
    createdAt: plant.createdAt,
  };
}
