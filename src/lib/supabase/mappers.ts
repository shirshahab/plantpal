import type {
  DbPlant,
  HealthStatus,
  LocationType,
  Plant,
  PlantingType,
  Profile,
  SunExposure,
} from "@/lib/types";

import { inferHardinessZone } from "@/lib/location/location-service";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1466692476860-aef1dfb1e735?w=800&q=80";

export function mapDbPlantToPlant(row: DbPlant): Plant {
  return {
    id: row.id,
    name: row.nickname,
    species: row.species,
    image: row.photo_url || DEFAULT_IMAGE,
    locationType: row.location_type as LocationType,
    plantingType: row.container_type as PlantingType,
    zipCode: row.zip_code,
    hardinessZone: row.hardiness_zone ?? inferHardinessZone(row.zip_code),
    sunExposure: row.sun_exposure as SunExposure,
    waterFrequencyDays: row.water_frequency,
    fertilizeFrequencyWeeks: row.fertilizer_frequency,
    pruneSchedule: row.pruning_frequency,
    healthStatus: row.health_status as HealthStatus,
    healthNotes: row.notes || "",
    wateringInstructions: "Water when soil is dry at recommended frequency.",
    fertilizingInstructions: "Feed during active growth season.",
    pruningInstructions: `Prune: ${row.pruning_frequency}`,
    lastWateredAt: row.last_watered_at,
    lastFertilizedAt: row.last_fertilized_at,
    lastPrunedAt: row.last_pruned_at ?? null,
    lastRepottedAt: row.last_repotted_at ?? null,
    lastHealthScanAt: row.last_health_scan_at ?? null,
    lastGrowthPhotoAt: row.last_growth_photo_at ?? null,
    createdAt: row.created_at,
  };
}

export function mapPlantInputToDb(
  input: {
    name: string;
    species: string;
    image: string;
    locationType: LocationType;
    plantingType: PlantingType;
    zipCode: string;
    sunExposure: SunExposure;
  },
  userId: string,
  care: {
    waterFrequencyDays: number;
    fertilizeFrequencyWeeks: number;
    pruneSchedule: string;
  }
): Omit<DbPlant, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    nickname: input.name,
    species: input.species,
    location_type: input.locationType,
    container_type: input.plantingType,
    zip_code: input.zipCode,
    hardiness_zone: null,
    sun_exposure: input.sunExposure,
    photo_url: input.image,
    health_status: "healthy",
    water_frequency: care.waterFrequencyDays,
    fertilizer_frequency: care.fertilizeFrequencyWeeks,
    pruning_frequency: care.pruneSchedule,
    notes: "Newly added — monitor for the first two weeks.",
    last_watered_at: null,
    last_fertilized_at: null,
    last_pruned_at: null,
    last_repotted_at: null,
    last_health_scan_at: null,
    last_growth_photo_at: null,
  };
}

export function mapDbProfile(row: {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
