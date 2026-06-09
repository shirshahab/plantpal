export type PlantSizeType =
  | "nursery_container"
  | "height"
  | "trunk_diameter"
  | "pot_diameter"
  | "unknown";

export type PhotoStatus = "real_photo" | "placeholder" | "needs_photo";

export type PlaceholderImageType =
  | "tree"
  | "flower"
  | "houseplant"
  | "succulent"
  | "vegetable"
  | "bonsai"
  | "shrub";

export const PLACEHOLDER_OPTIONS: {
  id: PlaceholderImageType;
  label: string;
  emoji: string;
}[] = [
  { id: "tree", label: "Generic Tree", emoji: "🌳" },
  { id: "flower", label: "Generic Flower", emoji: "🌸" },
  { id: "houseplant", label: "Generic Houseplant", emoji: "🪴" },
  { id: "succulent", label: "Generic Succulent", emoji: "🌵" },
  { id: "vegetable", label: "Generic Vegetable", emoji: "🥬" },
  { id: "bonsai", label: "Generic Bonsai", emoji: "🌲" },
  { id: "shrub", label: "Generic Shrub", emoji: "🌿" },
];

export const NURSERY_CONTAINER_SIZES = [
  "4 inch",
  "1 gallon",
  "2 gallon",
  "3 gallon",
  "5 gallon",
  "7 gallon",
  "10 gallon",
  "15 gallon",
  "24 inch box",
  "36 inch box",
  "Other",
] as const;

export type NurseryContainerSize = (typeof NURSERY_CONTAINER_SIZES)[number];

export const SIZE_TYPE_LABELS: Record<PlantSizeType, string> = {
  nursery_container: "Nursery container",
  height: "Height",
  trunk_diameter: "Trunk diameter",
  pot_diameter: "Pot diameter",
  unknown: "Unknown",
};

export interface PlantSizeFields {
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

export interface PlantPhotoFields {
  photoStatus: PhotoStatus;
  placeholderImageType: PlaceholderImageType | null;
}

export const DEFAULT_SIZE_FIELDS: PlantSizeFields = {
  sizeType: "unknown",
  nurseryContainerSize: null,
  heightFeet: null,
  heightInches: null,
  potDiameterInches: null,
  trunkDiameterInches: null,
  estimatedAgeMonths: null,
  plantedDate: null,
  purchaseDate: null,
  purchasePrice: null,
  purchaseStore: null,
};

export const DEFAULT_PHOTO_FIELDS: PlantPhotoFields = {
  photoStatus: "needs_photo",
  placeholderImageType: null,
};

/** Infer placeholder category from species / nickname text. */
export function inferPlaceholderType(
  species: string,
  name = ""
): PlaceholderImageType {
  const text = `${species} ${name}`.toLowerCase();
  if (text.match(/bonsai|juniper|ficus retusa/)) return "bonsai";
  if (text.match(/succulent|cactus|aloe|echeveria|agave|sedum/)) return "succulent";
  if (text.match(/tomato|pepper|lettuce|basil|vegetable|herb|squash|kale/))
    return "vegetable";
  if (text.match(/rose|lavender|petunia|marigold|flower|bloom|azalea/))
    return "flower";
  if (text.match(/oak|maple|pine|cedar|lemon|lime|orange|avocado|fruit|tree/))
    return "tree";
  if (text.match(/boxwood|hedge|shrub|manzanita|sage/)) return "shrub";
  if (text.match(/monstera|pothos|ficus|philodendron|indoor|snake plant/))
    return "houseplant";
  return "houseplant";
}

export function formatPlantSize(plant: {
  sizeType: PlantSizeType;
  nurseryContainerSize: string | null;
  heightFeet: number | null;
  heightInches: number | null;
  potDiameterInches: number | null;
  trunkDiameterInches: number | null;
}): string | null {
  if (plant.sizeType === "nursery_container" && plant.nurseryContainerSize) {
    return plant.nurseryContainerSize;
  }
  if (plant.sizeType === "height") {
    const ft = plant.heightFeet ?? 0;
    const inch = plant.heightInches ?? 0;
    if (ft > 0 && inch > 0) return `${ft} ft ${inch} in`;
    if (ft > 0) return `${ft} ft tall`;
    if (inch > 0) return `${inch} in tall`;
  }
  if (plant.sizeType === "pot_diameter" && plant.potDiameterInches) {
    return `${plant.potDiameterInches}" pot`;
  }
  if (plant.sizeType === "trunk_diameter" && plant.trunkDiameterInches) {
    return `${plant.trunkDiameterInches}" trunk`;
  }
  return null;
}

export function parseGallonSize(label: string | null): number | null {
  if (!label) return null;
  const m = label.match(/(\d+)\s*gallon/i);
  return m ? Number(m[1]) : null;
}

export function buildSizeContextForAi(plant: PlantSizeFields & { plantingType?: string }): string {
  const parts: string[] = [];
  const label = formatPlantSize(plant);
  if (label) parts.push(`Size: ${label} (${SIZE_TYPE_LABELS[plant.sizeType]})`);
  if (plant.plantingType) parts.push(`Planting: ${plant.plantingType}`);
  if (plant.estimatedAgeMonths) parts.push(`Estimated age: ${plant.estimatedAgeMonths} months`);
  if (plant.plantedDate) parts.push(`Planted: ${plant.plantedDate}`);
  if (plant.purchaseDate) parts.push(`Purchased: ${plant.purchaseDate}`);
  if (plant.purchasePrice != null) parts.push(`Purchase price: $${plant.purchasePrice}`);
  if (plant.purchaseStore) parts.push(`Store: ${plant.purchaseStore}`);
  return parts.join(". ") || "Size not specified";
}
