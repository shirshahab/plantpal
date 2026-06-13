import { AccountTier } from "@/lib/billing/tier-config";
import type { TrialSource, UserSubscription } from "@/lib/types/billing";
import {
  grantLaunchTrial,
  isTrialActive,
  isTrialExpired,
  LAUNCH_TRIAL_DAYS,
} from "@/lib/billing/trial";
import {
  expireTrialIfNeeded as expireStoredTrial,
  loadMockSubscription,
  saveMockSubscription,
} from "@/lib/billing/subscription-state";

export type { TrialSource };

export function grantReferralTrial(
  days = LAUNCH_TRIAL_DAYS,
  source: TrialSource = "referral_invitee"
): UserSubscription {
  const current = loadMockSubscription();
  if (isTrialActive(current)) return current;

  const end = new Date();
  end.setDate(end.getDate() + days);

  const next = grantLaunchTrial(current, source);
  const extended: UserSubscription = {
    ...next,
    trialEndsAt: end.toISOString(),
    planEndDate: end.toISOString(),
  };

  saveMockSubscription(extended);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plantpal-subscription-updated"));
  }
  return extended;
}

export { isTrialExpired, isTrialActive };

export function expireTrialIfNeeded(): UserSubscription {
  return expireStoredTrial();
}
