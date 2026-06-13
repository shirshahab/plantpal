import { normalizeFeature, FEATURE_REQUIRED_TIER, type BillingFeature } from "./feature-gates";
import {
  AccountTier,
  TIER_RANK,
  type AccountTier as Tier,
} from "./tier-config";
import {
  FREE_PLANT_LIMIT,
  canAccessAcademyPath,
  isProTier,
} from "./limits";
import { isDevUnlockAllFeatures } from "./dev-unlock";
import { hasVerifiedStoreTrialAccess, getEffectiveTier } from "./trial";
import type { UserSubscription } from "@/lib/types/billing";

export interface AccessOptions {
  betaUnlockAll?: boolean;
  bypassLimits?: boolean;
  founderMode?: boolean;
  trialFullAccess?: boolean;
  subscription?: UserSubscription;
}

export function isAccessUnrestricted(options: AccessOptions = {}): boolean {
  if (isDevUnlockAllFeatures()) return true;
  if (options.founderMode) return true;
  if (options.trialFullAccess && options.subscription) {
    return hasVerifiedStoreTrialAccess(options.subscription);
  }
  return !!(options.betaUnlockAll || options.bypassLimits);
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

  const gateTier = options.subscription ? getEffectiveTier(options.subscription) : tier;

  const normalized = normalizeFeature(feature);
  if (!normalized) return false;

  if (normalized === "unlimited_plants") {
    return isProTier(gateTier);
  }

  if (normalized === "unlimited_scans") {
    return isProTier(gateTier);
  }

  if (normalized === "academy_basics") {
    return true;
  }

  const required = FEATURE_REQUIRED_TIER[normalized];
  return TIER_RANK[gateTier] >= TIER_RANK[required];
}

export function canAccessAcademyPathForTier(
  tier: Tier,
  pathId: string,
  options: AccessOptions = {}
): boolean {
  if (isAccessUnrestricted(options)) return true;
  const gateTier = options.subscription ? getEffectiveTier(options.subscription) : tier;
  return canAccessAcademyPath(gateTier, pathId);
}

export function getPlantLimit(tier: Tier, options: AccessOptions = {}): number | null {
  if (isAccessUnrestricted(options)) return null;
  const gateTier = options.subscription ? getEffectiveTier(options.subscription) : tier;
  return isFree(gateTier) ? FREE_PLANT_LIMIT : null;
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
