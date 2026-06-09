export const AccountTier = {
  FREE: "free",
  PLUS: "plus",
  FAMILY: "family",
} as const;

export type AccountTier = (typeof AccountTier)[keyof typeof AccountTier];

export const FREE_PLANT_LIMIT = 3;

export const TIER_RANK: Record<AccountTier, number> = {
  [AccountTier.FREE]: 0,
  [AccountTier.PLUS]: 1,
  [AccountTier.FAMILY]: 2,
};

export const TIER_LABELS: Record<AccountTier, string> = {
  [AccountTier.FREE]: "Free",
  [AccountTier.PLUS]: "PlantPal Plus",
  [AccountTier.FAMILY]: "Family",
};

/** Canonical feature keys for subscription gating. */
export type BillingFeature =
  | "ai_doctor"
  | "ai_care_plan"
  | "price_checker"
  | "climate_intelligence"
  | "plant_genome"
  | "landscape_designer"
  | "concierge"
  | "unlimited_plants"
  | "family_sharing"
  | "plant_scanner"
  | "growth_timeline"
  | "advanced_learning"
  | "priority_ai"
  | "multiple_properties"
  | "advanced_reminders";

export const FEATURE_REQUIRED_TIER: Record<BillingFeature, AccountTier> = {
  ai_doctor: AccountTier.PLUS,
  ai_care_plan: AccountTier.PLUS,
  price_checker: AccountTier.PLUS,
  climate_intelligence: AccountTier.PLUS,
  plant_genome: AccountTier.PLUS,
  plant_scanner: AccountTier.PLUS,
  growth_timeline: AccountTier.PLUS,
  advanced_learning: AccountTier.PLUS,
  priority_ai: AccountTier.PLUS,
  unlimited_plants: AccountTier.PLUS,
  landscape_designer: AccountTier.FAMILY,
  concierge: AccountTier.FAMILY,
  family_sharing: AccountTier.FAMILY,
  multiple_properties: AccountTier.FAMILY,
  advanced_reminders: AccountTier.FAMILY,
};
