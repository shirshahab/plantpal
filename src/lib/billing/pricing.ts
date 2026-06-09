import type { PlanPricing } from "@/lib/types/billing";
import { AccountTier } from "./tier-config";
import { FREE_PLANT_LIMIT, FREE_SCAN_LIMIT_MONTHLY } from "./limits";

export { AccountTier, TIER_LABELS } from "./tier-config";
export { FREE_PLANT_LIMIT, FREE_SCAN_LIMIT_MONTHLY } from "./limits";

export const PRO_MONTHLY_PRICE = 7.99;

export const OFFICIAL_PRICING: Record<"pro", PlanPricing> = {
  pro: {
    monthly: PRO_MONTHLY_PRICE,
    annual: 59,
    annualSavingsPercent: 38,
  },
};

/** @deprecated Use OFFICIAL_PRICING.pro */
export const LEGACY_PRICING = {
  plus: OFFICIAL_PRICING.pro,
  family: {
    monthly: 14.99,
    annual: 119,
    annualSavingsPercent: 34,
  },
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
    "Basic plant tracking & reminders",
    "Plant scanner (limited)",
  ],
  [AccountTier.PLUS]: [
    "Unlimited scans",
    "Unlimited plants",
    "Advanced diagnosis (AI Doctor)",
    "Landscape AI designer",
    "Full Academy — all learning paths",
    "Seasonal courses",
    "Export care reports",
    "Climate intelligence & Price Checker",
  ],
  [AccountTier.FAMILY]: [
    "Everything in PlantPal Pro",
    "Multiple properties",
    "Shared household gardens",
    "Concierge recovery plans",
  ],
};

export const PLAN_BADGES: Partial<Record<AccountTier, string>> = {
  [AccountTier.PLUS]: "Most Popular",
};

export const PRO_FEATURE_HIGHLIGHTS = [
  "Unlimited scans",
  "Unlimited plants",
  "Advanced diagnosis",
  "Landscape AI",
  "Full Academy",
  "Seasonal courses",
  "Export reports",
] as const;
