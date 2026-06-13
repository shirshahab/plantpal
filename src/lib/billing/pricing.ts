import type { PlanPricing } from "@/lib/types/billing";
import { AccountTier } from "./tier-config";
import { FREE_PLANT_LIMIT, FREE_SCAN_LIMIT_MONTHLY } from "./limits";
import { LAUNCH_TRIAL_DAYS } from "./trial";

export { AccountTier, TIER_LABELS } from "./tier-config";
export { FREE_PLANT_LIMIT, FREE_SCAN_LIMIT_MONTHLY } from "./limits";
export { LAUNCH_TRIAL_DAYS } from "./trial";

export const PRO_MONTHLY_PRICE = 7.99;
export const FAMILY_MONTHLY_PRICE = 14.99;

export const OFFICIAL_PRICING: Record<"pro" | "family", PlanPricing> = {
  pro: {
    monthly: PRO_MONTHLY_PRICE,
    annual: 59,
    annualSavingsPercent: 38,
  },
  family: {
    monthly: FAMILY_MONTHLY_PRICE,
    annual: 119,
    annualSavingsPercent: 34,
  },
};

/** @deprecated Use OFFICIAL_PRICING.pro */
export const LEGACY_PRICING = {
  plus: OFFICIAL_PRICING.pro,
  family: OFFICIAL_PRICING.family,
};

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export function formatMonthlyEquivalent(annualTotal: number): string {
  return formatPrice(annualTotal / 12);
}

export const PLAN_INCLUDES: Record<AccountTier, string[]> = {
  [AccountTier.FREE]: [
    `${FREE_SCAN_LIMIT_MONTHLY} scans per month`,
    `Up to ${FREE_PLANT_LIMIT} plants`,
    "Academy basics (Beginner Gardening)",
    "Basic plant tracking and reminders",
    "Plant scanner (limited)",
  ],
  [AccountTier.PLUS]: [
    "Unlimited plant scans",
    "Unlimited plants",
    "Plant Doctor",
    "Full care plans",
    "Local weather alerts",
    "Full Academy",
    "Garden Designer",
    "Climate intelligence and Price Checker",
  ],
  [AccountTier.FAMILY]: [
    "Everything in PlantPal Pro",
    "Multiple properties",
    "Shared household gardens",
    "Concierge recovery plans",
  ],
};

export const PAYWALL_BENEFITS = [
  "Unlimited plant scans",
  "Plant Doctor",
  "Full care plans",
  "Local weather alerts",
  "Academy",
  "Garden Designer",
  "Family gardens on Family plan",
] as const;

export const PLAN_BADGES: Partial<Record<AccountTier, string>> = {
  [AccountTier.PLUS]: "Most Popular",
};

export const PRO_FEATURE_HIGHLIGHTS = [
  "Unlimited scans",
  "Unlimited plants",
  "Plant Doctor",
  "Garden Designer",
  "Full Academy",
  "Local weather alerts",
  "Export reports",
] as const;

export const TRIAL_LEGAL_COPY =
  "After your free trial, your subscription renews automatically unless canceled in your App Store or Google Play settings. Payment is charged after the trial unless you cancel before it ends.";

export const STORE_COMPLIANCE_LINES = [
  `${LAUNCH_TRIAL_DAYS}-day free trial for eligible new subscribers`,
  "Subscription renews automatically at the end of each billing period",
  "Cancel anytime in App Store or Google Play account settings",
  "Payment is charged after the free trial unless canceled before trial ends",
  "Plan renews monthly or yearly depending on the plan you select",
] as const;
