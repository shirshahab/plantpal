import type { HealthStatus, Plant } from "@/lib/types";

export type GoalCategory =
  | "general"
  | "fruit_trees"
  | "flowering"
  | "landscape"
  | "bonsai"
  | "pruning"
  | "indoor";

export type MissionStatus = "active" | "completed" | "skipped";
export type MilestoneStatus = "upcoming" | "in_progress" | "completed";

export type MissionTaskType =
  | "water"
  | "fertilize"
  | "prune"
  | "inspect"
  | "photo"
  | "repot"
  | "custom";

export interface PlantGoal {
  id: string;
  name: string;
  category: GoalCategory;
  description: string;
  icon: string;
}

export interface UserPlantGoal {
  id: string;
  userId: string;
  plantId: string;
  goalId: string;
  priority: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface PlantMilestone {
  id: string;
  plantId: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string | null;
  completedAt: string | null;
  status: MilestoneStatus;
  createdAt: string;
}

export interface PlantMission {
  id: string;
  plantId: string;
  userId: string;
  title: string;
  description: string;
  season: string;
  taskType: MissionTaskType;
  rewardPoints: number;
  completedAt: string | null;
  status: MissionStatus;
  createdAt: string;
}

export interface GoalBasedCarePlan {
  wateringAdjustment: string;
  fertilizerAdjustment: string;
  pruningAdjustment: string;
  soilAdjustment: string;
  seasonalTasks: string[];
  warnings: string[];
  goalSpecificTips: string[];
  /** Merged frequencies after goal modifiers */
  waterFrequencyDays: number;
  fertilizeFrequencyWeeks: number;
  pruneSchedule: string;
  wateringInstructions: string;
  fertilizingInstructions: string;
  pruningInstructions: string;
}

export interface PlantJourneySummary {
  primaryGoal: PlantGoal | null;
  selectedGoals: PlantGoal[];
  currentStage: string;
  nextMilestone: PlantMilestone | null;
  activeMissions: PlantMission[];
  progressPercent: number;
  carePlan: GoalBasedCarePlan;
}

export interface CarePlanInput {
  plant: Plant;
  goals: PlantGoal[];
  zipCode: string;
  healthStatus: HealthStatus;
}

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  general: "General",
  fruit_trees: "Fruit & Harvest",
  flowering: "Flowering Plants",
  landscape: "Trees & Landscape",
  bonsai: "Bonsai",
  pruning: "Pruning & Shape",
  indoor: "Indoor Plants",
};
