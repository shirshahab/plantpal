export const AccountTier = {
  FREE: "free",
  PLUS: "plus",
  /** Internal id — user-facing label is PlantPal Pro */
  FAMILY: "family",
} as const;

export type AccountTier = (typeof AccountTier)[keyof typeof AccountTier];

export const TIER_RANK: Record<AccountTier, number> = {
  [AccountTier.FREE]: 0,
  [AccountTier.PLUS]: 1,
  [AccountTier.FAMILY]: 2,
};

export const TIER_LABELS: Record<AccountTier, string> = {
  [AccountTier.FREE]: "Free",
  [AccountTier.PLUS]: "PlantPal Pro",
  [AccountTier.FAMILY]: "PlantPal Pro Family",
};

/** Canonical feature keys for subscription gating. */
export type BillingFeature =
  | "ai_doctor"
  | "advanced_diagnosis"
  | "ai_care_plan"
  | "price_checker"
  | "climate_intelligence"
  | "plant_genome"
  | "landscape_designer"
  | "landscape_ai"
  | "concierge"
  | "unlimited_plants"
  | "unlimited_scans"
  | "family_sharing"
  | "plant_scanner"
  | "growth_timeline"
  | "advanced_learning"
  | "full_academy"
  | "academy_basics"
  | "seasonal_courses"
  | "export_reports"
  | "priority_ai"
  | "multiple_properties"
  | "advanced_reminders";

export const FEATURE_REQUIRED_TIER: Record<BillingFeature, AccountTier> = {
  academy_basics: AccountTier.FREE,
  ai_doctor: AccountTier.PLUS,
  advanced_diagnosis: AccountTier.PLUS,
  ai_care_plan: AccountTier.PLUS,
  price_checker: AccountTier.PLUS,
  climate_intelligence: AccountTier.PLUS,
  plant_genome: AccountTier.PLUS,
  plant_scanner: AccountTier.FREE,
  unlimited_scans: AccountTier.PLUS,
  growth_timeline: AccountTier.PLUS,
  advanced_learning: AccountTier.PLUS,
  full_academy: AccountTier.PLUS,
  seasonal_courses: AccountTier.PLUS,
  export_reports: AccountTier.PLUS,
  priority_ai: AccountTier.PLUS,
  unlimited_plants: AccountTier.PLUS,
  landscape_designer: AccountTier.PLUS,
  landscape_ai: AccountTier.PLUS,
  concierge: AccountTier.FAMILY,
  family_sharing: AccountTier.FAMILY,
  multiple_properties: AccountTier.FAMILY,
  advanced_reminders: AccountTier.FAMILY,
};
