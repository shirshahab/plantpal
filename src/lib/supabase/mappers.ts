import type {
  DbPlant,
  HealthStatus,
  LocationType,
  Plant,
  PlantingType,
  Profile,
  SunExposure,
  UpdatePlantInput,
} from "@/lib/types";
import type { PhotoStatus, PlaceholderImageType, PlantSizeType } from "@/lib/plants/plant-size";
import {
  DEFAULT_PHOTO_FIELDS,
  DEFAULT_SIZE_FIELDS,
} from "@/lib/plants/plant-size";
import { getPlaceholderImageUrl } from "@/lib/plants/plant-placeholders";
import { inferHardinessZone } from "@/lib/location/location-service";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1466692476860-aef1dfb1e735?w=800&q=80";

function mapPhotoFields(row: DbPlant): {
  photoStatus: PhotoStatus;
  placeholderImageType: PlaceholderImageType | null;
  image: string;
} {
  const photoStatus = (row.photo_status as PhotoStatus) ?? DEFAULT_PHOTO_FIELDS.photoStatus;
  const placeholderImageType =
    (row.placeholder_image_type as PlaceholderImageType) ?? null;

  let image = row.photo_url || DEFAULT_IMAGE;
  if (photoStatus === "placeholder" && placeholderImageType) {
    image = getPlaceholderImageUrl(placeholderImageType);
  }

  return { photoStatus, placeholderImageType, image };
}

function mapSizeFields(row: DbPlant) {
  return {
    sizeType: (row.size_type as PlantSizeType) ?? DEFAULT_SIZE_FIELDS.sizeType,
    nurseryContainerSize: row.nursery_container_size,
    heightFeet: row.height_feet != null ? Number(row.height_feet) : null,
    heightInches: row.height_inches != null ? Number(row.height_inches) : null,
    potDiameterInches:
      row.pot_diameter_inches != null ? Number(row.pot_diameter_inches) : null,
    trunkDiameterInches:
      row.trunk_diameter_inches != null ? Number(row.trunk_diameter_inches) : null,
    estimatedAgeMonths: row.estimated_age_months,
    plantedDate: row.planted_date,
    purchaseDate: row.purchase_date,
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
    purchaseStore: row.purchase_store,
  };
}

