import {
  AccountTier,
  FEATURE_REQUIRED_TIER,
  TIER_RANK,
  type AccountTier as Tier,
  type BillingFeature,
} from "./tier-config";

export type { BillingFeature };

/** Legacy feature ids used across the app → canonical billing feature. */
const FEATURE_ALIASES: Record<string, BillingFeature> = {
  ai_care_plans: "ai_care_plan",
  growth_forecasts: "plant_genome",
  shared_gardens: "family_sharing",
  household_access: "family_sharing",
  plant_limit: "unlimited_plants",
};

export function normalizeFeature(feature: string): BillingFeature | null {
  if (feature in FEATURE_REQUIRED_TIER) {
    return feature as BillingFeature;
  }
  return FEATURE_ALIASES[feature] ?? null;
}

export function getRequiredTier(feature: BillingFeature | string): Tier {
  const normalized = normalizeFeature(feature);
  if (!normalized) return AccountTier.PLUS;
  return FEATURE_REQUIRED_TIER[normalized];
}

export function getFeatureLockLabel(feature: BillingFeature | string): "Plus Feature" | "Family Feature" {
  return getRequiredTier(feature) === AccountTier.FAMILY ? "Family Feature" : "Plus Feature";
}

export function featuresForTier(tier: Tier): BillingFeature[] {
  const rank = TIER_RANK[tier];
  return (Object.entries(FEATURE_REQUIRED_TIER) as [BillingFeature, Tier][]).filter(
    ([, required]) => rank >= TIER_RANK[required]
  ).map(([feature]) => feature);
}

export { FEATURE_REQUIRED_TIER };
