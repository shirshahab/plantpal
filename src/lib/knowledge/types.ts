export type PlantSpeciesType =
  | "tree"
  | "shrub"
  | "flower"
  | "vegetable"
  | "herb"
  | "indoor"
  | "succulent"
  | "vine"
  | "grass";

export type FertilizerType =
  | "organic"
  | "synthetic"
  | "slow_release"
  | "liquid"
  | "granular";

export type RiskLevel = "low" | "medium" | "high";

export interface PlantSpecies {
  id: string;
  common_name: string;
  scientific_name: string;
  family: string;
  type: PlantSpeciesType;
  description: string;
  sunlight: string;
  watering: string;
  soil_preference: string;
  hardiness_zone_min: number;
  hardiness_zone_max: number;
  mature_height: string;
  mature_width: string;
  growth_rate: string;
  toxicity: string;
  maintenance_level: string;
  image_url: string;
  source: string;
}

export interface SoilType {
  id: string;
  name: string;
  texture: string;
  drainage: string;
  ph_min: number;
  ph_max: number;
  best_for: string;
  description: string;
  amendments: string;
}

export interface Fertilizer {
  id: string;
  name: string;
  type: FertilizerType;
  npk_ratio: string;
  best_for: string;
  application_frequency: string;
  season: string;
  warning_notes: string;
  description: string;
}

export interface Pest {
  id: string;
  name: string;
  description: string;
  signs: string;
  affected_plants: string;
  treatment: string;
  prevention: string;
  image_url: string;
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string;
  causes: string;
  affected_plants: string;
  treatment: string;
  prevention: string;
  image_url: string;
}

export interface PlantCareGuide {
  id: string;
  plant_species_id: string;
  watering_guide: string;
  sunlight_guide: string;
  soil_guide: string;
  fertilizer_guide: string;
  pruning_guide: string;
  repotting_guide: string;
  seasonal_care: string;
  common_problems: string;
  beginner_tips: string;
}

export interface PlantSpeciesDetail extends PlantSpecies {
  care_guide: PlantCareGuide | null;
  soils: SoilType[];
  fertilizers: Fertilizer[];
  pests: (Pest & { risk_level: RiskLevel; notes?: string })[];
  diseases: (Disease & { risk_level: RiskLevel; notes?: string })[];
}

export interface SpeciesSearchFilters {
  query?: string;
  type?: PlantSpeciesType | "";
  sunlight?: string;
  watering?: string;
  zone?: number;
}

export const PLANT_TYPE_LABELS: Record<PlantSpeciesType, string> = {
  tree: "Tree",
  shrub: "Shrub",
  flower: "Flower",
  vegetable: "Vegetable",
  herb: "Herb",
  indoor: "Indoor",
  succulent: "Succulent",
  vine: "Vine",
  grass: "Grass",
};
