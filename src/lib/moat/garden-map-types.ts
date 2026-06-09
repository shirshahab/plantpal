export type GardenSpaceType =
  | "front_yard"
  | "backyard"
  | "side_yard"
  | "balcony"
  | "indoor"
  | "greenhouse"
  | "orchard"
  | "vegetable_garden";

export interface GardenZone {
  id: string;
  name: string;
  /** Normalized 0–1 coordinates on space photo */
  x: number;
  y: number;
  width: number;
  height: number;
  sunExposure: "full_sun" | "partial_sun" | "shade";
  shadeHours: number;
}

export interface ZonePlantPlacement {
  id: string;
  zoneId: string;
  plantId: string | null;
  label: string;
  sunExposure: "full_sun" | "partial_sun" | "shade";
  waterSchedule: string;
  fertilizerSchedule: string;
  healthScore: number;
  x: number;
  y: number;
}

export interface GardenSpace {
  id: string;
  name: string;
  type: GardenSpaceType;
  photoUrl: string | null;
  zones: GardenZone[];
  placements: ZonePlantPlacement[];
  createdAt: string;
  updatedAt: string;
}

export const GARDEN_SPACE_LABELS: Record<GardenSpaceType, string> = {
  front_yard: "Front Yard",
  backyard: "Backyard",
  side_yard: "Side Yard",
  balcony: "Balcony",
  indoor: "Indoor Collection",
  greenhouse: "Greenhouse",
  orchard: "Orchard",
  vegetable_garden: "Vegetable Garden",
};

export const GARDEN_SPACE_ICONS: Record<GardenSpaceType, string> = {
  front_yard: "🏡",
  backyard: "🌳",
  side_yard: "🌿",
  balcony: "🪴",
  indoor: "🏠",
  greenhouse: "🌡️",
  orchard: "🍋",
  vegetable_garden: "🥬",
};
