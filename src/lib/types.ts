export type LocationType = "indoor" | "outdoor";
export type PlantingType = "pot" | "ground";
export type SunExposure = "full_sun" | "partial_sun" | "shade";
export type HealthStatus = "healthy" | "needs_attention" | "critical";

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase `plants` table row (snake_case). */
export interface DbPlant {
  id: string;
  user_id: string;
  nickname: string;
  species: string;
  location_type: string;
  container_type: string;
  zip_code: string;
  hardiness_zone: string | null;
  sun_exposure: string;
  photo_url: string | null;
  health_status: string;
  water_frequency: number;
  fertilizer_frequency: number;
  pruning_frequency: string;
  notes: string | null;
  last_watered_at: string | null;
  last_fertilized_at: string | null;
  last_pruned_at: string | null;
  last_repotted_at: string | null;
  last_health_scan_at: string | null;
  last_growth_photo_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  image: string;
  locationType: LocationType;
  plantingType: PlantingType;
  zipCode: string;
  hardinessZone?: string | null;
  sunExposure: SunExposure;
  waterFrequencyDays: number;
  fertilizeFrequencyWeeks: number;
  pruneSchedule: string;
  healthStatus: HealthStatus;
  healthNotes: string;
  wateringInstructions: string;
  fertilizingInstructions: string;
  pruningInstructions: string;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  lastPrunedAt?: string | null;
  lastRepottedAt?: string | null;
  lastHealthScanAt?: string | null;
  lastGrowthPhotoAt?: string | null;
  createdAt: string;
}

export interface NewPlantInput {
  name: string;
  species: string;
  image: string;
  locationType: LocationType;
  plantingType: PlantingType;
  zipCode: string;
  sunExposure: SunExposure;
  goalIds: string[];
  primaryGoalId?: string;
}

export interface ScanResult {
  issue: string;
  likelyCause: string;
  confidence: "high" | "medium" | "low";
  recommendedAction: string;
}

export const SUN_EXPOSURE_LABELS: Record<SunExposure, string> = {
  full_sun: "Full Sun",
  partial_sun: "Partial Sun",
  shade: "Shade",
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
};

export const PLANTING_TYPE_LABELS: Record<PlantingType, string> = {
  pot: "Pot",
  ground: "Ground",
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  needs_attention: "Needs Attention",
  critical: "Critical",
};
