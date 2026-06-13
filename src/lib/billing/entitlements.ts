/**
 * Maps App Store / Play Store product IDs to PlantPal tiers.
 */
import { AccountTier } from "./tier-config";
import { findProductByStoreId } from "./store-products";
import type { BillingCycle, StorePlatform, UserSubscription } from "@/lib/types/billing";

export const REVENUECAT_ENTITLEMENT_PRO = "pro";
export const REVENUECAT_ENTITLEMENT_FAMILY = "family";

export interface EntitlementMapping {
  tier: typeof AccountTier.PLUS | typeof AccountTier.FAMILY;
  cycle: BillingCycle;
  storePlatform: StorePlatform;
  productId: string;
}

export function mapProductIdToEntitlement(productId: string): EntitlementMapping | null {
  const product = findProductByStoreId(productId);
  if (!product) return null;

  const storePlatform: StorePlatform =
    product.iosProductId === productId ? "ios" : "android";

  return {
    tier: product.tier,
    cycle: product.cycle,
    storePlatform,
    productId,
  };
}

export function tierFromRevenueCatEntitlements(
  activeEntitlements: string[]
): typeof AccountTier.PLUS | typeof AccountTier.FAMILY | null {
  const normalized = activeEntitlements.map((e) => e.toLowerCase());
  if (normalized.includes(REVENUECAT_ENTITLEMENT_FAMILY)) return AccountTier.FAMILY;
  if (normalized.includes(REVENUECAT_ENTITLEMENT_PRO)) return AccountTier.PLUS;
  return null;
}

export function subscriptionStatusFromStore(
  isActive: boolean,
  isTrialing: boolean
): UserSubscription["subscriptionStatus"] {
  if (isTrialing) return "trialing";
  if (isActive) return "active";
  return "expired";
}

export function trialStatusFromStore(
  isTrialing: boolean,
  hasPaidTier: boolean
): UserSubscription["trialStatus"] {
  if (isTrialing) return "active";
  if (hasPaidTier) return "converted";
  return "none";
}
