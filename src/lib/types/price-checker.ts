export type NurserySize =
  | "4 inch"
  | "1 gallon"
  | "2 gallon"
  | "3 gallon"
  | "5 gallon"
  | "7 gallon"
  | "10 gallon"
  | "15 gallon"
  | "24 inch box"
  | "36 inch box"
  | "other";

export type StoreType =
  | "any"
  | "big_box"
  | "local_nursery"
  | "online"
  | "wholesale";

export type PlantCondition =
  | "healthy"
  | "yellow_leaves"
  | "wilting"
  | "root_bound"
  | "not_sure";

export type BuyRecommendation =
  | "Strong Buy"
  | "Good Buy"
  | "Fair"
  | "Pass"
  | "Needs Inspection";

export interface SizePricing {
  bigBoxRange: [number, number];
  nurseryRange: [number, number];
  onlineRange: [number, number];
  premiumRange: [number, number];
  buyUnderPrice: number;
  overpricedAbove: number;
}

export interface PlantPriceProfile {
  id: string;
  displayName: string;
  aliases: string[];
  checklist: string[];
  redFlags: string[];
  alternatives: string[];
  regionalNotes: string;
  sizes: Partial<Record<NurserySize, SizePricing>>;
}

export interface PriceCorrection {
  original: string;
  corrected: string;
  suggestion?: string;
}

export interface PhotoInspection {
  visibleLeaves: string;
  structure: string;
  risk: "low" | "medium" | "high";
  recommendation: string;
  comingSoon: boolean;
}

export interface PriceCheckInput {
  plantName: string;
  size: NurserySize;
  zipCode: string;
  storeType: StoreType;
  condition: PlantCondition;
  hasPhoto: boolean;
}

export interface PriceTier {
  label: string;
  range: string;
  description: string;
}

export interface PriceCheckResult {
  correctedName: string;
  displayQuery: string;
  correction: PriceCorrection | null;
  profile: PlantPriceProfile;
  size: NurserySize;
  pricing: SizePricing;
  fairRange: [number, number];
  verdict: string;
  tiers: PriceTier[];
  bigBoxLabel: string;
  nurseryLabel: string;
  premiumLabel: string;
  onlineLabel: string;
  recommendation: BuyRecommendation;
  recommendationText: string;
  checklist: string[];
  redFlags: string[];
  alternatives: string[];
  regionalNotes: string;
  photoInspection: PhotoInspection | null;
  lessonId: string;
}

export interface PriceReportInput {
  storeName: string;
  city: string;
  price: string;
  size: string;
  dateSeen: string;
  notes: string;
}
