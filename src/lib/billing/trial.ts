/**
 * Launch trial entitlement — 14-day full access for new users.
 */
import { AccountTier } from "./tier-config";
import { isProTier } from "./limits";
import type { TrialSource, TrialStatus, UserSubscription } from "@/lib/types/billing";

export const LAUNCH_TRIAL_DAYS = 14;

export const TRIAL_STARTED_KEY = "plantpal-trial-started";

export function isTrialActive(sub: UserSubscription): boolean {
  if (sub.trialStatus !== "active") return false;
  if (!sub.trialEndsAt && !sub.planEndDate) return false;
  const end = sub.trialEndsAt ?? sub.planEndDate!;
  return new Date(end).getTime() > Date.now();
}

export function isTrialExpired(sub: UserSubscription): boolean {
  if (sub.trialStatus !== "active") return sub.trialStatus === "expired";
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

/** During launch trial, unlock all Pro + Family features. */
export function hasLaunchTrialAccess(sub: UserSubscription): boolean {
  return isTrialActive(sub);
}

/** Paid tier, or Family-equivalent during active launch trial. */
export function getEffectiveTier(sub: UserSubscription): AccountTier {
  if (hasLaunchTrialAccess(sub)) return AccountTier.FAMILY;
  if (sub.subscriptionStatus === "active" && isProTier(sub.tier)) return sub.tier;
  if (sub.subscriptionStatus === "trialing" && isProTier(sub.tier)) return sub.tier;
  return AccountTier.FREE;
}

export function grantLaunchTrial(
  sub: UserSubscription,
  source: TrialSource = "launch"
): UserSubscription {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + LAUNCH_TRIAL_DAYS);

  return {
    ...sub,
    tier: AccountTier.PLUS,
    trialStatus: "active" as TrialStatus,
    subscriptionStatus: "trialing",
    trialSource: source,
    trialStartedAt: now.toISOString(),
    trialEndsAt: end.toISOString(),
    planStartDate: now.toISOString(),
    planEndDate: end.toISOString(),
  };
}

export function expireLaunchTrial(sub: UserSubscription): UserSubscription {
  if (sub.subscriptionStatus === "active" && isProTier(sub.tier)) {
    return { ...sub, trialStatus: "converted" };
  }

  return {
    ...sub,
    tier: AccountTier.FREE,
    trialStatus: "expired",
    subscriptionStatus: "expired",
  };
}

export function markTrialConverted(sub: UserSubscription): UserSubscription {
  return {
    ...sub,
    trialStatus: "converted",
    subscriptionStatus: "active",
  };
}

export function shouldAutoStartLaunchTrial(sub: UserSubscription): boolean {
  if (typeof window === "undefined") return false;
  if (sub.trialStatus !== "none") return false;
  if (sub.subscriptionStatus === "active" && isProTier(sub.tier)) return false;
  return localStorage.getItem(TRIAL_STARTED_KEY) !== "1";
}

export function ensureLaunchTrial(sub: UserSubscription): UserSubscription {
  if (isTrialActive(sub)) return sub;
  if (sub.trialStatus === "expired" || sub.trialStatus === "converted") return sub;
  if (sub.subscriptionStatus === "active" && isProTier(sub.tier)) return sub;

  if (isTrialExpired(sub)) {
    return expireLaunchTrial(sub);
  }

  if (shouldAutoStartLaunchTrial(sub)) {
    const next = grantLaunchTrial(sub);
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_STARTED_KEY, "1");
    }
    return next;
  }

  return sub;
}
