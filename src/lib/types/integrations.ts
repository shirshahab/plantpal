import type { PlantSpecies } from "@/lib/knowledge/types";
import type { WeatherSnapshot } from "@/lib/types/phase6";

export type IntegrationSource = "plantpal" | "perenual" | "ai" | "mock" | "live";

export type IntegrationStatus =
  | "connected"
  | "missing_key"
  | "error"
  | "mock_fallback";

export interface IntegrationHealthCard {
  id: string;
  name: string;
  status: IntegrationStatus;
  message: string;
}

export interface ZipProfile {
  zipCode: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  usda_zone: string;
  climate_type: string;
  source: "mock" | "zippopotam" | "live";
}

export interface WeatherInsights extends WeatherSnapshot {
  tempHighF: number;
  tempLowF: number;
  humidity: number;
  windSpeedMph: number;
  rainChance: number;
  recommendedWateringAdjustment: string;
  source: "live" | "mock";
}

export interface PlantSearchHit extends PlantSpecies {
  resultSource: IntegrationSource;
  externalId?: string;
}

export interface PlantSearchResponse {
  results: PlantSearchHit[];
  sources: { plantpal: number; perenual: number };
}

export interface PlantNetSuggestion {
  species: string;
  commonNames: string[];
  score: number;
}

export interface PriceSearchItem {
  retailer: string;
  title: string;
  price: number;
  size: string;
  url: string;
  distanceOrShipping: string;
  source: "live" | "mock";
}

export interface PriceSearchResponse {
  query: string;
  results: PriceSearchItem[];
  source: "live" | "mock";
}
