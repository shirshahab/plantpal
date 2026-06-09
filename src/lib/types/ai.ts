import type { HealthStatus, LocationType, PlantingType, SunExposure } from "@/lib/types";

export type AIResponseSource = "ai" | "mock";

export type PhotoType =
  | "profile"
  | "health_scan"
  | "growth"
  | "nursery_tag"
  | "identification";

export interface PlantIdentificationResponse {
  common_name: string;
  scientific_name: string;
  confidence: "high" | "medium" | "low";
  care_summary: string;
  toxicity_warning: string | null;
  suggested_location: "indoor" | "outdoor" | "either";
  suggested_sun: "full_sun" | "partial_sun" | "shade";
  database_species_id: string | null;
  source: AIResponseSource;
  plantnet_second_opinion?: {
    species: string;
    commonNames: string[];
    score: number;
  }[];
}

export interface TagScanResponse {
  plant_name: string;
  variety: string | null;
  size: string | null;
  sun_needs: string | null;
  water_needs: string | null;
  hardiness_zone: string | null;
  price: string | null;
  care_instructions: string | null;
  scientific_name: string | null;
  suggested_sun_exposure: "full_sun" | "partial_sun" | "shade" | null;
  suggested_location: "indoor" | "outdoor" | null;
  source: AIResponseSource;
}

export interface AIPhotoAnalyzeResponse {
  issue_detected: string;
  likely_causes: string[];
  confidence: "high" | "medium" | "low";
  severity: "mild" | "moderate" | "serious";
  what_to_do_today: string;
  what_to_avoid: string;
  when_to_rescan: string;
  recommended_lesson: string | null;
  safety_note: string;
  needs_professional_help: boolean;
  source: AIResponseSource;
}

export interface IdentifyPlantRequest {
  imageDataUrl: string;
}

export interface ScanTagRequest {
  imageDataUrl: string;
}

export interface AnalyzePhotoRequest {
  imageDataUrl: string;
  plantId?: string;
  nickname?: string;
  species?: string;
  zipCode?: string;
  locationType?: LocationType;
  healthStatus?: HealthStatus;
}

export interface AICarePlanResponse {
  watering_schedule: string;
  fertilizer_schedule: string;
  pruning_schedule: string;
  soil_recommendation: string;
  seasonal_tasks: string[];
  goal_adjustments: string[];
  warning_signs: string[];
  next_7_days: string[];
  next_30_days: string[];
  source: AIResponseSource;
}

export interface AIDoctorResponse {
  likely_issue: string;
  confidence: "high" | "medium" | "low";
  possible_causes: string[];
  what_to_do_today: string;
  what_to_avoid: string;
  when_to_check_back: string;
  severity: "mild" | "moderate" | "serious";
  needs_professional_help: boolean;
  source: AIResponseSource;
}

export interface AIGoalMissionItem {
  title: string;
  description: string;
  task_type: string;
  season: string;
}

export interface AIGoalPlanResponse {
  primary_goal: string;
  current_stage: string;
  next_milestone: { title: string; description: string; target_hint: string };
  missions: AIGoalMissionItem[];
  care_adjustments: string[];
  progress_tips: string[];
  source: AIResponseSource;
}

export interface AIPriceCheckResponse {
  corrected_plant_name: string;
  estimated_price_range: string;
  good_buy_price: string;
  overpriced_above: string;
  what_to_look_for: string[];
  red_flags: string[];
  better_alternatives: string[];
  buy_pass_verdict: "Strong Buy" | "Good Buy" | "Fair" | "Pass" | "Needs Inspection";
  source: AIResponseSource;
}

export interface CarePlanRequest {
  plantId: string;
  nickname: string;
  species: string;
  zipCode: string;
  locationType: LocationType;
  plantingType: PlantingType;
  sunExposure: SunExposure;
  healthStatus: HealthStatus;
  healthNotes?: string;
  goals: string[];
  primaryGoal?: string;
  season?: string;
}

export interface DoctorRequest {
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
  photoUrl?: string;
}

export interface GoalPlanRequest {
  plantId: string;
  nickname: string;
  species: string;
  zipCode: string;
  healthStatus: HealthStatus;
  healthNotes?: string;
  goals: string[];
  primaryGoal?: string;
  createdAt: string;
}

export interface PriceCheckerAIRequest {
  plantName: string;
  size: string;
  zipCode: string;
  storeType: string;
  condition: string;
  priceAsked?: number;
}

export interface AIApiResult<T> {
  ok: true;
  data: T;
  saved: boolean;
}

export interface AIApiError {
  ok: false;
  error: string;
}

export type AIApiResponse<T> = AIApiResult<T> | AIApiError;
