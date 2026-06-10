import type { PlaceholderImageType } from "./plant-size";
import {
  categoryFromPlaceholderType,
  getCategoryArtwork,
  getPlantDisplayImage,
  isArtworkUrl,
  CATEGORY_LABELS,
} from "./plant-artwork";

/** Artwork URL stored as plant.image when a placeholder is selected. */
export function getPlaceholderImageUrl(type: PlaceholderImageType): string {
  return getCategoryArtwork(categoryFromPlaceholderType(type));
}

export function getPlaceholderLabel(type: PlaceholderImageType): string {
  return CATEGORY_LABELS[categoryFromPlaceholderType(type)];
}

export function isPlaceholderImageUrl(url: string): boolean {
  return url.startsWith("data:image/svg+xml") || isArtworkUrl(url);
}

export function resolvePlantImageUrl(plant: {
  name?: string;
  species?: string;
  image: string;
  photoStatus: import("./plant-size").PhotoStatus;
  placeholderImageType: PlaceholderImageType | null;
}): string {
  return getPlantDisplayImage({
    name: plant.name ?? "",
    species: plant.species ?? "",
    image: plant.image,
    photoStatus: plant.photoStatus,
    placeholderImageType: plant.placeholderImageType,
  }).src;
}
