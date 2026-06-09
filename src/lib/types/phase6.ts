export type ScoreLabel = "Thriving" | "Healthy" | "Needs Attention" | "Critical";

export type RarityLevel = "Common" | "Uncommon" | "Rare" | "Very Rare";

export interface GrowthEntry {
  id: string;
  plantId: string;
  userId: string;
  photoUrl: string;
  heightInches: number | null;
  note: string;
  entryDate: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "care" | "collection" | "social" | "milestone";
  target: number;
  unlockedAt: string | null;
}

export interface WeatherAlert {
  type: "heat" | "frost" | "wind" | "rain" | "humidity";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  wateringAdjustment: string;
}

export interface WeatherSnapshot {
  location: string;
  zipCode: string;
  condition: string;
  tempF: number;
  tempHighF?: number;
  tempLowF?: number;
  humidity?: number;
  windSpeedMph?: number;
  rainChance?: number;
  recommendedWateringAdjustment?: string;
  alerts: WeatherAlert[];
  summary: string;
  source?: "live" | "mock";
}

export interface DoctorReport {
  likelyIssue: string;
  confidence: "high" | "medium" | "low";
  why: string;
  doToday: string;
  avoid: string;
  checkBack: string;
}

export interface HarvestEntry {
  id: string;
  plantId: string;
  userId: string;
  cropName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  notes: string;
  createdAt: string;
}

export interface PropertyZone {
  id: string;
  name: string;
  type: "front_yard" | "back_yard" | "patio" | "side_yard";
  plantIds: string[];
  tasks: string[];
}

export interface Property {
  id: string;
  name: string;
  zipCode: string;
  zones: PropertyZone[];
}

export interface PlantRarity {
  plantId: string;
  level: RarityLevel;
  estimatedValue: number;
  collectorNotes: string;
}

export interface GalleryItem {
  id: string;
  plantId: string;
  plantName: string;
  beforeUrl: string;
  afterUrl: string;
  daysBetween: number;
  note: string;
}

export interface ShopRecommendation {
  name: string;
  whyItFits: string;
  watering: string;
  soil: string;
  difficulty: string;
  buyChecklist: string[];
  suitabilityScore?: number;
}

export interface EnhancedDailyTip {
  id: string;
  text: string;
  whyItMatters: string;
  actionToday: string;
  lessonId: string;
}
