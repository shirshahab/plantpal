import { AccountTier } from "@/lib/billing/tier-config";
import type { UserSubscription } from "@/lib/types/billing";
import {
  loadMockSubscription,
  saveMockSubscription,
} from "@/lib/billing/subscription-state";

export type TrialSource = "referral_invitee" | "referral_referrer" | "promo";

const TRIAL_DAYS = 7;

export function grantReferralTrial(
  days = TRIAL_DAYS,
  source: TrialSource = "referral_invitee"
): UserSubscription {
  const current = loadMockSubscription();
  if (current.trialStatus === "active" && current.tier !== AccountTier.FREE) {
    return current;
  }

  const end = new Date();
  end.setDate(end.getDate() + days);

  const next: UserSubscription = {
    ...current,
    tier: AccountTier.PLUS,
    trialStatus: "active",
    subscriptionStatus: "trialing",
    planStartDate: new Date().toISOString(),
    planEndDate: end.toISOString(),
    trialSource: source,
  };

  saveMockSubscription(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plantpal-subscription-updated"));
  }
  return next;
}

export function isTrialExpired(sub: UserSubscription): boolean {
  if (sub.trialStatus !== "active" || !sub.planEndDate) return false;
  return new Date(sub.planEndDate).getTime() < Date.now();
}

export function expireTrialIfNeeded(): UserSubscription {
  const sub = loadMockSubscription();
  if (sub.trialStatus !== "active") return sub;
  if (!isTrialExpired(sub)) return sub;

  const next: UserSubscription = {
    ...sub,
    tier: AccountTier.FREE,
    trialStatus: "expired",
    subscriptionStatus: sub.subscriptionStatus === "trialing" ? "expired" : sub.subscriptionStatus,
    planEndDate: sub.planEndDate,
  };
  saveMockSubscription(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plantpal-subscription-updated"));
  }
  return next;
}
