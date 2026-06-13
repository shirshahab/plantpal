import {
  expireTrialIfNeeded as expireStoredTrial,
  loadVerifiedSubscriptionState,
} from "@/lib/billing/subscription-state";
import { isTrialActive, isTrialExpired } from "@/lib/billing/trial";
import type { TrialSource, UserSubscription } from "@/lib/types/billing";

export type { TrialSource };

/** Referral perks must go through store billing — no client-only trial grants. */
export function grantReferralTrial(
  _days?: number,
  _source?: TrialSource
): UserSubscription {
  return loadVerifiedSubscriptionState();
}

export { isTrialExpired, isTrialActive };

export function expireTrialIfNeeded(): UserSubscription {
  return expireStoredTrial();
}