export function mapDbPlantToPlant(row: DbPlant): Plant {
  const photo = mapPhotoFields(row);
  return {
    id: row.id,
    name: row.nickname,
    species: row.species,
    image: photo.image,
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
    photoStatus: photo.photoStatus,
    placeholderImageType: photo.placeholderImageType,
    plantSpeciesId: row.plant_species_id ?? null,
    ...mapSizeFields(row),
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function mapPlantInputToDb(
  input: {
    name: string;
    species: string;
    image: string;
    locationType: LocationType;
    plantingType: PlantingType;
    zipCode: string;
    sunExposure: SunExposure;
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
    notes?: string;
    plantSpeciesId?: string | null;
  },
  userId: string,
  care: {
    waterFrequencyDays: number;
    fertilizeFrequencyWeeks: number;
    pruneSchedule: string;
  }
): Omit<DbPlant, "id" | "created_at" | "updated_at"> {
  const photoStatus = input.photoStatus ?? "needs_photo";
  // Persist real photos and species reference images (http URLs);
  // SVG placeholder data URLs are reconstructed from placeholder_image_type.
  const storedPhotoUrl =
    photoStatus === "real_photo" || input.image.startsWith("http")
      ? input.image
      : null;

  return {
    user_id: userId,
    nickname: input.name,
    species: input.species,
    location_type: input.locationType,
    container_type: input.plantingType,
    zip_code: input.zipCode,
    hardiness_zone: null,
    sun_exposure: input.sunExposure,
    photo_url: storedPhotoUrl,
    health_status: "healthy",
    water_frequency: care.waterFrequencyDays,
    fertilizer_frequency: care.fertilizeFrequencyWeeks,
    pruning_frequency: care.pruneSchedule,
    notes: input.notes ?? "Newly added — monitor for the first two weeks.",
    last_watered_at: null,
    last_fertilized_at: null,
    last_pruned_at: null,
    last_repotted_at: null,
    last_health_scan_at: null,
    last_growth_photo_at: null,
    placeholder_image_type: input.placeholderImageType ?? null,
    photo_status: photoStatus,
    size_type: input.sizeType ?? "unknown",
    nursery_container_size: input.nurseryContainerSize ?? null,
    height_feet: input.heightFeet ?? null,
    height_inches: input.heightInches ?? null,
    pot_diameter_inches: input.potDiameterInches ?? null,
    trunk_diameter_inches: input.trunkDiameterInches ?? null,
    estimated_age_months: input.estimatedAgeMonths ?? null,
    planted_date: input.plantedDate ?? null,
    purchase_date: input.purchaseDate ?? null,
    purchase_price: input.purchasePrice ?? null,
    purchase_store: input.purchaseStore ?? null,
    plant_species_id:
      input.plantSpeciesId && UUID_RE.test(input.plantSpeciesId)
        ? input.plantSpeciesId
        : null,
  };
}

export function mapPlantUpdateToDb(
  patch: UpdatePlantInput
): Partial<Omit<DbPlant, "id" | "user_id" | "created_at">> {
  const row: Partial<Omit<DbPlant, "id" | "user_id" | "created_at">> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.name != null) row.nickname = patch.name;
  if (patch.species != null) row.species = patch.species;
  if (patch.locationType != null) row.location_type = patch.locationType;
  if (patch.plantingType != null) row.container_type = patch.plantingType;
  if (patch.zipCode != null) row.zip_code = patch.zipCode;
  if (patch.sunExposure != null) row.sun_exposure = patch.sunExposure;
  if (patch.healthNotes != null) row.notes = patch.healthNotes;
  if (patch.photoStatus != null) row.photo_status = patch.photoStatus;
  if (patch.placeholderImageType !== undefined) {
    row.placeholder_image_type = patch.placeholderImageType;
  }
  if (patch.image != null && patch.photoStatus === "real_photo") {
    row.photo_url = patch.image;
  }
  if (patch.sizeType != null) row.size_type = patch.sizeType;
  if (patch.nurseryContainerSize !== undefined) {
    row.nursery_container_size = patch.nurseryContainerSize;
  }
  if (patch.heightFeet !== undefined) row.height_feet = patch.heightFeet;
  if (patch.heightInches !== undefined) row.height_inches = patch.heightInches;
  if (patch.potDiameterInches !== undefined) {
    row.pot_diameter_inches = patch.potDiameterInches;
  }
  if (patch.trunkDiameterInches !== undefined) {
    row.trunk_diameter_inches = patch.trunkDiameterInches;
  }
  if (patch.estimatedAgeMonths !== undefined) {
    row.estimated_age_months = patch.estimatedAgeMonths;
  }
  if (patch.plantedDate !== undefined) row.planted_date = patch.plantedDate;
  if (patch.purchaseDate !== undefined) row.purchase_date = patch.purchaseDate;
  if (patch.purchasePrice !== undefined) row.purchase_price = patch.purchasePrice;
  if (patch.purchaseStore !== undefined) row.purchase_store = patch.purchaseStore;

  return row;
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

/** Defaults for mock plants missing new fields. */
export function withPlantDefaults(partial: Partial<Plant> & Pick<Plant, "id" | "name" | "species">): Plant {
  return {
    image: partial.image ?? DEFAULT_IMAGE,
    locationType: partial.locationType ?? "outdoor",
    plantingType: partial.plantingType ?? "pot",
    zipCode: partial.zipCode ?? "91107",
    sunExposure: partial.sunExposure ?? "partial_sun",
    waterFrequencyDays: partial.waterFrequencyDays ?? 7,
    fertilizeFrequencyWeeks: partial.fertilizeFrequencyWeeks ?? 8,
    pruneSchedule: partial.pruneSchedule ?? "Early spring",
    healthStatus: partial.healthStatus ?? "healthy",
    healthNotes: partial.healthNotes ?? "",
    wateringInstructions: partial.wateringInstructions ?? "",
    fertilizingInstructions: partial.fertilizingInstructions ?? "",
    pruningInstructions: partial.pruningInstructions ?? "",
    lastWateredAt: partial.lastWateredAt ?? null,
    lastFertilizedAt: partial.lastFertilizedAt ?? null,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    photoStatus: partial.photoStatus ?? "real_photo",
    placeholderImageType: partial.placeholderImageType ?? null,
    sizeType: partial.sizeType ?? "unknown",
    nurseryContainerSize: partial.nurseryContainerSize ?? null,
    heightFeet: partial.heightFeet ?? null,
    heightInches: partial.heightInches ?? null,
    potDiameterInches: partial.potDiameterInches ?? null,
    trunkDiameterInches: partial.trunkDiameterInches ?? null,
    estimatedAgeMonths: partial.estimatedAgeMonths ?? null,
    plantedDate: partial.plantedDate ?? null,
    purchaseDate: partial.purchaseDate ?? null,
    purchasePrice: partial.purchasePrice ?? null,
    purchaseStore: partial.purchaseStore ?? null,
    ...partial,
  } as Plant;
}
