export * from "./types";
export * from "./plans";
export {
  loadMockSubscription,
  saveMockSubscription,
  setMockTier,
  loadSubscriptionTier,
  saveSubscriptionTier,
  SUBSCRIPTION_STORAGE_KEY,
} from "@/lib/billing/subscription-state";
export {
  canAccessFeature,
  canAddPlantCount,
  plantsRemaining,
  getPlantLimit,
  isTierAtLeast,
  isFree,
  isPlus,
  isFamily,
} from "@/lib/billing/account-tiers";
export {
  FREE_PLANT_LIMIT,
  TIER_RANK,
} from "@/lib/billing/tier-config";
export { isBetaUnlockAll, isBetaUnlocked, isFounderModeEnabled } from "@/lib/billing/beta-unlock";
export { getFeatureLockLabel, normalizeFeature } from "@/lib/billing/feature-gates";

import type { AccountTier } from "@/lib/billing/tier-config";
import { TIER_RANK } from "@/lib/billing/tier-config";
import { canAccessFeature } from "@/lib/billing/account-tiers";

/** @deprecated Use canAccessFeature from billing */
export function hasFeature(tier: AccountTier, feature: string): boolean {
  return canAccessFeature(tier, feature);
}

/** @deprecated Use TIER_RANK from billing */
export function tierRank(tier: AccountTier): number {
  return TIER_RANK[tier];
}

export const SUBSCRIPTION_STORAGE_KEY_LEGACY = "plantpal-subscription-tier";
