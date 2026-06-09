import { normalizeFeature, FEATURE_REQUIRED_TIER, type BillingFeature } from "./feature-gates";
import {
  AccountTier,
  FREE_PLANT_LIMIT,
  TIER_RANK,
  type AccountTier as Tier,
} from "./tier-config";

export interface AccessOptions {
  betaUnlockAll?: boolean;
  bypassLimits?: boolean;
}

export function isFree(tier: Tier): boolean {
  return tier === AccountTier.FREE;
}

export function isPlus(tier: Tier): boolean {
  return tier === AccountTier.PLUS;
}

export function isFamily(tier: Tier): boolean {
  return tier === AccountTier.FAMILY;
}

export function isTierAtLeast(tier: Tier, minimum: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minimum];
}

export function canAccessFeature(
  tier: Tier,
  feature: BillingFeature | string,
  options: AccessOptions = {}
): boolean {
  if (options.betaUnlockAll || options.bypassLimits) return true;

  const normalized = normalizeFeature(feature);
  if (!normalized) return false;

  if (normalized === "unlimited_plants") {
    return !isFree(tier);
  }

  const required = FEATURE_REQUIRED_TIER[normalized];
  return TIER_RANK[tier] >= TIER_RANK[required];
}

export function getPlantLimit(tier: Tier, options: AccessOptions = {}): number | null {
  if (options.betaUnlockAll || options.bypassLimits) return null;
  return isFree(tier) ? FREE_PLANT_LIMIT : null;
}

export function canAddPlantCount(
  tier: Tier,
  currentCount: number,
  options: AccessOptions = {}
): boolean {
  const limit = getPlantLimit(tier, options);
  if (limit === null) return true;
  return currentCount < limit;
}

export function plantsRemaining(
  tier: Tier,
  currentCount: number,
  options: AccessOptions = {}
): number | null {
  const limit = getPlantLimit(tier, options);
  if (limit === null) return null;
  return Math.max(0, limit - currentCount);
}
