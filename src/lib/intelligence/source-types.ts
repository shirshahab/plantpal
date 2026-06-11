/**
 * Shared types for the PlantPal data intelligence layer.
 *
 * Ground rules:
 * - Every insight carries its source and confidence.
 * - Anything estimated or modeled is labeled `estimated: true` internally.
 *   Estimated data never shows exact numbers or fake user activity in the UI.
 */

export type DataSource =
  | "noaa"
  | "openweather"
  | "usda"
  | "disease-reference"
  | "serpapi"
  | "reddit"
  | "community"
  | "perenual"
  | "climate-model"
  | "internal";

export type SourceConfidence = "verified" | "high" | "medium" | "low" | "estimated";

export type InsightType =
  | "weather_risk"
  | "trend"
  | "disease"
  | "plant_fact"
  | "community"
  | "seasonal"
  | "recommendation";

/** Base shape every intelligence insight shares. */
export interface IntelligenceInsight {
  id: string;
  type: InsightType;
  title: string;
  summary: string;
  source: DataSource;
  confidence: SourceConfidence;
  /** True when the value is modeled/estimated rather than measured. */
  estimated: boolean;
  /** Human-readable location ("Pasadena, CA" or ZIP) when relevant. */
  location?: string;
  /** Species or common plant name when relevant. */
  plant?: string;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
}

/** Insight rendered in local/dashboard surfaces. */
export interface LocalPlantInsight extends IntelligenceInsight {
  emoji?: string;
}

/** A reference fact about a plant, traceable to a source. */
export interface PlantFact {
  plant: string;
  scientificName?: string;
  fact: string;
  source: DataSource;
  confidence: SourceConfidence;
  sourceUrl?: string;
}

/** A disease/pest/deficiency reference entry. */
export interface DiseaseReference {
  issue: string;
  category: "fungal" | "bacterial" | "pest" | "nutrient" | "environmental";
  visualSigns: string[];
  commonCauses: string[];
  spreadsFast: boolean;
  urgency: "low" | "medium" | "high";
  affectedPlants: string[];
  immediateActions: string[];
  prevention: string[];
  whatToAvoid: string[];
  whenToRescan: string;
  sourceUrl?: string;
}

/** A search/discussion trend signal. */
export interface TrendSignal {
  term: string;
  location?: string;
  /** Only set when backed by real data. Estimated signals omit it. */
  percentChange?: number;
  direction: "up" | "down" | "flat";
  reason: string;
  confidence: SourceConfidence;
  source: DataSource;
  estimated: boolean;
  createdAt: string;
}

/** A weather-derived risk for gardens. */
export interface WeatherRisk {
  kind: "heat" | "frost" | "wind" | "rain" | "humidity" | "dry_spell";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  /** What to actually do about it. */
  action: string;
  source: DataSource;
  confidence: SourceConfidence;
  startsAt?: string;
  endsAt?: string;
}

export type CommunitySignalType =
  | "plant_added"
  | "plant_scanned"
  | "issue_detected"
  | "care_plan_generated"
  | "lesson_completed"
  | "garden_design_created"
  | "trend_viewed";

/** An aggregate community activity signal. Never an individual user. */
export interface CommunitySignal {
  signalType: CommunitySignalType;
  plantSpecies?: string | null;
  issue?: string | null;
  zipPrefix?: string | null;
  city?: string | null;
  state?: string | null;
  count: number;
  periodStart: string;
  periodEnd: string;
  source: DataSource;
  estimated: boolean;
}

let counter = 0;

/** Cheap unique-enough id for in-memory insights. */
export function insightId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Standard freshness helper. */
export function expiresInHours(hours: number, from = new Date()): string {
  return new Date(from.getTime() + hours * 3_600_000).toISOString();
}
