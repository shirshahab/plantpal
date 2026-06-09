import type { AIResponseSource } from "@/lib/types/ai";
import type { HealthStatus, LocationType } from "@/lib/types";

export type ConciergeSeverity = "mild" | "moderate" | "serious";
export type ConciergePlanStatus = "active" | "completed" | "archived";

export interface ConciergeWeekPlan {
  week: number;
  title: string;
  actions: string[];
}

export interface ConciergeLessonLink {
  lessonId: string;
  title: string;
  reason: string;
}

export interface ConciergePlanData {
  likely_issue: string;
  severity: ConciergeSeverity;
  root_cause: string;
  confidence: "high" | "medium" | "low";
  seven_day_plan: string[];
  weekly_plan: ConciergeWeekPlan[];
  what_to_avoid: string[];
  when_to_rescan: string;
  products_needed: string[];
  lessons: ConciergeLessonLink[];
  source: AIResponseSource;
}

export interface ConciergePlanRequest {
  plantId: string;
  nickname: string;
  species: string;
  zipCode: string;
  locationType: LocationType;
  healthStatus: HealthStatus;
  healthNotes?: string;
  goals: string[];
  primaryGoal?: string;
  issue: string;
  imageDataUrl?: string;
  lastWateredAt?: string | null;
  lastFertilizedAt?: string | null;
  tasksCompleted?: number;
  healthScanCount?: number;
  careHistorySummary?: string;
}

export interface SavedConciergePlan {
  id: string;
  plantId: string;
  title: string;
  issue: string;
  severity: ConciergeSeverity;
  plan: ConciergePlanData;
  status: ConciergePlanStatus;
  createdAt: string;
  updatedAt: string;
}

export const SEVERITY_LABELS: Record<ConciergeSeverity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  serious: "Serious",
};
