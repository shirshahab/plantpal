import type { AccountTier } from "@/lib/billing/tier-config";

export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "expired"
  | "mock";

export type TrialStatus = "none" | "active" | "expired";

export interface UserSubscription {
  tier: AccountTier;
  billingCycle: BillingCycle;
  trialStatus: TrialStatus;
  subscriptionStatus: SubscriptionStatus;
  planStartDate: string | null;
  planEndDate: string | null;
}

export interface PlanPricing {
  monthly: number;
  annual: number;
  annualSavingsPercent: number;
}
