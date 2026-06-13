import type { AccountTier } from "@/lib/billing/tier-config";

export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "expired"
  | "mock";

export type TrialStatus = "none" | "active" | "expired" | "converted";

export type TrialSource =
  | "launch"
  | "referral_invitee"
  | "referral_referrer"
  | "promo";

export type StorePlatform = "ios" | "android" | "web";

export interface UserSubscription {
  tier: AccountTier;
  billingCycle: BillingCycle;
  trialStatus: TrialStatus;
  subscriptionStatus: SubscriptionStatus;
  planStartDate: string | null;
  planEndDate: string | null;
  trialSource?: TrialSource;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  storePlatform?: StorePlatform | null;
  storeProductId?: string | null;
  storeOriginalTransactionId?: string | null;
  storePurchaseToken?: string | null;
}

export interface PlanPricing {
  monthly: number;
  annual: number;
  annualSavingsPercent: number;
}
