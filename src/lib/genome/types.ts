import type { PlantSpeciesType } from "@/lib/knowledge/types";

/** Direction of a tracked trend over time. */
export type TrendDirection = "rising" | "stable" | "declining";

export type LifeStage =
  | "seedling"
  | "juvenile"
  | "establishing"
  | "mature"
  | "senescent";

export type BloomStage = "none" | "pre_bloom" | "blooming" | "post_bloom";

export type FruitStage =
  | "none"
  | "pre_fruit"
  | "fruit_set"
  | "ripening"
  | "harvest_ready";

export type DormancyStatus =
  | "active_growth"
  | "slowing"
  | "dormant"
  | "breaking_dormancy";

export type ForecastCategory =
  | "flowering"
  | "fruiting"
  | "heat_stress"
  | "frost_risk"
  | "repotting"
  | "pruning"
  | "watering"
  | "fertilizing"
  | "dormancy"
  | "milestone";

export type GenomeEventType =
  | "photo_added"
  | "task_completed"
  | "weather_snapshot"
  | "health_scan"
  | "growth_measurement"
  | "care_action";

export type GenomeComputeSource = "mock" | "computed";

/** Species reference baseline — describes the plant type, not the individual. */
export interface SpeciesGenomeBaseline {
  id: string;
  commonName: string;
  scientificName: string;
  type: PlantSpeciesType;
  growthRate: "slow" | "moderate" | "fast";
  bloomMonths: number[];
  fruitMonths: number[];
  dormantMonths: number[];
  repottingMonths: number[];
  pruningMonths: number[];
  maxHeightInches: number;
  isFruitBearing: boolean;
  isFlowering: boolean;
  heatTolerance: "low" | "medium" | "high";
}

export interface PlantGenomeTrend {
  direction: TrendDirection;
  label: string;
  detail: string;
  score: number;
}

export interface ForecastItem {
  id: string;
  category: ForecastCategory;
  title: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  confidence: "high" | "medium" | "low";
  source: "mock" | "ai" | "species";
}

/** Computed digital-twin state for one plant instance. */
export interface PlantGenomeState {
  plantId: string;
  computedAt: string;
  version: number;
  ageDays: number;
  ageMonths: number;
  ageLabel: string;
  lifeStage: LifeStage;
  growthTrend: PlantGenomeTrend;
  healthTrend: PlantGenomeTrend;
  bloomStage: BloomStage;
  fruitStage: FruitStage;
  dormancyStatus: DormancyStatus;
  riskScore: number;
  recoveryScore: number;
  intelligenceScore: number;
  wateringConsistency: ConsistencyMetric;
  fertilizerConsistency: ConsistencyMetric;
  photoProgress: ConsistencyMetric;
  missedTasksCount: number;
  primaryGoalName: string | null;
  nextMilestone: string | null;
  forecast30: ForecastItem[];
  forecast90: ForecastItem[];
  forecastSeason: ForecastItem[];
  upcomingMilestones: ForecastItem[];
  telemetrySummary: {
    photoCount: number;
    growthMeasurements: number;
    tasksCompleted: number;
    tasksMissed: number;
    healthScans: number;
    lastEvolvedAt: string | null;
  };
  speciesBaseline: SpeciesGenomeBaseline;
  source: GenomeComputeSource;
}

export interface ConsistencyMetric {
  score: number;
  label: string;
  detail: string;
}

export interface GenomeEvent {
  id: string;
  plantId: string;
  type: GenomeEventType;
  payload: Record<string, unknown>;
  recordedAt: string;
}

/** Persisted per-plant genome record (telemetry + optional cache). */
export interface PlantGenomeRecord {
  plantId: string;
  events: GenomeEvent[];
  lastComputedAt: string | null;
  cachedState?: PlantGenomeState;
}

export interface GenomeComputeInput {
  plantId: string;
  plantCreatedAt: string;
  plantName: string;
  species: string;
  healthStatus: "healthy" | "needs_attention" | "critical";
  zipCode: string;
  locationType: "indoor" | "outdoor";
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  lastHealthScanAt: string | null;
  lastGrowthPhotoAt: string | null;
  growthHeights: number[];
  growthEntryCount: number;
  photoCount: number;
  healthScanCount: number;
  tasksCompleted: number;
  tasksMissed: number;
  missedWaterTasks: number;
  missedFertilizeTasks: number;
  careLogs: import("@/lib/types/tasks").PlantCareLog[];
  primaryGoalName: string | null;
  events: GenomeEvent[];
  tempF?: number;
  tempHighF?: number;
  weatherAlerts?: { type: string; severity: string }[];
}
