import type {
  PhotoStatus,
  PlaceholderImageType,
  PlantPhotoFields,
  PlantSizeFields,
  PlantSizeType,
} from "@/lib/plants/plant-size";

export type { PhotoStatus, PlaceholderImageType, PlantSizeType };

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
  placeholder_image_type: string | null;
  photo_status: string | null;
  size_type: string | null;
  nursery_container_size: string | null;
  height_feet: number | null;
  height_inches: number | null;
  pot_diameter_inches: number | null;
  trunk_diameter_inches: number | null;
  estimated_age_months: number | null;
  planted_date: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_store: string | null;
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
  photoStatus: PhotoStatus;
  placeholderImageType: PlaceholderImageType | null;
  sizeType: PlantSizeType;
  nurseryContainerSize: string | null;
  heightFeet: number | null;
  heightInches: number | null;
  potDiameterInches: number | null;
  trunkDiameterInches: number | null;
  estimatedAgeMonths: number | null;
  plantedDate: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  purchaseStore: string | null;
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
  notes?: string;
  photoStatus?: PhotoStatus;
  placeholderImageType?: PlaceholderImageType | null;
  sizeType?: PlantSizeType;
  nurseryContainerSize?: string | null;
  heightFeet?: number | null;
  heightInches?: number | null;
  potDiameterInches?: number | null;
  trunkDiameterInches?: number | null;
  estimatedAgeMonths?: number | null;
  plantedDate?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  purchaseStore?: string | null;
}

export type UpdatePlantInput = Partial<
  Pick<
    Plant,
    | "name"
    | "species"
    | "image"
    | "locationType"
    | "plantingType"
    | "zipCode"
    | "sunExposure"
    | "healthNotes"
    | "photoStatus"
    | "placeholderImageType"
    | "sizeType"
    | "nurseryContainerSize"
    | "heightFeet"
    | "heightInches"
    | "potDiameterInches"
    | "trunkDiameterInches"
    | "estimatedAgeMonths"
    | "plantedDate"
    | "purchaseDate"
    | "purchasePrice"
    | "purchaseStore"
  >
> &
  PlantPhotoFields &
  PlantSizeFields;

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
