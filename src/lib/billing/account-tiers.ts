import { normalizeFeature, FEATURE_REQUIRED_TIER, type BillingFeature } from "./feature-gates";
import {
  AccountTier,
  TIER_RANK,
  type AccountTier as Tier,
} from "./tier-config";
import {
  FREE_PLANT_LIMIT,
  PUBLIC_BETA_UNLOCK_ALL,
  canAccessAcademyPath,
  isProTier,
} from "./limits";

export interface AccessOptions {
  betaUnlockAll?: boolean;
  bypassLimits?: boolean;
  founderMode?: boolean;
}

export function isAccessUnrestricted(options: AccessOptions = {}): boolean {
  if (PUBLIC_BETA_UNLOCK_ALL) return true;
  return !!(options.betaUnlockAll || options.bypassLimits || options.founderMode);
}

export function isFree(tier: Tier): boolean {
  return tier === AccountTier.FREE;
}

/** @deprecated Use isProTier from limits */
export function isPlus(tier: Tier): boolean {
  return isProTier(tier);
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
  if (isAccessUnrestricted(options)) return true;

  const normalized = normalizeFeature(feature);
  if (!normalized) return false;

  if (normalized === "unlimited_plants") {
    return isProTier(tier);
  }

  if (normalized === "unlimited_scans") {
    return isProTier(tier);
  }

  if (normalized === "academy_basics") {
    return true;
  }

  const required = FEATURE_REQUIRED_TIER[normalized];
  return TIER_RANK[tier] >= TIER_RANK[required];
}

export function canAccessAcademyPathForTier(
  tier: Tier,
  pathId: string,
  options: AccessOptions = {}
): boolean {
  if (isAccessUnrestricted(options)) return true;
  return canAccessAcademyPath(tier, pathId);
}

export function getPlantLimit(tier: Tier, options: AccessOptions = {}): number | null {
  if (isAccessUnrestricted(options)) return null;
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

export { isProTier } from "./limits";
