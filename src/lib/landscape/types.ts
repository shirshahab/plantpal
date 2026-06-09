import type { AIResponseSource } from "@/lib/types/ai";

export type SpaceType =
  | "front_yard"
  | "back_yard"
  | "side_yard"
  | "patio"
  | "balcony"
  | "slope";

export type SunExposure = "full_sun" | "partial_sun" | "shade" | "mixed";

export type YardSize = "small" | "medium" | "large" | "unknown";

export type BudgetRange =
  | "under_500"
  | "500_2500"
  | "2500_8000"
  | "8000_plus"
  | "flexible";

export type StyleGoal =
  | "fruit_garden"
  | "low_maintenance"
  | "native_garden"
  | "tropical"
  | "mediterranean"
  | "japanese_garden"
  | "kids_family"
  | "pollinator"
  | "privacy"
  | "outdoor_living";

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  front_yard: "Front yard",
  back_yard: "Backyard",
  side_yard: "Side yard",
  patio: "Patio",
  balcony: "Balcony",
  slope: "Slope / hillside",
};

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  front_yard: "🏡",
  back_yard: "🌳",
  side_yard: "🌿",
  patio: "🪴",
  balcony: "🏙️",
  slope: "⛰️",
};

export const SUN_EXPOSURE_LABELS: Record<SunExposure, string> = {
  full_sun: "Full sun (6+ hrs)",
  partial_sun: "Partial sun",
  shade: "Mostly shade",
  mixed: "Mixed / varies",
};

export const YARD_SIZE_LABELS: Record<YardSize, string> = {
  small: "Small (under 500 sq ft)",
  medium: "Medium (500–2,000 sq ft)",
  large: "Large (2,000+ sq ft)",
  unknown: "Not sure — estimate from photo",
};

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  under_500: "Under $500",
  "500_2500": "$500 – $2,500",
  "2500_8000": "$2,500 – $8,000",
  "8000_plus": "$8,000+",
  flexible: "Flexible — show all options",
};

export const STYLE_GOAL_LABELS: Record<StyleGoal, string> = {
  fruit_garden: "Fruit garden",
  low_maintenance: "Low maintenance",
  native_garden: "Native garden",
  tropical: "Tropical",
  mediterranean: "Mediterranean",
  japanese_garden: "Japanese garden",
  kids_family: "Kids / family yard",
  pollinator: "Pollinator garden",
  privacy: "Privacy",
  outdoor_living: "Outdoor living",
};

export const STYLE_GOAL_ICONS: Record<StyleGoal, string> = {
  fruit_garden: "🍊",
  low_maintenance: "🌵",
  native_garden: "🦋",
  tropical: "🌴",
  mediterranean: "🫒",
  japanese_garden: "🎋",
  kids_family: "⚽",
  pollinator: "🐝",
  privacy: "🧱",
  outdoor_living: "🪑",
};

export interface LandscapeDesignRequest {
  imageDataUrl: string;
  spaceType: SpaceType;
  zipCode: string;
  sunExposure: SunExposure;
  yardSize: YardSize;
  budgetRange: BudgetRange;
  styleGoal: StyleGoal;
  notes?: string;
}

export interface SpaceAnalysis {
  space_type: SpaceType;
  estimated_sq_ft: string;
  estimated_dimensions: string;
  existing_plants: string[];
  sunlight: SunExposure;
  sunlight_notes: string;
  site_notes: string;
}

export interface ClimateContext {
  zip_code: string;
  city: string;
  usda_zone: string;
  climate_type: string;
  season_note: string;
}

export interface PlantRecommendations {
  trees: string[];
  shrubs: string[];
  flowers: string[];
  ground_cover: string[];
}

export interface IrrigationRecommendation {
  approach: string;
  notes: string;
}

export type BudgetTier = "budget" | "balanced" | "premium";
export type MaintenanceLevel = "low" | "moderate" | "high";

export interface BudgetOption {
  tier: BudgetTier;
  label: string;
  estimated_cost: string;
  summary: string;
  plant_list: string[];
  highlights: string[];
}

export interface LandscapeDesignResponse {
  analysis: SpaceAnalysis;
  climate: ClimateContext;
  recommendations: PlantRecommendations;
  irrigation: IrrigationRecommendation;
  soil_prep: string;
  maintenance_level: MaintenanceLevel;
  maintenance_notes: string;
  estimated_budget: string;
  first_steps: string[];
  budget_options: BudgetOption[];
  design_summary: string;
  source: AIResponseSource;
}

export interface LandscapeProjectPhoto {
  dataUrl: string;
  label?: string;
}

export interface LandscapeProject {
  id: string;
  name: string;
  spaceType: SpaceType;
  zipCode: string;
  sunExposure: SunExposure;
  yardSize: YardSize;
  budgetRange: BudgetRange;
  styleGoal: StyleGoal;
  notes: string;
  photos: LandscapeProjectPhoto[];
  design: LandscapeDesignResponse;
  visualConceptRequested: boolean;
  createdAt: string;
  updatedAt: string;
  /** Primary photo for list thumbnails */
  photoDataUrl: string;
}

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  budget: "Budget Plan",
  balanced: "Balanced Plan",
  premium: "Premium Plan",
};

export const MAINTENANCE_LABELS: Record<MaintenanceLevel, string> = {
  low: "Low maintenance",
  moderate: "Moderate upkeep",
  high: "High touch / seasonal",
};
