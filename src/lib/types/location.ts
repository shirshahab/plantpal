import type { WeatherSnapshot } from "@/lib/types/phase6";
import type { Plant } from "@/lib/types";

export type RiskLevel = "low" | "moderate" | "high";

export type ClimateType =
  | "Mediterranean"
  | "Marine"
  | "Humid subtropical"
  | "Continental"
  | "Desert"
  | "Tropical";

export interface LocationProfile {
  zipCode: string;
  city: string;
  state: string;
  usdaZone: string;
  climateType: ClimateType;
  growingSeason: string;
  frostRisk: RiskLevel;
  heatRisk: RiskLevel;
  droughtRisk: RiskLevel;
  localWarnings: string[];
}

export interface PlantLocalRecommendation {
  plantName: string;
  message: string;
  confidence: "high" | "medium" | "low";
}

export interface PlantLocalRisk {
  plantName: string;
  risk: string;
}

export interface LocalInsights {
  profile: LocationProfile;
  weather: WeatherSnapshot;
  headline: string;
  plantRecommendations: PlantLocalRecommendation[];
  careAdjustments: string[];
  seasonalTasks: string[];
  plantRisks: PlantLocalRisk[];
}

export interface SuitabilityResult {
  score: number;
  label: "Excellent" | "Good" | "Fair" | "Poor";
  summary: string;
  factors: {
    zoneMatch: number;
    sunMatch: number;
    waterClimate: number;
    weatherRisk: number;
    containerFit: number;
    experienceFit: number;
  };
}

export interface LocalMatchCheck {
  fitLabel: "Great fit" | "Good fit" | "Caution" | "Risky";
  score: number;
  message: string;
  tips: string[];
}

export interface LocationInsightsRequest {
  zip_code: string;
  plants?: Array<{
    id?: string;
    name: string;
    species: string;
    locationType?: string;
    sunExposure?: string;
    plantingType?: string;
  }>;
}
