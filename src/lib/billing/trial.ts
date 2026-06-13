/**
 * Store-managed trial helpers.
 * Production access requires verified App Store / Play / RevenueCat entitlement.
 */
import { AccountTier } from "./tier-config";
import { isProTier } from "./limits";
import type { TrialStatus, UserSubscription } from "@/lib/types/billing";

export const LAUNCH_TRIAL_DAYS = 14;

/** @deprecated Legacy local trial key — purged on load. */
export const TRIAL_STARTED_KEY = "plantpal-trial-started";

/** Local auto-trial is disabled for App Store launch. */
export function isLocalTrialAutoStartEnabled(): boolean {
  return false;
}

/** Subscription backed by store / RevenueCat sync, not client-only mock state. */
export function isVerifiedSubscription(sub: UserSubscription): boolean {
  if (sub.subscriptionStatus === "mock") return false;

  const hasStoreProof = Boolean(
    sub.storePlatform ||
      sub.storeProductId ||
      sub.storeOriginalTransactionId ||
      sub.storePurchaseToken
  );

  if (!hasStoreProof) return false;

  if (sub.subscriptionStatus === "active" && isProTier(sub.tier)) return true;
  if (sub.subscriptionStatus === "trialing" && isProTier(sub.tier)) return true;

  return false;
}

export function isTrialActive(sub: UserSubscription): boolean {
  if (!isVerifiedSubscription(sub)) return false;
  if (sub.subscriptionStatus !== "trialing" && sub.trialStatus !== "active") return false;
  if (!sub.trialEndsAt && !sub.planEndDate) return false;
  const end = sub.trialEndsAt ?? sub.planEndDate!;
  return new Date(end).getTime() > Date.now();
}

export function isTrialExpired(sub: UserSubscription): boolean {
  if (!isVerifiedSubscription(sub)) return sub.trialStatus === "expired";
  if (sub.trialStatus !== "active" && sub.subscriptionStatus !== "trialing") {
    return sub.trialStatus === "expired";
  }
  const end = sub.trialEndsAt ?? sub.planEndDate;
  if (!end) return false;
  return new Date(end).getTime() <= Date.now();
}

export function trialDaysRemaining(sub: UserSubscription): number | null {
  if (!isTrialActive(sub)) return null;
  const end = new Date(sub.trialEndsAt ?? sub.planEndDate!);
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function trialEndsLabel(sub: UserSubscription): string | null {
  const end = sub.trialEndsAt ?? sub.planEndDate;
  if (!end || !isTrialActive(sub)) return null;
  return new Date(end).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** @deprecated Use isVerifiedSubscription + isTrialActive */
export function hasLaunchTrialAccess(sub: UserSubscription): boolean {
  return hasVerifiedStoreTrialAccess(sub);
}

export function hasVerifiedStoreTrialAccess(sub: UserSubscription): boolean {
  return isVerifiedSubscription(sub) && isTrialActive(sub);
}

/** Effective tier from verified subscription only. */
export function getEffectiveTier(sub: UserSubscription): AccountTier {
  if (!isVerifiedSubscription(sub)) return AccountTier.FREE;
  if (isTrialExpired(sub)) return AccountTier.FREE;
  if (isProTier(sub.tier)) return sub.tier;
  return AccountTier.FREE;
}

export function expireLaunchTrial(sub: UserSubscription): UserSubscription {
  if (sub.subscriptionStatus === "active" && isProTier(sub.tier) && isVerifiedSubscription(sub)) {
    return { ...sub, trialStatus: "converted" as TrialStatus };
  }

  return {
    ...sub,
    tier: AccountTier.FREE,
    trialStatus: "expired",
    subscriptionStatus: "expired",
    planEndDate: sub.planEndDate ?? new Date().toISOString(),
  };
}

export function markTrialConverted(sub: UserSubscription): UserSubscription {
  return {
    ...sub,
    trialStatus: "converted",
    subscriptionStatus: "active",
  };
}

export function purgeLegacyLocalTrialKeys(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TRIAL_STARTED_KEY);
}
