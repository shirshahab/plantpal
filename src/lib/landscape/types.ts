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

/** Phase 38 MVP budget tiers ($ – $$$$) */
export type BudgetTierMvp = "tier_1" | "tier_2" | "tier_3" | "tier_4";

export type MaintenancePreference = "low" | "medium" | "high";

export type StyleGoal =
  | "modern"
  | "japanese"
  | "cottage"
  | "mediterranean"
  | "tropical"
  | "desert"
  | "edible_garden"
  | "family_friendly"
  | "pollinator_garden";

export type GardenStyle = StyleGoal;

export type BudgetTier = "budget" | "balanced" | "premium";
export type MaintenanceLevel = "low" | "moderate" | "high";

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

export const BUDGET_MVP_LABELS: Record<BudgetTierMvp, string> = {
  tier_1: "$ — Under $1,000",
  tier_2: "$$ — $1,000 – $5,000",
  tier_3: "$$$ — $5,000 – $15,000",
  tier_4: "$$$$ — $15,000+",
};

export const BUDGET_MVP_SYMBOLS: Record<BudgetTierMvp, string> = {
  tier_1: "$",
  tier_2: "$$",
  tier_3: "$$$",
  tier_4: "$$$$",
};

export const MAINTENANCE_PREF_LABELS: Record<MaintenancePreference, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STYLE_GOAL_LABELS: Record<StyleGoal, string> = {
  modern: "Modern",
  japanese: "Japanese",
  cottage: "Cottage",
  mediterranean: "Mediterranean",
  tropical: "Tropical",
  desert: "Desert",
  edible_garden: "Edible Garden",
  family_friendly: "Family Friendly",
  pollinator_garden: "Pollinator Garden",
};

export const STYLE_GOAL_ICONS: Record<StyleGoal, string> = {
  modern: "✨",
  japanese: "⛩️",
  cottage: "🏡",
  mediterranean: "🫒",
  tropical: "🌴",
  desert: "🌵",
  edible_garden: "🥬",
  family_friendly: "👨‍👩‍👧",
  pollinator_garden: "🦋",
};

export function budgetMvpToRange(tier: BudgetTierMvp): BudgetRange {
  const map: Record<BudgetTierMvp, BudgetRange> = {
    tier_1: "under_500",
    tier_2: "500_2500",
    tier_3: "2500_8000",
    tier_4: "8000_plus",
  };
  return map[tier];
}

export function maintenancePrefToLevel(pref: MaintenancePreference): MaintenanceLevel {
  if (pref === "low") return "low";
  if (pref === "high") return "high";
  return "moderate";
}

export interface LandscapePropertyProfile {
  zipCode: string;
  hardinessZone: string;
  sunExposure: SunExposure;
  yardSize: YardSize;
  budgetTier: BudgetTierMvp;
  maintenancePreference: MaintenancePreference;
}

export interface LandscapeDesignRequest {
  imageDataUrl: string;
  /** Additional yard photos (front/back/side) */
  additionalPhotos?: LandscapeProjectPhoto[];
  spaceType: SpaceType;
  zipCode: string;
  sunExposure: SunExposure;
  yardSize: YardSize;
  budgetRange: BudgetRange;
  styleGoal: StyleGoal;
  maintenancePreference?: MaintenancePreference;
  notes?: string;
  generateConceptImage?: boolean;
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

export interface BudgetOption {
  tier: BudgetTier;
  label: string;
  estimated_cost: string;
  summary: string;
  plant_list: string[];
  highlights: string[];
}

export interface LandscapePlantListItem {
  name: string;
  category: "tree" | "shrub" | "flower" | "ground_cover" | "edible" | "accent";
  quantity: string;
  est_price?: string;
  suitability_score?: number;
  suitability_label?: string;
}

export interface AfterConcept {
  headline: string;
  description: string;
  key_changes: string[];
  accent_color: string;
}

export interface PhasedPlanPhase {
  phase: 1 | 2 | 3;
  title: string;
  timeframe: string;
  tasks: string[];
  estimated_cost: string;
}

export interface LandscapeDesignResponse {
  analysis: SpaceAnalysis;
  climate: ClimateContext;
  recommendations: PlantRecommendations;
  irrigation: IrrigationRecommendation;
  soil_prep: string;
  maintenance_level: MaintenanceLevel;
  maintenance_notes: string;
  /** 0–100 upkeep score for the design */
  maintenance_score: number;
  estimated_budget: string;
  first_steps: string[];
  budget_options: BudgetOption[];
  design_summary: string;
  layout_suggestions: string[];
  phased_plan: PhasedPlanPhase[];
  after_concept: AfterConcept;
  /** AI-generated concept render URL */
  after_image_url: string | null;
  plant_list: LandscapePlantListItem[];
  source: AIResponseSource;
}

export interface LandscapeProjectPhoto {
  dataUrl: string;
  storageUrl?: string;
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
  budgetTier?: BudgetTierMvp;
  maintenancePreference?: MaintenancePreference;
  styleGoal: StyleGoal;
  notes: string;
  photos: LandscapeProjectPhoto[];
  design: LandscapeDesignResponse;
  visualConceptRequested: boolean;
  createdAt: string;
  updatedAt: string;
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

/** MVP yard photo slots */
export const YARD_PHOTO_SLOTS: { id: SpaceType; label: string }[] = [
  { id: "front_yard", label: "Front yard" },
  { id: "back_yard", label: "Backyard" },
  { id: "side_yard", label: "Side yard" },
];
